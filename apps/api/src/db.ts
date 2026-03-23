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

    // Iter70: lesson_sources gained missingReason
    try {
      if (!hasColumn('lesson_sources', 'missingReason')) {
        sqlite.exec(
          `ALTER TABLE lesson_sources ADD COLUMN missingReason TEXT NOT NULL DEFAULT '';`,
        );
      }
    } catch {
      // If lesson_sources doesn't exist yet, CREATE TABLE below will handle it.
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

  -- Iter67: structured sources persistence per lesson
  CREATE TABLE IF NOT EXISTS lesson_sources (
    lessonId TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    sources TEXT NOT NULL DEFAULT '[]',
    missingReason TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lesson_sources_course ON lesson_sources(courseId);

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

  CREATE TABLE IF NOT EXISTS mindmap_suggestions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    suggestions TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_mindmap_suggestions_user_course ON mindmap_suggestions(userId, courseId);

  CREATE TABLE IF NOT EXISTS marketplace_agents_activated (
    userId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    PRIMARY KEY (userId, agentId)
  );



  -- Iter69: marketplace persistence (courses, enrollments, payouts, payment intents, agent submissions)
  CREATE TABLE IF NOT EXISTS marketplace_courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    creatorId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    lessonCount INTEGER NOT NULL DEFAULT 0,
    attributionCount INTEGER NOT NULL DEFAULT 0,
    readabilityScore REAL NOT NULL DEFAULT 0.7,
    rating REAL NOT NULL DEFAULT 0,
    enrollmentCount INTEGER NOT NULL DEFAULT 0,
    revenue REAL NOT NULL DEFAULT 0,
    publishedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_courses_status ON marketplace_courses(status);
  CREATE INDEX IF NOT EXISTS idx_marketplace_courses_topic ON marketplace_courses(topic);

  CREATE TABLE IF NOT EXISTS marketplace_enrollments (
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    PRIMARY KEY (userId, courseId)
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_enrollments_course ON marketplace_enrollments(courseId);

  CREATE TABLE IF NOT EXISTS marketplace_payment_intents (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_payment_intents_user ON marketplace_payment_intents(userId);

  CREATE TABLE IF NOT EXISTS marketplace_payouts (
    id TEXT PRIMARY KEY,
    creatorId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    amount REAL NOT NULL,
    creatorShare REAL NOT NULL,
    platformShare REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_payouts_creator ON marketplace_payouts(creatorId);

  CREATE TABLE IF NOT EXISTS marketplace_agent_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    manifest TEXT NOT NULL DEFAULT '{}',
    creatorId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    submittedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_agent_submissions_status ON marketplace_agent_submissions(status);

  -- Iter70: marketplace reviews/ratings
  CREATE TABLE IF NOT EXISTS marketplace_course_reviews (
    id TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    userId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_course ON marketplace_course_reviews(courseId);
  CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_user ON marketplace_course_reviews(userId);

  -- Collaboration (Iter70): lightweight groups + messages
  CREATE TABLE IF NOT EXISTS collaboration_groups (

    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT '',
    ownerId TEXT NOT NULL,
    memberIds TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_collaboration_groups_owner ON collaboration_groups(ownerId);

  CREATE TABLE IF NOT EXISTS collaboration_group_messages (
    id TEXT PRIMARY KEY,
    groupId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_collab_messages_group_created ON collaboration_group_messages(groupId, createdAt);

  -- Pro Update Agent notifications (Iter70): durable notification feed
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'update',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    readAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(userId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, readAt);

  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    tokensUsed INTEGER NOT NULL,
    timestamp TEXT NOT NULL
  );

  -- Iter67: richer usage tracking (per-agent + per-provider; in/out split)
  CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    agentName TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'unknown',
    tokensIn INTEGER NOT NULL DEFAULT 0,
    tokensOut INTEGER NOT NULL DEFAULT 0,
    tokensTotal INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_usage_records_user_created ON usage_records(userId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_usage_records_user_agent ON usage_records(userId, agentName);
  CREATE INDEX IF NOT EXISTS idx_usage_records_user_provider ON usage_records(userId, provider);

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

  -- Iter68: global admin-configurable web search settings used during course creation
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// ── Prepared Statements ─────────────────────────────────────────────────────

const stmts = {
  // App settings (global)
  getAppSetting: sqlite.prepare(`SELECT value FROM app_settings WHERE key = ?`),
  upsertAppSetting: sqlite.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)`,
  ),

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
  countUsers: sqlite.prepare(`SELECT COUNT(*) as n FROM users`),

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

  // Usage records (Iter67)
  insertUsageRecord: sqlite.prepare(
    `INSERT INTO usage_records (userId, agentName, provider, tokensIn, tokensOut, tokensTotal, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  getUsageTotalSince: sqlite.prepare(
    `SELECT COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ?`,
  ),
  getUsageByDaySince: sqlite.prepare(
    `SELECT substr(createdAt, 1, 10) as day, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? GROUP BY day ORDER BY day ASC`,
  ),
  getTopAgentsSince: sqlite.prepare(
    `SELECT agentName, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? GROUP BY agentName ORDER BY total DESC LIMIT ?`,
  ),
  getTopProvidersSince: sqlite.prepare(
    `SELECT provider, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? GROUP BY provider ORDER BY total DESC LIMIT ?`,
  ),
  getUsageByProviderSince: sqlite.prepare(
    `SELECT provider, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? GROUP BY provider`,
  ),

  // Usage meta (counts + last used)
  getUsageCountByProviderSince: sqlite.prepare(
    `SELECT provider, COUNT(*) as count FROM usage_records WHERE userId = ? AND createdAt >= ? GROUP BY provider`,
  ),
  getLastUsedByProvider: sqlite.prepare(
    `SELECT provider, MAX(createdAt) as lastUsed FROM usage_records WHERE userId = ? GROUP BY provider`,
  ),

  // Collaboration
  insertCollaborationGroup: sqlite.prepare(
    `INSERT OR REPLACE INTO collaboration_groups (id, name, topic, ownerId, memberIds, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  listCollaborationGroupsByMemberLike: sqlite.prepare(
    `SELECT * FROM collaboration_groups WHERE memberIds LIKE ? ORDER BY createdAt DESC`,
  ),
  getCollaborationGroupById: sqlite.prepare(`SELECT * FROM collaboration_groups WHERE id = ?`),
  insertCollaborationGroupMessage: sqlite.prepare(
    `INSERT INTO collaboration_group_messages (id, groupId, userId, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
  ),
  listCollaborationGroupMessages: sqlite.prepare(
    `SELECT * FROM collaboration_group_messages WHERE groupId = ? ORDER BY createdAt ASC`,
  ),

  // Notifications (Update Agent)
  insertNotification: sqlite.prepare(
    `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, createdAt, readAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  listNotificationsByUser: sqlite.prepare(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
  ),
  markNotificationRead: sqlite.prepare(
    `UPDATE notifications SET readAt = ? WHERE id = ? AND userId = ?`,
  ),

  // Lesson sources
  upsertLessonSource: sqlite.prepare(
    `INSERT OR REPLACE INTO lesson_sources (lessonId, courseId, sources, missingReason, updatedAt) VALUES (?, ?, ?, ?, ?)`,
  ),
  getLessonSources: sqlite.prepare(
    `SELECT sources, missingReason FROM lesson_sources WHERE lessonId = ?`,
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

  // Mindmap suggestions
  upsertMindmapSuggestions: sqlite.prepare(
    `INSERT OR REPLACE INTO mindmap_suggestions (id, userId, courseId, suggestions, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  getMindmapSuggestionsByCourse: sqlite.prepare(
    `SELECT * FROM mindmap_suggestions WHERE userId = ? AND courseId = ?`,
  ),

  // Marketplace agent activation
  activateAgent: sqlite.prepare(
    `INSERT OR IGNORE INTO marketplace_agents_activated (userId, agentId) VALUES (?, ?)`,
  ),
  getActivatedAgents: sqlite.prepare(
    `SELECT agentId FROM marketplace_agents_activated WHERE userId = ?`,
  ),

  // Marketplace courses + enrollments + payouts
  insertMarketplaceCourse: sqlite.prepare(
    `INSERT OR REPLACE INTO marketplace_courses (id, title, topic, description, difficulty, price, creatorId, status, lessonCount, attributionCount, readabilityScore, rating, enrollmentCount, revenue, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getMarketplaceCourseById: sqlite.prepare(`SELECT * FROM marketplace_courses WHERE id = ?`),
  getMarketplaceCoursesByCreator: sqlite.prepare(
    `SELECT * FROM marketplace_courses WHERE creatorId = ? ORDER BY createdAt DESC`,
  ),
  listMarketplacePublishedCourses: sqlite.prepare(
    `SELECT * FROM marketplace_courses WHERE status = 'published' ORDER BY publishedAt DESC`,
  ),
  insertMarketplaceEnrollment: sqlite.prepare(
    `INSERT OR IGNORE INTO marketplace_enrollments (userId, courseId, createdAt) VALUES (?, ?, ?)`,
  ),
  hasMarketplaceEnrollment: sqlite.prepare(
    `SELECT 1 FROM marketplace_enrollments WHERE userId = ? AND courseId = ? LIMIT 1`,
  ),
  countMarketplaceEnrollmentsByCourse: sqlite.prepare(
    `SELECT COUNT(1) as c FROM marketplace_enrollments WHERE courseId = ?`,
  ),
  insertMarketplacePaymentIntent: sqlite.prepare(
    `INSERT OR REPLACE INTO marketplace_payment_intents (id, userId, courseId, amount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  insertMarketplacePayout: sqlite.prepare(
    `INSERT OR REPLACE INTO marketplace_payouts (id, creatorId, courseId, amount, creatorShare, platformShare, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getMarketplacePayoutsByCreator: sqlite.prepare(
    `SELECT * FROM marketplace_payouts WHERE creatorId = ? ORDER BY createdAt DESC`,
  ),
  insertMarketplaceAgentSubmission: sqlite.prepare(
    `INSERT OR REPLACE INTO marketplace_agent_submissions (id, name, description, manifest, creatorId, status, submittedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  getApprovedMarketplaceAgentSubmissions: sqlite.prepare(
    `SELECT * FROM marketplace_agent_submissions WHERE status = 'approved' ORDER BY submittedAt DESC`,
  ),

  // Marketplace reviews (Iter70)
  insertMarketplaceCourseReview: sqlite.prepare(
    `INSERT INTO marketplace_course_reviews (id, courseId, userId, rating, text, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  listMarketplaceCourseReviews: sqlite.prepare(
    `SELECT * FROM marketplace_course_reviews WHERE courseId = ? ORDER BY createdAt DESC LIMIT ?`,
  ),
  getMarketplaceCourseReviewAgg: sqlite.prepare(
    `SELECT COUNT(1) as count, COALESCE(AVG(rating), 0) as avgRating FROM marketplace_course_reviews WHERE courseId = ?`,
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

export interface UsageRecord {
  userId: string;
  agentName: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  createdAt: Date;
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

  countUsers(): number {
    const row = stmts.countUsers.get() as any;
    return Number(row?.n || 0);
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

  deleteApiKey(id: string): void {
    stmts.deleteApiKey.run(id);
  }

  addTokenUsage(record: TokenUsageRecord): void {
    stmts.insertTokenUsage.run(
      record.userId,
      record.agentId,
      record.tokensUsed,
      record.timestamp.toISOString(),
    );
  }

  addUsageRecord(record: UsageRecord): void {
    stmts.insertUsageRecord.run(
      record.userId,
      record.agentName,
      record.provider || 'unknown',
      Math.max(0, Math.round(record.tokensIn || 0)),
      Math.max(0, Math.round(record.tokensOut || 0)),
      Math.max(0, Math.round(record.tokensTotal || 0)),
      record.createdAt.toISOString(),
    );
  }

  getUsageTotalSince(userId: string, since: Date): number {
    const row = stmts.getUsageTotalSince.get(userId, since.toISOString()) as any;
    return row?.total || 0;
  }

  getUsageByDaySince(userId: string, since: Date): Array<{ day: string; total: number }> {
    return (stmts.getUsageByDaySince.all(userId, since.toISOString()) as any[]).map((r) => ({
      day: String(r.day),
      total: Number(r.total || 0),
    }));
  }

  getTopAgentsSince(
    userId: string,
    since: Date,
    limit = 5,
  ): Array<{ agentName: string; total: number }> {
    return (stmts.getTopAgentsSince.all(userId, since.toISOString(), limit) as any[]).map((r) => ({
      agentName: String(r.agentName),
      total: Number(r.total || 0),
    }));
  }

  getTopProvidersSince(
    userId: string,
    since: Date,
    limit = 5,
  ): Array<{ provider: string; total: number }> {
    return (stmts.getTopProvidersSince.all(userId, since.toISOString(), limit) as any[]).map(
      (r) => ({
        provider: String(r.provider),
        total: Number(r.total || 0),
      }),
    );
  }

  getUsageByProviderSince(userId: string, since: Date): Array<{ provider: string; total: number }> {
    return (stmts.getUsageByProviderSince.all(userId, since.toISOString()) as any[]).map((r) => ({
      provider: String(r.provider),
      total: Number(r.total || 0),
    }));
  }

  getUsageCountByProviderSince(
    userId: string,
    since: Date,
  ): Array<{ provider: string; count: number }> {
    return (stmts.getUsageCountByProviderSince.all(userId, since.toISOString()) as any[]).map(
      (r) => ({
        provider: String(r.provider),
        count: Number(r.count || 0),
      }),
    );
  }

  getLastUsedByProvider(userId: string): Array<{ provider: string; lastUsed?: Date }> {
    return (stmts.getLastUsedByProvider.all(userId) as any[]).map((r) => ({
      provider: String(r.provider),
      lastUsed: r.lastUsed ? new Date(String(r.lastUsed)) : undefined,
    }));
  }

  // Test helper: read persisted lesson sources (Iter67)
  __getLessonSources(lessonId: string): any {
    return dbLessonSources.get(lessonId);
  }

  getTokenUsageByAgent(userId: string, agentId: string): number {
    const row = stmts.getTokenUsageByAgent.get(userId, agentId) as any;
    return row?.total || 0;
  }

  // Notifications (Update Agent)
  addNotification(row: {
    id: string;
    userId: string;
    type?: string;
    title: string;
    body?: string;
    createdAt: Date;
    readAt?: Date | null;
  }): void {
    stmts.insertNotification.run(
      row.id,
      row.userId,
      row.type || 'update',
      row.title,
      row.body || '',
      row.createdAt.toISOString(),
      row.readAt ? row.readAt.toISOString() : null,
    );
  }

  listNotifications(userId: string, limit = 50): Array<any> {
    return (stmts.listNotificationsByUser.all(userId, limit) as any[]).map((r) => ({
      id: String(r.id),
      userId: String(r.userId),
      type: String(r.type || 'update'),
      title: String(r.title || ''),
      body: String(r.body || ''),
      createdAt: String(r.createdAt || ''),
      readAt: r.readAt ? String(r.readAt) : null,
    }));
  }

  markNotificationRead(userId: string, id: string): void {
    stmts.markNotificationRead.run(new Date().toISOString(), id, userId);
  }

  clear(): void {
    sqlite.exec(
      `DELETE FROM users; DELETE FROM api_keys; DELETE FROM refresh_tokens; DELETE FROM token_usage; DELETE FROM usage_records; DELETE FROM courses; DELETE FROM lessons; DELETE FROM lesson_sources; DELETE FROM progress; DELETE FROM pipelines; DELETE FROM invoices; DELETE FROM mindmaps; DELETE FROM mindmap_suggestions; DELETE FROM marketplace_agents_activated; DELETE FROM marketplace_courses; DELETE FROM marketplace_enrollments; DELETE FROM marketplace_payment_intents; DELETE FROM marketplace_payouts; DELETE FROM marketplace_agent_submissions; DELETE FROM marketplace_course_reviews; DELETE FROM collaboration_groups; DELETE FROM collaboration_group_messages; DELETE FROM notifications;`,
    );
  }
}

export const db = new SqliteDb();

// ── Course helpers ──────────────────────────────────────────────────────────

export const dbLessonSources = {
  save(lessonId: string, courseId: string, sources: any[], missingReason: string = ''): void {
    stmts.upsertLessonSource.run(
      lessonId,
      courseId,
      JSON.stringify(sources || []),
      missingReason || '',
      new Date().toISOString(),
    );
  },

  get(lessonId: string): { sources: any[]; missingReason?: string } {
    const row = stmts.getLessonSources.get(lessonId) as any;
    if (!row) return { sources: [] };
    try {
      return {
        sources: JSON.parse(row.sources || '[]'),
        missingReason: row.missingReason ? String(row.missingReason) : '',
      };
    } catch {
      return { sources: [] };
    }
  },
};

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

export const dbMindmapSuggestions = {
  get(
    userId: string,
    courseId: string,
  ): { userId: string; courseId: string; suggestions: any[]; updatedAt: string } | null {
    const row = stmts.getMindmapSuggestionsByCourse.get(userId, courseId) as any;
    if (!row) return null;
    return {
      userId: row.userId,
      courseId: row.courseId,
      suggestions: JSON.parse(row.suggestions || '[]'),
      updatedAt: row.updatedAt,
    };
  },

  save(
    userId: string,
    courseId: string,
    suggestions: any[],
  ): {
    userId: string;
    courseId: string;
    suggestions: any[];
  } {
    const now = new Date().toISOString();
    const id = `ms-${userId}-${courseId}`;
    stmts.upsertMindmapSuggestions.run(
      id,
      userId,
      courseId,
      JSON.stringify(suggestions || []),
      now,
      now,
    );
    return { userId, courseId, suggestions: suggestions || [] };
  },
};

// ── Marketplace agent activation ────────────────────────────────────────────

export type MarketplaceCourseRow = {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  creatorId: string;
  status: string;
  lessonCount: number;
  attributionCount: number;
  readabilityScore: number;
  rating: number;
  enrollmentCount: number;
  revenue: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const dbMarketplaceCourses = {
  upsert(course: MarketplaceCourseRow): MarketplaceCourseRow {
    const now = new Date().toISOString();
    const createdAt = course.createdAt || now;
    const updatedAt = course.updatedAt || now;
    stmts.insertMarketplaceCourse.run(
      course.id,
      course.title,
      course.topic,
      course.description,
      course.difficulty,
      course.price,
      course.creatorId,
      course.status,
      course.lessonCount,
      course.attributionCount,
      course.readabilityScore,
      course.rating,
      course.enrollmentCount,
      course.revenue,
      course.publishedAt,
      createdAt,
      updatedAt,
    );
    return { ...course, createdAt, updatedAt };
  },

  getById(id: string): MarketplaceCourseRow | null {
    const row = stmts.getMarketplaceCourseById.get(id) as any;
    return row || null;
  },

  listPublished(): MarketplaceCourseRow[] {
    return stmts.listMarketplacePublishedCourses.all() as any[];
  },

  listByCreator(creatorId: string): MarketplaceCourseRow[] {
    return stmts.getMarketplaceCoursesByCreator.all(creatorId) as any[];
  },
};

export const dbMarketplaceEnrollments = {
  enroll(userId: string, courseId: string): void {
    const now = new Date().toISOString();
    stmts.insertMarketplaceEnrollment.run(userId, courseId, now);
  },
  has(userId: string, courseId: string): boolean {
    const row = stmts.hasMarketplaceEnrollment.get(userId, courseId) as any;
    return !!row;
  },
  countByCourse(courseId: string): number {
    const row = stmts.countMarketplaceEnrollmentsByCourse.get(courseId) as any;
    return Number(row?.c || 0);
  },
};

export const dbMarketplacePayouts = {
  insert(payout: {
    id: string;
    creatorId: string;
    courseId: string;
    amount: number;
    creatorShare: number;
    platformShare: number;
    status: string;
    createdAt: string;
  }): void {
    stmts.insertMarketplacePayout.run(
      payout.id,
      payout.creatorId,
      payout.courseId,
      payout.amount,
      payout.creatorShare,
      payout.platformShare,
      payout.status,
      payout.createdAt,
    );
  },
  listByCreator(creatorId: string): any[] {
    return stmts.getMarketplacePayoutsByCreator.all(creatorId) as any[];
  },
};

export const dbMarketplacePayments = {
  insertIntent(intent: {
    id: string;
    userId: string;
    courseId: string;
    amount: number;
    status: string;
    createdAt: string;
  }): void {
    stmts.insertMarketplacePaymentIntent.run(
      intent.id,
      intent.userId,
      intent.courseId,
      intent.amount,
      intent.status,
      intent.createdAt,
    );
  },

  updateStatus(id: string, status: string): void {
    // keep this in the prepared-statement style used elsewhere
    sqlite
      .prepare(`UPDATE marketplace_payment_intents SET status = ? WHERE id = ?`)
      .run(status, id);
  },
};

export const dbMarketplaceAgentSubmissions = {
  upsert(submission: {
    id: string;
    name: string;
    description: string;
    manifest: any;
    creatorId: string;
    status: string;
    submittedAt: string;
  }): void {
    stmts.insertMarketplaceAgentSubmission.run(
      submission.id,
      submission.name,
      submission.description,
      JSON.stringify(submission.manifest || {}),
      submission.creatorId,
      submission.status,
      submission.submittedAt,
    );
  },
  listApproved(): Array<{
    id: string;
    name: string;
    description: string;
    manifest: any;
    creatorId: string;
    status: string;
    submittedAt: string;
  }> {
    const rows = stmts.getApprovedMarketplaceAgentSubmissions.all() as any[];
    return rows.map((r) => ({ ...r, manifest: JSON.parse(r.manifest || '{}') }));
  },
};

export const dbMarketplace = {
  activateAgent(userId: string, agentId: string): void {
    stmts.activateAgent.run(userId, agentId);
  },

  getActivatedAgents(userId: string): string[] {
    return (stmts.getActivatedAgents.all(userId) as any[]).map((r) => r.agentId);
  },

  // Reviews
  addCourseReview(input: {
    id: string;
    courseId: string;
    userId: string;
    rating: number;
    text: string;
    createdAt: string;
  }): void {
    stmts.insertMarketplaceCourseReview.run(
      input.id,
      input.courseId,
      input.userId,
      input.rating,
      input.text,
      input.createdAt,
    );
  },

  listCourseReviews(
    courseId: string,
    limit: number = 20,
  ): Array<{
    id: string;
    courseId: string;
    userId: string;
    rating: number;
    text: string;
    createdAt: string;
  }> {
    return stmts.listMarketplaceCourseReviews.all(
      courseId,
      Math.max(1, Math.min(100, limit)),
    ) as any[];
  },

  getCourseReviewAgg(courseId: string): { count: number; avgRating: number } {
    const row = stmts.getMarketplaceCourseReviewAgg.get(courseId) as any;
    return { count: Number(row?.count || 0), avgRating: Number(row?.avgRating || 0) };
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
  create(
    lessonId: string,
    sectionIndex: number,
    prompt: string,
    imageUrl: string,
    status?: 'ok' | 'openai_unavailable',
  ): any {
    const id = `ill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    stmts.insertIllustration.run(id, lessonId, sectionIndex, prompt, imageUrl, createdAt);
    return { id, lessonId, sectionIndex, prompt, imageUrl, status: status || 'ok', createdAt };
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

export const dbCollaboration = {
  listGroupsForUser(userId: string): any[] {
    // store memberIds as JSON string; LIKE is fine for MVP (non-perf critical).
    return stmts.listCollaborationGroupsByMemberLike.all(`%"${userId}"%`) as any[];
  },

  createGroup(input: {
    id: string;
    name: string;
    topic: string;
    ownerId: string;
    memberIds: string[];
    createdAt: string;
  }): void {
    stmts.insertCollaborationGroup.run(
      input.id,
      input.name,
      input.topic,
      input.ownerId,
      JSON.stringify(input.memberIds || []),
      input.createdAt,
    );
  },

  getGroupById(id: string): any | undefined {
    return stmts.getCollaborationGroupById.get(id) as any;
  },

  addMessage(input: {
    id: string;
    groupId: string;
    userId: string;
    content: string;
    createdAt: string;
  }): void {
    stmts.insertCollaborationGroupMessage.run(
      input.id,
      input.groupId,
      input.userId,
      input.content,
      input.createdAt,
    );
  },

  listMessages(groupId: string): any[] {
    return stmts.listCollaborationGroupMessages.all(groupId) as any[];
  },
};

export { sqlite };
