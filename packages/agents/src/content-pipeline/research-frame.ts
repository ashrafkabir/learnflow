/**
 * Iter69: Course Research & Composition Frame
 *
 * Implements a layered search plan (Market/Analyst, Academic, Practitioner/Community) + relevance filtering.
 * This is a deterministic scaffold used by the pipeline.
 */

export type ResearchLayerId = 'L1_market' | 'L2_academic' | 'L3_practitioner' | 'L4_filter';

export type ResearchLayer = {
  id: ResearchLayerId;
  label: string;
  queries: string[];
};

export type CourseResearchFrame = {
  title: string;
  topic: string;
  layers: ResearchLayer[];
  expectedOutput: {
    trendsTopN: number;
    painPointsTopN: number;
    proofPointsTopN: number;
    subtopicsTopN: number;
  };
};

export function buildCourseResearchFrame(courseTopic: string): CourseResearchFrame {
  const t = courseTopic;
  return {
    title: `COURSE RESEARCH & COMPOSITION PROMPT (Topic: ${t})`,
    topic: t,
    layers: [
      {
        id: 'L1_market',
        label: 'L1 Market/Analyst',
        queries: [
          `${t} Gartner Forrester IDC analyst report 2025`,
          `${t} enterprise adoption trends 2025`,
          `${t} ROI proof points business case enterprise`,
          `${t} vendor landscape comparison decision criteria`,
        ],
      },
      {
        id: 'L2_academic',
        label: 'L2 Academic/Research',
        queries: [
          `${t} peer reviewed research findings 2024 2025`,
          `${t} emerging frameworks validated methodology`,
          `${t} failure modes risks empirical study`,
        ],
      },
      {
        id: 'L3_practitioner',
        label: 'L3 Practitioner/Community',
        queries: [
          `${t} real-world implementation case study enterprise`,
          `${t} github trending open source community 2025`,
          `${t} conference keynote re:Invent Build Google Cloud Next 2025`,
        ],
      },
      {
        id: 'L4_filter',
        label: 'L4 Relevance filter',
        queries: [],
      },
    ],
    expectedOutput: {
      trendsTopN: 7,
      painPointsTopN: 5,
      proofPointsTopN: 3,
      subtopicsTopN: 5,
    },
  };
}

export type ResearchFindings = {
  trends: string[];
  painPoints: string[];
  proofPoints: string[];
  emergingSubtopics: string[];
};

/**
 * Deterministic summarizer for research findings.
 * For MVP: derive from search result titles/snippets using simple heuristics.
 */
export function deriveFindingsFromSearch(params: {
  topic: string;
  byLayer: Record<
    string,
    Array<{ title: string; description?: string; url: string; source?: string }>
  >;
}): ResearchFindings {
  const { topic, byLayer } = params;
  const text = Object.values(byLayer)
    .flat()
    .map((r) => `${r.title} ${r.description || ''}`)
    .join(' | ')
    .toLowerCase();

  // Extremely simple heuristics; keep deterministic.
  const candidates = Array.from(
    new Set(
      text
        .split(/\||\.|;|\(|\)|\[|\]|\{|\}|,|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 18 && s.length <= 120),
    ),
  ).slice(0, 80);

  const trends = candidates
    .filter((c) => /trend|outlook|forecast|adoption|market|landscape|2025/.test(c))
    .slice(0, 7);
  const painPoints = candidates
    .filter((c) => /risk|failure|pitfall|challenge|gap|security|cost/.test(c))
    .slice(0, 5);
  const proofPoints = candidates
    .filter((c) => /roi|case study|benchmark|study|results|evidence|report/.test(c))
    .slice(0, 3);
  const emergingSubtopics = candidates
    .filter((c) => c.includes(topic.toLowerCase().split(' ')[0] || ''))
    .slice(0, 5);

  return {
    trends: trends.length ? trends : [`${topic}: top trends (insufficient signal)`],
    painPoints: painPoints.length ? painPoints : [`${topic}: common gaps (insufficient signal)`],
    proofPoints: proofPoints.length
      ? proofPoints
      : [`${topic}: proof points (insufficient signal)`],
    emergingSubtopics: emergingSubtopics.length
      ? emergingSubtopics
      : [`${topic}: emerging subtopics (insufficient signal)`],
  };
}
