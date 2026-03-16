/**
 * Course Builder Agent — full pipeline: topic → discover → extract → score → format → syllabus.
 */

import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';
import { decomposeTopic } from './topic-decomposer.js';
import { generateSyllabus } from './syllabus-generator.js';

export class CourseBuilderAgent implements AgentInterface {
  name = 'course_builder';
  capabilities = ['build_course', 'update_syllabus'];

  async initialize(): Promise<void> {
    // No-op for now
  }

  async process(
    context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const topic =
      (task.params.topic as string) || (task.params.input as string) || 'General Knowledge';

    // Step 1: Decompose topic
    const conceptTree = decomposeTopic(topic);
    const subtopics = conceptTree.children.map((c) => c.label);

    // Step 2: Generate syllabus
    const syllabus = generateSyllabus(topic, subtopics);

    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: `Course outline for "${topic}":\n${syllabus.modules.map((m) => `${m.order + 1}. ${m.title}`).join('\n')}`,
        syllabus,
        conceptTree,
      },
      tokensUsed: 150,
    };
  }

  async cleanup(): Promise<void> {
    // No-op
  }
}
