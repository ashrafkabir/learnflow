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
  knowledgeGaps: string[];
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
      tokensUsed: 150,
    };
  }

  async cleanup(): Promise<void> {}

  generateMultipleChoiceQuestions(content: string): MultipleChoiceQuestion[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const questions: MultipleChoiceQuestion[] = [];

    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ').filter((w) => w.length > 3);
      const keyWord = words[Math.floor(words.length / 2)] || 'concept';

      questions.push({
        id: `mcq-${i}`,
        question: `What is true about ${keyWord}?`,
        options: [
          sentence.slice(0, 50) + '...',
          'This is incorrect option A',
          'This is incorrect option B',
          'This is incorrect option C',
        ],
        correctIndex: 0,
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
