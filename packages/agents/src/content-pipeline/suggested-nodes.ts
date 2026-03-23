import OpenAI from 'openai';
import type { FirecrawlSource } from './firecrawl-provider.js';
import { searchTopicTrending } from './web-search-provider.js';

export type SuggestedMindmapNode = {
  id: string;
  label: string;
  reason?: string;
};

function stableId(prefix: string, label: string): string {
  // Stable-ish across calls in the same process; still unique enough for UI.
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${prefix}-${Date.now()}-${slug}`;
}

const STOP = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'from',
    'has',
    'have',
    'how',
    'i',
    'in',
    'into',
    'is',
    'it',
    'its',
    'of',
    'on',
    'or',
    'our',
    's',
    'so',
    'such',
    't',
    'than',
    'that',
    'the',
    'their',
    'then',
    'these',
    'they',
    'this',
    'to',
    'vs',
    'was',
    'were',
    'what',
    'when',
    'where',
    'which',
    'why',
    'will',
    'with',
    'you',
    'your',
    '2023',
    '2024',
    '2025',
    '2026',
  ].map((s) => s.toLowerCase()),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter((t) => !STOP.has(t));
}

function heuristicAdjacentTopics(
  topic: string,
  sources: FirecrawlSource[],
): SuggestedMindmapNode[] {
  // Very lightweight n-gram mining from titles/snippets.
  const text = sources
    .slice(0, 18)
    .map((s) => `${s.title || ''} ${String(s.content || '').slice(0, 180)}`)
    .join(' ');

  const words = tokenize(text);
  const bigramCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    if (!a || !b) continue;
    if (a === topic.toLowerCase() || b === topic.toLowerCase()) continue;
    const bi = `${a} ${b}`;
    bigramCounts.set(bi, (bigramCounts.get(bi) || 0) + 1);
  }

  const top = Array.from(bigramCounts.entries())
    .sort((x, y) => y[1] - x[1])
    .map(([k]) => k)
    .filter((k) => k.length >= 6)
    .slice(0, 6);

  const labels = top
    .map((b) => b.replace(/\b\w/g, (c) => c.toUpperCase()))
    .filter(Boolean)
    .slice(0, 4);

  // Add a couple “evergreen but timely” expansions if the mining yields little.
  const fallback = [
    `${topic}: 2025–2026 trends`,
    `${topic}: common pitfalls`,
    `${topic}: real-world case studies`,
  ];

  const merged = Array.from(new Set([...labels, ...fallback])).slice(0, 5);
  return merged.map((label) => ({
    id: stableId('sug', label),
    label,
    reason: 'Derived from recent web search signals (heuristic).',
  }));
}

export async function generateSuggestedMindmapNodes(
  topic: string,
  opts: { max?: number } = {},
): Promise<{ suggestions: SuggestedMindmapNode[]; sources: FirecrawlSource[] }> {
  const max = Math.max(2, Math.min(6, opts.max ?? 5));
  const trimmed = String(topic || '').trim();
  if (!trimmed) return { suggestions: [], sources: [] };

  const sources = await searchTopicTrending(trimmed);

  const apiKey = process.env.OPENAI_API_KEY;
  const looksMissingOrPlaceholder =
    !apiKey ||
    apiKey.trim().length < 20 ||
    apiKey.toLowerCase().includes('your_') ||
    apiKey.toLowerCase().includes('placeholder') ||
    apiKey.toLowerCase().includes('changeme');

  if (looksMissingOrPlaceholder) {
    return { suggestions: heuristicAdjacentTopics(trimmed, sources).slice(0, max), sources };
  }

  const openai = new OpenAI({ apiKey: apiKey.trim() });
  const evidence = sources.slice(0, 12).map((s) => ({
    title: s.title,
    url: s.url,
    source: s.source,
    publishDate: s.publishDate,
    snippet: String(s.content || '').slice(0, 180),
  }));

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 450,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You propose adjacent “suggested nodes” for a learning mindmap, based on web-search evidence.
Return JSON: {"suggestions":[{"label":"...","reason":"..."}]}
Rules:
- Return ${max} suggestions.
- Labels are 3–7 words and NOT generic (avoid "overview").
- Make them cutting-edge for 2025–2026 (benchmarks, new standards, emerging techniques).
- Do not include URLs in labels.
- Reasons should be one short sentence.`,
        },
        {
          role: 'user',
          content: JSON.stringify({ topic: trimmed, evidence }, null, 2),
        },
      ],
    });

    const content = resp.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content) as any;
    const arr = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const cleaned: SuggestedMindmapNode[] = arr
      .map((s: any) => ({
        label: typeof s?.label === 'string' ? s.label.trim() : '',
        reason: typeof s?.reason === 'string' ? s.reason.trim() : undefined,
      }))
      .filter((s: any) => s.label && s.label.length >= 6)
      .slice(0, max)
      .map((s: any) => ({
        id: stableId('sug', s.label),
        label: s.label,
        reason: s.reason || 'Derived from recent web search signals.',
      }));

    if (cleaned.length >= 2) return { suggestions: cleaned, sources };
    return { suggestions: heuristicAdjacentTopics(trimmed, sources).slice(0, max), sources };
  } catch {
    return { suggestions: heuristicAdjacentTopics(trimmed, sources).slice(0, max), sources };
  }
}
