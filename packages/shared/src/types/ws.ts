/**
 * WebSocket contract types shared across API + client.
 *
 * NOTE: Spec uses `completion%` in §11.2, which is not a valid JS identifier.
 * We normalize to `completion_percent` on the wire.
 */

export type WsClientMessage = {
  event: 'message';
  data: {
    text: string;
    attachments?: string[];
    context_overrides?: Record<string, unknown>;
    // Optional client-provided request correlation id. If provided, server will echo
    // it in error envelopes for this message.
    requestId?: string;
    // Client-provided message id for idempotency/correlation (Spec §11.2).
    message_id?: string;
    // Non-spec additions used for better context routing:
    courseId?: string;
    lessonId?: string;
  };
};

export type WsServerEvent =
  | { event: 'connected'; data: { userId: string } }
  | { event: 'response.start'; data: { message_id: string; agent_name: string } }
  | { event: 'response.chunk'; data: { message_id: string; content_delta: string; type: string } }
  | {
      event: 'response.end';
      data: {
        message_id: string;
        actions: Array<{ type: string; label: string }>;
        sources: Array<{
          title: string;
          url: string;
          domain?: string;
          author?: string;
          publication?: string;
          year?: number;
          accessedAt?: string;
          sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
          credibilityScore?: number;
          credibilityLabel?: 'High' | 'Medium' | 'Low' | 'Unknown';
          whyCredible?: string;
        }>;
      };
    }
  | {
      event: 'agent.spawned';
      data: {
        agent_name: string;
        task_summary: string;
        kind?: 'routing' | 'agent_call' | 'pipeline_stage';
        startedAt?: string;
      };
    }
  | {
      event: 'agent.complete';
      data: {
        agent_name: string;
        result_summary: string;
        kind?: 'routing' | 'agent_call' | 'pipeline_stage';
        durationMs?: number;
      };
    }
  | {
      event: 'mindmap.update';
      data: {
        // Spec §11.2
        nodes_added: unknown[];
        edges_added: unknown[];
      };
    }
  | {
      // Iter163+: Suggestions are NOT spec-correct mindmap.update graph deltas.
      // Use a dedicated event so clients don't misinterpret semantics.
      event: 'mindmap.suggestions';
      data: {
        courseId?: string | null;
        suggestions: Array<{
          id: string;
          label: string;
          parentLessonId?: string;
          reason?: string;
        }>;
      };
    }
  | {
      event: 'progress.update';
      data: { course_id: string | null; lesson_id: string | null; completion_percent: number };
    }
  | {
      event: 'error';
      data: {
        error: { code: string; message: string; details?: unknown };
        requestId: string;
        message_id?: string;
      };
    };
