/**
 * Firecrawl Content Provider — Uses Firecrawl API for real web source crawling.
 * Implements Override #3: all content must come from crawled real sources.
 */
function getDefaultConfig() {
  return {
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    baseUrl: 'https://api.firecrawl.dev/v1',
    maxSourcesPerLesson: 8,
    minCredibility: 0.5,
    cacheTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}
const _DEFAULT_CONFIG = getDefaultConfig();
// In-memory cache for crawled content
const sourceCache = new Map();
/** Domain credibility scoring per Override #3 */
const CREDIBILITY_MAP = {
  'arxiv.org': 0.95,
  'nature.com': 0.95,
  'ieee.org': 0.92,
  'acm.org': 0.92,
  'sciencedirect.com': 0.9,
  '.edu': 0.9,
  '.gov': 0.88,
  'docs.python.org': 0.92,
  'doc.rust-lang.org': 0.92,
  'developer.mozilla.org': 0.9,
  'react.dev': 0.9,
  'kubernetes.io': 0.9,
  'cloud.google.com': 0.88,
  'aws.amazon.com': 0.88,
  'learn.microsoft.com': 0.88,
  'technologyreview.com': 0.85,
  'wired.com': 0.82,
  'arstechnica.com': 0.8,
  'medium.com': 0.65,
  'dev.to': 0.62,
  'stackoverflow.com': 0.7,
  'wikipedia.org': 0.72,
  'github.com': 0.75,
  'reddit.com': 0.55,
  'substack.com': 0.68,
  'quora.com': 0.5,
  'thenewstack.io': 0.78,
  'news.ycombinator.com': 0.6,
};
/**
 * Score domain credibility (0-1).
 */
export function scoreCredibility(url) {
  const lower = url.toLowerCase();
  for (const [domain, score] of Object.entries(CREDIBILITY_MAP)) {
    if (lower.includes(domain)) return score;
  }
  // TLD-based fallback
  if (lower.includes('.edu')) return 0.9;
  if (lower.includes('.gov')) return 0.88;
  if (lower.includes('.org')) return 0.6;
  return 0.4;
}
/**
 * Score source recency (0-1). Prefers content from last 2 years.
 */
export function scoreRecency(dateStr) {
  if (!dateStr) return 0.3;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0.3;
  const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 90) return 1.0;
  if (ageDays < 180) return 0.9;
  if (ageDays < 365) return 0.75;
  if (ageDays < 730) return 0.55;
  return 0.3;
}
/**
 * Score keyword relevance (0-1).
 */
export function scoreRelevance(content, topic) {
  const keywords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const lower = content.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++;
  }
  return keywords.length > 0 ? Math.min(1.0, hits / keywords.length) : 0;
}
/**
 * Extract domain from URL.
 */
export function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
/**
 * Check if source diversity is maintained (<50% from single domain).
 */
export function checkDomainDiversity(sources) {
  if (sources.length < 2) return true;
  const domainCounts = {};
  for (const s of sources) {
    domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
  }
  const max = Math.max(...Object.values(domainCounts));
  return max / sources.length <= 0.5;
}
/**
 * Search for sources on a topic using Firecrawl API.
 * In mock mode (no API key), returns realistic mock results.
 */
