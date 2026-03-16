/**
 * Notes Agent — creates structured notes, flashcards, and summaries.
 * Supports Cornell and Zettelkasten formats.
 */

import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';

export interface CornellNote {
  cue: string;
  notes: string;
  summary: string;
}

export interface ZettelkastenNote {
  id: string;
  title: string;
  content: string;
  links: string[];
  tags: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export class NotesAgent implements AgentInterface {
  name = 'notes_agent';
  capabilities = ['take_notes', 'create_flashcards', 'cornell_notes', 'zettelkasten'];

  async initialize(): Promise<void> {}

  async process(
    _context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const content = (task.params.content as string) || (task.params.input as string) || '';
    const format = (task.params.format as string) || 'cornell';

    let data: unknown;
    let text: string;

    switch (format) {
      case 'zettelkasten':
        data = this.createZettelkastenNotes(content);
        text = `Created ${(data as ZettelkastenNote[]).length} atomic notes in Zettelkasten format.`;
        break;
      case 'flashcards':
        data = this.createFlashcards(content);
        text = `Generated ${(data as Flashcard[]).length} flashcards.`;
        break;
      case 'cornell':
      default:
        data = this.createCornellNotes(content);
        text = 'Created Cornell-format notes with cues, notes, and summary.';
        break;
    }

    return {
      agentName: this.name,
      status: 'success',
      data: { text, notes: data, format },
      tokensUsed: 100,
    };
  }

  async cleanup(): Promise<void> {}

  createCornellNotes(content: string): CornellNote {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim());
    const cues = sentences.slice(0, 3).map((s) => s.trim().split(' ').slice(0, 5).join(' ') + '?');

    return {
      cue: cues.join('\n'),
      notes: content.slice(0, 500),
      summary: sentences.slice(0, 2).join('. ') + '.',
    };
  }

  createZettelkastenNotes(content: string): ZettelkastenNote[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const notes: ZettelkastenNote[] = [];

    for (let i = 0; i < Math.min(sentences.length, 5); i++) {
      const words = sentences[i].trim().split(' ');
      notes.push({
        id: `zk-${Date.now()}-${i}`,
        title: words.slice(0, 5).join(' '),
        content: sentences[i].trim(),
        links: i > 0 ? [`zk-${Date.now()}-${i - 1}`] : [],
        tags: words.filter((w) => w.length > 5).slice(0, 3),
      });
    }

    return notes;
  }

  createFlashcards(content: string): Flashcard[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const flashcards: Flashcard[] = [];

    for (let i = 0; i < Math.min(sentences.length, 10); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ');
      const keyWord = words.find((w) => w.length > 5) || words[0];

      flashcards.push({
        question: `What is ${keyWord}?`,
        answer: sentence,
      });
    }

    return flashcards;
  }
}
