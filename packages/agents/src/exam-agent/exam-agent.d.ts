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
export declare class ExamAgent implements AgentInterface {
  name: string;
  capabilities: string[];
  initialize(): Promise<void>;
  process(
    _context: StudentContextObject,
    task: {
      type: string;
      params: Record<string, unknown>;
    },
  ): Promise<AgentResponse>;
  cleanup(): Promise<void>;
  generateMultipleChoiceQuestions(content: string): MultipleChoiceQuestion[];
  generateShortAnswerQuestions(content: string): ShortAnswerQuestion[];
  scoreQuiz(questions: MultipleChoiceQuestion[], answers: Record<string, string>): QuizResult;
}
//# sourceMappingURL=exam-agent.d.ts.map
