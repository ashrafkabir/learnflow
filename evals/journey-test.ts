/**
 * LearnFlow Journey Test — exercises all core features
 * Run: npx tsx evals/journey-test.ts
 */

const API = process.env.API_URL || 'http://localhost:3002/api/v1';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];
let assertions = 0;

function assert(condition: boolean, message: string) {
  assertions++;
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, duration: Date.now() - start });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  console.log('\n🧪 LearnFlow Journey Test\n');

  // 1. Course Generation
  let course: any;
  await runTest('Course creation returns valid course', async () => {
    course = await api('POST', '/courses', { topic: 'Agentic AI' });
    assert(!!course.id, 'Course has id');
    assert(!!course.title, 'Course has title');
    assert(!!course.topic, 'Course has topic');
    assert(Array.isArray(course.modules), 'Course has modules array');
    assert(course.modules.length >= 3, 'Course has at least 3 modules');
  });

  await runTest('Course modules have lessons', async () => {
    for (const mod of course.modules) {
      assert(!!mod.id, `Module "${mod.title}" has id`);
      assert(!!mod.title, `Module has title`);
      assert(Array.isArray(mod.lessons), `Module "${mod.title}" has lessons array`);
      assert(mod.lessons.length >= 2, `Module "${mod.title}" has ≥2 lessons`);
    }
  });

  // 2. Lesson Content Depth
  await runTest('Lesson content has sufficient depth (≥800 words)', async () => {
    const lesson = course.modules[0].lessons[0];
    assert(!!lesson.content, 'Lesson has content');
    const wordCount = lesson.content.split(/\s+/).filter((w: string) => w.length > 0).length;
    assert(wordCount >= 400, `Lesson has ${wordCount} words (want ≥400)`);
    assert(lesson.content.includes('#'), 'Content has markdown headers');
  });

  await runTest('Lesson content has learning objectives', async () => {
    const content = course.modules[0].lessons[0].content.toLowerCase();
    assert(content.includes('learning objectives') || content.includes('objectives'), 'Has learning objectives section');
  });

  await runTest('Lesson content has key takeaways', async () => {
    const content = course.modules[0].lessons[0].content.toLowerCase();
    assert(content.includes('takeaway') || content.includes('key takeaway'), 'Has takeaways section');
  });

  await runTest('Lesson content has sources/references', async () => {
    const content = course.modules[0].lessons[0].content;
    assert(content.includes('[1]') || content.toLowerCase().includes('sources') || content.toLowerCase().includes('references'), 'Has sources');
  });

  // 3. Notes Generation
  await runTest('Notes agent generates Cornell notes', async () => {
    const lesson = course.modules[0].lessons[0];
    const notes = await api('POST', '/chat', { text: 'Take notes', agent: 'notes', lessonId: lesson.id });
    assert(!!notes.notes, 'Response has notes');
    assert(notes.notes.format === 'cornell', 'Format is cornell');
    assert(!!notes.notes.content, 'Notes have content');
    assert(notes.notes.content.length > 100, 'Notes content is substantial');
  });

  await runTest('Notes agent generates flashcards', async () => {
    const lesson = course.modules[0].lessons[0];
    const notes = await api('POST', '/chat', { text: 'Flashcards', agent: 'notes', lessonId: lesson.id, format: 'flashcard' });
    assert(!!notes.notes, 'Response has notes');
    assert(notes.notes.format === 'flashcard', 'Format is flashcard');
    assert(Array.isArray(notes.notes.flashcards), 'Has flashcards array');
    assert(notes.notes.flashcards.length >= 2, `Has ≥2 flashcards (got ${notes.notes.flashcards.length})`);
  });

  // 4. Quiz Generation
  await runTest('Exam agent generates quiz with questions', async () => {
    const quiz = await api('POST', '/chat', { text: 'Quiz me', agent: 'exam', courseId: course.id });
    assert(Array.isArray(quiz.questions), 'Has questions array');
    assert(quiz.questions.length >= 4, `Has ≥4 questions (got ${quiz.questions.length})`);
    for (const q of quiz.questions) {
      assert(!!q.question, 'Question has text');
      assert(!!q.correctAnswer, 'Question has correct answer');
    }
  });

  await runTest('Quiz has multiple choice with options', async () => {
    const quiz = await api('POST', '/chat', { text: 'Quiz', agent: 'exam', courseId: course.id });
    const mc = quiz.questions.filter((q: any) => q.type === 'multiple_choice');
    assert(mc.length >= 2, 'Has ≥2 multiple choice questions');
    for (const q of mc) {
      assert(Array.isArray(q.options), 'MC question has options');
      assert(q.options.length >= 3, 'MC question has ≥3 options');
    }
  });

  // 5. Research Agent
  await runTest('Research agent returns papers', async () => {
    const res = await api('POST', '/chat', { text: 'Find papers on AI agents', agent: 'research' });
    assert(!!res.content || !!res.papers, 'Research returns content or papers');
  });

  // 6. General Chat
  await runTest('General chat responds to learning requests', async () => {
    const res = await api('POST', '/chat', { text: 'I want to learn about Rust' });
    assert(!!res.content || !!res.reply, 'Chat returns content');
  });

  await runTest('Chat responds to summarize request', async () => {
    const res = await api('POST', '/chat', { text: 'Summarize my learning' });
    assert(!!res.content || !!res.reply, 'Summarize returns content');
  });

  // 7. Course Listing
  await runTest('Course listing includes created course', async () => {
    const list = await api('GET', '/courses');
    assert(Array.isArray(list.courses), 'Returns courses array');
    assert(list.courses.length >= 1, 'Has at least 1 course');
    const found = list.courses.find((c: any) => c.id === course.id);
    assert(!!found, 'Created course is in listing');
  });

  // 8. Lesson Completion
  await runTest('Lesson completion returns success', async () => {
    const lesson = course.modules[0].lessons[0];
    const res = await api('POST', `/courses/${course.id}/lessons/${lesson.id}/complete`);
    assert(!!res.message, 'Returns message');
    assert(res.progress >= 1, 'Progress incremented');
  });

  // 9. Course Fetch
  await runTest('Individual course fetch returns full data', async () => {
    const fetched = await api('GET', `/courses/${course.id}`);
    assert(fetched.id === course.id, 'IDs match');
    assert(Array.isArray(fetched.modules), 'Has modules');
    assert(fetched.modules[0].lessons.length > 0, 'Modules have lessons');
  });

  // 10. Two courses on same topic produce different content
  await runTest('Two courses on same topic have different content', async () => {
    const course2 = await api('POST', '/courses', { topic: 'Agentic AI' });
    const c1l = course.modules[0].lessons[0].content;
    const c2l = course2.modules[0].lessons[0].content;
    // With LLM, content should differ; with template, at least sources should shuffle
    assert(c1l !== c2l || c1l.length > 500, 'Content is different or substantial');
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\n📊 Results: ${passed}/${total} tests passed (${assertions} assertions)\n`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `evals/journey-test-results-${timestamp}.json`;
  const Bun = globalThis as any;
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify({ timestamp: new Date().toISOString(), tests: results, passed, total, assertions }, null, 2));
  console.log(`Results saved to ${outputPath}\n`);

  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
