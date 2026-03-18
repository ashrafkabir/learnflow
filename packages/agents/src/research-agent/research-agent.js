/**
 * Research Agent — finds papers and synthesizes findings.
 */
export class ResearchAgent {
    name = 'research_agent';
    capabilities = ['deep_research', 'find_papers', 'synthesize'];
    api;
    constructor(api) {
        this.api = api;
    }
    async initialize() { }
    async process(_context, task) {
        const topic = task.params.topic || task.params.input || 'general';
        let papers = [];
        if (this.api) {
            papers = await this.api.search(topic);
        }
        else {
            // Mock papers for testing
            papers = this.getMockPapers(topic);
        }
        const summary = this.synthesize(topic, papers);
        return {
            agentName: this.name,
            status: 'success',
            data: {
                text: summary.synthesis,
                summary,
                papers,
            },
            tokensUsed: 200,
        };
    }
    async cleanup() { }
    getMockPapers(topic) {
        return [
            {
                title: `Introduction to ${topic}`,
                authors: ['A. Smith', 'B. Jones'],
                abstract: `This paper provides an overview of ${topic} and its applications.`,
                url: `https://arxiv.org/abs/${Date.now()}`,
                year: 2024,
                citations: 50,
            },
            {
                title: `Advanced ${topic} Techniques`,
                authors: ['C. Wilson'],
                abstract: `We present novel techniques for ${topic} with improved performance.`,
                url: `https://arxiv.org/abs/${Date.now() + 1}`,
                year: 2025,
                citations: 25,
            },
        ];
    }
    synthesize(topic, papers) {
        const keyFindings = papers.map((p) => `${p.authors[0]} (${p.year}): ${p.abstract.slice(0, 100)}...`);
        const synthesis = `Research on "${topic}" spans ${papers.length} papers. ` +
            `Key contributions include work by ${papers.map((p) => p.authors[0]).join(', ')}. ` +
            `The most cited work has ${Math.max(...papers.map((p) => p.citations))} citations.`;
        return {
            topic,
            papers,
            synthesis,
            keyFindings,
        };
    }
}
//# sourceMappingURL=research-agent.js.map