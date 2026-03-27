import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db.js';
import { fetchWithBackoff } from './fetchWithBackoff.js';
import { parseFeed } from './rss.js';
import { buildDeterministicExplanation } from './explanation.js';
import { defaultSourcesForTopic } from './defaultSources.js';
import { getDomain, normalizeUrl } from './url.js';

export type UpdateAgentSourceInput = { id?: string; url: string };

export type UpdateAgentTopicRunResult = {
  topic: string;
  topicId: string | null;
  sourcesChecked: number;
  notificationsCreated: number;
  failures: Array<{ url: string; error: string }>;
};

/**
 * Shared Update Agent generator.
 * - Best-effort: RSS/Atom only.
 * - Dedupe by item URL.
 * - Updates per-source status (lastCheckedAt/backoff fields) when src.id is provided.
 */
export async function runUpdateAgentForTopic(params: {
  userId: string;
  topic: string;
  topicId?: string | null;
  sources?: UpdateAgentSourceInput[];
  checkedAt?: Date;
  maxSources?: number;
}): Promise<UpdateAgentTopicRunResult> {
  const userId = params.userId;
  const topic = params.topic.trim();
  const checkedAt = params.checkedAt ?? new Date();
  const maxSources = Number.isFinite(params.maxSources) ? Number(params.maxSources) : 6;

  const topicId = params.topicId ?? null;

  const sources: UpdateAgentSourceInput[] = [];
  if (Array.isArray(params.sources) && params.sources.length > 0) {
    sources.push(...params.sources);
  } else {
    for (const u of defaultSourcesForTopic(topic)) sources.push({ url: u });
  }

  const failures: Array<{ url: string; error: string }> = [];
  let created = 0;
  let sourcesChecked = 0;

  for (const src of sources.slice(0, maxSources)) {
    const srcUrl = src.url;
    const now = new Date();
    sourcesChecked += 1;

    try {
      const normalizedSourceUrl = normalizeUrl(srcUrl);
      const resp = await fetchWithBackoff(normalizedSourceUrl, { timeoutMs: 12_000 });
      const body = await resp.text();
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const items = parseFeed(body).slice(0, 8);
      const next = items.find((it) => !db.hasNotificationUrl(userId, normalizeUrl(it.url)));
      if (!next) {
        if (src.id) {
          db.updateUpdateAgentSourceStatus({
            userId,
            id: src.id,
            lastCheckedAt: now,
            lastSuccessAt: now,
            lastError: '',
            lastErrorAt: null,
            lastItemUrlSeen: items[0]?.url ? normalizeUrl(items[0].url) : '',
            lastItemPublishedAt: items[0]?.publishedAt || null,
            nextEligibleAt: null,
            failureCount: 0,
          });
        }
        continue;
      }

      const itemUrl = normalizeUrl(next.url);
      const title = next.title;
      const summary = next.summary || '';
      const explanation = buildDeterministicExplanation({ topic, title, summary });

      db.addNotification({
        id: `notif-${uuidv4()}`,
        userId,
        type: 'update',
        title,
        body: summary,
        createdAt: checkedAt,
        readAt: null,
        topic,
        sourceUrl: normalizedSourceUrl,
        sourceDomain: getDomain(normalizedSourceUrl),
        checkedAt,
        explanation,
        url: itemUrl,
        origin: 'update_agent',
      });
      created += 1;

      if (src.id) {
        db.updateUpdateAgentSourceStatus({
          userId,
          id: src.id,
          lastCheckedAt: now,
          lastSuccessAt: now,
          lastError: '',
          lastErrorAt: null,
          lastItemUrlSeen: itemUrl,
          lastItemPublishedAt: next.publishedAt || null,
          nextEligibleAt: null,
          failureCount: 0,
        });
      }
    } catch (e: any) {
      failures.push({ url: srcUrl, error: e?.message || String(e) });
      if (src.id) {
        // backoff: 30s * 2^n, capped at 1h
        let prevFailureCount = 0;
        try {
          const allTopics = db.listUpdateAgentTopics(userId);
          for (const t of allTopics) {
            const rows = db.listUpdateAgentSources(userId, t.id);
            const match = rows.find((r: any) => r.id === src.id);
            if (match) {
              prevFailureCount = Number(match.failureCount || 0);
              break;
            }
          }
        } catch {
          // ignore
        }
        const nextFailureCount = Math.max(0, prevFailureCount) + 1;
        const delayMs = Math.min(
          60 * 60 * 1000,
          30 * 1000 * Math.pow(2, Math.min(10, nextFailureCount - 1)),
        );
        db.updateUpdateAgentSourceStatus({
          userId,
          id: src.id,
          lastCheckedAt: now,
          lastSuccessAt: null,
          lastError: e?.message || String(e),
          lastErrorAt: now,
          nextEligibleAt: new Date(Date.now() + delayMs),
          failureCount: nextFailureCount,
        });
      }
      continue;
    }
  }

  return {
    topic,
    topicId,
    sourcesChecked,
    notificationsCreated: created,
    failures,
  };
}
