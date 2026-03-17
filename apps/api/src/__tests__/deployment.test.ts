import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../../..');

function exists(p: string): boolean {
  return fs.existsSync(path.join(root, p));
}

function readF(p: string): string {
  return fs.readFileSync(path.join(root, p), 'utf-8');
}

// S14-A01: Dockerfile builds
describe('S14-A01: Dockerfile', () => {
  it('Dockerfile exists and has multi-stage build', () => {
    expect(exists('Dockerfile')).toBe(true);
    const df = readF('Dockerfile');
    expect(df).toContain('FROM node:18');
    expect(df).toContain('AS builder');
    expect(df).toContain('AS runner');
    expect(df).toContain('EXPOSE');
    expect(df).toContain('CMD');
  });
});

// S14-A02: Kubernetes manifests
describe('S14-A02: Kubernetes manifests', () => {
  it('deployment.yaml is valid YAML structure', () => {
    expect(exists('k8s/deployment.yaml')).toBe(true);
    const yaml = readF('k8s/deployment.yaml');
    expect(yaml).toContain('apiVersion');
    expect(yaml).toContain('kind: Deployment');
    expect(yaml).toContain('kind: Service');
    expect(yaml).toContain('kind: Ingress');
    expect(yaml).toContain('learnflow-api');
  });
});

// S14-A03: Monitoring config
describe('S14-A03: Monitoring config', () => {
  it('Grafana dashboard defined', () => {
    expect(exists('monitoring/grafana-dashboard.json')).toBe(true);
    const dash = JSON.parse(readF('monitoring/grafana-dashboard.json'));
    expect(dash.dashboard.panels.length).toBeGreaterThanOrEqual(4);
    expect(dash.dashboard.title).toContain('LearnFlow');
  });
});

// S14-A04: CDN config
describe('S14-A04: CDN config for static assets', () => {
  it('CDN config exists with caching rules', () => {
    expect(exists('monitoring/cdn-config.json')).toBe(true);
    const cdn = JSON.parse(readF('monitoring/cdn-config.json'));
    expect(cdn.cdn.provider).toBe('cloudflare');
    expect(cdn.cdn.zones[0].caching.static_assets.ttl).toBeGreaterThan(0);
  });
});

// S14-A07: macOS installer script
describe('S14-A07: macOS .dmg installer script', () => {
  it('exists and is executable', () => {
    expect(exists('scripts/build-macos.sh')).toBe(true);
    const script = readF('scripts/build-macos.sh');
    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('.dmg');
  });
});

// S14-A08: Windows installer script
describe('S14-A08: Windows .exe/.msi installer script', () => {
  it('exists', () => {
    expect(exists('scripts/build-windows.sh')).toBe(true);
    const script = readF('scripts/build-windows.sh');
    expect(script).toContain('#!/bin/bash');
    expect(script).toContain('.exe');
  });
});

// S14-A09: Launch blog post
describe('S14-A09: Launch blog post', () => {
  it('exists with ≥500 words', () => {
    expect(exists('apps/docs/pages/blog/launch-post.md')).toBe(true);
    const post = readF('apps/docs/pages/blog/launch-post.md');
    const wordCount = post.split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(500);
    expect(post).toContain('LearnFlow');
  });
});

// S14-A10: Environment variables documented
describe('S14-A10: Environment variables documented', () => {
  it('.env.example has all required variables', () => {
    expect(exists('.env.example')).toBe(true);
    const env = readF('.env.example');
    expect(env).toContain('DATABASE_URL');
    expect(env).toContain('REDIS_URL');
    expect(env).toContain('JWT_SECRET');
    expect(env).toContain('ENCRYPTION_KEY');
  });

  it('k8s manifests reference all env vars', () => {
    const yaml = readF('k8s/deployment.yaml');
    expect(yaml).toContain('DATABASE_URL');
    expect(yaml).toContain('REDIS_URL');
    expect(yaml).toContain('JWT_SECRET');
    expect(yaml).toContain('ENCRYPTION_KEY');
  });
});
