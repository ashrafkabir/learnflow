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
export declare class NotesAgent implements AgentInterface {
    name: string;
    capabilities: string[];
    initialize(): Promise<void>;
    process(_context: StudentContextObject, task: {
        type: string;
        params: Record<string, unknown>;
    }): Promise<AgentResponse>;
    cleanup(): Promise<void>;
    createCornellNotes(content: string): CornellNote;
    createZettelkastenNotes(content: string): ZettelkastenNote[];
    createFlashcards(content: string): Flashcard[];
}
//# sourceMappingURL=notes-agent.d.ts.map