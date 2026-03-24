/**
 * Syllabus Generator — creates modules with correct prerequisite ordering.
 */

export interface SyllabusModule {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisites: string[]; // IDs of prerequisite modules
  lessons: string[];
}

export interface Syllabus {
  topic: string;
  modules: SyllabusModule[];
  totalLessons: number;
  estimatedHours: number;
}

/**
 * Generate a syllabus from a topic with prerequisite-ordered modules.
 */
export function generateSyllabus(topic: string, subtopics: string[]): Syllabus {
  const modules: SyllabusModule[] = subtopics.map((st, i) => ({
    id: `mod-${i}`,
    title: st,
    description: `Build working understanding of ${st} in the context of ${topic}`,
    order: i,
    prerequisites: i > 0 ? [`mod-${i - 1}`] : [], // Linear prerequisite chain
    lessons: [`lesson-${i}-1`, `lesson-${i}-2`],
  }));

  return {
    topic,
    modules,
    totalLessons: modules.reduce((sum, m) => sum + m.lessons.length, 0),
    estimatedHours: modules.length * 2,
  };
}

/**
 * Validate that the prerequisite DAG is valid (no cycles).
 */
export function isValidPrerequisiteOrder(modules: SyllabusModule[]): boolean {
  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (id: string): boolean => {
    if (inStack.has(id)) return false; // Cycle detected
    if (visited.has(id)) return true;

    inStack.add(id);
    const mod = moduleMap.get(id);
    if (mod) {
      for (const prereq of mod.prerequisites) {
        if (!dfs(prereq)) return false;
      }
    }
    inStack.delete(id);
    visited.add(id);
    return true;
  };

  for (const mod of modules) {
    if (!dfs(mod.id)) return false;
  }

  return true;
}
