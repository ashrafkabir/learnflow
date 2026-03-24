// Minimal safe defaults. Keep small + stable.
export function defaultSourcesForTopic(topic: string): string[] {
  const t = (topic || '').toLowerCase();

  // Curated tech-ish defaults; can be expanded later.
  if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('llm')) {
    return [
      'https://openai.com/blog/rss.xml',
      'https://www.anthropic.com/news/rss.xml',
      'https://www.theverge.com/rss/index.xml',
    ];
  }

  if (t.includes('security') || t.includes('infosec') || t.includes('vulnerability')) {
    return ['https://www.cisa.gov/uscert/ncas/alerts.xml', 'https://krebsonsecurity.com/feed/'];
  }

  // General news/tech fallback
  return ['https://www.theverge.com/rss/index.xml'];
}
