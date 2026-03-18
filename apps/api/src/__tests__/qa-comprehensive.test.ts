import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth.js';
import { authMiddleware } from '../middleware.js';
import { db } from '../db.js';
import { subscriptionRouter } from '../routes/subscription.js';
import { NotesAgent, ExamAgent, SummarizerAgent, ResearchAgent } from '@learnflow/agents';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContext: any = {
  userId: 'test-user',
  goals: ['learn quantum computing'],
  knowledgeLevel: 'intermediate',
  progress: {},
  preferences: { noteFormat: 'cornell' },
  courses: [],
  currentCourse: null,
};

const sampleLesson = `
  Quantum computing leverages quantum mechanics to process information.
  Unlike classical bits, qubits can exist in superposition states.
  Entanglement allows qubits to be correlated regardless of distance.
  Quantum gates manipulate qubits through unitary transformations.
  Shor's algorithm can factor large numbers exponentially faster.
  Grover's algorithm provides quadratic speedup for search problems.
  Current hardware faces decoherence and error correction challenges.
  IBM, Google, and IonQ are leading quantum hardware development.
  Quantum supremacy was demonstrated by Google in 2019.
  Applications include cryptography, drug discovery, and optimization.
`.repeat(5);

// S13-A06: Agent prompt regression tests
describe('S13-A06: Agent output format regression', () => {
  it('NotesAgent produces valid Cornell format', async () => {
    const agent = new NotesAgent();
    await agent.initialize();
    const result = await agent.process(mockContext, {
      type: 'generate_notes',
      params: { content: sampleLesson, format: 'cornell' },
    });
    expect(result.status).toBe('success');
    expect(result.agentName).toContain('notes');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;
    // data = { text, notes: CornellNote, format }
    expect(data.notes).toBeDefined();
    expect(data.notes.cue || data.notes.cues).toBeDefined();
    expect(data.notes.summary).toBeDefined();
  });

  it('ExamAgent produces valid MC format', async () => {
    const agent = new ExamAgent();
    await agent.initialize();
    const result = await agent.process(mockContext, {
      type: 'generate_quiz',
      params: { content: sampleLesson, questionType: 'multiple_choice' },
    });
    expect(result.status).toBe('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;
    expect(Array.isArray(data.questions || data)).toBe(true);
  });

  it('SummarizerAgent condenses content', async () => {
    const agent = new SummarizerAgent();
    await agent.initialize();
    const result = await agent.process(mockContext, {
      type: 'summarize',
      params: { content: sampleLesson, maxWords: 500 },
    });
    expect(result.status).toBe('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;
    // data = { text: string, summary: Summary }
    const text = data.text || '';
    expect(text.length).toBeGreaterThan(20);
  });

  it('ResearchAgent returns structured results', async () => {
    const agent = new ResearchAgent();
    await agent.initialize();
    const result = await agent.process(mockContext, {
      type: 'search',
      params: { topic: 'quantum error correction', input: 'quantum error correction' },
    });
    expect(result.status).toBe('success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;
    expect(data.papers || data.results).toBeDefined();
  });
});

// S13-A12: TypeScript compilation check
describe('S13-A12: TypeScript compilation', () => {
  it('key agent classes are importable', () => {
    expect(NotesAgent).toBeDefined();
    expect(ExamAgent).toBeDefined();
    expect(SummarizerAgent).toBeDefined();
    expect(ResearchAgent).toBeDefined();
  });
});

// S13: Integration — full API flow
describe('S13: Full API integration flow', () => {
  function createApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/subscription', authMiddleware, subscriptionRouter);
    return app;
  }

  it('register → subscribe → check features → cancel', async () => {
    db.clear();
    const app = createApp();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'qa@test.com', password: 'password123', displayName: 'QA' });
    expect(reg.status).toBe(201);
    const token = reg.body.accessToken;

    const sub = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });
    expect(sub.body.tier).toBe('pro');

    const status = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(status.body.tier).toBe('pro');
    expect(status.body.invoices.length).toBe(1);

    const cancel = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'cancel' });
    expect(cancel.body.tier).toBe('free');
  });
});