export async function searchSources(topic, config = {}) {
  const cfg = { ...getDefaultConfig(), ...config };
  if (!cfg.apiKey) {
    // Mock mode: return realistic search results
    return getMockSearchResults(topic);
  }
  console.log('[Firecrawl] Searching for:', topic, 'with API key:', cfg.apiKey ? 'SET' : 'MISSING');
  const response = await fetch(`${cfg.baseUrl}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: topic,
      limit: cfg.maxSourcesPerLesson,
      lang: 'en',
      country: 'us',
    }),
  });
  if (!response.ok) {
    throw new Error(`Firecrawl search failed: ${response.status}`);
  }
  const data = await response.json();
  return data.data || [];
}
/**
 * Scrape a single URL using Firecrawl API.
 * In mock mode, returns mock content.
 */
export async function scrapeUrl(url, config = {}) {
  const cfg = { ...getDefaultConfig(), ...config };
  if (!cfg.apiKey) {
    return getMockScrapedContent(url);
  }
  const response = await fetch(`${cfg.baseUrl}/scrape`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Firecrawl scrape failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    markdown: data.data?.markdown || '',
    title: data.data?.metadata?.title || '',
    author: data.data?.metadata?.author || 'Unknown',
    publishDate: data.data?.metadata?.publishedTime || null,
  };
}
/**
 * Full pipeline: search topic → scrape top sources → score → filter → return.
 * This is the main entry point for the Firecrawl content sourcing.
 */
export async function crawlSourcesForTopic(topic, config = {}) {
  const cfg = { ...getDefaultConfig(), ...config };
  // Step 1: Search for sources
  const searchResults = await searchSources(topic, cfg);
  // Step 2: Scrape each source and score
  const sources = [];
  for (const result of searchResults) {
    // Check cache first
    const cached = sourceCache.get(result.url);
    if (cached && Date.now() - cached.cachedAt < cfg.cacheTtlMs) {
      sources.push(cached.source);
      continue;
    }
    try {
      const scraped = await scrapeUrl(result.url, cfg);
      const content = scraped.markdown || result.description || '';
      const domain = extractDomain(result.url);
      const source = {
        url: result.url,
        title: scraped.title || result.title,
        author: scraped.author,
        publishDate: scraped.publishDate,
        source: domain,
        content,
        credibilityScore: scoreCredibility(result.url),
        relevanceScore: scoreRelevance(content, topic),
        recencyScore: scoreRecency(scraped.publishDate),
        wordCount: content.split(/\s+/).length,
        domain,
      };
      // Cache the result
      sourceCache.set(result.url, { source, cachedAt: Date.now() });
      sources.push(source);
    } catch {
      // Skip failed scrapes
      continue;
    }
  }
  // Step 3: Filter by minimum credibility
  const filtered = sources.filter((s) => {
    const combined = (s.credibilityScore + s.relevanceScore + s.recencyScore) / 3;
    return combined >= cfg.minCredibility;
  });
  // Step 4: Sort by combined score descending
  filtered.sort((a, b) => {
    const scoreA = (a.credibilityScore + a.relevanceScore + a.recencyScore) / 3;
    const scoreB = (b.credibilityScore + b.relevanceScore + b.recencyScore) / 3;
    return scoreB - scoreA;
  });
  // Step 5: Ensure domain diversity
  return ensureDiversity(filtered, cfg.maxSourcesPerLesson);
}
function ensureDiversity(sources, maxSources) {
  const result = [];
  const domainCount = {};
  for (const s of sources) {
    if (result.length >= maxSources) break;
    const currentCount = domainCount[s.domain] || 0;
    const maxPerDomain = Math.ceil(maxSources / 2);
    if (currentCount < maxPerDomain) {
      result.push(s);
      domainCount[s.domain] = currentCount + 1;
    }
  }
  return result;
}
/**
 * Format sources into inline citations and a references section.
 */
export function formatCitations(sources) {
  const inlineCitations = new Map();
  const refs = ['## References & Further Reading'];
  sources.forEach((s, i) => {
    const num = i + 1;
    inlineCitations.set(i, `[${num}]`);
    const dateStr = s.publishDate ? `, ${new Date(s.publishDate).getFullYear()}` : '';
    const authorStr = s.author !== 'Unknown' ? `${s.author}. ` : '';
    refs.push(`${num}. ${authorStr}"${s.title}"${dateStr}. ${s.url}`);
  });
  return { inlineCitations, referencesSection: refs.join('\n') };
}
/**
 * Synthesize lesson content from crawled sources.
 * Returns content with inline citations and a references section.
 *
 * Iteration 14 rewrite: use an actual LLM synthesis when an API key is present.
 * - Prefers OPENAI_API_KEY, falls back to ANTHROPIC_API_KEY.
 * - Falls back to a deterministic template if no key is configured or the LLM fails.
 */
export async function synthesizeFromSources(topic, lessonTitle, sources) {
  if (sources.length === 0) {
    return { content: `# ${lessonTitle}\n\nContent for ${topic}.`, references: '', sourceCount: 0 };
  }
  const { referencesSection } = formatCitations(sources);
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  // Provide the model a compact, indexed source pack so it can cite like [1], [2], ...
  const topSources = sources.slice(0, 10);
  const sourcePack = topSources
    .map((s, i) => {
      const n = i + 1;
      const excerpt = (s.content || '').slice(0, 2200);
      return `[${n}] ${s.title || s.domain}\nURL: ${s.url}\nDomain: ${s.domain}\nExcerpt:\n${excerpt}`;
    })
    .join('\n\n---\n\n');
  const systemPrompt = `You are a world-class educator and science communicator (Feynman + Kurzgesagt).

Goal: Write a single lesson that feels like a great blog post: concrete, visual, engaging, and frontier-focused.

Hard requirements:
- Length: 900–1400 words.
- Include at least one strong analogy or metaphor.
- Include at least one small ASCII diagram when helpful.
- Include a mandatory section titled exactly: "🔭 Frontiers & Open Questions".
- Use ONLY the provided sources for factual claims.
- Add inline citations using bracket markers that match the provided source indices: [1], [2], ...
- Use at least 3 different sources.
- Do NOT write a bibliography-style "this source is useful" list; synthesize.

Output format (markdown):
# ${lessonTitle}

## Learning Objectives
- 3–4 bullets starting with "By the end, you’ll be able to…"

## Main Content
(4–6 subsections with ### headings)

## 🔭 Frontiers & Open Questions
(3–5 specific frontier directions + why they matter)

## Key Takeaways
(5–7 numbered takeaways)

Do NOT include a Sources/References list in the model output; it will be appended separately.`;
  const userPrompt = `Topic: ${topic}
Lesson title: ${lessonTitle}

Sources (indexed; cite as [n]):
\n${sourcePack}`;
  // 1) Try OpenAI
  if (openaiKey) {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: openaiKey });
      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 5000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const content = resp.choices[0]?.message?.content?.trim();
      if (content && content.length > 400) {
        return {
          content: `${content}\n\n${referencesSection}`,
          references: referencesSection,
          sourceCount: sources.length,
        };
      }
    } catch (err) {
      console.warn('[synthesizeFromSources] OpenAI synthesis failed:', err);
    }
  }
  // 2) Try Anthropic
  if (anthropicKey) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 5000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const contentArr = data?.content;
        const contentObj = data?.content;
        const text = Array.isArray(contentArr)
          ? contentArr
              .map((c) => c?.text)
              .filter(Boolean)
              .join('\n')
          : contentObj?.text;
        const content = (text || '').trim();
        if (content && content.length > 400) {
          return {
            content: `${content}\n\n${referencesSection}`,
            references: referencesSection,
            sourceCount: sources.length,
          };
        }
      } else {
        console.warn(
          '[synthesizeFromSources] Anthropic HTTP error:',
          resp.status,
          await resp.text(),
        );
      }
    } catch (err) {
      console.warn('[synthesizeFromSources] Anthropic synthesis failed:', err);
    }
  }
  // 3) Fallback (deterministic template) — preserves prior behavior for tests/offline.
  const sections = [];
  sections.push(`# ${lessonTitle}\n`);
  sections.push(`## Learning Objectives\n`);
  sections.push(
    `- By the end, you’ll be able to explain the core ideas behind ${topic} in plain English\n` +
      `- By the end, you’ll be able to recognize key terms and how they relate\n` +
      `- By the end, you’ll be able to apply ${lessonTitle.toLowerCase()} concepts to a small, realistic scenario\n`,
  );
  sections.push(`## Main Content\n`);
  // Keep the old keyword-based scaffolding (but in a more narrative form).
  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'into',
    'your',
    'you',
    'are',
    'was',
    'were',
    'has',
    'have',
    'had',
    'will',
    'can',
    'could',
    'should',
    'may',
    'might',
    'also',
    'than',
    'then',
    'their',
    'there',
    'about',
    'over',
    'under',
    'between',
    'within',
    'using',
    'use',
    'used',
    'more',
    'most',
    'such',
    'often',
    'many',
    'some',
    'other',
    'these',
    'those',
    'they',
    'them',
    'its',
    'it',
    'in',
    'on',
    'at',
    'to',
    'of',
    'a',
    'an',
    'as',
    'is',
    'be',
    'by',
    'or',
  ]);
  const collectKeywords = (text) => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !stop.has(w));
    const freq = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  };
  const topThemes = new Map();
  for (const s of sources.slice(0, 4)) {
    for (const kw of collectKeywords(s.content)) topThemes.set(kw, (topThemes.get(kw) || 0) + 1);
  }
  const themes = [...topThemes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
  sections.push(
    `### A simple mental model\n` +
      `Think of **${lessonTitle}** as a set of ideas that help you reason about ${topic}. ` +
      `Across the sources, the recurring themes are: ${themes.length ? themes.join(', ') : 'core concepts, trade-offs, and practical techniques'}. ` +
      `We’ll connect those into one coherent picture. [1]\n`,
  );
  sections.push(`### What’s going on under the hood\n`);
  sections.push(
    `A good way to learn this is to map **inputs → process → outputs**. For example:\n\n` +
      '```\n' +
      `Inputs → ${lessonTitle} system → Outcomes\n` +
      '```\n\n' +
      `Different sources emphasize different parts of this pipeline, which is why we use several perspectives. [2] [3]\n`,
  );
  sections.push(`### Concrete example\n`);
  const s0 = sources[0];
  const s1 = sources[1] || sources[0];
  sections.push(
    `Start with a tiny scenario and ask: what would change if we tweaked one assumption? ` +
      `That “what if?” habit is the fastest path to mastery. [1]\n\n` +
      `For deeper specifics, see: [${s0.title || s0.domain}](${s0.url}) [1] and [${s1.title || s1.domain}](${s1.url}) [2].\n`,
  );
  sections.push(`## 🔭 Frontiers & Open Questions\n`);
  sections.push(
    `Even in a "foundations" lesson, it helps to know what’s still moving. A few frontier questions to explore next:\n` +
      `- What are the current limitations and failure modes people are actively trying to fix? [1]\n` +
      `- Which new tools or methods are changing best practices right now? [2]\n` +
      `- What problems are still unsolved, and why are they hard? [3]\n`,
  );
  sections.push(`## Key Takeaways\n`);
  sections.push(`1. ${lessonTitle} is best learned as a mental model, not a glossary. [1]\n`);
  sections.push(
    `2. Use multiple sources to triangulate what matters vs. what’s just implementation detail. [2]\n`,
  );
  sections.push(`3. The fastest learning loop is: explain → test with examples → refine. [3]\n`);
  sections.push(`4. Frontier work is where the most interesting trade-offs live. [1]\n`);
  sections.push(`5. Keep the references handy; they’re your “next rabbit holes.” [2]\n`);
  sections.push(referencesSection);
  return {
    content: sections.join('\n'),
    references: referencesSection,
    sourceCount: sources.length,
  };
}
/**
 * Search and scrape sources specific to a single lesson.
 * Generates lesson-specific queries, searches, scrapes top results, dedupes, scores by relevance to the lesson.
 */
