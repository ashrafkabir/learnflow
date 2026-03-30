import { z } from 'zod';
import { sqlite } from '../db.js';

export type SearchProviderId =
  | 'wikipedia'
  | 'arxiv'
  | 'github'
  | 'reddit'
  | 'medium'
  | 'substack'
  | 'quora'
  | 'thenewstack'
  | 'devto'
  | 'hackernews'
  | 'stackoverflow'
  | 'freecodecamp'
  | 'towardsdatascience'
  | 'digitalocean'
  | 'mdn'
  | 'smashingmag'
  | 'coursera'
  | 'baiduscholar';

export const SEARCH_PROVIDER_IDS: SearchProviderId[] = [
  'wikipedia',
  'arxiv',
  'github',
  'reddit',
  'medium',
  'substack',
  'quora',
  'thenewstack',
  'devto',
  'hackernews',
  'stackoverflow',
  'freecodecamp',
  'towardsdatascience',
  'digitalocean',
  'mdn',
  'smashingmag',
  'coursera',
  'baiduscholar',
];

export type AdminSearchConfig = {
  stage1Templates: string[]; // topic trending (legacy)
  stage2Templates: string[]; // per-lesson (legacy)
  /** Iter69: layered course research templates */
  layerTemplates?: {
    L1_market: string[];
    L2_academic: string[];
    L3_practitioner: string[];
  };
  enabledSources: Record<SearchProviderId, boolean>;
  perQueryLimit: number;
  maxSourcesPerLesson: number;
  maxStage1Queries: number;
  maxStage2Queries: number;
};

export const adminSearchConfigSchema = z
  .object({
    stage1Templates: z.array(z.string().min(3)).min(1).max(20),
    stage2Templates: z.array(z.string().min(3)).min(1).max(20),
    layerTemplates: z
      .object({
        L1_market: z.array(z.string().min(3)).min(1).max(20),
        L2_academic: z.array(z.string().min(3)).min(1).max(20),
        L3_practitioner: z.array(z.string().min(3)).min(1).max(20),
      })
      .optional(),
    enabledSources: z.record(z.string(), z.coerce.boolean()).optional(),
    perQueryLimit: z.coerce.number().int().min(1).max(10).default(5),
    maxSourcesPerLesson: z.coerce.number().int().min(1).max(12).default(6),
    maxStage1Queries: z.coerce.number().int().min(1).max(20).default(10),
    maxStage2Queries: z.coerce.number().int().min(1).max(20).default(6),
  })
  .transform((v) => {
    const enabled: Record<SearchProviderId, boolean> = {} as any;
    for (const id of SEARCH_PROVIDER_IDS) enabled[id] = true;
    if (v.enabledSources) {
      for (const id of Object.keys(v.enabledSources)) {
        if ((SEARCH_PROVIDER_IDS as string[]).includes(id)) {
          (enabled as any)[id] = Boolean((v.enabledSources as any)[id]);
        }
      }
    }
    return {
      stage1Templates: v.stage1Templates,
      stage2Templates: v.stage2Templates,
      layerTemplates: v.layerTemplates,
      enabledSources: enabled,
      perQueryLimit: v.perQueryLimit,
      maxSourcesPerLesson: v.maxSourcesPerLesson,
      maxStage1Queries: v.maxStage1Queries,
      maxStage2Queries: v.maxStage2Queries,
    } satisfies AdminSearchConfig;
  });

const DEFAULTS: AdminSearchConfig = {
  // Legacy templates (still used for per-lesson search)
  stage1Templates: [
    '{courseTopic} overview',
    '{courseTopic} best practices',
    '{courseTopic} pitfalls common mistakes',
    '{courseTopic} architecture patterns',
    '{courseTopic} examples',
    '{courseTopic} 2025 trends',
    'site:wikipedia.org {courseTopic}',
    'site:arxiv.org {courseTopic}',
    'site:github.com {courseTopic}',
  ],
  stage2Templates: [
    '{lessonTitle} {courseTopic}',
    '{lessonTitle} best practices',
    '{lessonTitle} examples',
    '{lessonTitle} pitfalls',
    '{moduleTitle} {lessonTitle}',
    '{lessonDescription}',
    'site:wikipedia.org {lessonTitle}',
    'site:github.com {lessonTitle}',
  ],
  // Iter69: Layered research defaults (editable)
  layerTemplates: {
    L1_market: [
      '"{courseTopic} Gartner Forrester IDC analyst report 2025"',
      '"{courseTopic} enterprise adoption trends 2025"',
      '"{courseTopic} ROI proof points business case enterprise"',
      '"{courseTopic} vendor landscape comparison decision criteria"',
    ],
    L2_academic: [
      '"{courseTopic} peer reviewed research findings 2024 2025"',
      '"{courseTopic} emerging frameworks validated methodology"',
      '"{courseTopic} failure modes risks empirical study"',
    ],
    L3_practitioner: [
      '"{courseTopic} real-world implementation case study enterprise"',
      '"{courseTopic} github trending open source community 2025"',
      '"{courseTopic} conference keynote re:Invent Build Google Cloud Next 2025"',
    ],
  },
  enabledSources: Object.fromEntries(SEARCH_PROVIDER_IDS.map((id) => [id, true])) as any,
  perQueryLimit: 5,
  maxSourcesPerLesson: 6,
  maxStage1Queries: 10,
  maxStage2Queries: 6,
};

const KEY = 'admin.searchConfig';

export function getAdminSearchConfig(): AdminSearchConfig {
  try {
    const row = sqlite.prepare('SELECT value FROM app_settings WHERE key = ?').get(KEY) as any;
    if (!row?.value) return DEFAULTS;
    const parsed = JSON.parse(String(row.value));
    return adminSearchConfigSchema.parse(parsed);
  } catch {
    return DEFAULTS;
  }
}

export function saveAdminSearchConfig(next: unknown): AdminSearchConfig {
  const parsed = adminSearchConfigSchema.parse(next);
  sqlite
    .prepare('INSERT OR REPLACE INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)')
    .run(KEY, JSON.stringify(parsed), new Date().toISOString());
  return parsed;
}
