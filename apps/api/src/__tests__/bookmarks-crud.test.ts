import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Uses dev auth in tests when app is created without devMode?
// Here we rely on test harness auth middleware; easiest is devMode.

describe('Bookmarks CRUD', () => {
  it('POST/GET/DELETE /api/v1/bookmarks', async () => {
    const app = createApp({ devMode: true });

    // Empty
    const empty = await request(app).get('/api/v1/bookmarks').expect(200);
    expect(Array.isArray(empty.body.bookmarks)).toBe(true);

    // Create
    await request(app)
      .post('/api/v1/bookmarks')
      .send({ courseId: 'course-1', lessonId: 'lesson-1' })
      .expect(201);

    const list1 = await request(app).get('/api/v1/bookmarks').expect(200);
    expect(list1.body.bookmarks.length).toBe(1);
    expect(list1.body.bookmarks[0].courseId).toBe('course-1');
    expect(list1.body.bookmarks[0].lessonId).toBe('lesson-1');

    // Delete
    await request(app).delete('/api/v1/bookmarks/lesson-1').expect(204);
    const list2 = await request(app).get('/api/v1/bookmarks').expect(200);
    expect(list2.body.bookmarks.length).toBe(0);
  });
});
