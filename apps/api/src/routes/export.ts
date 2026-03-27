import { Router, Request, Response } from 'express';
import JSZip from 'jszip';
import crypto from 'crypto';
import { dbCourses, db, dbNotes, dbLessonSources } from '../db.js';
import { sendError } from '../errors.js';
import { scoreSourceCredibility } from '../utils/sourceCredibility.js';

const router = Router();

function stableSourceId(s: any): string {
  const url = String(s?.url || '').trim();
  const title = String(s?.title || '').trim();
  const publication = String(s?.publication || '').trim();
  const author = String(s?.author || '').trim();
  const year = s?.year ? String(s.year) : '';
  const key = [url, title, publication, author, year].join('|');
  return crypto.createHash('sha1').update(key).digest('hex');
}

function normalizeLessonSourcesRow(row: { sources: any[]; missingReason?: string }): {
  sources: any[];
  missingReason?: string;
} {
  const accessedAt = new Date().toISOString();
  const sources = (row?.sources || []).map((s: any) => {
    const url = String(s?.url || '');
    const domain = s?.domain
      ? String(s.domain)
      : (() => {
          try {
            return new URL(url).hostname.replace(/^www\./i, '');
          } catch {
            return undefined;
          }
        })();

    const sourceType = s?.sourceType;
    const cred = url
      ? scoreSourceCredibility({ url, domain, publication: s?.publication, sourceType })
      : null;

    return {
      ...s,
      id: String(s?.id || stableSourceId(s)),
      accessedAt: String(s?.accessedAt || accessedAt),
      capturedAt: s?.capturedAt ? String(s.capturedAt) : undefined,
      credibilityScore:
        typeof s?.credibilityScore === 'number'
          ? s.credibilityScore
          : (cred?.credibilityScore ?? 0),
      credibilityLabel: s?.credibilityLabel || cred?.credibilityLabel || 'Unknown',
      whyCredible: s?.whyCredible || cred?.whyCredible || 'Credibility unknown (heuristic).',
      sourceType: s?.sourceType || cred?.sourceType,
      domain: domain || s?.domain,
    };
  });

  return { sources, missingReason: row?.missingReason || '' };
}

function sourcesToMarkdown(sources: any[]): string {
  if (!Array.isArray(sources) || sources.length === 0) return '';

  const rows = sources
    .filter(Boolean)
    .map((s: any, i: number) => {
      const id = Number.isFinite(s?.id) ? Number(s.id) : i + 1;
      const author = s?.author ? String(s.author) : 'Unknown';
      const title = s?.title ? String(s.title) : `Reference ${id}`;
      const publication = s?.publication
        ? String(s.publication)
        : s?.domain
          ? String(s.domain)
          : '';
      const year = s?.year ? String(s.year) : '';
      const url = s?.url ? String(s.url) : '';
      const credibilityLabel = s?.credibilityLabel ? String(s.credibilityLabel) : '';
      const credibilityScore =
        typeof s?.credibilityScore === 'number' ? s.credibilityScore.toFixed(2) : '';
      const credibility = [credibilityLabel, credibilityScore ? `(${credibilityScore})` : '']
        .filter(Boolean)
        .join(' ');
      const why = s?.whyCredible ? String(s.whyCredible) : '';
      const accessed = s?.accessedAt ? String(s.accessedAt) : '';

      const meta = [publication, year].filter(Boolean).join(' · ');
      const extras = [
        credibility ? `Credibility: ${credibility}` : '',
        why ? `Why trusted: ${why}` : '',
        accessed ? `Accessed: ${accessed}` : '',
      ]
        .filter(Boolean)
        .join(' — ');

      return `${id}. ${author}. "${title}"${meta ? ` (${meta})` : ''}. ${url}${
        extras ? `\n   ${extras}` : ''
      }`;
    })
    .join('\n');

  return `## Sources\n\n${rows}`;
}

