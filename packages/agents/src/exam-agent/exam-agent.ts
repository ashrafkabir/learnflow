/**
 * Exam Agent — generates quizzes, scores responses, identifies knowledge gaps.
 */

import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  expectedKeywords: string[];
  sampleAnswer: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  // Back-compat: older callers may treat gaps as freeform strings.
  knowledgeGaps: string[];
  // Preferred: normalized concept tags that can drive recommendations.
  gapTags?: string[];
  correctAnswers: string[];
  incorrectAnswers: string[];
}

export class ExamAgent implements AgentInterface {
  name = 'exam_agent';
  capabilities = ['generate_quiz', 'score_quiz', 'identify_gaps'];

  async initialize(): Promise<void> {}

  async process(
    _context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const content = (task.params.content as string) || (task.params.input as string) || '';
    const questionType = (task.params.questionType as string) || 'multiple_choice';

    let data: unknown;
    let text: string;

    if (task.type === 'score_quiz') {
      const answers = task.params.answers as Record<string, string>;
      const questions = task.params.questions as MultipleChoiceQuestion[];
      data = this.scoreQuiz(questions, answers);
      text = `Quiz scored: ${(data as QuizResult).percentage}% correct.`;
    } else if (questionType === 'short_answer') {
      data = this.generateShortAnswerQuestions(content);
      text = `Generated ${(data as ShortAnswerQuestion[]).length} short-answer questions.`;
    } else {
      data = this.generateMultipleChoiceQuestions(content);
      text = `Generated ${(data as MultipleChoiceQuestion[]).length} multiple-choice questions.`;
    }

    return {
      agentName: this.name,
      status: 'success',
      data: { text, questions: data },
      tokensUsed: null,
    };
  }

  async cleanup(): Promise<void> {}

  generateMultipleChoiceQuestions(content: string): MultipleChoiceQuestion[] {
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const questions: MultipleChoiceQuestion[] = [];

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

    const cleanToken = (t: string) => t.toLowerCase().replace(/[^a-z0-9_-]/gi, '');

    const pickKeyword = (s: string): string => {
      const tokens = s
        .split(/\s+/)
        .map((t) => cleanToken(t))
        .filter((t) => t.length >= 4 && !stop.has(t));
      return tokens[Math.floor(tokens.length / 3)] || tokens[0] || 'concept';
    };

    const uniq = (arr: string[]) => Array.from(new Set(arr.map((a) => a.trim()).filter(Boolean)));

    const hash32 = (str: string): number => {
      // Simple deterministic 32-bit hash (djb2-ish)
      let h = 5381;
      for (let i = 0; i < str.length; i++) {
        h = (h * 33) ^ str.charCodeAt(i);
      }
      return h >>> 0;
    };

    const stableShuffle = (arr: string[], salt: string): string[] => {
      // Deterministic “shuffle” via hashing + sort.
      return [...arr].sort((a, b) => hash32(a + salt) - hash32(b + salt));
    };

    const distractorsFor = (keyword: string, sentence: string): string[] => {
      // Deterministic-ish heuristic distractors. We avoid “garbage placeholders” and prefer
      // plausible confusions: overgeneralization, inversion, wrong scope, and near-miss.
      const altToken = pickKeyword(sentence.split(/\s+/).slice(-12).join(' '));

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

      // Build options (4), de-duped. If we still have <4, pad with safe, non-placeholder variants.
      let options = uniq([correct, ...distractors]).slice(0, 4);
      if (options.length < 4) {
        const pads = uniq([
          `It refers to a different concept than ${keyword}.`,
          `It applies only in rare edge cases and is not generally true about ${keyword}.`,
          `It describes a common misconception about ${keyword}.`,
        ]);
        options = uniq([...options, ...pads]).slice(0, 4);
      }

      // Ensure we always return 4 options; last resort: clone with slight variation.
      while (options.length < 4) options.push(`${options[options.length - 1]} (variant)`);

      // Shuffle and record correctIndex.
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

  generateShortAnswerQuestions(content: string): ShortAnswerQuestion[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const questions: ShortAnswerQuestion[] = [];

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

  scoreQuiz(questions: MultipleChoiceQuestion[], answers: Record<string, string>): QuizResult {
    let correct = 0;
    const correctAnswers: string[] = [];
    const incorrectAnswers: string[] = [];
    const knowledgeGaps: string[] = [];
    const gapTags: string[] = [];

    const stop = new Set([
      'what',
      'true',
      'about',
      'is',
      'are',
      'the',
      'a',
      'an',
      'of',
      'to',
      'in',
      'on',
      'for',
      'and',
      'or',
      'with',
      'this',
      'that',
    ]);
    const toTag = (qText: string) => {
      const tokens = String(qText)
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 4 && !stop.has(t));
      return tokens[0] || 'concept';
    };

    for (const q of questions) {
      const userAnswer = parseInt(answers[q.id] || '-1', 10);
      if (userAnswer === q.correctIndex) {
        correct++;
        correctAnswers.push(q.id);
      } else {
        incorrectAnswers.push(q.id);
        knowledgeGaps.push(q.question);
        gapTags.push(toTag(q.question));
      }
    }

    return {
      score: correct,
      total: questions.length,
      percentage: questions.length > 0 ? (correct / questions.length) * 100 : 0,
      knowledgeGaps,
      gapTags: Array.from(new Set(gapTags)),
      correctAnswers,
      incorrectAnswers,
    };
  }
}
