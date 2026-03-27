export type UsageSummary = {
  days: number;
  since: string;
  totalTokens: number;
  byDay: Array<{ day: string; total: number }>;
  topAgents: Array<{ agentName: string; total: number }>;
  topProviders: Array<{ provider: string; total: number }>;
};

export type UsageDashboard = {
  range: number;
  since: string;
  totalTokens: number;
  daily: Array<{ day: string; total: number }>;
  byAgent: Array<{ agentName: string; total: number }>;
  byProvider: Array<{ provider: string; total: number }>;
};

export async function fetchUsageSummary(
  apiGet: (path: string) => Promise<any>,
  days = 7,
): Promise<UsageSummary> {
  const res = await apiGet(`/usage/summary?days=${days}`);
  return res as UsageSummary;
}

export async function fetchUsageDashboard(
  apiGet: (path: string) => Promise<any>,
  range: 7 | 30 | 90 = 7,
): Promise<UsageDashboard> {
  const res = await apiGet(`/usage/dashboard?range=${range}`);
  return res as UsageDashboard;
}
