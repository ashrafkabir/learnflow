import type { AgentInterface } from './types.js';

/**
 * Agent Registry — manages available agents and capability lookups
 */
export class AgentRegistry {
  private agents: Map<string, AgentInterface> = new Map();

  register(agent: AgentInterface): void {
    this.agents.set(agent.name, agent);
  }

  unregister(name: string): void {
    this.agents.delete(name);
  }

  get(name: string): AgentInterface | undefined {
    return this.agents.get(name);
  }

  /**
   * Find agent(s) matching a capability query.
   * Returns the first agent whose capabilities array includes the query string.
   */
  findByCapability(capability: string): AgentInterface | undefined {
    for (const agent of this.agents.values()) {
      if (agent.capabilities.includes(capability)) {
        return agent;
      }
    }
    return undefined;
  }

  listAll(): AgentInterface[] {
    return Array.from(this.agents.values());
  }
}
