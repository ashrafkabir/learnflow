export type UsageSummary = {
  days: number;
  since: string;
  totalTokens: number;
  byDay: Array<{ day: string; total: number }>;
  topAgents: Array<{ agentName: string; total: number }>;
  topProviders: Array<{ provider: string; total: number }>;
  byProvider?: Array<{ provider: string; total: number }>;
  providerMeta?: Array<{
    provider: string;
    total: number;
    callCount: number;
    lastUsed: string | null;
  }>;
};

export type UsageAggregates = {
  windows: number[];
  data: Record<string, UsageSummary>;
};

export async function fetchUsageSummary(
  apiGet: (path: string) => Promise<any>,
  days = 7,
): Promise<UsageSummary> {
  const res = await apiGet(`/usage/summary?days=${days}`);
  return res as UsageSummary;
}

export async function fetchUsageAggregates(
  apiGet: (path: string) => Promise<any>,
): Promise<UsageAggregates> {
  const res = await apiGet('/usage/aggregates');
  return res as UsageAggregates;
}
