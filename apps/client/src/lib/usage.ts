export type UsageSummary = {
  days: number;
  since: string;
  totalTokens: number;
  byDay: Array<{ day: string; total: number }>;
  topAgents: Array<{ agentName: string; total: number }>;
  topProviders: Array<{ provider: string; total: number }>;
};

export async function fetchUsageSummary(
  apiGet: (path: string) => Promise<any>,
  days = 7,
): Promise<UsageSummary> {
  const res = await apiGet(`/usage/summary?days=${days}`);
  return res as UsageSummary;
}
