import OpenAI from 'openai';
function normalizeQueries(queries, min, max) {
    const arr = Array.isArray(queries) ? queries : [];
    const cleaned = arr
        .map((q) => (typeof q === 'string' ? q.trim() : ''))
        .filter((q) => q.length >= 4)
        .map((q) => q.replace(/^[-*\d.\s]+/, '').trim())
        .filter(Boolean);
    // Deduplicate (case-insensitive)
    const seen = new Set();
    const deduped = [];
    for (const q of cleaned) {
        const key = q.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(q);
    }
    return deduped.slice(0, Math.max(min, Math.min(max, deduped.length)));
}
function heuristicTrendingQueries(topic) {
    // Keep this conservative but useful when OpenAI key is absent.
    return normalizeQueries([
        `${topic} best practices`,
        `${topic} tutorial`,
        `${topic} pitfalls common mistakes`,
        `${topic} architecture patterns`,
        `${topic} examples`,
        `${topic} 2025 trends`,
        `${topic} research`,
        `${topic} open source github`,
    ], 6, 10);
}
function heuristicLessonQueries(args) {
    const { topic, moduleTitle, lessonTitle, lessonDescription } = args;
    return normalizeQueries([
        `${lessonTitle} ${topic}`,
        `${lessonTitle} best practices`,
        `${lessonTitle} examples`,
        `${lessonTitle} pitfalls`,
        `${moduleTitle} ${lessonTitle}`,
        lessonDescription,
    ], 3, 6);
}
export function createOpenAIQueryGenerator(env = process.env) {
    const apiKey = env.OPENAI_API_KEY;
    const openai = apiKey ? new OpenAI({ apiKey }) : null;
    return {
        async generateTrendingQueries(topic) {
            if (!openai)
                return heuristicTrendingQueries(topic);
            const resp = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.4,
                max_tokens: 450,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You generate web search queries for researching a course topic. Return JSON: {"queries": [..]}.\n' +
                            'Rules: 6-10 queries, concise, include a mix of: definitions, best practices, trends, real-world use cases, pitfalls, and at least 2 queries targeting high-quality sources (e.g., site:wikipedia.org, site:arxiv.org, site:github.com).\n' +
                            'No quotes, no special operators other than optional site: filters. Avoid duplicates.',
                    },
                    { role: 'user', content: `Topic: ${topic}` },
                ],
            });
            const content = resp.choices[0]?.message?.content || '{}';
            let parsed = {};
            try {
                parsed = JSON.parse(content);
            }
            catch {
                return heuristicTrendingQueries(topic);
            }
            const queries = normalizeQueries(parsed.queries, 6, 10);
            return queries.length >= 6 ? queries : heuristicTrendingQueries(topic);
        },
        async generateLessonQueries(args) {
            if (!openai)
                return heuristicLessonQueries(args);
            const resp = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.4,
                max_tokens: 350,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You generate web search queries for researching a specific lesson within a course. Return JSON: {"queries": [..]}.\n' +
                            'Rules: 3-6 queries, targeted and specific; include at least 1 query for Wikipedia, 1 for arXiv (if relevant), and 1 for GitHub repositories or READMEs. Avoid duplicates.',
                    },
                    {
                        role: 'user',
                        content: `Course topic: ${args.topic}\nModule: ${args.moduleTitle}\nLesson: ${args.lessonTitle}\nLesson description: ${args.lessonDescription}`,
                    },
                ],
            });
            const content = resp.choices[0]?.message?.content || '{}';
            let parsed = {};
            try {
                parsed = JSON.parse(content);
            }
            catch {
                return heuristicLessonQueries(args);
            }
            const queries = normalizeQueries(parsed.queries, 3, 6);
            return queries.length >= 3 ? queries : heuristicLessonQueries(args);
        },
    };
}
//# sourceMappingURL=trending-queries.js.map