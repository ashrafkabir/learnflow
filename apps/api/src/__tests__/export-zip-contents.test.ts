import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import JSZip from 'jszip';

describe('export zip contents', () => {
  it('zip includes md/json + metadata.json with schema fields', async () => {
    const app = createApp({ devMode: true });
    const token = jwt.sign(
      { sub: 'test-user-zip-1', email: 'test@learnflow.dev', role: 'student', tier: 'pro' },
      config.jwtSecret,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/api/v1/export?format=zip')
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((res, cb) => {
        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(Buffer.from(chunk)));
        res.on('end', () => cb(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');

    const zip = await JSZip.loadAsync(res.body as Buffer);
    expect(zip.file('learnflow-export.md')).toBeTruthy();
    expect(zip.file('learnflow-export.json')).toBeTruthy();
    expect(zip.file('metadata.json')).toBeTruthy();

    const metaRaw = await zip.file('metadata.json')!.async('string');
    const meta = JSON.parse(metaRaw);
    expect(typeof meta.exportedAt).toBe('string');
    expect(typeof meta.appVersion).toBe('string');
    expect(typeof meta.schemaVersion).toBe('string');
  });
});
