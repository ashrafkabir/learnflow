import { describe, it, expect } from 'vitest';
import { decomposeTopic, countNodes } from '../course-builder/topic-decomposer.js';
import {
  generateSyllabus,
  isValidPrerequisiteOrder,
} from '../course-builder/syllabus-generator.js';
import { discoverSources } from '../content-pipeline/source-discovery.js';
import type { SearchApi } from '../content-pipeline/source-discovery.js';
import { extractText } from '../content-pipeline/content-extractor.js';
import { scoreContent } from '../content-pipeline/quality-scorer.js';
import { AttributionTracker } from '../content-pipeline/attribution-tracker.js';
import { isDuplicate } from '../content-pipeline/deduplicator.js';
import { formatLessons, estimateReadingTime } from '../content-pipeline/lesson-formatter.js';
import { parseRobotsTxt, isUrlAllowed } from '../content-pipeline/robots-checker.js';
import { ScraperRateLimiter } from '../content-pipeline/rate-limiter.js';
import { CourseBuilderAgent } from '../course-builder/course-builder-agent.js';
import type { StudentContextObject } from '@learnflow/core';

function createMockContext(): StudentContextObject {
  return {
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test',
      role: 'student',
      tier: 'free',
      goals: ['Learn ML'],
      preferredLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    enrolledCourseIds: [],
    completedLessonIds: [],
    goals: ['Learn ML'],
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 0,
    totalStudyMinutes: 0,
    lastActiveAt: new Date(),
    goalDetails: [],
    interests: [],
    browseHistory: [],
    searchQueries: [],
    bookmarkedContent: [],
    sessionFrequency: 0,
    preferredTimeOfDay: 'morning',
    preferredLessonLength: 10,
    subscriptionTier: 'free',
    billingStatus: 'active',
    usageQuotas: {},
    notificationSettings: { email: true, push: true, inApp: true },
    preferredAgents: [],
    displayPreferences: { theme: 'light', fontSize: 16 },
    collaborationOptIn: false,
    peerConnections: [],
    sharedCourses: [],
    lessonRatings: {},
    agentRatings: {},
    courseReviews: [],
  };
}

// S04-A01: Topic decomposition breaks "Machine Learning" into concept tree
describe('S04-A01: Topic decomposition', () => {
  it('breaks Machine Learning into tree with ≥5 nodes', () => {
    const tree = decomposeTopic('Machine Learning');
    const total = countNodes(tree);
    expect(total).toBeGreaterThanOrEqual(5);
    expect(tree.label).toBe('Machine Learning');
    expect(tree.children.length).toBeGreaterThan(0);
  });
});

// S04-A02: Source discovery queries multiple APIs and returns ranked results
describe('S04-A02: Source discovery', () => {
  it('queries multiple APIs and returns ranked results', async () => {
    const mockApis: SearchApi[] = [
      {
        name: 'google',
        search: async () => [
          {
            url: 'https://example.com/a',
            title: 'Article A',
            snippet: '...',
            domain: 'example.com',
            relevanceScore: 0.9,
            source: 'google',
          },
        ],
      },
      {
        name: 'bing',
        search: async () => [
          {
            url: 'https://example.com/b',
            title: 'Article B',
            snippet: '...',
            domain: 'example.com',
            relevanceScore: 0.8,
            source: 'bing',
          },
        ],
      },
    ];

    const results = await discoverSources('machine learning', mockApis);
    expect(results).toHaveLength(2);
    expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1].relevanceScore);
  });
});

// S04-A03: Content extractor returns clean text from HTML
describe('S04-A03: Content extractor', () => {
  it('strips HTML tags and returns clean text', () => {
    const html = `
      <html><head><script>alert('x')</script><style>body{}</style></head>
      <body><nav>Menu</nav><h1>Hello World</h1><p>This is <b>content</b> with &amp; entities.</p>
      <footer>Footer</footer></body></html>
    `;
    const text = extractText(html);
    expect(text).not.toContain('<');
    expect(text).not.toContain('alert');
    expect(text).not.toContain('Menu');
    expect(text).not.toContain('Footer');
    expect(text).toContain('Hello World');
    expect(text).toContain('content');
    expect(text).toContain('&');
  });
});

