/**
 * DAG-based execution planner for agent tasks.
 * Parallelizes independent tasks and serializes dependent ones.
 */

export interface DagTask {
  id: string;
  agentName: string;
  dependsOn: string[]; // IDs of tasks this depends on
  execute: () => Promise<unknown>;
}

export interface DagResult {
  taskId: string;
  result: unknown;
  error?: string;
}

export class DagPlanner {
  /**
   * Execute tasks respecting dependency order.
   * Independent tasks run in parallel; dependent ones wait.
   */
  async execute(tasks: DagTask[]): Promise<DagResult[]> {
    const results = new Map<string, DagResult>();
    const completed = new Set<string>();

    // Validate no circular dependencies
    this.validateNoCycles(tasks);

    while (completed.size < tasks.length) {
      // Find all tasks whose dependencies are satisfied
      const ready = tasks.filter(
        (t) => !completed.has(t.id) && t.dependsOn.every((dep) => completed.has(dep)),
      );

      if (ready.length === 0 && completed.size < tasks.length) {
        throw new Error('DAG deadlock: unresolvable dependencies');
      }

      // Execute ready tasks in parallel
      const batchResults = await Promise.allSettled(
        ready.map(async (task) => {
          try {
            const result = await task.execute();
            return { taskId: task.id, result } as DagResult;
          } catch (err) {
            return {
              taskId: task.id,
              result: null,
              error: err instanceof Error ? err.message : String(err),
            } as DagResult;
          }
        }),
      );

      for (const settled of batchResults) {
        const dagResult =
          settled.status === 'fulfilled'
            ? settled.value
            : {
                taskId: 'unknown',
                result: null,
                error: String(settled.reason),
              };
        results.set(dagResult.taskId, dagResult);
        completed.add(dagResult.taskId);
      }
    }

    return Array.from(results.values());
  }

  private validateNoCycles(tasks: DagTask[]): void {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const dfs = (id: string): void => {
      if (inStack.has(id)) throw new Error(`Circular dependency at ${id}`);
      if (visited.has(id)) return;
      inStack.add(id);
      const task = taskMap.get(id);
      if (task) {
        for (const dep of task.dependsOn) {
          dfs(dep);
        }
      }
      inStack.delete(id);
      visited.add(id);
    };

    for (const task of tasks) {
      dfs(task.id);
    }
  }
}
