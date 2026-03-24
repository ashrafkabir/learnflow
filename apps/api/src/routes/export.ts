import { Router, Request, Response } from 'express';
import JSZip from 'jszip';
import { dbCourses, db, dbNotes } from '../db.js';
import { sendError } from '../errors.js';

const router = Router();

function coursesToMarkdown(courses: any[]): string {
  return courses
    .map((c) => {
      const lessons = (c.modules || [])
        .map((m: any) =>
          (m.lessons || []).map((l: any) => `### ${l.title}\n\n${l.content || ''}`).join('\n\n'),
        )
        .join('\n\n');
      return `# ${c.title}\n\n${c.description || ''}\n\n${lessons}`;
    })
    .join('\n\n---\n\n');
}

// GET /api/v1/export?format=json|md|zip
// GET /api/v1/export/zip (alias)
async function handleExport(req: Request, res: Response) {
  const userId = req.user!.sub;
  const format = String(req.query.format || 'json');

  const courses = dbCourses.getAll().filter((c: any) => c.authorId === userId);
  const user = db.findUserById(userId);
  const notesByLessonId: Record<string, any> = {};
  for (const c of courses as any[]) {
    for (const m of c.modules || []) {
      for (const l of m.lessons || []) {
        const n = dbNotes.get(String(l.id), userId);
        if (n) notesByLessonId[String(l.id)] = n;
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
  };

  const tier = (req.user?.tier || user?.tier || 'free') as string;

  if (format === 'md' || format === 'markdown') {
    const md = coursesToMarkdown(courses);
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
    zip.file('learnflow-export.md', coursesToMarkdown(courses));
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
}

router.get('/', async (req: Request, res: Response) => {
  await handleExport(req, res);
});

router.get('/zip', async (req: Request, res: Response) => {
  req.query.format = 'zip';
  await handleExport(req, res);
});

export const exportRouter = router;