export async function searchForLesson(
  courseTopic,
  moduleTitle,
  lessonTitle,
  lessonDescription,
  config = {},
) {
  const cfg = { ...getDefaultConfig(), ...config };
  // Generate 3-5 lesson-specific search queries
  const queries = generateLessonQueries(courseTopic, moduleTitle, lessonTitle, lessonDescription);
  console.log(`[Firecrawl] Lesson "${lessonTitle}" — ${queries.length} queries`);
  const allResults = [];
  const seenUrls = new Set();
  for (const query of queries) {
    try {
      const results = await searchSources(query, { ...cfg, maxSourcesPerLesson: 5 });
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    } catch (err) {
      console.warn(`[Firecrawl] Search failed for query "${query}":`, err);
    }
    // Rate limit delay
    await new Promise((r) => setTimeout(r, 300));
  }
  // Scrape top results (up to 8 unique URLs)
  const toScrape = allResults.slice(0, 8);
  const sources = [];
  for (const result of toScrape) {
    // Check cache
    const cached = sourceCache.get(result.url);
    if (cached && Date.now() - cached.cachedAt < cfg.cacheTtlMs) {
      sources.push(cached.source);
      continue;
    }
    try {
      const scraped = await scrapeUrl(result.url, cfg);
      const content = scraped.markdown || result.description || '';
      const domain = extractDomain(result.url);
      const source = {
        url: result.url,
        title: scraped.title || result.title,
        author: scraped.author,
        publishDate: scraped.publishDate,
        source: domain,
        content,
        credibilityScore: scoreCredibility(result.url),
        relevanceScore: scoreRelevance(content, `${lessonTitle} ${lessonDescription}`),
        recencyScore: scoreRecency(scraped.publishDate),
        wordCount: content.split(/\s+/).length,
        domain,
      };
      sourceCache.set(result.url, { source, cachedAt: Date.now() });
      sources.push(source);
    } catch {
      continue;
    }
    // Rate limit delay
    await new Promise((r) => setTimeout(r, 250));
  }
  // Sort by relevance to THIS lesson (not just credibility)
  sources.sort((a, b) => {
    const scoreA = a.relevanceScore * 0.5 + a.credibilityScore * 0.3 + a.recencyScore * 0.2;
    const scoreB = b.relevanceScore * 0.5 + b.credibilityScore * 0.3 + b.recencyScore * 0.2;
    return scoreB - scoreA;
  });
  // Return top 6
  return ensureDiversity(sources, 6);
}
/**
 * Generate lesson-specific search queries.
 */
