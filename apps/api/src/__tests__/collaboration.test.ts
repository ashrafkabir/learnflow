import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth.js';
import { authMiddleware } from '../middleware.js';
import { collaborationRouter } from '../routes/collaboration.js';
import { db } from '../db.js';
import { errorHandler, requestIdMiddleware } from '../errors.js';

function createApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/collaboration', authMiddleware, collaborationRouter);
  app.use(errorHandler);
  return app;
}

const app = createApp();

let token: string;

beforeEach(async () => {
  db.clear();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `collab-${Date.now()}@test.com`, password: 'password123', displayName: 'User' });
  token = res.body.accessToken;
});

describe('Collaboration (Iter70)', () => {
  it('create group -> send message -> reload messages persists', async () => {
    const created = await request(app)
      .post('/api/v1/collaboration/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Study Group', topic: 'Rust' });

    expect(created.status).toBe(201);
    const groupId = created.body.group.id;

    const msg = await request(app)
      .post(`/api/v1/collaboration/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello team' });

    expect(msg.status).toBe(201);

    const messages = await request(app)
      .get(`/api/v1/collaboration/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(messages.status).toBe(200);
    expect(messages.body.messages.length).toBe(1);
    expect(messages.body.messages[0].content).toBe('Hello team');

    const groups = await request(app)
      .get('/api/v1/collaboration/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(groups.status).toBe(200);
    expect(groups.body.groups.length).toBe(1);
    expect(groups.body.groups[0].name).toBe('My Study Group');
  });
});
