/**
 * SQLite persistence layer using better-sqlite3.
 * All data survives API restarts.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const DB_PATH = isTest ? ':memory:' : path.join(DATA_DIR, 'learnflow.db');
const sqlite: Database.Database = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// ── Migrations ──────────────────────────────────────────────────────────────

function hasColumn(table: string, column: string): boolean {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

// Legacy DBs may miss new columns; add them safely on startup.
if (!isTest) {
  try {
    if (!hasColumn('users', 'onboardingCompletedAt')) {
      sqlite.exec(`ALTER TABLE users ADD COLUMN onboardingCompletedAt TEXT;`);
    }

    if (!hasColumn('mindmaps', 'yjsState')) {
      sqlite.exec(`ALTER TABLE mindmaps ADD COLUMN yjsState TEXT;`);
    }

    if (!hasColumn('mindmaps', 'updatedAt')) {
      sqlite.exec(`ALTER TABLE mindmaps ADD COLUMN updatedAt TEXT;`);
    }
  } catch {
    // If the users table doesn't exist yet, CREATE TABLE below will handle it.
  }
}

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    passwordHash TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student',
    tier TEXT NOT NULL DEFAULT 'free',
    goals TEXT NOT NULL DEFAULT '[]',
    topics TEXT NOT NULL DEFAULT '[]',
    experience TEXT NOT NULL DEFAULT '',
    schedule TEXT NOT NULL DEFAULT '{}',
    preferredLanguage TEXT NOT NULL DEFAULT 'en',
    onboardingCompletedAt TEXT,
    oauthProvider TEXT,
    oauthId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    depth TEXT NOT NULL DEFAULT 'intermediate',
    authorId TEXT NOT NULL DEFAULT 'anonymous',
    modules TEXT NOT NULL DEFAULT '[]',
    progress TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    moduleIndex INTEGER NOT NULL,
    lessonIndex INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    estimatedTime INTEGER NOT NULL DEFAULT 5,
    wordCount INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress (
    userId TEXT NOT NULL,
    lessonId TEXT NOT NULL,
    courseId TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 1,
    completedAt TEXT NOT NULL,
    PRIMARY KEY (userId, lessonId)
  );

  CREATE TABLE IF NOT EXISTS learning_events (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    courseId TEXT,
    lessonId TEXT,
    meta TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    provider TEXT NOT NULL,
    encryptedKey TEXT NOT NULL,
    iv TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    lastFour TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    expiresAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    topic TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'scraping',
    state TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'paid',
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mindmaps (
    userId TEXT PRIMARY KEY,
    nodes TEXT NOT NULL DEFAULT '[]',
    edges TEXT NOT NULL DEFAULT '[]',
    yjsState TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS marketplace_agents_activated (
    userId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    PRIMARY KEY (userId, agentId)
  );

  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    tokensUsed INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    lessonId TEXT NOT NULL,
    userId TEXT NOT NULL DEFAULT 'anonymous',
    content TEXT NOT NULL DEFAULT '{}',
    illustrations TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notes_lesson_user ON notes(lessonId, userId);

  CREATE TABLE IF NOT EXISTS illustrations (
    id TEXT PRIMARY KEY,
    lessonId TEXT NOT NULL,
    sectionIndex INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_illustrations_lesson ON illustrations(lessonId);

  CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    lessonId TEXT NOT NULL,
    selectedText TEXT NOT NULL,
    startOffset INTEGER NOT NULL,
    endOffset INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'note',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_annotations_lesson ON annotations(lessonId);
`);

// ── Prepared Statements ─────────────────────────────────────────────────────

const stmts = {
  // Users
  insertUser: sqlite.prepare(
    `INSERT INTO users (id, email, displayName, passwordHash, role, tier, goals, topics, experience, schedule, preferredLanguage, onboardingCompletedAt, oauthProvider, oauthId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  updateUser: sqlite.prepare(
    `UPDATE users SET email=?, displayName=?, passwordHash=?, role=?, tier=?, goals=?, topics=?, experience=?, schedule=?, preferredLanguage=?, onboardingCompletedAt=?, oauthProvider=?, oauthId=?, updatedAt=? WHERE id=?`,
  ),
  findUserById: sqlite.prepare(`SELECT * FROM users WHERE id = ?`),
  findUserByEmail: sqlite.prepare(`SELECT * FROM users WHERE email = ?`),
  findUserByOAuth: sqlite.prepare(`SELECT * FROM users WHERE oauthProvider = ? AND oauthId = ?`),

  // Refresh tokens
  insertRefreshToken: sqlite.prepare(
    `INSERT OR REPLACE INTO refresh_tokens (token, userId, expiresAt) VALUES (?, ?, ?)`,
  ),
  findRefreshToken: sqlite.prepare(`SELECT * FROM refresh_tokens WHERE token = ?`),
  deleteRefreshToken: sqlite.prepare(`DELETE FROM refresh_tokens WHERE token = ?`),

  // API keys
  insertApiKey: sqlite.prepare(
    `INSERT INTO api_keys (id, userId, provider, encryptedKey, iv, label, lastFour, active, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getKeysByUserId: sqlite.prepare(`SELECT * FROM api_keys WHERE userId = ?`),
  findApiKeyById: sqlite.prepare(`SELECT * FROM api_keys WHERE id = ?`),
  deleteApiKey: sqlite.prepare(`DELETE FROM api_keys WHERE id = ?`),

  // Token usage
  insertTokenUsage: sqlite.prepare(
    `INSERT INTO token_usage (userId, agentId, tokensUsed, timestamp) VALUES (?, ?, ?, ?)`,
  ),
  getTokenUsageByAgent: sqlite.prepare(
    `SELECT COALESCE(SUM(tokensUsed), 0) as total FROM token_usage WHERE userId = ? AND agentId = ?`,
  ),

  // Courses
  insertCourse: sqlite.prepare(
    `INSERT OR REPLACE INTO courses (id, title, description, topic, depth, authorId, modules, progress, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  findCourseById: sqlite.prepare(`SELECT * FROM courses WHERE id = ?`),
  getAllCourses: sqlite.prepare(`SELECT * FROM courses`),
  deleteCourse: sqlite.prepare(`DELETE FROM courses WHERE id = ?`),

  // Progress
  upsertProgress: sqlite.prepare(
    `INSERT OR REPLACE INTO progress (userId, lessonId, courseId, completed, completedAt) VALUES (?, ?, ?, 1, ?)`,
  ),
  getProgressByUserCourse: sqlite.prepare(
    `SELECT lessonId FROM progress WHERE userId = ? AND courseId = ?`,
  ),
  getAllProgressByUser: sqlite.prepare(`SELECT courseId, lessonId FROM progress WHERE userId = ?`),

  // Learning events
  insertLearningEvent: sqlite.prepare(
    `INSERT INTO learning_events (id, userId, type, courseId, lessonId, meta, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  getLearningEventsByUser: sqlite.prepare(
    `SELECT * FROM learning_events WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
  ),

  // Pipelines
  insertPipeline: sqlite.prepare(
    `INSERT OR REPLACE INTO pipelines (id, courseId, topic, stage, state, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  findPipelineById: sqlite.prepare(`SELECT * FROM pipelines WHERE id = ?`),
  getAllPipelines: sqlite.prepare(`SELECT * FROM pipelines`),
  updatePipeline: sqlite.prepare(`UPDATE pipelines SET stage=?, state=?, updatedAt=? WHERE id=?`),

  // Invoices
  insertInvoice: sqlite.prepare(
    `INSERT INTO invoices (id, userId, amount, status, date) VALUES (?, ?, ?, ?, ?)`,
  ),
  getInvoicesByUser: sqlite.prepare(`SELECT * FROM invoices WHERE userId = ?`),

  // Mindmaps
  upsertMindmap: sqlite.prepare(
    `INSERT OR REPLACE INTO mindmaps (userId, nodes, edges, yjsState, updatedAt) VALUES (?, ?, ?, ?, ?)`,
  ),
  getMindmap: sqlite.prepare(`SELECT * FROM mindmaps WHERE userId = ?`),

  // Marketplace agent activation
  activateAgent: sqlite.prepare(
    `INSERT OR IGNORE INTO marketplace_agents_activated (userId, agentId) VALUES (?, ?)`,
  ),
  getActivatedAgents: sqlite.prepare(
    `SELECT agentId FROM marketplace_agents_activated WHERE userId = ?`,
  ),

  // Illustrations
  insertIllustration: sqlite.prepare(
    `INSERT INTO illustrations (id, lessonId, sectionIndex, prompt, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  getIllustrationsByLesson: sqlite.prepare(
    `SELECT * FROM illustrations WHERE lessonId = ? ORDER BY sectionIndex, createdAt`,
  ),
  deleteIllustration: sqlite.prepare(`DELETE FROM illustrations WHERE id = ?`),

  // Annotations
  insertAnnotation: sqlite.prepare(
    `INSERT INTO annotations (id, lessonId, selectedText, startOffset, endOffset, note, type, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getAnnotationsByLesson: sqlite.prepare(
    `SELECT * FROM annotations WHERE lessonId = ? ORDER BY startOffset`,
  ),
  deleteAnnotation: sqlite.prepare(`DELETE FROM annotations WHERE id = ?`),

  // Notes
  upsertNote: sqlite.prepare(
    `INSERT OR REPLACE INTO notes (id, lessonId, userId, content, illustrations, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  getNoteByLessonUser: sqlite.prepare(`SELECT * FROM notes WHERE lessonId = ? AND userId = ?`),
  deleteNote: sqlite.prepare(`DELETE FROM notes WHERE id = ?`),
};

// ── User Interface ──────────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: 'student' | 'creator' | 'admin';
  tier: 'free' | 'pro';
  goals: string[];
  topics?: string[];
  experience?: string;
  schedule?: any;
  preferredLanguage: string;
  onboardingCompletedAt?: Date;
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

function rowToUser(row: any): DbUser | undefined {
  if (!row) return undefined;
  return {
    ...row,
    goals: JSON.parse(row.goals || '[]'),
    topics: JSON.parse(row.topics || '[]'),
    schedule: JSON.parse(row.schedule || '{}'),
    onboardingCompletedAt: row.onboardingCompletedAt
      ? new Date(row.onboardingCompletedAt)
      : undefined,
    active: undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function rowToApiKey(row: any): DbApiKey {
  return {
    ...row,
    active: !!row.active,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// ── DB wrapper (compatible API) ─────────────────────────────────────────────

class SqliteDb {
  // Keep refreshTokens in-memory for speed (they're ephemeral anyway)
  refreshTokens = {
    get: (token: string): { userId: string; expiresAt: Date } | undefined => {
      const row = stmts.findRefreshToken.get(token) as any;
      if (!row) return undefined;
      return { userId: row.userId, expiresAt: new Date(row.expiresAt) };
    },
    set: (token: string, value: { userId: string; expiresAt: Date }) => {
      stmts.insertRefreshToken.run(token, value.userId, value.expiresAt.toISOString());
    },
    delete: (token: string) => {
      stmts.deleteRefreshToken.run(token);
    },
  };

  findUserByEmail(email: string): DbUser | undefined {
    return rowToUser(stmts.findUserByEmail.get(email));
  }

  findUserById(id: string): DbUser | undefined {
    return rowToUser(stmts.findUserById.get(id));
  }

  findUserByOAuth(provider: string, oauthId: string): DbUser | undefined {
    return rowToUser(stmts.findUserByOAuth.get(provider, oauthId));
  }

  addUser(user: DbUser): void {
    stmts.insertUser.run(
      user.id,
      user.email,
      user.displayName,
      user.passwordHash,
      user.role,
      user.tier,
      JSON.stringify(user.goals || []),
      JSON.stringify(user.topics || []),
      user.experience || '',
      JSON.stringify(user.schedule || {}),
      user.preferredLanguage || 'en',
      user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
      user.oauthProvider || null,
      user.oauthId || null,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString(),
    );
  }

  updateUser(user: DbUser): void {
    stmts.updateUser.run(
      user.email,
      user.displayName,
      user.passwordHash,
      user.role,
      user.tier,
      JSON.stringify(user.goals || []),
      JSON.stringify(user.topics || []),
      user.experience || '',
      JSON.stringify(user.schedule || {}),
      user.preferredLanguage || 'en',
      user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : null,
      user.oauthProvider || null,
      user.oauthId || null,
      user.updatedAt.toISOString(),
      user.id,
    );
  }

  addApiKey(key: DbApiKey): void {
    stmts.insertApiKey.run(
      key.id,
      key.userId,
      key.provider,
      key.encryptedKey,
      key.iv,
      key.label,
      key.lastFour,
      key.active ? 1 : 0,
      key.expiresAt?.toISOString() || null,
      key.createdAt.toISOString(),
      key.updatedAt.toISOString(),
    );
  }

  getKeysByUserId(userId: string): DbApiKey[] {
    return (stmts.getKeysByUserId.all(userId) as any[]).map(rowToApiKey);
  }

  findApiKeyById(id: string): DbApiKey | undefined {
    const row = stmts.findApiKeyById.get(id) as any;
    return row ? rowToApiKey(row) : undefined;
  }

  addTokenUsage(record: TokenUsageRecord): void {
    stmts.insertTokenUsage.run(
      record.userId,
      record.agentId,
      record.tokensUsed,
      record.timestamp.toISOString(),
    );
  }

  getTokenUsageByAgent(userId: string, agentId: string): number {
    const row = stmts.getTokenUsageByAgent.get(userId, agentId) as any;
    return row?.total || 0;
  }

  clear(): void {
    sqlite.exec(
      `DELETE FROM users; DELETE FROM api_keys; DELETE FROM refresh_tokens; DELETE FROM token_usage; DELETE FROM courses; DELETE FROM progress; DELETE FROM pipelines; DELETE FROM invoices; DELETE FROM mindmaps; DELETE FROM marketplace_agents_activated;`,
    );
  }
}

export const db = new SqliteDb();

// ── Course helpers ──────────────────────────────────────────────────────────

export const dbCourses = {
  getAll(): any[] {
    return (stmts.getAllCourses.all() as any[]).map((row) => ({
      ...row,
      modules: JSON.parse(row.modules || '[]'),
      progress: JSON.parse(row.progress || '{}'),
    }));
  },

  getById(id: string): any | undefined {
    const row = stmts.findCourseById.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      modules: JSON.parse(row.modules || '[]'),
      progress: JSON.parse(row.progress || '{}'),
    };
  },

  save(course: any): void {
    stmts.insertCourse.run(
      course.id,
      course.title,
      course.description || '',
      course.topic || '',
      course.depth || 'intermediate',
      course.authorId || 'anonymous',
      JSON.stringify(course.modules || []),
      JSON.stringify(course.progress || {}),
      course.createdAt || new Date().toISOString(),
    );
  },

  delete(id: string): void {
    stmts.deleteCourse.run(id);
  },
};

// ── Progress helpers ────────────────────────────────────────────────────────

export const dbProgress = {
  markComplete(userId: string, courseId: string, lessonId: string): void {
    const now = new Date().toISOString();
    stmts.upsertProgress.run(userId, lessonId, courseId, now);
    // Also record an event (used by analytics).
    try {
      dbEvents.add(userId, { type: 'lesson.completed', courseId, lessonId, meta: {} });
    } catch {
      // best effort
    }
  },

  getCompletedLessons(userId: string, courseId: string): string[] {
    return (stmts.getProgressByUserCourse.all(userId, courseId) as any[]).map((r) => r.lessonId);
  },

  getUserStats(userId: string): {
    totalCoursesEnrolled: number;
    totalLessonsCompleted: number;
    totalStudyMinutes: number;
    currentStreak: number;
  } {
    const rows = stmts.getAllProgressByUser.all(userId) as any[];
    const courseIds = new Set(rows.map((r) => r.courseId));
    const totalLessons = rows.length;
    return {
      totalCoursesEnrolled: courseIds.size,
      totalLessonsCompleted: totalLessons,
      totalStudyMinutes: totalLessons * 5,
      currentStreak: Math.min(totalLessons, 30),
    };
  },
};

// ── Learning events helpers ────────────────────────────────────────────────

export const dbEvents = {
  add(
    userId: string,
    evt: { type: string; courseId?: string; lessonId?: string; meta?: Record<string, unknown> },
  ): void {
    const now = new Date().toISOString();
    stmts.insertLearningEvent.run(
      `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId,
      evt.type,
      evt.courseId || null,
      evt.lessonId || null,
      JSON.stringify(evt.meta || {}),
      now,
    );
  },

  list(userId: string, limit = 200): any[] {
    return stmts.getLearningEventsByUser.all(userId, limit) as any[];
  },
};

// ── Pipeline helpers ────────────────────────────────────────────────────────

export const dbPipelines = {
  save(p: any): void {
    const { id, courseId, topic, stage, ...rest } = p;
    const now = new Date().toISOString();
    stmts.insertPipeline.run(
      id,
      courseId,
      topic,
      stage,
      JSON.stringify(rest),
      p.createdAt || now,
      now,
    );
  },

  getById(id: string): any | undefined {
    const row = stmts.findPipelineById.get(id) as any;
    if (!row) return undefined;
    const state = JSON.parse(row.state || '{}');
    return {
      id: row.id,
      courseId: row.courseId,
      topic: row.topic,
      stage: row.stage,
      ...state,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  getAll(): any[] {
    return (stmts.getAllPipelines.all() as any[]).map((row) => {
      const state = JSON.parse(row.state || '{}');
      return {
        id: row.id,
        courseId: row.courseId,
        topic: row.topic,
        stage: row.stage,
        ...state,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  },

  update(id: string, stage: string, data: any): void {
    stmts.updatePipeline.run(stage, JSON.stringify(data), new Date().toISOString(), id);
  },
};

// ── Invoice helpers ─────────────────────────────────────────────────────────

export const dbInvoices = {
  add(userId: string, invoice: { id: string; amount: number; status: string; date: string }): void {
    stmts.insertInvoice.run(invoice.id, userId, invoice.amount, invoice.status, invoice.date);
  },

  getByUser(userId: string): any[] {
    return stmts.getInvoicesByUser.all(userId) as any[];
  },
};

// ── Mindmap helpers ─────────────────────────────────────────────────────────

export const dbMindmaps = {
  get(userId: string): {
    userId: string;
    nodes: unknown[];
    edges: unknown[];
    yjsState?: string | null;
    updatedAt?: string | null;
  } {
    const row = stmts.getMindmap.get(userId) as any;
    if (!row) return { userId, nodes: [], edges: [], yjsState: null, updatedAt: null };
    return {
      userId,
      nodes: JSON.parse(row.nodes || '[]'),
      edges: JSON.parse(row.edges || '[]'),
      yjsState: row.yjsState ?? null,
      updatedAt: row.updatedAt ?? null,
    };
  },

  save(userId: string, nodes: unknown[], edges: unknown[]): void {
    stmts.upsertMindmap.run(
      userId,
      JSON.stringify(nodes),
      JSON.stringify(edges),
      null,
      new Date().toISOString(),
    );
  },

  upsert(
    userId: string,
    payload: { nodes: string; edges: string; yjsState: string | null; updatedAt: string },
  ): void {
    stmts.upsertMindmap.run(
      userId,
      payload.nodes,
      payload.edges,
      payload.yjsState,
      payload.updatedAt,
    );
  },
};

// ── Marketplace agent activation ────────────────────────────────────────────

export const dbMarketplace = {
  activateAgent(userId: string, agentId: string): void {
    stmts.activateAgent.run(userId, agentId);
  },

  getActivatedAgents(userId: string): string[] {
    return (stmts.getActivatedAgents.all(userId) as any[]).map((r) => r.agentId);
  },
};

// ── Notes helpers ───────────────────────────────────────────────────────────

export const dbNotes = {
  get(lessonId: string, userId: string = 'anonymous'): any | null {
    const row = stmts.getNoteByLessonUser.get(lessonId, userId) as any;
    if (!row) return null;
    return {
      id: row.id,
      lessonId: row.lessonId,
      userId: row.userId,
      content: JSON.parse(row.content || '{}'),
      illustrations: JSON.parse(row.illustrations || '[]'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  save(lessonId: string, userId: string, content: any, illustrations: any[] = []): any {
    const existing = stmts.getNoteByLessonUser.get(lessonId, userId) as any;
    const now = new Date().toISOString();
    const id = existing?.id || `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = existing?.createdAt || now;
    stmts.upsertNote.run(
      id,
      lessonId,
      userId,
      JSON.stringify(content),
      JSON.stringify(illustrations),
      createdAt,
      now,
    );
    return { id, lessonId, userId, content, illustrations, createdAt, updatedAt: now };
  },

  delete(id: string): void {
    stmts.deleteNote.run(id);
  },
};

// ── Illustration helpers ────────────────────────────────────────────────────

export const dbIllustrations = {
  getByLesson(lessonId: string): any[] {
    return stmts.getIllustrationsByLesson.all(lessonId) as any[];
  },
  create(lessonId: string, sectionIndex: number, prompt: string, imageUrl: string): any {
    const id = `ill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    stmts.insertIllustration.run(id, lessonId, sectionIndex, prompt, imageUrl, createdAt);
    return { id, lessonId, sectionIndex, prompt, imageUrl, createdAt };
  },
  delete(id: string): void {
    stmts.deleteIllustration.run(id);
  },
};

// ── Annotation helpers ──────────────────────────────────────────────────────

export const dbAnnotations = {
  getByLesson(lessonId: string): any[] {
    return stmts.getAnnotationsByLesson.all(lessonId) as any[];
  },
  create(
    lessonId: string,
    selectedText: string,
    startOffset: number,
    endOffset: number,
    note: string,
    type: string,
  ): any {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    stmts.insertAnnotation.run(
      id,
      lessonId,
      selectedText,
      startOffset,
      endOffset,
      note,
      type,
      createdAt,
    );
    return { id, lessonId, selectedText, startOffset, endOffset, note, type, createdAt };
  },
  delete(id: string): void {
    stmts.deleteAnnotation.run(id);
  },
};

export { sqlite };
