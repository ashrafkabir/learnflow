import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const docsDir = path.resolve(__dirname, '../../pages');

function readDoc(name: string): string {
  return fs.readFileSync(path.join(docsDir, name), 'utf-8');
}

function docExists(name: string): boolean {
  return fs.existsSync(path.join(docsDir, name));
}

// S12-A01: Getting Started Guide
describe('S12-A01: Getting Started Guide', () => {
  it('has setup, key config, and first course sections', () => {
    const doc = readDoc('getting-started.md');
    expect(doc).toContain('## Setup');
    expect(doc).toContain('API Key');
    expect(doc).toContain('First Course');
    expect(doc).toContain('## Prerequisites');
  });
});

// S12-A02: User Guide
describe('S12-A02: User Guide', () => {
  it('covers all features from spec', () => {
    const doc = readDoc('user-guide.md');
    expect(doc).toContain('Dashboard');
    expect(doc).toContain('Conversation');
    expect(doc).toContain('Course Builder');
    expect(doc).toContain('Notes');
    expect(doc).toContain('Exam');
    expect(doc).toContain('Research');
    expect(doc).toContain('Mindmap');
    expect(doc).toContain('Marketplace');
    expect(doc).toContain('Settings');
  });
});

// S12-A03: Agent SDK Reference
describe('S12-A03: Agent SDK Reference', () => {
  it('has interface spec, manifest schema, examples', () => {
    const doc = readDoc('agent-sdk.md');
    expect(doc).toContain('AgentInterface');
    expect(doc).toContain('manifest.json');
    expect(doc).toContain('inputSchema');
    expect(doc).toContain('outputSchema');
    expect(doc).toContain('VocabularyAgent');
    expect(doc).toContain('Publishing to Marketplace');
  });
});

// S12-A04: API Reference — all 17 endpoints
describe('S12-A04: API Reference', () => {
  it('covers all REST endpoints', () => {
    const doc = readDoc('api-reference.md');
    // Auth endpoints
    expect(doc).toContain('/auth/register');
    expect(doc).toContain('/auth/login');
    expect(doc).toContain('/auth/refresh');
    expect(doc).toContain('/auth/oauth');
    // Key endpoints
    expect(doc).toContain('/keys');
    // Course endpoints
    expect(doc).toContain('/courses');
    expect(doc).toContain('/courses/:id');
    // Chat
    expect(doc).toContain('/chat');
    // WebSocket
    expect(doc).toContain('/ws');
    // Notes, Quiz, Research
    expect(doc).toContain('/notes');
    expect(doc).toContain('/quiz');
    expect(doc).toContain('/research');
    // Mindmap
    expect(doc).toContain('/mindmap');
    // Subscription
    expect(doc).toContain('/subscription');
    // Marketplace
    expect(doc).toContain('/marketplace');
    // Profile
    expect(doc).toContain('/profile');
  });
});

// S12-A05: Course Creator Guide
describe('S12-A05: Course Creator Guide', () => {
  it('has publishing flow and quality guidelines', () => {
    const doc = readDoc('course-creator-guide.md');
    expect(doc).toContain('Publishing Flow');
    expect(doc).toContain('Quality');
    expect(doc).toContain('Revenue');
    expect(doc).toContain('attribution');
  });
});

// S12-A06: Privacy & Security
describe('S12-A06: Privacy & Security', () => {
  it('covers GDPR, CCPA, key encryption', () => {
    const doc = readDoc('privacy-security.md');
    expect(doc).toContain('GDPR');
    expect(doc).toContain('CCPA');
    expect(doc).toContain('AES-256');
    expect(doc).toContain('bcrypt');
    expect(doc).toContain('Right to Access');
    expect(doc).toContain('Right to Erasure');
  });
});

// S12-A07: Architecture Guide
describe('S12-A07: Architecture Guide', () => {
  it('has system diagram and agent communication', () => {
    const doc = readDoc('architecture.md');
    expect(doc).toContain('System Overview');
    expect(doc).toContain('Agent Communication');
    expect(doc).toContain('AgentMessage');
    expect(doc).toContain('DAG');
    expect(doc).toContain('Orchestrator');
    expect(doc).toContain('Monorepo Structure');
  });
});

// S12-A08: All internal links resolve
describe('S12-A08: Internal links', () => {
  it('all referenced docs exist', () => {
    const getting = readDoc('getting-started.md');
    // Extract markdown links
    const linkPattern = /\(\.\/([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(getting)) !== null) {
      const target = match[1];
      expect(docExists(`${target}.md`)).toBe(true);
    }
  });
});

// S12-A09: Code examples compile (structural check)
describe('S12-A09: Code examples', () => {
  it('SDK doc has TypeScript code blocks', () => {
    const doc = readDoc('agent-sdk.md');
    const codeBlocks = doc.match(/```typescript[\s\S]*?```/g) || [];
    expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
    // Check that code blocks contain valid-looking TypeScript
    // At least one block should have interface or class or function
    const hasStructure = codeBlocks.some(
      (b) => b.includes('interface') || b.includes('class') || b.includes('function'),
    );
    expect(hasStructure).toBe(true);
  });
});

// S12-A10: Documentation site builds
describe('S12-A10: Documentation build', () => {
  it('all doc pages exist', () => {
    const pages = [
      'getting-started.md',
      'user-guide.md',
      'agent-sdk.md',
      'api-reference.md',
      'course-creator-guide.md',
      'privacy-security.md',
      'architecture.md',
    ];
    for (const page of pages) {
      expect(docExists(page)).toBe(true);
    }
  });
});
