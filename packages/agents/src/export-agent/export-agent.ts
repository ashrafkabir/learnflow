import type { AgentInterface, AgentResponse } from '@learnflow/core';
import type { StudentContextObject } from '@learnflow/core';

/**
 * export_agent
 *
 * Spec intent:
 * - Invoked when user requests download/export/offline.
 *
 * Current MVP reality:
 * - The actual export is implemented as UI flows (e.g., Settings export buttons)
 *   and/or API endpoints.
 * - This agent exists to satisfy orchestrator routing + avoid missing-agent errors.
 *
 * Deterministic behavior in NODE_ENV=test.
 */
export class ExportAgent implements AgentInterface {
  name = 'export_agent';
  capabilities = ['export', 'download', 'offline', 'pdf'];

  async initialize(): Promise<void> {
    // no-op
  }

  async cleanup(): Promise<void> {
    // no-op
  }

  async process(
    _context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const format = String((task?.params as any)?.format || 'pdf');
    const input = String((task?.params as any)?.input || '');

    // For MVP: return guidance that points to existing product surfaces.
    // Avoid claiming we generated a file here.
    const content =
      `I can help you export content for offline use. ` +
      `Right now, exports are handled via the app’s Export buttons (Settings) ` +
      `or the Export endpoint.\n\n` +
      `What would you like to export (course, lesson, or notes), and in which format (pdf/markdown/json)?\n\n` +
      `Request: "${input}" (format: ${format})`;

    return {
      agentName: this.name,
      status: 'success',
      data: { content, format },
      tokensUsed: null,
    };
  }
}
