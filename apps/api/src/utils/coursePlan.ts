import type { FirecrawlSource } from '@learnflow/agents';

export type PlannedQuery = {
  query: string;
  reason: string;
};

export type TargetSourceMix = {
  docs: number;
  blog: number;
  academic: number;
  forum: number;
};

export type CoursePlanLesson = {
  moduleIndex: number;
  lessonIndex: number;
  moduleTitle: string;
  lessonTitle: string;
  lessonDescription: string;
  plannedQueries: PlannedQuery[];
  targetSourceMix: TargetSourceMix;
};

export type CoursePlan = {
  version: 'iter74';
  createdAt: string;
  topic: string;
  depth: string;
  sourceContext: {
    totalSources: number;
    sampleDomains: string[];
  };
  lessons: CoursePlanLesson[];
};

function domainFromUrl(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function inferTargetSourceMix(topic: string): TargetSourceMix {
  const t = String(topic || '').toLowerCase();
  if (/(kubernetes|react|python|javascript|typescript|node|sql|aws|azure|gcp|docker)/.test(t)) {
    return { docs: 3, blog: 2, academic: 0, forum: 1 };
  }
  if (/(math|statistics|probability|calculus|physics|quantum)/.test(t)) {
    return { docs: 1, blog: 1, academic: 3, forum: 1 };
  }
  if (/(policy|business|strategy|finance|operations|product)/.test(t)) {
    return { docs: 1, blog: 2, academic: 1, forum: 2 };
  }
  return { docs: 2, blog: 2, academic: 1, forum: 1 };
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function buildCoursePlan(params: {
  topic: string;
  depth: string;
  modules: Array<{
    title: string;
    objective?: string;
    lessons: Array<{ title: string; description: string }>;
  }>;
  topicSources: FirecrawlSource[];
}): CoursePlan {
  const { topic, depth, modules, topicSources } = params;
  const sampleDomains = uniq(
    topicSources.slice(0, 12).map((s) => domainFromUrl(s.url) || s.domain),
  );

  const lessons: CoursePlanLesson[] = [];

  for (let mi = 0; mi < modules.length; mi++) {
    const mod = modules[mi];
    for (let li = 0; li < (mod.lessons || []).length; li++) {
      const les = mod.lessons[li];
      const targetSourceMix = inferTargetSourceMix(topic);

      const plannedQueries: PlannedQuery[] = [
        {
          query: `${topic} ${les.title} overview`,
          reason: 'Get a fast, broad introduction to frame the lesson.',
        },
        {
          query: `${topic} ${les.title} documentation`,
          reason: 'Find authoritative reference docs and definitions.',
        },
        {
          query: `${topic} ${les.title} tutorial step by step`,
          reason: 'Find a walkthrough to support the worked example.',
        },
        {
          query: `${topic} ${les.title} worked example`,
          reason: 'Specifically target fully worked examples and artifacts.',
        },
        {
          query: `${topic} ${les.title} common pitfalls`,
          reason: 'Improve quality and practical guidance.',
        },
      ];

      // Ensure 3–6 queries
      const q = plannedQueries.slice(0, 6);

      lessons.push({
        moduleIndex: mi,
        lessonIndex: li,
        moduleTitle: mod.title,
        lessonTitle: les.title,
        lessonDescription: les.description,
        plannedQueries: q,
        targetSourceMix,
      });
    }
  }

  return {
    version: 'iter74',
    createdAt: new Date().toISOString(),
    topic,
    depth,
    sourceContext: {
      totalSources: topicSources.length,
      sampleDomains,
    },
    lessons,
  };
}
