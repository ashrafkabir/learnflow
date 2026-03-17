import { test, expect } from '@playwright/test';

const SS = '/home/aifactory/onedrive-learnflow/evals/screenshots';

const TOPICS = [
  'Agentic AI and Autonomous Agents',
  'Rust Programming',
  'Prompt Engineering and LLM Fine-Tuning',
  'Climate Tech and Carbon Markets',
  'Quantum Computing Fundamentals',
];

test.describe('Test 1: Onboarding Flow', () => {
  test('welcome page loads and navigates to goals', async ({ page }) => {
    await page.goto('/onboarding/welcome');
    await expect(page.locator('text=Welcome to LearnFlow')).toBeVisible();
    await page.screenshot({ path: `${SS}/onboarding-welcome.png` });

    // Click Get Started
    await page.click('button[aria-label="Get Started"]');
    await expect(page).toHaveURL(/\/onboarding\/goals/);
    await page.screenshot({ path: `${SS}/onboarding-goals.png` });
  });
});

test.describe('Test 2: Dashboard Loads', () => {
  test('dashboard renders with courses, streak, and navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/dashboard-loaded.png` });

    // Streak tracker
    await expect(page.locator('[data-component="streak-tracker"]')).toBeVisible();

    // Course carousel with courses
    await expect(page.locator('[data-component="course-carousel"]')).toBeVisible();
    const courses = await page
      .locator('[data-component="course-carousel"] [role="article"]')
      .count();
    expect(courses).toBeGreaterThanOrEqual(1);

    // Daily lessons
    await expect(page.locator('[data-component="daily-lessons"]')).toBeVisible();

    // Mindmap preview
    await expect(page.locator('[data-component="mindmap-preview"]')).toBeVisible();

    await page.screenshot({ path: `${SS}/dashboard-full.png` });
  });
});

test.describe('Test 3: Course View & Syllabus', () => {
  test('course view shows syllabus with modules', async ({ page }) => {
    await page.goto('/courses/c-1');
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/course-view.png` });

    // Syllabus visible
    await expect(page.locator('[aria-label="Course syllabus"]')).toBeVisible();

    // Progress tracker
    await expect(page.locator('[data-component="progress-tracker"]')).toBeVisible();

    // Modules exist (at least 3 from mock data)
    const modules = await page.locator('[data-component="syllabus"] button').count();
    expect(modules).toBeGreaterThanOrEqual(3);

    // First module is expanded - shows lessons
    const lessons = await page.locator('[data-component="syllabus"] [role="article"]').count();
    expect(lessons).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: `${SS}/course-syllabus.png` });
  });
});

test.describe('Test 4: Lesson Reader & References', () => {
  test('lesson has content with references and citations', async ({ page }) => {
    await page.goto('/courses/c-1/lessons/l1');
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/lesson-reader.png` });

    // Lesson content
    const content = await page.locator('[aria-label="Lesson content"]');
    await expect(content).toBeVisible();
    const text = await content.textContent();
    expect((text || '').length).toBeGreaterThan(200);

    // Code block present
    const codeBlocks = await page.locator('pre code').count();
    expect(codeBlocks).toBeGreaterThanOrEqual(1);

    // Inline citations [1], [2], [3]
    expect(text).toContain('[1]');
    expect(text).toContain('[2]');
    expect(text).toContain('[3]');

    // References section
    const refs = page.locator('[aria-label="References"]');
    await expect(refs).toBeVisible();
    await page.screenshot({ path: `${SS}/lesson-references.png` });

    // At least 3 source links
    const sourceLinks = await refs.locator('a').count();
    expect(sourceLinks).toBeGreaterThanOrEqual(3);

    // Links have real URLs
    const firstHref = await refs.locator('a').first().getAttribute('href');
    expect(firstHref).toMatch(/^https?:\/\//);

    await page.screenshot({ path: `${SS}/lesson-references-detail.png` });
  });
});

test.describe('Test 5: Conversation Interface', () => {
  test('chat loads and can send messages', async ({ page }) => {
    await page.goto('/conversation');
    await expect(page.locator('[data-screen="conversation"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/conversation-initial.png` });

    // Initial assistant message
    await expect(page.locator('[data-role="assistant"]')).toBeVisible();

    // Type and send a message
    await page.fill('[aria-label="Message input"]', 'Tell me about Agentic AI');
    await page.click('[aria-label="Send message"]');

    // User message appears
    await expect(page.locator('[data-role="user"]')).toBeVisible();

    // Assistant response appears
    const assistantMsgs = await page.locator('[data-role="assistant"]').count();
    expect(assistantMsgs).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: `${SS}/conversation-exchange.png` });
  });
});

test.describe('Test 6: Mindmap Explorer', () => {
  test('mindmap renders with knowledge nodes', async ({ page }) => {
    await page.goto('/mindmap');
    await expect(page.locator('[aria-label="Knowledge graph"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/mindmap-loaded.png` });

    // Tree nodes exist
    const nodes = await page.locator('[data-node-id]').count();
    expect(nodes).toBeGreaterThan(0);

    // Mastery indicators (aria-labels contain "mastery")
    const masteryNodes = await page.locator('[role="treeitem"]').count();
    expect(masteryNodes).toBeGreaterThan(0);

    await page.screenshot({ path: `${SS}/mindmap-nodes.png` });
  });
});

test.describe('Test 7: Navigation Between Screens', () => {
  test('can navigate from dashboard to course to lesson', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/nav-dashboard.png` });

    // Click a course
    await page.locator('[data-component="course-carousel"] [role="article"]').first().click();
    await expect(page).toHaveURL(/\/courses\//);
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/nav-course.png` });

    // Click a lesson
    await page.locator('[data-component="syllabus"] [role="article"]').first().click();
    await expect(page).toHaveURL(/\/lessons\//);
    await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/nav-lesson.png` });

    // Go back
    await page.click('text=← Back to Course');
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible();
    await page.screenshot({ path: `${SS}/nav-back-course.png` });
  });
});

test.describe('Test 8: Topic Coverage (5 Trending Topics)', () => {
  for (const topic of TOPICS) {
    test(`conversation handles topic: ${topic}`, async ({ page }) => {
      await page.goto('/conversation');
      await expect(page.locator('[data-screen="conversation"]')).toBeVisible();

      await page.fill('[aria-label="Message input"]', `Create a course on ${topic}`);
      await page.click('[aria-label="Send message"]');

      // User message appears with topic
      const userMsg = page.locator('[data-role="user"]').last();
      await expect(userMsg).toContainText(topic);

      // Assistant responds
      const assistantMsgs = await page.locator('[data-role="assistant"]').count();
      expect(assistantMsgs).toBeGreaterThanOrEqual(2);

      const slug = topic.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
      await page.screenshot({ path: `${SS}/topic-${slug}.png` });
    });
  }
});
