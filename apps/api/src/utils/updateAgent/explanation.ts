export function buildDeterministicExplanation(args: {
  topic: string;
  title: string;
  summary?: string;
}): string {
  const topic = (args.topic || '').trim();
  const hay = `${args.title || ''} ${args.summary || ''}`.toLowerCase();

  const words = topic
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  const uniq = Array.from(new Set(words));
  const hits = uniq.filter((w) => hay.includes(w)).slice(0, 4);

  if (hits.length > 0) {
    return `Matched topic keywords: ${hits.join(', ')}`;
  }

  return `New item found while monitoring topic "${topic}".`;
}
