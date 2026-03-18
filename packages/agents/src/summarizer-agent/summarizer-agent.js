/**
 * Summarizer Agent — condenses long-form content into key takeaways.
 */
export class SummarizerAgent {
  name = 'summarizer_agent';
  capabilities = ['summarize', 'condense', 'key_takeaways'];
  async initialize() {}
  async process(_context, task) {
    const content = task.params.content || task.params.input || '';
    const maxWords = task.params.maxWords || 500;
    const summary = this.summarize(content, maxWords);
    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: summary.summary,
        summary,
      },
      tokensUsed: 100,
    };
  }
  async cleanup() {}
  summarize(content, maxWords = 500) {
    const words = content.split(/\s+/).filter(Boolean);
    const originalWordCount = words.length;
    // Extract key sentences (first sentence of each paragraph + important ones)
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const keyPoints = [];
    const summaryParts = [];
    // Take first few sentences and sentences with key indicator words
    const indicators = ['important', 'key', 'main', 'significant', 'crucial', 'essential'];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const isImportant = indicators.some((i) => trimmed.toLowerCase().includes(i));
      if (summaryParts.length < 3 || isImportant) {
        if (this.countWords(summaryParts.join('. ')) < maxWords) {
          summaryParts.push(trimmed);
          if (trimmed.length > 20) {
            keyPoints.push(trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : ''));
          }
        }
      }
    }
    // Ensure we don't exceed maxWords
    let summaryText = summaryParts.join('. ');
    const summaryWords = summaryText.split(/\s+/);
    if (summaryWords.length > maxWords) {
      summaryText = summaryWords.slice(0, maxWords).join(' ') + '...';
    }
    const summaryWordCount = this.countWords(summaryText);
    return {
      originalWordCount,
      summaryWordCount,
      compressionRatio: originalWordCount > 0 ? summaryWordCount / originalWordCount : 0,
      keyPoints: keyPoints.slice(0, 5),
      summary: summaryText,
    };
  }
  countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }
}
//# sourceMappingURL=summarizer-agent.js.map
