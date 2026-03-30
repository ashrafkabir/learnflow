import { test, expect } from '@playwright/test';

// Iter156 P0: tie artifact expectations to the real pipeline detail UI.
// This test avoids running the full pipeline (slow/external keys).

test('Iter156: pipeline detail UI shows expected artifact quick-links', async ({
  page,
  baseURL,
}) => {
  await page.addInitScript(() => {
    (window as any).__LEARNFLOW_ENV__ = {
      ...(window as any).__LEARNFLOW_ENV__,
      VITE_DEV_AUTH_BYPASS: '1',
    };
    (window as any).__LEARNFLOW_E2E__ = true;
  });

  // Create a user via register endpoint (works in dev + test).
  const email = `e2e_iter156_${Date.now()}_${Math.floor(Math.random() * 1e6)}@learnflow.dev`;
  const password = 'password123';

  const reg = await page.request.post(`${baseURL}/api/v1/auth/register`, {
    timeout: 20_000,
    data: { email, password, displayName: 'E2E' },
  });
  if (!reg.ok()) {
    const body = await reg.text().catch(() => '');
    throw new Error(`Register failed: ${reg.status()} ${reg.statusText()} ${body}`);
  }
  const regJson: any = await reg.json();
  const token = regJson?.accessToken;
  expect(typeof token).toBe('string');

  // Create a pipeline (do not wait for completion)
  const create = await page.request.post(`${baseURL}/api/v1/pipeline`, {
    timeout: 30_000,
    data: { topic: 'Iter156 artifacts guard', depth: 'intermediate', lessonCount: 4 },
    headers: { Authorization: `Bearer ${token}`, 'x-learnflow-e2e-fixtures': 'true' },
  });
  expect(create.ok()).toBeTruthy();
  const createJson: any = await create.json();
  const pipelineId = createJson?.pipelineId;
  expect(typeof pipelineId).toBe('string');

  // Validate artifacts index via API contract (stable), then assert UI shows the same known list.
  const idx = await page.request.get(`${baseURL}/api/v1/pipeline/${pipelineId}/artifacts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(idx.ok()).toBeTruthy();
  const idxJson: any = await idx.json();
  const knownRels = (idxJson?.known || []).map((k: any) => k.rel);
  expect(knownRels).toContain('course-research.md');
  expect(knownRels).toContain('lessonplan.md');

  // Navigate to pipeline detail (auth via localStorage token)
  await page.addInitScript((t) => {
    localStorage.setItem('learnflow-token', String(t));
  }, token);

  // Some routes fetch token on mount; set it explicitly as well.
  await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });

  // Ensure auth is actually accepted by API (prevents blank pipeline screen + alert).
  const ctx = await page.request.get(`${baseURL}/api/v1/profile/context`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(ctx.ok()).toBeTruthy();

  await page.goto(`${baseURL}/pipeline/${pipelineId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Pipeline Detail' })).toBeVisible({
    timeout: 60_000,
  });

  // Artifacts section renders even if pipeline fails early (BYOAI required).
  await expect(page.getByRole('heading', { name: 'Artifacts', exact: true })).toBeVisible({
    timeout: 60_000,
  });

  // The UI should show the known list entries.
  await expect(page.getByText('course-research.md')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('lessonplan.md')).toBeVisible({ timeout: 60_000 });
});
