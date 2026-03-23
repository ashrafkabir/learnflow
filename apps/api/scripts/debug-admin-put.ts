import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';

async function main() {
  db.clear();
  const app = createApp();

  const email = `admin-${Date.now()}@test.com`;
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'Password123!', displayName: 'User' });

  const token = reg.body.accessToken;

  const res = await request(app)
    .put('/api/v1/admin/search-config')
    .set('Authorization', `Bearer ${token}`)
    .send({
      stage1Templates: ['{courseTopic} overview'],
      stage2Templates: ['{lessonTitle} {courseTopic}'],
      perQueryLimit: 3,
      maxSourcesPerLesson: 4,
      maxStage1Queries: 2,
      maxStage2Queries: 2,
      enabledSources: { wikipedia: true, reddit: false },
    });

  console.log('status', res.status);
  console.log('body', res.body);
}

main();
