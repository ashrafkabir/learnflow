/** In-memory store for S02 (replaced by PostgreSQL in later sprints) */

export interface DbUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'student' | 'creator' | 'admin';
  tier: 'free' | 'pro';
  goals: string[];
  preferredLanguage: string;
  oauthProvider?: string;
  oauthId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbApiKey {
  id: string;
  userId: string;
  provider: string;
  encryptedKey: string;
  iv: string;
  label: string;
  lastFour: string;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsageRecord {
  userId: string;
  agentId: string;
  tokensUsed: number;
  timestamp: Date;
}

class InMemoryDb {
  users: Map<string, DbUser> = new Map();
  apiKeys: Map<string, DbApiKey> = new Map();
  refreshTokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  tokenUsage: TokenUsageRecord[] = [];

  findUserByEmail(email: string): DbUser | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  findUserById(id: string): DbUser | undefined {
    return this.users.get(id);
  }

  findUserByOAuth(provider: string, oauthId: string): DbUser | undefined {
    for (const user of this.users.values()) {
      if (user.oauthProvider === provider && user.oauthId === oauthId) return user;
    }
    return undefined;
  }

  getKeysByUserId(userId: string): DbApiKey[] {
    const keys: DbApiKey[] = [];
    for (const key of this.apiKeys.values()) {
      if (key.userId === userId) keys.push(key);
    }
    return keys;
  }

  addTokenUsage(record: TokenUsageRecord): void {
    this.tokenUsage.push(record);
  }

  getTokenUsageByAgent(userId: string, agentId: string): number {
    return this.tokenUsage
      .filter((r) => r.userId === userId && r.agentId === agentId)
      .reduce((sum, r) => sum + r.tokensUsed, 0);
  }

  clear(): void {
    this.users.clear();
    this.apiKeys.clear();
    this.refreshTokens.clear();
    this.tokenUsage = [];
  }
}

export const db = new InMemoryDb();
