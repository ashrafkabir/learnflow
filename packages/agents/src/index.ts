// Course Builder
export { CourseBuilderAgent } from './course-builder/course-builder-agent.js';
export { decomposeTopic, countNodes } from './course-builder/topic-decomposer.js';
export { generateSyllabus, isValidPrerequisiteOrder } from './course-builder/syllabus-generator.js';
export {
  buildCourseOutline,
  classifyTopicDomain,
  topicFingerprint,
  type CourseOutline,
  type OutlineDomain,
  type OutlineModule,
  type OutlineLesson,
} from './course-builder/domain-outline.js';
export { quantumComputingRequiredModules } from './course-builder/domain-profiles/quantum.js';
export { programmingRequiredModules } from './course-builder/domain-profiles/programming.js';
export { mathRequiredModules } from './course-builder/domain-profiles/math.js';
export { policyBusinessRequiredModules } from './course-builder/domain-profiles/policy-business.js';
export { cookingRequiredModules } from './course-builder/domain-profiles/cooking.js';
export { aiPromptingRequiredModules } from './course-builder/domain-profiles/ai-prompting.js';

// Content Pipeline
export { discoverSources } from './content-pipeline/source-discovery.js';
export { extractText } from './content-pipeline/content-extractor.js';

export {
  writeCourseResearch,
  writeLessonResearch,
  writeLessonPlan,
  writeCourseResearchMarkdown,
  writeLessonPlanMarkdown,
  readCourseResearch,
  readLessonResearch,
  listLessonResearchBundles,
  courseArtifactsRoot,
} from './content-pipeline/artifact-writer.js';
export { scoreContent } from './content-pipeline/quality-scorer.js';
export { AttributionTracker } from './content-pipeline/attribution-tracker.js';
export { isDuplicate, similarity } from './content-pipeline/deduplicator.js';
export { formatLessons, estimateReadingTime } from './content-pipeline/lesson-formatter.js';
export { parseRobotsTxt, isUrlAllowed } from './content-pipeline/robots-checker.js';
export { ScraperRateLimiter } from './content-pipeline/rate-limiter.js';

// Core Agents (S05)
export { ExportAgent } from './export-agent/export-agent.js';
export { NotesAgent } from './notes-agent/notes-agent.js';
export { ResearchAgent } from './research-agent/research-agent.js';
export { ExamAgent } from './exam-agent/exam-agent.js';
export { SummarizerAgent } from './summarizer-agent/summarizer-agent.js';
export { TutorAgent } from './tutor-agent/tutor-agent.js';

// Collaboration & Mindmap (S06)
export { CollaborationAgent } from './collaboration-agent/collaboration-agent.js';
export { MindmapAgent } from './mindmap-agent/mindmap-agent.js';

// Update Agent (S10)
export { UpdateAgent, MockWebSearchProvider } from './update-agent/update-agent.js';

// Types
export type { ConceptNode } from './course-builder/topic-decomposer.js';
export type { SyllabusModule, Syllabus } from './course-builder/syllabus-generator.js';
export type { SourceResult, SearchApi } from './content-pipeline/source-discovery.js';
export type { QualityScore } from './content-pipeline/quality-scorer.js';
export type { Attribution } from './content-pipeline/attribution-tracker.js';
export type { FormattedLesson } from './content-pipeline/lesson-formatter.js';
export type { RobotsRules } from './content-pipeline/robots-checker.js';
export type { CornellNote, ZettelkastenNote, Flashcard } from './notes-agent/notes-agent.js';
export type {
  Paper,
  ResearchSummary,
  SemanticScholarApi,
} from './research-agent/research-agent.js';
export type {
  MultipleChoiceQuestion,
  ShortAnswerQuestion,
  QuizResult,
} from './exam-agent/exam-agent.js';
export type { Summary } from './summarizer-agent/summarizer-agent.js';
export type { PeerMatch, StudyGroup } from './collaboration-agent/collaboration-agent.js';
export type {
  MindmapNode,
  MindmapEdge,
  Mindmap,
  CrdtOperation,
} from './mindmap-agent/mindmap-agent.js';

// Content provider exports.
// Iter152: Spec §6.1.1 requires OpenAI `web_search` only for discovery (no Wikipedia/arXiv/GitHub/etc pipelines).
// The legacy multi-source provider remains in repo for reference/tests, but is NOT exported as the default.
export {
  // NOTE: For pipeline research, use `searchAndExtractTopic` from openai-websearch-provider.
  // Keep Firecrawl types + scoring helpers available for rendering.
  searchSources,
  scrapeUrl,
  scoreCredibility,
  scoreRecency,
  scoreRelevance,
  synthesizeFromSources,
  formatCitations,
  checkDomainDiversity,
  extractDomain,
} from './content-pipeline/firecrawl-provider.js';

export {
  // OpenAI web_search based provider (spec-compliant discovery)
  searchAndExtractTopic,
  type NormalizedSource,
} from './content-pipeline/openai-websearch-provider.js';

export {
  // Legacy / non-default provider (kept for backwards compatibility in dev)
  crawlSourcesForTopic,
  searchForLesson,
  searchTopicTrending,
} from './content-pipeline/web-search-provider.js';

export {
  searchWikimediaCommonsImages,
  type LicenseSafeImageCandidate,
} from './content-pipeline/image-search-provider.js';
export type {
  FirecrawlSource,
  FirecrawlConfig,
  FirecrawlSearchResult,
} from './content-pipeline/firecrawl-provider.js';

// Suggested nodes (Iter39)
export {
  generateSuggestedMindmapNodes,
  type SuggestedMindmapNode,
} from './content-pipeline/suggested-nodes.js';
