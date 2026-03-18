export type QueryGenerator = {
  generateTrendingQueries: (topic: string) => Promise<string[]>;
  generateLessonQueries: (args: {
    topic: string;
    moduleTitle: string;
    lessonTitle: string;
    lessonDescription: string;
  }) => Promise<string[]>;
};
export declare function createOpenAIQueryGenerator(env?: NodeJS.ProcessEnv): QueryGenerator;
//# sourceMappingURL=trending-queries.d.ts.map
