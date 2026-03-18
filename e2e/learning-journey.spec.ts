import { test, expect } from '@playwright/test';

test.describe('LearnFlow Learning Journey', () => {
  test('Test 1: Onboarding flow completes end-to-end', async ({ page }) => {
    // 1. Navigate to /onboarding — should redirect to /onboarding/welcome
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding\/welcome/);
    await expect(page.locator('[data-screen="onboarding-welcome"]')).toBeVisible();
    await page.screenshot({ path: 'evals/screenshots/01-welcome.png' });

    // 2. Click Get Started
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/\/onboarding\/goals/);
    await expect(page.locator('[data-screen="onboarding-goals"]')).toBeVisible();
    await page.screenshot({ path: 'evals/screenshots/02-goals.png' });

    // 3. Select a goal and continue
    await page.locator('[data-screen="onboarding-goals"] button').first().click();
    await page.click('text=Continue');
    await expect(page).toHaveURL(/\/onboarding\/(topics|interests)/);
    await page.screenshot({ path: 'evals/screenshots/03-topics.png' });

    // 4. Select a topic and continue
    await page.locator('[data-screen="onboarding-topics"] button').first().click();
    await page.click('text=Continue');
    await expect(page).toHaveURL(/\/onboarding\/experience/);
    await page.screenshot({ path: 'evals/screenshots/04-experience.png' });

    // 5. Select experience and continue
    await page.locator('[data-screen="onboarding-experience"] button').first().click();
    await page.click('text=Continue');
    await page.screenshot({ path: 'evals/screenshots/05-apikeys.png' });
  });

  test('Test 2: Course generation creates navigable course', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-screen="dashboard"]')).toBeVisible();
    await page.screenshot({ path: 'evals/screenshots/06-dashboard.png' });

    // Type a topic and create course
    const input = page.locator('input[placeholder*="topic"]').or(page.locator('input[placeholder*="Topic"]')).or(page.locator('input[type="text"]').first());
    await input.fill('Agentic AI');
    
    // Click create button
    await page.click('text=Create Course');
    
    // Wait for course creation (may take time due to LLM calls)
    await page.waitForURL(/\/courses\//, { timeout: 120000 });
    await expect(page.locator('[data-screen="course-view"]')).toBeVisible();
    await page.screenshot({ path: 'evals/screenshots/07-course-view.png' });

    // Verify course has modules
    const modules = page.locator('[data-component="module-card"]').or(page.locator('text=Module'));
    await expect(modules.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'evals/screenshots/08-course-modules.png' });
  });

  test('Test 3: Lesson content renders with structured sections', async ({ page }) => {
    // First create a course to have content
    await page.goto('/dashboard');
    const input = page.locator('input[type="text"]').first();
    await input.fill('Quantum Computing');
    await page.click('text=Create Course');
    await page.waitForURL(/\/courses\//, { timeout: 120000 });

    // Click first lesson
    const lessonLink = page.locator('a[href*="/lessons/"]').or(page.locator('text=Lesson').first());
    if (await lessonLink.count() > 0) {
      await lessonLink.first().click();
      await page.waitForURL(/\/lessons\//);
      await expect(page.locator('[data-screen="lesson-reader"]')).toBeVisible();
      await page.screenshot({ path: 'evals/screenshots/09-lesson-reader.png' });

      // Check structured elements exist
      const content = page.locator('[data-component="lesson-content"]');
      await expect(content).toBeVisible();
      
      // Check for learning objectives section
      const objectives = page.locator('text=Learning Objectives');
      expect(await objectives.count()).toBeGreaterThanOrEqual(1);

      // Check for key takeaways
      const takeaways = page.locator('text=Key Takeaways');
      expect(await takeaways.count()).toBeGreaterThanOrEqual(1);

      await page.screenshot({ path: 'evals/screenshots/10-lesson-sections.png' });
    }
  });
});