function coursesToMarkdown(
  courses: any[],
  lessonSourcesByLessonId: Record<string, { sources: any[]; missingReason?: string }>,
): string {
  return courses
    .map((c) => {
      const lessons = (c.modules || [])
        .map((m: any) =>
          (m.lessons || [])
            .map((l: any) => {
              const persisted = lessonSourcesByLessonId?.[String(l.id)] || { sources: [] };
              const srcMd = sourcesToMarkdown(persisted.sources || []);
              const missing = persisted?.missingReason
                ? `\n\n> Sources note: ${String(persisted.missingReason)}`
                : '';
              const extra = srcMd ? `\n\n${srcMd}` : missing;
              return `### ${l.title}\n\n${l.content || ''}${extra}`;
            })
            .join('\n\n'),
        )
        .join('\n\n');
      return `# ${c.title}\n\n${c.description || ''}\n\n${lessons}`;
    })
    .join('\n\n---\n\n');
}

// GET /api/v1/export?format=json|md|zip
router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const format = String(req.query.format || 'json');

  const courses = dbCourses.getAll().filter((c: any) => c.authorId === userId);
  const user = db.findUserById(userId);
  const notesByLessonId: Record<string, any> = {};
  const lessonSourcesByLessonId: Record<string, { sources: any[]; missingReason?: string }> = {};

  for (const c of courses as any[]) {
    for (const m of c.modules || []) {
      for (const l of m.lessons || []) {
        const n = dbNotes.get(String(l.id), userId);
        if (n) notesByLessonId[String(l.id)] = n;

        // Iter95/97: include persisted structured sources (+ stable ids, timestamps, credibility fields) in exports.
        try {
          lessonSourcesByLessonId[String(l.id)] = normalizeLessonSourcesRow(
            dbLessonSources.get(String(l.id)),
          );
        } catch {
          // best-effort
          lessonSourcesByLessonId[String(l.id)] = { sources: [] };
        }
      }
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    profile: {
      name: user?.displayName || '',
      email: user?.email || '',
      goals: user?.goals || [],
      topics: (user as any)?.topics || [],
      experience: (user as any)?.experience || 'beginner',
      tier: req.user?.tier || user?.tier || 'free',
    },
    courses,
    notesByLessonId,
    lessonSourcesByLessonId,
  };

  const tier = (req.user?.tier || user?.tier || 'free') as string;

  if (format === 'md' || format === 'markdown') {
    const md = coursesToMarkdown(courses, lessonSourcesByLessonId);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="learnflow-export.md"');
    res.status(200).send(md);
    return;
  }

  // Subscription matrix enforcement (Iter70): Free = Markdown only.
  if (tier !== 'pro') {
    sendError(res, req, {
      status: 403,
      code: 'upgrade_required',
      message: 'Export format requires Pro. Free tier supports Markdown export only.',
      details: {
        allowedFormats: ['md', 'markdown'],
        requestedFormat: format,
      },
    });
    return;
  }

  if (format === 'zip') {
    const zip = new JSZip();
    zip.file('learnflow-export.json', JSON.stringify(payload, null, 2));
    zip.file('learnflow-export.md', coursesToMarkdown(courses, lessonSourcesByLessonId));
    zip.file(
      'metadata.json',
      JSON.stringify({ exportedAt: payload.exportedAt, version: payload.version }, null, 2),
    );

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="learnflow-export.zip"');
    res.status(200).send(buf);
    return;
  }

  if (format === 'pdf' || format === 'scorm') {
    // Stub allowed for Pro while implementation lands.
    sendError(res, req, {
      status: 501,
      code: 'not_implemented',
      message: `${format.toUpperCase()} export is coming soon for Pro users.`,
      details: { requestedFormat: format },
    });
    return;
  }

  // default JSON (Pro)
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="learnflow-export.json"');
  res.status(200).send(JSON.stringify(payload, null, 2));
});

export const exportRouter = router;
