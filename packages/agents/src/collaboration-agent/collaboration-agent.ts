/**
 * Collaboration Agent — matches peers, creates study groups, facilitates collaboration.
 */

import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';

export interface PeerMatch {
  userId: string;
  displayName: string;
  overlappingGoals: string[];
  matchScore: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  memberIds: string[];
  sharedResources: string[];
  createdAt: Date;
}

export class CollaborationAgent implements AgentInterface {
  name = 'collaboration_agent';
  capabilities = ['find_peers', 'create_group', 'match_recommendations'];

  async initialize(): Promise<void> {}

  async process(
    context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const allUsers = (task.params.allUsers as StudentContextObject[]) || [];

    if (task.type === 'create_group') {
      const memberIds = (task.params.memberIds as string[]) || [context.userId];
      const groupName = (task.params.groupName as string) || 'Study Group';
      const group = this.createStudyGroup(groupName, memberIds);
      return {
        agentName: this.name,
        status: 'success',
        data: {
          text: `Created study group "${group.name}" with ${group.memberIds.length} members.`,
          group,
        },
        tokensUsed: 50,
      };
    }

    // Default: find peer matches
    const matches = this.findPeerMatches(context, allUsers);
    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: `Found ${matches.length} potential study partners based on your goals.`,
        matches,
      },
      tokensUsed: 100,
    };
  }

  async cleanup(): Promise<void> {}

  findPeerMatches(user: StudentContextObject, allUsers: StudentContextObject[]): PeerMatch[] {
    const matches: PeerMatch[] = [];

    for (const other of allUsers) {
      if (other.userId === user.userId) continue;

      const overlapping = user.goals.filter((g) =>
        other.goals.some(
          (og) =>
            og.toLowerCase().includes(g.toLowerCase()) ||
            g.toLowerCase().includes(og.toLowerCase()),
        ),
      );

      if (overlapping.length > 0) {
        matches.push({
          userId: other.userId,
          displayName: other.user.displayName,
          overlappingGoals: overlapping,
          matchScore: overlapping.length / Math.max(user.goals.length, 1),
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  createStudyGroup(name: string, memberIds: string[]): StudyGroup {
    return {
      id: `group-${Date.now()}`,
      name,
      memberIds,
      sharedResources: [],
      createdAt: new Date(),
    };
  }
}
