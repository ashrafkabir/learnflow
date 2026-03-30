import { describe, it, expect } from 'vitest';

// Iter157 P0: lesson generation must be artifact-driven.
// When the lesson research artifacts are missing, the loader must fail deterministically.

describe('Iter157: artifact-only invariant for lesson generation', () => {
  it('throws artifacts_missing when lesson research bundle is not found', async () => {
    const { loadLessonSourcesForGeneration, ArtifactMissingError } =
      await import('../pipeline/lesson-artifacts.js');

    await expect(
      loadLessonSourcesForGeneration({
        courseId: 'c-does-not-exist',
        lessonId: 'l-does-not-exist',
      }),
    ).rejects.toBeInstanceOf(ArtifactMissingError);

    await expect(
      loadLessonSourcesForGeneration({
        courseId: 'c-does-not-exist',
        lessonId: 'l-does-not-exist',
      }),
    ).rejects.toMatchObject({ code: 'artifacts_missing' });
  });
});