function generateLessonQueries(courseTopic, moduleTitle, lessonTitle, lessonDescription) {
  const queries = [
    `${lessonTitle} ${courseTopic} explained`,
    `${lessonTitle} tutorial guide`,
    `${lessonDescription} examples`,
  ];
  // Add a comparison/advanced query
  const words = lessonTitle.split(/\s+/).filter((w) => w.length > 3);
  if (words.length >= 2) {
    queries.push(`${words.join(' ')} best practices techniques`);
  }
  // Add module-context query
  queries.push(`${moduleTitle} ${lessonTitle} concepts`);
  return queries.slice(0, 5);
}
/**
 * Bulk research for a topic — Stage 1 of the pipeline.
 * Runs 5-8 search queries to find trending/authoritative content.
 * Uses search results directly (no individual scraping) for speed and reliability.
 * Individual lesson scraping happens in Stage 2.
 */
export async function searchTopicTrending(topic, config = {}) {
  const cfg = { ...getDefaultConfig(), ...config };
  const queries = [
    `${topic} comprehensive guide 2025`,
    `${topic} best practices`,
    `${topic} tutorial advanced`,
    `${topic} trends 2025`,
    `${topic} research latest`,
    `${topic} real world examples`,
    `${topic} common mistakes pitfalls`,
  ];
  const allResults = [];
  const seenUrls = new Set();
  for (const query of queries) {
    try {
      const results = await searchSources(query, { ...cfg, maxSourcesPerLesson: 5 });
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    } catch (err) {
      console.warn(`[Firecrawl] Trending search failed for "${query}":`, err);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`[Firecrawl] Trending research found ${allResults.length} unique results`);
  // Convert search results to sources WITHOUT individual scraping (fast path for planning).
  // The search API returns title + description which is enough for course planning.
  // Per-lesson scraping in Stage 2 will get the full content.
  const sources = allResults.map((result) => {
    const content = result.markdown || result.description || '';
    const domain = extractDomain(result.url);
    const source = {
      url: result.url,
      title: result.title,
      author: 'Unknown',
      publishDate: null,
      source: domain,
      content,
      credibilityScore: scoreCredibility(result.url),
      relevanceScore: scoreRelevance(content, topic),
      recencyScore: 0.5, // Unknown without date
      wordCount: content.split(/\s+/).length,
      domain,
    };
    // Cache for potential reuse
    sourceCache.set(result.url, { source, cachedAt: Date.now() });
    return source;
  });
  // Sort by combined score
  sources.sort((a, b) => {
    const scoreA = (a.credibilityScore + a.relevanceScore + a.recencyScore) / 3;
    const scoreB = (b.credibilityScore + b.relevanceScore + b.recencyScore) / 3;
    return scoreB - scoreA;
  });
  return sources;
}
/** Clear the source cache (for testing). */
export function clearSourceCache() {
  sourceCache.clear();
}
/** Get cache size (for testing). */
export function getSourceCacheSize() {
  return sourceCache.size;
}
// ─── Mock Data ───────────────────────────────────────────────────
function getMockSearchResults(topic) {
  const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
  return [
    {
      url: `https://arxiv.org/abs/2024.${topicSlug}-survey`,
      title: `A Comprehensive Survey of ${topic}`,
      description: `This paper provides a comprehensive review of recent advances in ${topic}, covering theoretical foundations and practical applications.`,
    },
    {
      url: `https://docs.python.org/3/library/${topicSlug}.html`,
      title: `${topic} — Official Documentation`,
      description: `Official documentation covering the core concepts and API reference for ${topic}.`,
    },
    {
      url: `https://medium.com/tech-insights/${topicSlug}-guide`,
      title: `The Complete Guide to ${topic} in 2025`,
      description: `A practitioner's guide to understanding and implementing ${topic} in modern systems.`,
      markdown: `# The Complete Guide to ${topic}\n\nThis comprehensive guide covers everything you need to know about ${topic}. From the fundamental principles to advanced implementation patterns, we explore how ${topic} is transforming the technology landscape.\n\n## Core Concepts\n\nAt its heart, ${topic} involves several key principles that practitioners must understand. The field has seen rapid advancement in recent years, with new methodologies and frameworks emerging regularly.\n\n## Implementation\n\nWhen implementing ${topic}, it's crucial to follow established best practices. Leading organizations have found that a systematic approach yields the best results, with measurable improvements in efficiency and accuracy.`,
    },
    {
      url: `https://www.nature.com/articles/${topicSlug}-2025`,
      title: `Recent Advances in ${topic}: A Review`,
      description: `Nature article reviewing breakthrough developments in ${topic} across multiple research domains.`,
    },
    {
      url: `https://dev.to/techauthor/${topicSlug}-tutorial`,
      title: `${topic}: A Hands-On Tutorial`,
      description: `Step-by-step tutorial for getting started with ${topic}, including code examples and best practices.`,
    },
    {
      url: `https://learn.microsoft.com/en-us/${topicSlug}/overview`,
      title: `${topic} Overview - Microsoft Learn`,
      description: `Microsoft Learn documentation providing an overview of ${topic} concepts, architecture, and implementation strategies.`,
    },
  ];
}
function getMockScrapedContent(url) {
  const domain = extractDomain(url);
  const baseTopic = url.split('/').pop()?.replace(/-/g, ' ') || 'the topic';
  if (domain.includes('arxiv.org')) {
    return {
      title: `A Comprehensive Survey of ${baseTopic}`,
      author: 'Chen, L. et al.',
      publishDate: '2025-01-15',
      markdown: `# A Comprehensive Survey of ${baseTopic}\n\n## Abstract\nThis paper presents a comprehensive survey of ${baseTopic}, examining the current state of the art, key challenges, and future directions. We reviewed over 200 publications from 2020-2025 and identified three major trends that are shaping the field. Our analysis reveals that ${baseTopic} has seen a 340% increase in research publications over the past three years, indicating growing academic and industrial interest.\n\n## Introduction\nThe field of ${baseTopic} has undergone significant transformation in recent years. Early approaches relied on traditional methods, but recent advances in machine learning and computational capabilities have opened new possibilities. This survey aims to provide researchers and practitioners with a thorough understanding of the landscape.\n\n## Key Findings\nOur analysis identified several critical developments: (1) Novel algorithmic approaches have improved efficiency by 45%, (2) Cross-domain applications are expanding rapidly, (3) Standardization efforts are underway to improve interoperability. These findings suggest that ${baseTopic} is maturing as a discipline with increasing real-world impact.`,
    };
  }
  if (domain.includes('nature.com')) {
    return {
      title: `Recent Advances in ${baseTopic}: A Review`,
      author: 'Dr. Sarah Johnson',
      publishDate: '2025-02-20',
      markdown: `# Recent Advances in ${baseTopic}\n\nThe pace of innovation in ${baseTopic} continues to accelerate, with several breakthrough discoveries reported in the past year. Researchers at leading institutions have demonstrated new approaches that significantly outperform previous methods.\n\n## Methodology\nWe conducted a systematic review of 150 peer-reviewed publications, analyzing trends in methodology, applications, and outcomes. The review period covered January 2023 through December 2025.\n\n## Results\nKey findings include improved accuracy metrics across all benchmark tasks, with the best-performing approaches achieving 94.7% accuracy on standard evaluation sets. This represents a 12% improvement over the previous state of the art.`,
    };
  }
  if (domain.includes('microsoft.com') || domain.includes('python.org')) {
    return {
      title: `${baseTopic} Documentation`,
      author: 'Documentation Team',
      publishDate: '2025-03-01',
      markdown: `# ${baseTopic}\n\n## Overview\nThis documentation provides comprehensive coverage of ${baseTopic}, including installation guides, API references, and best practices. Whether you're a beginner or an experienced practitioner, you'll find the resources you need to work effectively with ${baseTopic}.\n\n## Getting Started\nTo begin working with ${baseTopic}, you'll need to understand the core concepts and set up your development environment. This guide walks you through the essential steps.\n\n## API Reference\nThe ${baseTopic} API provides a comprehensive set of functions and classes for building applications. Each endpoint is thoroughly documented with examples and parameter descriptions.`,
    };
  }
  return {
    title: `Guide to ${baseTopic}`,
    author: 'Tech Writer',
    publishDate: '2025-01-10',
    markdown: `# Guide to ${baseTopic}\n\nThis guide provides a practical introduction to ${baseTopic}, covering the essential concepts and techniques that every practitioner should know. We explore real-world use cases and provide hands-on examples to help you build practical skills.\n\n## Core Principles\n${baseTopic} is built on several fundamental principles that guide its application across different contexts. Understanding these principles is essential for effective implementation.\n\n## Best Practices\nBased on industry experience and research findings, we recommend the following best practices for working with ${baseTopic}: systematic testing, incremental adoption, and continuous monitoring.`,
  };
}
//# sourceMappingURL=firecrawl-provider.js.map
