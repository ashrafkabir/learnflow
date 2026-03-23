import { describe, it, expect, beforeEach } from 'vitest';
import { loadStudentContext, saveStudentContext } from '../lib/studentContext.js';

beforeEach(() => {
  localStorage.clear();
});

describe('studentContext', () => {
  it('saves and loads student context from localStorage', () => {
    saveStudentContext({ goals: ['g1'], topics: ['t1'], experience: 'beginner' });
    const ctx = loadStudentContext();
    expect(ctx?.goals).toEqual(['g1']);
    expect(ctx?.topics).toEqual(['t1']);
    expect(ctx?.experience).toBe('beginner');
  });
});