// S04-A04: Quality scorer produces scores in [0,1] range for all 4 dimensions
describe('S04-A04: Quality scorer', () => {
  it('produces scores in [0,1] for all dimensions', () => {
    const score = scoreContent(
      'Machine learning is a field of artificial intelligence that uses data to learn patterns.',
      'arxiv.org',
      new Date(),
      'machine learning',
    );

    expect(score.authority).toBeGreaterThanOrEqual(0);
    expect(score.authority).toBeLessThanOrEqual(1);
    expect(score.recency).toBeGreaterThanOrEqual(0);
    expect(score.recency).toBeLessThanOrEqual(1);
    expect(score.relevance).toBeGreaterThanOrEqual(0);
    expect(score.relevance).toBeLessThanOrEqual(1);
    expect(score.readability).toBeGreaterThanOrEqual(0);
    expect(score.readability).toBeLessThanOrEqual(1);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });
});

// S04-A05: Attribution tracker stores URL, author, date, license
describe('S04-A05: Attribution tracker', () => {
  it('stores and retrieves full attribution', () => {
    const tracker = new AttributionTracker();
    const attr = {
      url: 'https://example.com/article',
      author: 'John Doe',
      publication: 'Tech Journal',
      date: new Date('2025-01-15'),
      license: 'CC-BY-4.0',
      accessTimestamp: new Date(),
    };

    tracker.track(attr);
    const retrieved = tracker.get(attr.url);

    expect(retrieved).toBeDefined();
    expect(retrieved!.url).toBe(attr.url);
    expect(retrieved!.author).toBe(attr.author);
    expect(retrieved!.date).toEqual(attr.date);
    expect(retrieved!.license).toBe(attr.license);
    expect(tracker.hasRequiredFields(attr)).toBe(true);
  });
});

// S04-A06: Deduplication detects near-identical content
describe('S04-A06: Deduplication', () => {
  it('detects near-identical content', () => {
    const textA =
      'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. These systems use algorithms to identify patterns and make predictions based on training data. The field has grown significantly in recent years with applications in computer vision and natural language processing.';
    const textB =
      'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. These systems use algorithms to identify patterns and make predictions based on training data. The field has expanded significantly in recent years with uses in computer vision and natural language processing.';
    const textC =
      'The weather in Paris is lovely this time of year with clear skies and warm temperatures. Tourists flock to the Eiffel Tower and enjoy croissants at local cafes while strolling along the Seine river banks during the summer months.';

    expect(isDuplicate(textA, textB)).toBe(true);
    expect(isDuplicate(textA, textC)).toBe(false);
  });
});

// S04-A07: Lesson formatter chunks content to ≤1500 words per lesson
describe('S04-A07: Lesson formatter', () => {
  it('chunks 5000-word text into 4 lessons', () => {
    const words = Array(5000).fill('word').join(' ');
    const lessons = formatLessons(words, 'Test Topic');

    expect(lessons.length).toBe(4);
    for (const lesson of lessons) {
      const wordCount = lesson.content.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(1500);
    }
  });
});

// S04-A08: Syllabus generator creates modules with correct prerequisite ordering
describe('S04-A08: Syllabus prerequisite ordering', () => {
  it('generates valid prerequisite DAG', () => {
    const syllabus = generateSyllabus('Python', ['Basics', 'Functions', 'OOP', 'Advanced']);

    expect(syllabus.modules).toHaveLength(4);
    expect(isValidPrerequisiteOrder(syllabus.modules)).toBe(true);

    // First module has no prereqs
    expect(syllabus.modules[0].prerequisites).toHaveLength(0);
    // Second module depends on first
    expect(syllabus.modules[1].prerequisites).toContain('mod-0');
  });
});

// S04-A09: Course, Lesson, Source types compile without errors
describe('S04-A09: Types compile', () => {
  it('FormattedLesson has all spec Section 6.2 fields', () => {
    const lessons = formatLessons('Some content here for testing', 'Test');
    if (lessons.length > 0) {
      const l = lessons[0];
      expect(l.title).toBeDefined();
      expect(l.estimatedMinutes).toBeDefined();
      expect(l.learningObjectives).toBeDefined();
      expect(l.content).toBeDefined();
      expect(l.keyTakeaways).toBeDefined();
      expect(l.sources).toBeDefined();
      expect(l.nextSteps).toBeDefined();
      expect(l.quickCheck).toBeDefined();
    }
  });
});

// S04-A10: Estimated reading time calculation is accurate (±1 min)
describe('S04-A10: Reading time estimation', () => {
  it('estimates ~7-8 min for 1500 words', () => {
    const text = Array(1500).fill('word').join(' ');
    const minutes = estimateReadingTime(text);
    expect(minutes).toBeGreaterThanOrEqual(7);
    expect(minutes).toBeLessThanOrEqual(8);
  });
});

