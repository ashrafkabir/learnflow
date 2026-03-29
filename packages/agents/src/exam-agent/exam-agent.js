/**
 * Exam Agent — generates quizzes, scores responses, identifies knowledge gaps.
 */
export class ExamAgent {
  name = 'exam_agent';
  capabilities = ['generate_quiz', 'score_quiz', 'identify_gaps'];
  async initialize() {}
  async process(_context, task) {
    const content = task.params.content || task.params.input || '';
    const questionType = task.params.questionType || 'multiple_choice';
    let data;
    let text;
    if (task.type === 'score_quiz') {
      const answers = task.params.answers;
      const questions = task.params.questions;
      data = this.scoreQuiz(questions, answers);
      text = `Quiz scored: ${data.percentage}% correct.`;
    } else if (questionType === 'short_answer') {
      data = this.generateShortAnswerQuestions(content);
      text = `Generated ${data.length} short-answer questions.`;
    } else {
      data = this.generateMultipleChoiceQuestions(content);
      text = `Generated ${data.length} multiple-choice questions.`;
    }
    return {
      agentName: this.name,
      status: 'success',
      data: { text, questions: data },
      tokensUsed: 150,
    };
  }
  async cleanup() {}
  generateMultipleChoiceQuestions(content) {
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    const questions = [];

    const stop = new Set([
      'the',
      'and',
      'that',
      'this',
      'with',
      'from',
      'into',
      'about',
      'they',
      'them',
      'their',
      'there',
      'then',
      'than',
      'when',
      'where',
      'which',
      'while',
      'would',
      'could',
      'should',
      'also',
      'most',
      'some',
      'many',
      'such',
      'used',
      'using',
      'use',
      'often',
      'important',
    ]);

    const cleanToken = (t) =>
      String(t)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/gi, '');
    const uniq = (arr) => Array.from(new Set(arr.map((a) => String(a).trim()).filter(Boolean)));

    const pickKeyword = (s) => {
      const tokens = String(s)
        .split(/\s+/)
        .map((t) => cleanToken(t))
        .filter((t) => t.length >= 4 && !stop.has(t));
      return tokens[Math.floor(tokens.length / 3)] || tokens[0] || 'concept';
    };

    const hash32 = (str) => {
      let h = 5381;
      for (let i = 0; i < str.length; i++) {
        h = (h * 33) ^ str.charCodeAt(i);
      }
      return h >>> 0;
    };

    const stableShuffle = (arr, salt) => {
      return [...arr].sort((a, b) => hash32(String(a) + salt) - hash32(String(b) + salt));
    };

    const distractorsFor = (keyword, sentence) => {
      const altToken = pickKeyword(String(sentence).split(/\s+/).slice(-12).join(' '));

      const ds = uniq([
        `It is unrelated to ${keyword} and focuses on something else entirely.`,
        `It means the opposite of ${keyword} in this context.`,
        `It is a narrow special case of ${keyword} rather than the general idea.`,
        `It is primarily about ${altToken} (not ${keyword}).`,
        `It is a tool or implementation detail, not the underlying concept of ${keyword}.`,
      ]);
      return ds.slice(0, 4);
    };

    const maxQ = Math.min(sentences.length, 5);
    for (let i = 0; i < maxQ; i++) {
      const sentence = sentences[i];
      const keyword = pickKeyword(sentence);

      const correct = sentence.length > 60 ? `${sentence.slice(0, 60).trim()}…` : sentence;
      const distractors = distractorsFor(keyword, sentence).filter((d) => d !== correct);

      let options = uniq([correct, ...distractors]).slice(0, 4);
      if (options.length < 4) {
        const pads = uniq([
          `It refers to a different concept than ${keyword}.`,
          `It applies only in rare edge cases and is not generally true about ${keyword}.`,
          `It describes a common misconception about ${keyword}.`,
        ]);
        options = uniq([...options, ...pads]).slice(0, 4);
      }
      while (options.length < 4) options.push(`${options[options.length - 1]} (variant)`);

      const shuffled = stableShuffle(options, `${keyword}:${i}`);
      const correctIndex = shuffled.findIndex((o) => o === correct);

      questions.push({
        id: `mcq-${i}`,
        question: `What is true about ${keyword}?`,
        options: shuffled,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: sentence,
      });
    }

    return questions;
  }
  generateShortAnswerQuestions(content) {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const questions = [];
    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ').filter((w) => w.length > 4);
      questions.push({
        id: `sa-${i}`,
        question: `Explain the concept mentioned: "${words.slice(0, 3).join(' ')}"`,
        expectedKeywords: words.slice(0, 5),
        sampleAnswer: sentence,
      });
    }
    return questions;
  }
  scoreQuiz(questions, answers) {
    let correct = 0;
    const correctAnswers = [];
    const incorrectAnswers = [];
    const knowledgeGaps = [];
    for (const q of questions) {
      const userAnswer = parseInt(answers[q.id] || '-1', 10);
      if (userAnswer === q.correctIndex) {
        correct++;
        correctAnswers.push(q.id);
      } else {
        incorrectAnswers.push(q.id);
        knowledgeGaps.push(q.question);
      }
    }
    return {
      score: correct,
      total: questions.length,
      percentage: questions.length > 0 ? (correct / questions.length) * 100 : 0,
      knowledgeGaps,
      correctAnswers,
      incorrectAnswers,
    };
  }
}
//# sourceMappingURL=exam-agent.js.map
