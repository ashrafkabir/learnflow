type FlagEntry = { setAtMs: number };

const TTL_MS = 60 * 60 * 1000; // 1 hour (WS sessions are ephemeral)

// userId -> flagKey -> flag entry
const flagsByUser = new Map<string, Map<string, FlagEntry>>();

function prune(nowMs: number): void {
  for (const [userId, map] of flagsByUser) {
    for (const [key, entry] of map) {
      if (nowMs - entry.setAtMs > TTL_MS) map.delete(key);
    }
    if (map.size === 0) flagsByUser.delete(userId);
  }
}

export function hasWsFlag(userId: string, key: string): boolean {
  const nowMs = Date.now();
  prune(nowMs);
  const m = flagsByUser.get(userId);
  if (!m) return false;
  return m.has(key);
}

export function setWsFlag(userId: string, key: string): void {
  const nowMs = Date.now();
  prune(nowMs);
  const m = flagsByUser.get(userId) ?? new Map<string, FlagEntry>();
  m.set(key, { setAtMs: nowMs });
  flagsByUser.set(userId, m);
}

export function clearWsFlagsForTests(): void {
  flagsByUser.clear();
}