// S04-A11: Course builder agent produces valid course outline from topic
describe('S04-A11: CourseBuilderAgent', () => {
  it('produces valid outline', async () => {
    const agent = new CourseBuilderAgent();
    await agent.initialize();

    const ctx = createMockContext();
    const result = await agent.process(ctx, {
      type: 'build_course',
      params: { topic: 'Machine Learning' },
    });

    expect(result.status).toBe('success');
    expect(result.agentName).toBe('course_builder');
    const data = result.data as { text: string; syllabus: { modules: unknown[] } };
    expect(data.text).toContain('Machine Learning');
    expect(data.syllabus.modules.length).toBeGreaterThan(0);
  });
});

// S04-A12: Content respects robots.txt (mock test)
describe('S04-A12: Robots.txt compliance', () => {
  it('blocks URLs disallowed by robots.txt', () => {
    const robotsTxt = `
User-agent: *
Disallow: /private/
Disallow: /admin/
Crawl-delay: 2
    `;
    const rules = parseRobotsTxt(robotsTxt);

    expect(isUrlAllowed('/public/article', rules)).toBe(true);
    expect(isUrlAllowed('/private/data', rules)).toBe(false);
    expect(isUrlAllowed('/admin/dashboard', rules)).toBe(false);
  });
});

// S04-A13: Full pipeline integration
describe('S04-A13: Full pipeline', () => {
  it('topic → discover → extract → score → format → syllabus', async () => {
    const topic = 'Machine Learning';

    // 1. Decompose
    const tree = decomposeTopic(topic);
    expect(countNodes(tree)).toBeGreaterThanOrEqual(5);

    // 2. Discover (mock)
    const mockApi: SearchApi = {
      name: 'mock',
      search: async () => [
        {
          url: 'https://arxiv.org/ml-intro',
          title: 'Intro to ML',
          snippet: 'Machine learning overview',
          domain: 'arxiv.org',
          relevanceScore: 0.95,
          source: 'google',
        },
      ],
    };
    const sources = await discoverSources(topic, [mockApi]);
    expect(sources.length).toBeGreaterThan(0);

    // 3. Extract
    const html =
      '<html><body><h1>Machine Learning</h1><p>ML is about learning from data. ' +
      Array(300).fill('word').join(' ') +
      '</p></body></html>';
    const text = extractText(html);
    expect(text).not.toContain('<');

    // 4. Score
    const score = scoreContent(text, 'arxiv.org', new Date(), topic);
    expect(score.overall).toBeGreaterThan(0);

    // 5. Format
    const lessons = formatLessons(text, topic);
    expect(lessons.length).toBeGreaterThan(0);

    // 6. Syllabus
    const subtopics = tree.children.map((c) => c.label);
    const syllabus = generateSyllabus(topic, subtopics);
    expect(isValidPrerequisiteOrder(syllabus.modules)).toBe(true);
  });
});

// S04-A14: Lesson structure matches spec Section 6.2 (all 8 elements)
describe('S04-A14: Lesson structure has all 8 elements', () => {
  it('has title, estimatedTime, objectives, content, takeaways, sources, nextSteps, quickCheck', () => {
    const lessons = formatLessons(Array(500).fill('learning').join(' '), 'Test');
    expect(lessons.length).toBeGreaterThan(0);
    const lesson = lessons[0];

    // All 8 elements from spec Section 6.2
    expect(typeof lesson.title).toBe('string');
    expect(typeof lesson.estimatedMinutes).toBe('number');
    expect(Array.isArray(lesson.learningObjectives)).toBe(true);
    expect(typeof lesson.content).toBe('string');
    expect(Array.isArray(lesson.keyTakeaways)).toBe(true);
    expect(Array.isArray(lesson.sources)).toBe(true);
    expect(Array.isArray(lesson.nextSteps)).toBe(true);
    expect(Array.isArray(lesson.quickCheck)).toBe(true);
  });
});

// S04-A15: Rate limiting on scraper respects 1 req/sec per domain
describe('S04-A15: Scraper rate limiting', () => {
  it('enforces delay between requests to same domain', async () => {
    const limiter = new ScraperRateLimiter(100); // 100ms for fast tests

    // First request should be immediate
    expect(limiter.canRequestNow('example.com')).toBe(true);
    await limiter.waitForDomain('example.com');

    // Second request should need to wait
    expect(limiter.canRequestNow('example.com')).toBe(false);

    // Different domain should be immediate
    expect(limiter.canRequestNow('other.com')).toBe(true);

    // Wait for rate limit to expire
    await new Promise((r) => setTimeout(r, 110));
    expect(limiter.canRequestNow('example.com')).toBe(true);
  });
});
