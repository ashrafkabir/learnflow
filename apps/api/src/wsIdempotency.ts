type CompletionEntry = {
  completedAtMs: number;
};

const COMPLETION_TTL_MS = 5 * 60 * 1000;

// userId -> message_id -> completion entry
const completionsByUser = new Map<string, Map<string, CompletionEntry>>();

function prune(nowMs: number): void {
  for (const [userId, map] of completionsByUser) {
    for (const [mid, entry] of map) {
      if (nowMs - entry.completedAtMs > COMPLETION_TTL_MS) map.delete(mid);
    }
    if (map.size === 0) completionsByUser.delete(userId);
  }
}

export function isDuplicateCompletedMessage(userId: string, messageId: string): boolean {
  const nowMs = Date.now();
  prune(nowMs);
  const m = completionsByUser.get(userId);
  if (!m) return false;
  return m.has(messageId);
}

export function markMessageCompleted(userId: string, messageId: string): void {
  const nowMs = Date.now();
  prune(nowMs);
  const m = completionsByUser.get(userId) ?? new Map<string, CompletionEntry>();
  m.set(messageId, { completedAtMs: nowMs });
  completionsByUser.set(userId, m);
}

export function clearIdempotencyForTests(): void {
  completionsByUser.clear();
}
