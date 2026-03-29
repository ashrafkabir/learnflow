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
    // Iter84: DB hygiene origin flags
    try {
      if (!hasColumn('courses', 'origin')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN origin TEXT NOT NULL DEFAULT 'user';`);
      }
      // Iter137 P1.9: Link user-owned course instances back to the marketplace course they were enrolled from.
      if (!hasColumn('courses', 'marketplaceCourseId')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN marketplaceCourseId TEXT;`);
      }
    } catch {
      // If courses doesn't exist yet, CREATE TABLE below will handle it.
    }

    try {
      if (!hasColumn('notifications', 'origin')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN origin TEXT NOT NULL DEFAULT 'user';`);
      }
    } catch {
      // If notifications doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter86: usage_records origin tagging
    try {
      if (!hasColumn('usage_records', 'origin')) {
        sqlite.exec(`ALTER TABLE usage_records ADD COLUMN origin TEXT NOT NULL DEFAULT 'user';`);
      }
    } catch {
      // If usage_records doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter86: learning_events origin tagging
    try {
      if (!hasColumn('learning_events', 'origin')) {
        sqlite.exec(`ALTER TABLE learning_events ADD COLUMN origin TEXT NOT NULL DEFAULT 'user';`);
      }
    } catch {
      // If learning_events doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter86: token_usage origin tagging
    try {
      if (!hasColumn('token_usage', 'origin')) {
        sqlite.exec(`ALTER TABLE token_usage ADD COLUMN origin TEXT NOT NULL DEFAULT 'user';`);
      }
    } catch {
      // If token_usage doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter84: Update Agent topics/sources enable + ordering + backoff
    try {
      if (!hasColumn('update_agent_topics', 'enabled')) {
        sqlite.exec(
          `ALTER TABLE update_agent_topics ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;`,
        );
      }
      if (!hasColumn('update_agent_topics', 'updatedAt')) {
        sqlite.exec(`ALTER TABLE update_agent_topics ADD COLUMN updatedAt TEXT;`);
      }
    } catch {
      // If update_agent_topics doesn't exist yet, CREATE TABLE below will handle it.
    }

    try {
      if (!hasColumn('update_agent_sources', 'enabled')) {
        sqlite.exec(
          `ALTER TABLE update_agent_sources ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1;`,
        );
      }
      if (!hasColumn('update_agent_sources', 'position')) {
        sqlite.exec(
          `ALTER TABLE update_agent_sources ADD COLUMN position INTEGER NOT NULL DEFAULT 0;`,
        );
      }
      if (!hasColumn('update_agent_sources', 'sourceType')) {
        sqlite.exec(
          `ALTER TABLE update_agent_sources ADD COLUMN sourceType TEXT NOT NULL DEFAULT 'rss';`,
        );
      }
      if (!hasColumn('update_agent_sources', 'nextEligibleAt')) {
        sqlite.exec(`ALTER TABLE update_agent_sources ADD COLUMN nextEligibleAt TEXT;`);
      }
      if (!hasColumn('update_agent_sources', 'failureCount')) {
        sqlite.exec(
          `ALTER TABLE update_agent_sources ADD COLUMN failureCount INTEGER NOT NULL DEFAULT 0;`,
        );
      }
    } catch {
      // If update_agent_sources doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter96: Update Agent global lock + run history
    try {
      // best-effort: if missing tables, CREATE TABLE below will handle it.
      sqlite.exec(
        `CREATE TABLE IF NOT EXISTS update_agent_global_runs (userId TEXT PRIMARY KEY, lockId TEXT NOT NULL DEFAULT '', lockedAt TEXT, createdAt TEXT NOT NULL, updatedAt TEXT);`,
      );
      sqlite.exec(
        `CREATE TABLE IF NOT EXISTS update_agent_runs (id TEXT PRIMARY KEY, userId TEXT NOT NULL, startedAt TEXT NOT NULL, finishedAt TEXT, status TEXT NOT NULL, topicsChecked INTEGER NOT NULL DEFAULT 0, sourcesChecked INTEGER NOT NULL DEFAULT 0, notificationsCreated INTEGER NOT NULL DEFAULT 0, failuresJson TEXT NOT NULL DEFAULT '[]');`,
      );
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_update_agent_runs_user_started ON update_agent_runs(userId, startedAt DESC);`,
      );
    } catch {
      // ignore
    }

    try {
      if (!hasColumn('notifications', 'topic')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN topic TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('notifications', 'sourceUrl')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN sourceUrl TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('notifications', 'sourceDomain')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN sourceDomain TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('notifications', 'checkedAt')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN checkedAt TEXT;`);
      }
      if (!hasColumn('notifications', 'explanation')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN explanation TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('notifications', 'url')) {
        sqlite.exec(`ALTER TABLE notifications ADD COLUMN url TEXT NOT NULL DEFAULT '';`);
      }
      // Index for dedupe (best-effort)
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_notifications_user_url ON notifications(userId, url);`,
      );
    } catch {
      // If notifications doesn't exist yet, CREATE TABLE below will handle it.
    }

    if (!hasColumn('users', 'onboardingCompletedAt')) {
      sqlite.exec(`ALTER TABLE users ADD COLUMN onboardingCompletedAt TEXT;`);
    }

    // Iter101: user consent for server-side learning event telemetry
    if (!hasColumn('users', 'telemetryEnabled')) {
      sqlite.exec(`ALTER TABLE users ADD COLUMN telemetryEnabled INTEGER NOT NULL DEFAULT 1;`);
    }

    // Iter123: server-backed bookmarks table (legacy DBs)
    try {
      sqlite.exec(
        `CREATE TABLE IF NOT EXISTS bookmarks (userId TEXT NOT NULL, courseId TEXT NOT NULL, lessonId TEXT NOT NULL, createdAt TEXT NOT NULL, PRIMARY KEY (userId, lessonId));`,
      );
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(userId, createdAt DESC);`,
      );
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_bookmarks_user_course ON bookmarks(userId, courseId);`,
      );
    } catch {
      // ignore
    }

    if (!hasColumn('mindmaps', 'yjsState')) {
      sqlite.exec(`ALTER TABLE mindmaps ADD COLUMN yjsState TEXT;`);
    }

    if (!hasColumn('mindmaps', 'updatedAt')) {
      sqlite.exec(`ALTER TABLE mindmaps ADD COLUMN updatedAt TEXT;`);
    }

    // Iter70: lesson_sources gained missingReason

    // Iter135: add new tables for takeaways + images manifests (legacy DBs)
    try {
      sqlite.exec(
        `CREATE TABLE IF NOT EXISTS lesson_takeaways (lessonId TEXT PRIMARY KEY, courseId TEXT NOT NULL, takeaways TEXT NOT NULL DEFAULT '[]', provider TEXT NOT NULL DEFAULT 'unknown', model TEXT NOT NULL DEFAULT 'unknown', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`,
      );
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_lesson_takeaways_course ON lesson_takeaways(courseId);`,
      );
      sqlite.exec(
        `CREATE TABLE IF NOT EXISTS lesson_images (lessonId TEXT PRIMARY KEY, courseId TEXT NOT NULL, images TEXT NOT NULL DEFAULT '[]', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`,
      );
      sqlite.exec(
        `CREATE INDEX IF NOT EXISTS idx_lesson_images_course ON lesson_images(courseId);`,
      );
    } catch {
      // ignore
    }

    // Iter85: api_keys gained validationStatus + validatedAt
    // Iter97: api_keys gained tag + encVersion (AEAD)
    try {
      if (!hasColumn('api_keys', 'validationStatus')) {
        sqlite.exec(
          `ALTER TABLE api_keys ADD COLUMN validationStatus TEXT NOT NULL DEFAULT 'unknown';`,
        );
      }
      if (!hasColumn('api_keys', 'validatedAt')) {
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN validatedAt TEXT;`);
      }
      if (!hasColumn('api_keys', 'tag')) {
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN tag TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('api_keys', 'encVersion')) {
        sqlite.exec(`ALTER TABLE api_keys ADD COLUMN encVersion TEXT NOT NULL DEFAULT 'v1_cbc';`);
      }
    } catch {
      // If api_keys doesn't exist yet, CREATE TABLE below will handle it.
    }

    try {
      if (!hasColumn('lesson_sources', 'missingReason')) {
        sqlite.exec(
          `ALTER TABLE lesson_sources ADD COLUMN missingReason TEXT NOT NULL DEFAULT '';`,
        );
      }
    } catch {
      // If lesson_sources doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter72: illustrations gained attribution metadata
    try {
      if (!hasColumn('illustrations', 'provider')) {
        sqlite.exec(
          `ALTER TABLE illustrations ADD COLUMN provider TEXT NOT NULL DEFAULT 'unknown';`,
        );
      }
      if (!hasColumn('illustrations', 'model')) {
        sqlite.exec(`ALTER TABLE illustrations ADD COLUMN model TEXT NOT NULL DEFAULT 'unknown';`);
      }
      if (!hasColumn('illustrations', 'license')) {
        sqlite.exec(
          `ALTER TABLE illustrations ADD COLUMN license TEXT NOT NULL DEFAULT 'unknown';`,
        );
      }
      if (!hasColumn('illustrations', 'attributionText')) {
        sqlite.exec(
          `ALTER TABLE illustrations ADD COLUMN attributionText TEXT NOT NULL DEFAULT '';`,
        );
      }
      if (!hasColumn('illustrations', 'sourcePageUrl')) {
        sqlite.exec(`ALTER TABLE illustrations ADD COLUMN sourcePageUrl TEXT NOT NULL DEFAULT '';`);
      }

      // Iter73: illustrations gained imageReason for placement/relevance decisions.
      if (!hasColumn('illustrations', 'imageReason')) {
        sqlite.exec(`ALTER TABLE illustrations ADD COLUMN imageReason TEXT NOT NULL DEFAULT '';`);
      }
    } catch {
      // If illustrations doesn't exist yet, CREATE TABLE below will handle it.
    }

    // Iter72: courses gained status + error for async generation progress
    // Iter74: courses gained plan for persisted course planning artifact
    try {
      if (!hasColumn('courses', 'status')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN status TEXT NOT NULL DEFAULT 'READY';`);
      }
      if (!hasColumn('courses', 'error')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN error TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('courses', 'plan')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN plan TEXT NOT NULL DEFAULT '{}';`);
      }

      // Iter77: courses gained build attempt + stall detection timestamps/reasons
      if (!hasColumn('courses', 'generationAttempt')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN generationAttempt INTEGER NOT NULL DEFAULT 0;`);
      }
      if (!hasColumn('courses', 'generationStartedAt')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN generationStartedAt TEXT;`);
      }
      if (!hasColumn('courses', 'lastProgressAt')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN lastProgressAt TEXT;`);
      }
      if (!hasColumn('courses', 'failedAt')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN failedAt TEXT;`);
      }
      if (!hasColumn('courses', 'failureReason')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN failureReason TEXT NOT NULL DEFAULT '';`);
      }
      if (!hasColumn('courses', 'failureMessage')) {
        sqlite.exec(`ALTER TABLE courses ADD COLUMN failureMessage TEXT NOT NULL DEFAULT '';`);
      }
    } catch {
      // If courses doesn't exist yet, CREATE TABLE below will handle it.
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
    telemetryEnabled INTEGER NOT NULL DEFAULT 1,
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
    plan TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'READY',
    error TEXT NOT NULL DEFAULT '',
    generationAttempt INTEGER NOT NULL DEFAULT 0,
    generationStartedAt TEXT,
    lastProgressAt TEXT,
    failedAt TEXT,
    failureReason TEXT NOT NULL DEFAULT '',
    failureMessage TEXT NOT NULL DEFAULT '',
    origin TEXT NOT NULL DEFAULT 'user',
    marketplaceCourseId TEXT,
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

  -- Iter135: per-lesson key takeaways (persisted so UI can render a right-rail)
  CREATE TABLE IF NOT EXISTS lesson_takeaways (
    lessonId TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    takeaways TEXT NOT NULL DEFAULT '[]',
    provider TEXT NOT NULL DEFAULT 'unknown',
    model TEXT NOT NULL DEFAULT 'unknown',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lesson_takeaways_course ON lesson_takeaways(courseId);

  -- Iter135: per-lesson image manifest (from extracted sources; license/credit best-effort)
  CREATE TABLE IF NOT EXISTS lesson_images (
    lessonId TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lesson_images_course ON lesson_images(courseId);

  -- Iter73 P1: quality telemetry (best-effort)
  CREATE TABLE IF NOT EXISTS lesson_quality (
    lessonId TEXT PRIMARY KEY,
    courseId TEXT NOT NULL,
    telemetry TEXT NOT NULL DEFAULT '{}',
    updatedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_lesson_quality_course ON lesson_quality(courseId);

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
    origin TEXT NOT NULL DEFAULT 'user',
    createdAt TEXT NOT NULL
  );

  -- Iter138: mastery + spaced repetition scheduling
  CREATE TABLE IF NOT EXISTS mastery (
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    lessonId TEXT NOT NULL,
    masteryLevel REAL NOT NULL DEFAULT 0,
    lastStudiedAt TEXT,
    nextReviewAt TEXT,
    lastQuizScore INTEGER,
    lastQuizAt TEXT,
    gapsJson TEXT NOT NULL DEFAULT '[]',
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, courseId, lessonId)
  );
  CREATE INDEX IF NOT EXISTS idx_mastery_user_next_review ON mastery(userId, nextReviewAt);

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    provider TEXT NOT NULL,
    encryptedKey TEXT NOT NULL,
    iv TEXT NOT NULL DEFAULT '',
    tag TEXT NOT NULL DEFAULT '',
    encVersion TEXT NOT NULL DEFAULT 'v1_cbc',
    label TEXT NOT NULL DEFAULT '',
    lastFour TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    validationStatus TEXT NOT NULL DEFAULT 'unknown',
    validatedAt TEXT,
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

  -- Pro Update Agent notifications (Iter70+83): durable notification feed + trust loop metadata
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'update',
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    readAt TEXT,
    -- Iter83: trust loop
    topic TEXT NOT NULL DEFAULT '',
    sourceUrl TEXT NOT NULL DEFAULT '',
    sourceDomain TEXT NOT NULL DEFAULT '',
    checkedAt TEXT,
    explanation TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    origin TEXT NOT NULL DEFAULT 'user'
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(userId, createdAt);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, readAt);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_url ON notifications(userId, url);

  -- Iter83: Update Agent monitoring configuration
  CREATE TABLE IF NOT EXISTS update_agent_topics (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    topic TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_update_agent_topics_user ON update_agent_topics(userId);

  CREATE TABLE IF NOT EXISTS update_agent_sources (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    topicId TEXT NOT NULL,
    url TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0,
    sourceType TEXT NOT NULL DEFAULT 'rss',
    createdAt TEXT NOT NULL,
    lastCheckedAt TEXT,
    lastSuccessAt TEXT,
    lastError TEXT NOT NULL DEFAULT '',
    lastErrorAt TEXT,
    lastItemUrlSeen TEXT NOT NULL DEFAULT '',
    lastItemPublishedAt TEXT,
    nextEligibleAt TEXT,
    failureCount INTEGER NOT NULL DEFAULT 0
  );


  CREATE TABLE IF NOT EXISTS update_agent_topic_runs (
    userId TEXT NOT NULL,
    topicId TEXT NOT NULL,
    lockId TEXT NOT NULL DEFAULT '',
    lockedAt TEXT,
    lastRunAt TEXT,
    lastRunOk INTEGER NOT NULL DEFAULT 1,
    lastRunError TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_update_agent_topic_runs_user_topic
    ON update_agent_topic_runs(userId, topicId);

  -- Iter96: global per-user tick lock + run history
  CREATE TABLE IF NOT EXISTS update_agent_global_runs (
    userId TEXT PRIMARY KEY,
    lockId TEXT NOT NULL DEFAULT '',
    lockedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS update_agent_runs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    startedAt TEXT NOT NULL,
    finishedAt TEXT,
    status TEXT NOT NULL,
    topicsChecked INTEGER NOT NULL DEFAULT 0,
    sourcesChecked INTEGER NOT NULL DEFAULT 0,
    notificationsCreated INTEGER NOT NULL DEFAULT 0,
    failuresJson TEXT NOT NULL DEFAULT '[]'
  );
  CREATE INDEX IF NOT EXISTS idx_update_agent_runs_user_started ON update_agent_runs(userId, startedAt DESC);

  CREATE INDEX IF NOT EXISTS idx_update_agent_sources_user ON update_agent_sources(userId);
  CREATE INDEX IF NOT EXISTS idx_update_agent_sources_topic ON update_agent_sources(topicId);

  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    agentId TEXT NOT NULL,
    tokensUsed INTEGER NOT NULL,
    origin TEXT NOT NULL DEFAULT 'user',
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
    origin TEXT NOT NULL DEFAULT 'user',
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
    createdAt TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'unknown',
    model TEXT NOT NULL DEFAULT 'unknown',
    license TEXT NOT NULL DEFAULT 'unknown',
    attributionText TEXT NOT NULL DEFAULT '',
    sourcePageUrl TEXT NOT NULL DEFAULT '',
    imageReason TEXT NOT NULL DEFAULT ''
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

  -- Iter123: server-backed bookmarks (per-user) for lessons.
  CREATE TABLE IF NOT EXISTS bookmarks (
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    lessonId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    PRIMARY KEY (userId, lessonId)
  );
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(userId, createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user_course ON bookmarks(userId, courseId);

  -- Iter68: global admin-configurable web search settings used during course creation
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// ── Prepared Statements ─────────────────────────────────────────────────────

const stmts = {
  // Mastery (Iter138)
  upsertMastery: sqlite.prepare(
    `INSERT OR REPLACE INTO mastery (userId, courseId, lessonId, masteryLevel, lastStudiedAt, nextReviewAt, lastQuizScore, lastQuizAt, gapsJson, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getMasteryByUser: sqlite.prepare(`SELECT * FROM mastery WHERE userId = ?`),
  getMasteryByUserCourse: sqlite.prepare(`SELECT * FROM mastery WHERE userId = ? AND courseId = ?`),
  getMasteryByUserLesson: sqlite.prepare(
    `SELECT * FROM mastery WHERE userId = ? AND courseId = ? AND lessonId = ? LIMIT 1`,
  ),
  getDueReviewsByUser: sqlite.prepare(
    `SELECT * FROM mastery WHERE userId = ? AND nextReviewAt IS NOT NULL AND nextReviewAt <= ? ORDER BY nextReviewAt ASC LIMIT ?`,
  ),

  // App settings (global)
  getAppSetting: sqlite.prepare(`SELECT value FROM app_settings WHERE key = ?`),
  upsertAppSetting: sqlite.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)`,
  ),

  // Users
  insertUser: sqlite.prepare(
    `INSERT INTO users (id, email, displayName, passwordHash, role, tier, goals, topics, experience, schedule, preferredLanguage, onboardingCompletedAt, telemetryEnabled, oauthProvider, oauthId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  updateUser: sqlite.prepare(
    `UPDATE users SET email=?, displayName=?, passwordHash=?, role=?, tier=?, goals=?, topics=?, experience=?, schedule=?, preferredLanguage=?, onboardingCompletedAt=?, telemetryEnabled=?, oauthProvider=?, oauthId=?, updatedAt=? WHERE id=?`,
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
    `INSERT INTO api_keys (id, userId, provider, encryptedKey, iv, tag, encVersion, label, lastFour, active, validationStatus, validatedAt, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getKeysByUserId: sqlite.prepare(`SELECT * FROM api_keys WHERE userId = ?`),
  findApiKeyById: sqlite.prepare(`SELECT * FROM api_keys WHERE id = ?`),
  deleteApiKey: sqlite.prepare(`DELETE FROM api_keys WHERE id = ?`),
  setApiKeyActive: sqlite.prepare(`UPDATE api_keys SET active = ? WHERE id = ?`),
  deactivateKeysForProviderByUser: sqlite.prepare(
    `UPDATE api_keys SET active = 0 WHERE userId = ? AND provider = ?`,
  ),

  // Token usage
  insertTokenUsage: sqlite.prepare(
    `INSERT INTO token_usage (userId, agentId, tokensUsed, origin, timestamp) VALUES (?, ?, ?, ?, ?)`,
  ),
  getTokenUsageByAgent: sqlite.prepare(
    `SELECT COALESCE(SUM(tokensUsed), 0) as total FROM token_usage WHERE userId = ? AND agentId = ?`,
  ),

  // Usage records (Iter67)
  insertUsageRecord: sqlite.prepare(
    `INSERT INTO usage_records (userId, agentName, provider, tokensIn, tokensOut, tokensTotal, origin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  countUsageRecordsByUser: sqlite.prepare(
    `SELECT COUNT(*) as n FROM usage_records WHERE userId = ? AND origin = 'user'`,
  ),
  getLastUsageRecordAtByUser: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM usage_records WHERE userId = ? AND origin = 'user'`,
  ),
  countUsageRecordsByUserAllOrigins: sqlite.prepare(
    `SELECT COUNT(*) as n FROM usage_records WHERE userId = ?`,
  ),
  getLastUsageRecordAtByUserAllOrigins: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM usage_records WHERE userId = ?`,
  ),
  getUsageTotalSince: sqlite.prepare(
    `SELECT COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user'`,
  ),
  getUsageByDaySince: sqlite.prepare(
    `SELECT substr(createdAt, 1, 10) as day, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user' GROUP BY day ORDER BY day ASC`,
  ),
  getTopAgentsSince: sqlite.prepare(
    `SELECT agentName, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user' GROUP BY agentName ORDER BY total DESC LIMIT ?`,
  ),
  getTopProvidersSince: sqlite.prepare(
    `SELECT provider, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user' GROUP BY provider ORDER BY total DESC LIMIT ?`,
  ),
  getUsageByProviderSince: sqlite.prepare(
    `SELECT provider, COALESCE(SUM(tokensTotal), 0) as total FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user' GROUP BY provider`,
  ),

  // Usage meta (counts + last used)
  getUsageCountByProviderSince: sqlite.prepare(
    `SELECT provider, COUNT(*) as count FROM usage_records WHERE userId = ? AND createdAt >= ? AND origin = 'user' GROUP BY provider`,
  ),
  getLastUsedByProvider: sqlite.prepare(
    `SELECT provider, MAX(createdAt) as lastUsed FROM usage_records WHERE userId = ? AND origin = 'user' GROUP BY provider`,
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
    `INSERT OR REPLACE INTO notifications (id, userId, type, title, body, createdAt, readAt, topic, sourceUrl, sourceDomain, checkedAt, explanation, url, origin) VALUES (@id, @userId, @type, @title, @body, @createdAt, @readAt, @topic, @sourceUrl, @sourceDomain, @checkedAt, @explanation, @url, @origin)`,
  ),
  listNotificationsByUser: sqlite.prepare(
    `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
  ),
  countNotificationsByUser: sqlite.prepare(
    `SELECT COUNT(*) as n FROM notifications WHERE userId = ? AND origin = 'user'`,
  ),
  getLastNotificationAtByUser: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM notifications WHERE userId = ? AND origin = 'user'`,
  ),
  countNotificationsByUserAllOrigins: sqlite.prepare(
    `SELECT COUNT(*) as n FROM notifications WHERE userId = ?`,
  ),
  getLastNotificationAtByUserAllOrigins: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM notifications WHERE userId = ?`,
  ),
  markNotificationRead: sqlite.prepare(
    `UPDATE notifications SET readAt = ? WHERE id = ? AND userId = ?`,
  ),
  markAllNotificationsRead: sqlite.prepare(
    `UPDATE notifications SET readAt = ? WHERE userId = ? AND readAt IS NULL`,
  ),
  hasNotificationByUserAndUrl: sqlite.prepare(
    `SELECT id FROM notifications WHERE userId = ? AND url = ? LIMIT 1`,
  ),

  // Iter96: per-user global tick lock + run history
  acquireUpdateAgentGlobalRunLock: sqlite.prepare<
    {
      userId: string;
      lockId: string;
      lockedAt: string;
      staleBefore: string;
      createdAt: string;
      updatedAt: string;
    },
    { lockId: string }
  >(`
    INSERT INTO update_agent_global_runs (userId, lockId, lockedAt, createdAt, updatedAt)
    VALUES (@userId, @lockId, @lockedAt, @createdAt, @updatedAt)
    ON CONFLICT(userId) DO UPDATE SET
      lockId = CASE
        WHEN lockedAt IS NULL OR lockedAt < @staleBefore THEN excluded.lockId
        ELSE lockId
      END,
      lockedAt = CASE
        WHEN lockedAt IS NULL OR lockedAt < @staleBefore THEN excluded.lockedAt
        ELSE lockedAt
      END,
      updatedAt = excluded.updatedAt
    RETURNING lockId
  `),

  releaseUpdateAgentGlobalRunLock: sqlite.prepare(`
    UPDATE update_agent_global_runs
    SET lockedAt = NULL, updatedAt = @updatedAt
    WHERE userId = @userId AND lockId = @lockId
  `),

  insertUpdateAgentRun: sqlite.prepare(`
    INSERT INTO update_agent_runs (id, userId, startedAt, finishedAt, status, topicsChecked, sourcesChecked, notificationsCreated, failuresJson)
    VALUES (@id, @userId, @startedAt, @finishedAt, @status, @topicsChecked, @sourcesChecked, @notificationsCreated, @failuresJson)
  `),

  finishUpdateAgentRun: sqlite.prepare(`
    UPDATE update_agent_runs
    SET finishedAt=@finishedAt, status=@status, topicsChecked=@topicsChecked, sourcesChecked=@sourcesChecked, notificationsCreated=@notificationsCreated, failuresJson=@failuresJson
    WHERE id=@id AND userId=@userId
  `),

  listUpdateAgentRunsByUser: sqlite.prepare(
    `SELECT * FROM update_agent_runs WHERE userId = ? ORDER BY startedAt DESC LIMIT ?`,
  ),
  // Iter84: per-user/topic run lock + run state
  acquireUpdateAgentTopicRunLock: sqlite.prepare(`
    INSERT INTO update_agent_topic_runs (userId, topicId, lockId, lockedAt, createdAt, updatedAt)
    VALUES (@userId, @topicId, @lockId, @lockedAt, @createdAt, @updatedAt)
    ON CONFLICT(userId, topicId) DO UPDATE SET
      lockId = CASE
        WHEN lockedAt IS NULL OR lockedAt < @staleBefore THEN excluded.lockId
        ELSE lockId
      END,
      lockedAt = CASE
        WHEN lockedAt IS NULL OR lockedAt < @staleBefore THEN excluded.lockedAt
        ELSE lockedAt
      END,
      updatedAt = excluded.updatedAt
    RETURNING lockId
  `),

  releaseUpdateAgentTopicRunLock: sqlite.prepare(`
    UPDATE update_agent_topic_runs
    SET lockedAt = NULL, updatedAt = @updatedAt
    WHERE userId = @userId AND topicId = @topicId AND lockId = @lockId
  `),

  updateUpdateAgentTopicRunResult: sqlite.prepare(`
    INSERT INTO update_agent_topic_runs (userId, topicId, lastRunAt, lastRunOk, lastRunError, createdAt, updatedAt)
    VALUES (@userId, @topicId, @lastRunAt, @lastRunOk, @lastRunError, @createdAt, @updatedAt)
    ON CONFLICT(userId, topicId) DO UPDATE SET
      lastRunAt = excluded.lastRunAt,
      lastRunOk = excluded.lastRunOk,
      lastRunError = excluded.lastRunError,
      updatedAt = excluded.updatedAt
  `),

  getUpdateAgentTopicRunState: sqlite.prepare(`
    SELECT userId, topicId, lockId, lockedAt, lastRunAt, lastRunOk, lastRunError
    FROM update_agent_topic_runs
    WHERE userId = ? AND topicId = ?
  `),

  // Update Agent
  upsertUpdateAgentTopic: sqlite.prepare(
    `INSERT OR REPLACE INTO update_agent_topics (id, userId, topic, enabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  listUpdateAgentTopicsByUser: sqlite.prepare(
    `SELECT * FROM update_agent_topics WHERE userId = ? ORDER BY createdAt DESC`,
  ),
  deleteUpdateAgentTopic: sqlite.prepare(
    `DELETE FROM update_agent_topics WHERE id = ? AND userId = ?`,
  ),

  upsertUpdateAgentSource: sqlite.prepare(
    `INSERT OR REPLACE INTO update_agent_sources (id, userId, topicId, url, enabled, position, sourceType, createdAt, lastCheckedAt, lastSuccessAt, lastError, lastErrorAt, lastItemUrlSeen, lastItemPublishedAt, nextEligibleAt, failureCount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  listUpdateAgentSourcesByTopic: sqlite.prepare(
    `SELECT * FROM update_agent_sources WHERE userId = ? AND topicId = ? ORDER BY position ASC, createdAt DESC`,
  ),
  deleteUpdateAgentSource: sqlite.prepare(
    `DELETE FROM update_agent_sources WHERE id = ? AND userId = ?`,
  ),
  updateUpdateAgentSourceStatus: sqlite.prepare(
    `UPDATE update_agent_sources SET lastCheckedAt = ?, lastSuccessAt = ?, lastError = ?, lastErrorAt = ?, lastItemUrlSeen = ?, lastItemPublishedAt = ?, nextEligibleAt = ?, failureCount = ? WHERE id = ? AND userId = ?`,
  ),

  // Lesson sources
  upsertLessonSource: sqlite.prepare(
    `INSERT OR REPLACE INTO lesson_sources (lessonId, courseId, sources, missingReason, updatedAt) VALUES (?, ?, ?, ?, ?)`,
  ),
  getLessonSources: sqlite.prepare(
    `SELECT sources, missingReason FROM lesson_sources WHERE lessonId = ?`,
  ),

  // Iter135: Lesson takeaways + images manifests
  upsertLessonTakeaways: sqlite.prepare(
    `INSERT OR REPLACE INTO lesson_takeaways (lessonId, courseId, takeaways, provider, model, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  getLessonTakeaways: sqlite.prepare(`SELECT takeaways FROM lesson_takeaways WHERE lessonId = ?`),

  upsertLessonImages: sqlite.prepare(
    `INSERT OR REPLACE INTO lesson_images (lessonId, courseId, images, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
  ),
  getLessonImages: sqlite.prepare(`SELECT images FROM lesson_images WHERE lessonId = ?`),

  // Lesson quality telemetry
  upsertLessonQuality: sqlite.prepare(
    `INSERT OR REPLACE INTO lesson_quality (lessonId, courseId, telemetry, updatedAt) VALUES (?, ?, ?, ?)`,
  ),
  getLessonQuality: sqlite.prepare(`SELECT telemetry FROM lesson_quality WHERE lessonId = ?`),

  // Courses
  insertCourse: sqlite.prepare(
    `INSERT OR REPLACE INTO courses (id, title, description, topic, depth, authorId, modules, progress, plan, status, error, generationAttempt, generationStartedAt, lastProgressAt, failedAt, failureReason, failureMessage, origin, marketplaceCourseId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  updateCourseStatus: sqlite.prepare(`UPDATE courses SET status = ?, error = ? WHERE id = ?`),
  updateCourseBuildTelemetry: sqlite.prepare(
    `UPDATE courses SET generationAttempt = ?, generationStartedAt = ?, lastProgressAt = ?, failedAt = ?, failureReason = ?, failureMessage = ? WHERE id = ?`,
  ),
  updateCourseLastProgressAt: sqlite.prepare(`UPDATE courses SET lastProgressAt = ? WHERE id = ?`),
  findCourseById: sqlite.prepare(`SELECT * FROM courses WHERE id = ?`),
  findCourseByMarketplaceCourseId: sqlite.prepare(
    `SELECT * FROM courses WHERE authorId = ? AND marketplaceCourseId = ? LIMIT 1`,
  ),
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
  countProgressByUser: sqlite.prepare(`SELECT COUNT(*) as n FROM progress WHERE userId = ?`),
  getLastProgressCompletedAtByUser: sqlite.prepare(
    `SELECT MAX(completedAt) as lastAt FROM progress WHERE userId = ?`,
  ),

  // Learning events
  insertLearningEvent: sqlite.prepare(
    `INSERT INTO learning_events (id, userId, type, courseId, lessonId, meta, origin, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getLearningEventsByUser: sqlite.prepare(
    `SELECT * FROM learning_events WHERE userId = ? AND origin = 'user' ORDER BY createdAt DESC LIMIT ?`,
  ),
  countLearningEventsByUser: sqlite.prepare(
    `SELECT COUNT(*) as n FROM learning_events WHERE userId = ? AND origin = 'user'`,
  ),
  getLastLearningEventAtByUser: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM learning_events WHERE userId = ? AND origin = 'user'`,
  ),
  countLearningEventsByUserAllOrigins: sqlite.prepare(
    `SELECT COUNT(*) as n FROM learning_events WHERE userId = ?`,
  ),
  getLastLearningEventAtByUserAllOrigins: sqlite.prepare(
    `SELECT MAX(createdAt) as lastAt FROM learning_events WHERE userId = ?`,
  ),

  // Bookmarks (Iter123)
  upsertBookmark: sqlite.prepare(
    `INSERT OR REPLACE INTO bookmarks (userId, courseId, lessonId, createdAt) VALUES (?, ?, ?, ?)`,
  ),
  deleteBookmark: sqlite.prepare(`DELETE FROM bookmarks WHERE userId = ? AND lessonId = ?`),
  listBookmarksByUser: sqlite.prepare(
    `SELECT * FROM bookmarks WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
  ),
  getBookmarkByUserLesson: sqlite.prepare(
    `SELECT * FROM bookmarks WHERE userId = ? AND lessonId = ?`,
  ),

  // Pipelines
  insertPipeline: sqlite.prepare(
    `INSERT OR REPLACE INTO pipelines (id, courseId, topic, stage, state, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ),
  findPipelineById: sqlite.prepare(`SELECT * FROM pipelines WHERE id = ?`),
  getAllPipelines: sqlite.prepare(`SELECT * FROM pipelines`),
  updatePipeline: sqlite.prepare(`UPDATE pipelines SET stage=?, state=?, updatedAt=? WHERE id=?`),
  deletePipeline: sqlite.prepare(`DELETE FROM pipelines WHERE id = ?`),

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
  deactivateAgent: sqlite.prepare(
    `DELETE FROM marketplace_agents_activated WHERE userId = ? AND agentId = ?`,
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
    `INSERT INTO illustrations (id, lessonId, sectionIndex, prompt, imageUrl, createdAt, provider, model, license, attributionText, sourcePageUrl, imageReason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  /** User consent for server-side learning event telemetry (default true). */
  telemetryEnabled?: boolean;
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
  tag: string;
  encVersion: string;
  label: string;
  lastFour: string;
  active: boolean;
  validationStatus: 'unknown' | 'valid' | 'invalid';
  validatedAt?: Date;
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
  origin?: string;
  createdAt: Date;
}

export interface TokenUsageRecord {
  userId: string;
  agentId: string;
  tokensUsed: number;
  origin?: string;
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
    telemetryEnabled:
      row.telemetryEnabled === 0 || row.telemetryEnabled === '0'
        ? false
        : Boolean(row.telemetryEnabled ?? 1),
    active: undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function rowToApiKey(row: any): DbApiKey {
  return {
    ...row,
    tag: String(row.tag || ''),
    encVersion: String(row.encVersion || 'v1_cbc'),
    active: !!row.active,
    validationStatus: (row.validationStatus || 'unknown') as any,
    validatedAt: row.validatedAt ? new Date(row.validatedAt) : undefined,
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
      user.telemetryEnabled === false ? 0 : 1,
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
      user.telemetryEnabled === false ? 0 : 1,
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
      key.tag || '',
      key.encVersion || 'v1_cbc',
      key.label,
      key.lastFour,
      key.active ? 1 : 0,
      (key as any).validationStatus || 'unknown',
      (key as any).validatedAt ? (key as any).validatedAt.toISOString() : null,
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

  setApiKeyActive(id: string, active: boolean): void {
    (stmts as any).setApiKeyActive.run(active ? 1 : 0, id);
  }

  deactivateKeysForProviderByUser(userId: string, provider: string): void {
    (stmts as any).deactivateKeysForProviderByUser.run(userId, provider);
  }

  addTokenUsage(record: TokenUsageRecord): void {
    stmts.insertTokenUsage.run(
      record.userId,
      record.agentId,
      record.tokensUsed,
      record.origin || 'user',
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
      record.origin || 'user',
      record.createdAt.toISOString(),
    );
  }

  // Data Summary (Iter81/82): minimal auditable summary of server-stored records.
  // By default excludes non-user origins (Iter86).
  getDataSummary(userId: string): {
    learningEvents: { count: number; lastEventAt: string | null };
    progress: { completedCount: number; lastCompletedAt: string | null };
    usageRecords: { count: number; lastUsedAt: string | null };
    notifications: { count: number; lastNotificationAt: string | null };
    bookmarks: { count: number; lastBookmarkedAt: string | null };
    generatedAt: string;
  } {
    const leCount = (stmts as any).countLearningEventsByUser.get(userId) as any;
    const leLast = (stmts as any).getLastLearningEventAtByUser.get(userId) as any;

    const progCount = (stmts as any).countProgressByUser.get(userId) as any;
    const progLast = (stmts as any).getLastProgressCompletedAtByUser.get(userId) as any;

    const usageCount = (stmts as any).countUsageRecordsByUser.get(userId) as any;
    const usageLast = (stmts as any).getLastUsageRecordAtByUser.get(userId) as any;

    const notifCount = (stmts as any).countNotificationsByUser.get(userId) as any;
    const notifLast = (stmts as any).getLastNotificationAtByUser.get(userId) as any;

    // Bookmarks (Iter123)
    const bmCount = sqlite
      .prepare(`SELECT COUNT(*) as n FROM bookmarks WHERE userId = ?`)
      .get(userId) as any;
    const bmLast = sqlite
      .prepare(`SELECT MAX(createdAt) as lastAt FROM bookmarks WHERE userId = ?`)
      .get(userId) as any;

    return {
      learningEvents: {
        count: Number(leCount?.n || 0),
        lastEventAt: leLast?.lastAt ? String(leLast.lastAt) : null,
      },
      progress: {
        completedCount: Number(progCount?.n || 0),
        lastCompletedAt: progLast?.lastAt ? String(progLast.lastAt) : null,
      },
      usageRecords: {
        count: Number(usageCount?.n || 0),
        lastUsedAt: usageLast?.lastAt ? String(usageLast.lastAt) : null,
      },
      notifications: {
        count: Number(notifCount?.n || 0),
        lastNotificationAt: notifLast?.lastAt ? String(notifLast.lastAt) : null,
      },
      bookmarks: {
        count: Number(bmCount?.n || 0),
        lastBookmarkedAt: bmLast?.lastAt ? String(bmLast.lastAt) : null,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // Iter86: data-summary variant that includes all origins.
  getDataSummaryIncludingOrigins(userId: string): {
    learningEvents: { count: number; lastEventAt: string | null };
    progress: { completedCount: number; lastCompletedAt: string | null };
    usageRecords: { count: number; lastUsedAt: string | null };
    notifications: { count: number; lastNotificationAt: string | null };
    bookmarks: { count: number; lastBookmarkedAt: string | null };
    generatedAt: string;
  } {
    const leCount = (stmts as any).countLearningEventsByUserAllOrigins.get(userId) as any;
    const leLast = (stmts as any).getLastLearningEventAtByUserAllOrigins.get(userId) as any;

    const progCount = (stmts as any).countProgressByUser.get(userId) as any;
    const progLast = (stmts as any).getLastProgressCompletedAtByUser.get(userId) as any;

    const usageCount = (stmts as any).countUsageRecordsByUserAllOrigins.get(userId) as any;
    const usageLast = (stmts as any).getLastUsageRecordAtByUserAllOrigins.get(userId) as any;

    const notifCount = (stmts as any).countNotificationsByUserAllOrigins.get(userId) as any;
    const notifLast = (stmts as any).getLastNotificationAtByUserAllOrigins.get(userId) as any;

    // Bookmarks (Iter123)
    const bmCount = sqlite
      .prepare(`SELECT COUNT(*) as n FROM bookmarks WHERE userId = ?`)
      .get(userId) as any;
    const bmLast = sqlite
      .prepare(`SELECT MAX(createdAt) as lastAt FROM bookmarks WHERE userId = ?`)
      .get(userId) as any;

    return {
      learningEvents: {
        count: Number(leCount?.n || 0),
        lastEventAt: leLast?.lastAt ? String(leLast.lastAt) : null,
      },
      progress: {
        completedCount: Number(progCount?.n || 0),
        lastCompletedAt: progLast?.lastAt ? String(progLast.lastAt) : null,
      },
      usageRecords: {
        count: Number(usageCount?.n || 0),
        lastUsedAt: usageLast?.lastAt ? String(usageLast.lastAt) : null,
      },
      notifications: {
        count: Number(notifCount?.n || 0),
        lastNotificationAt: notifLast?.lastAt ? String(notifLast.lastAt) : null,
      },
      bookmarks: {
        count: Number(bmCount?.n || 0),
        lastBookmarkedAt: bmLast?.lastAt ? String(bmLast.lastAt) : null,
      },
      generatedAt: new Date().toISOString(),
    };
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

  // Iter86: Dev-only cleanup helper.
  adminCleanupByOrigin(params: {
    origin: 'harness' | 'screenshot' | 'fixture' | 'test';
    dryRun: boolean;
  }): {
    tables: Record<string, { matching: number; deleted: number }>;
  } {
    const { origin, dryRun } = params;
    if (origin === ('user' as any)) throw new Error('Refusing to delete user data');

    const tables: Record<string, { matching: number; deleted: number }> = {};

    const specs: Array<{ name: string; where: string }> = [
      { name: 'courses', where: `origin = ?` },
      { name: 'learning_events', where: `origin = ?` },
      { name: 'usage_records', where: `origin = ?` },
      { name: 'token_usage', where: `origin = ?` },
    ];

    for (const s of specs) {
      const row = sqlite
        .prepare(`SELECT COUNT(*) as n FROM ${s.name} WHERE ${s.where}`)
        .get(origin) as any;
      const matching = Number(row?.n || 0);
      let deleted = 0;
      if (!dryRun && matching > 0) {
        const info = sqlite.prepare(`DELETE FROM ${s.name} WHERE ${s.where}`).run(origin) as any;
        deleted = Number(info?.changes || 0);
      }
      tables[s.name] = { matching, deleted };
    }

    // Progress doesn't have origin; delete by courseId for harness courses only.
    try {
      const cids = (
        sqlite.prepare(`SELECT id FROM courses WHERE origin = ?`).all(origin) as any[]
      ).map((r) => String(r.id));
      const matching = cids.length;
      let deleted = 0;
      if (!dryRun && cids.length > 0) {
        const placeholders = cids.map(() => '?').join(',');
        const info = sqlite
          .prepare(`DELETE FROM progress WHERE courseId IN (${placeholders})`)
          .run(...cids) as any;
        deleted = Number(info?.changes || 0);
      }
      tables['progress'] = { matching, deleted };
    } catch {
      // ignore
    }

    return { tables };
  }

  // Update Agent
  upsertUpdateAgentTopic(row: {
    id: string;
    userId: string;
    topic: string;
    enabled?: boolean;
    createdAt: Date;
    updatedAt?: Date | null;
  }): void {
    stmts.upsertUpdateAgentTopic.run(
      row.id,
      row.userId,
      row.topic,
      row.enabled ? 1 : 0,
      row.createdAt.toISOString(),
      row.updatedAt ? row.updatedAt.toISOString() : null,
    );
  }

  listUpdateAgentTopics(userId: string): Array<{
    id: string;
    topic: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string | null;
  }> {
    return (stmts.listUpdateAgentTopicsByUser.all(userId) as any[]).map((r) => ({
      id: String(r.id),
      topic: String(r.topic || ''),
      enabled: Boolean(Number(r.enabled ?? 1)),
      createdAt: String(r.createdAt || ''),
      updatedAt: r.updatedAt ? String(r.updatedAt) : null,
    }));
  }

  deleteUpdateAgentTopic(userId: string, id: string): void {
    stmts.deleteUpdateAgentTopic.run(id, userId);
  }

  upsertUpdateAgentSource(row: {
    id: string;
    userId: string;
    topicId: string;
    url: string;
    enabled?: boolean;
    position?: number;
    sourceType?: string;
    createdAt: Date;
    lastCheckedAt?: Date | null;
    lastSuccessAt?: Date | null;
    lastError?: string;
    lastErrorAt?: Date | null;
    lastItemUrlSeen?: string;
    lastItemPublishedAt?: string | null;
    nextEligibleAt?: Date | null;
    failureCount?: number;
  }): void {
    stmts.upsertUpdateAgentSource.run(
      row.id,
      row.userId,
      row.topicId,
      row.url,
      row.enabled === false ? 0 : 1,
      Number(row.position || 0),
      row.sourceType || 'rss',
      row.createdAt.toISOString(),
      row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
      row.lastSuccessAt ? row.lastSuccessAt.toISOString() : null,
      row.lastError || '',
      row.lastErrorAt ? row.lastErrorAt.toISOString() : null,
      row.lastItemUrlSeen || '',
      row.lastItemPublishedAt || null,
      row.nextEligibleAt ? row.nextEligibleAt.toISOString() : null,
      Number(row.failureCount || 0),
    );
  }

  listUpdateAgentSources(userId: string, topicId: string): Array<any> {
    return (stmts.listUpdateAgentSourcesByTopic.all(userId, topicId) as any[]).map((r) => ({
      id: String(r.id),
      userId: String(r.userId),
      topicId: String(r.topicId),
      url: String(r.url),
      enabled: Boolean(Number(r.enabled ?? 1)),
      position: Number(r.position || 0),
      sourceType: String(r.sourceType || 'rss'),
      createdAt: String(r.createdAt),
      lastCheckedAt: r.lastCheckedAt ? String(r.lastCheckedAt) : null,
      lastSuccessAt: r.lastSuccessAt ? String(r.lastSuccessAt) : null,
      lastError: String(r.lastError || ''),
      lastErrorAt: r.lastErrorAt ? String(r.lastErrorAt) : null,
      lastItemUrlSeen: String(r.lastItemUrlSeen || ''),
      lastItemPublishedAt: r.lastItemPublishedAt ? String(r.lastItemPublishedAt) : null,
      nextEligibleAt: r.nextEligibleAt ? String(r.nextEligibleAt) : null,
      failureCount: Number(r.failureCount || 0),
    }));
  }

  deleteUpdateAgentSource(userId: string, id: string): void {
    stmts.deleteUpdateAgentSource.run(id, userId);
  }

  // Iter96: global per-user tick lock
  acquireUpdateAgentGlobalRunLock(args: {
    userId: string;
    lockId: string;
    lockedAt: Date;
    staleBefore: Date;
  }): { lockId: string } | null {
    const row = stmts.acquireUpdateAgentGlobalRunLock.get({
      userId: args.userId,
      lockId: args.lockId,
      lockedAt: args.lockedAt.toISOString(),
      staleBefore: args.staleBefore.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!row) return null;
    return { lockId: String(row.lockId || '') };
  }

  acquireUpdateAgentGlobalRunLockStrict(args: {
    userId: string;
    lockId: string;
    lockedAt: Date;
    staleBefore: Date;
  }): boolean {
    const row = this.acquireUpdateAgentGlobalRunLock(args);
    return !!row && row.lockId === args.lockId;
  }

  releaseUpdateAgentGlobalRunLock(args: { userId: string; lockId: string }): void {
    stmts.releaseUpdateAgentGlobalRunLock.run({
      userId: args.userId,
      lockId: args.lockId,
      updatedAt: new Date().toISOString(),
    });
  }

  // Iter96: run history
  insertUpdateAgentRun(row: {
    id: string;
    userId: string;
    startedAt: Date;
    finishedAt: Date | null;
    status: string;
    topicsChecked: number;
    sourcesChecked: number;
    notificationsCreated: number;
    failuresJson: string;
  }): void {
    stmts.insertUpdateAgentRun.run({
      id: row.id,
      userId: row.userId,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
      status: row.status,
      topicsChecked: row.topicsChecked,
      sourcesChecked: row.sourcesChecked,
      notificationsCreated: row.notificationsCreated,
      failuresJson: row.failuresJson,
    });
  }

  finishUpdateAgentRun(args: {
    id: string;
    userId: string;
    finishedAt: Date;
    status: string;
    topicsChecked: number;
    sourcesChecked: number;
    notificationsCreated: number;
    failuresJson: string;
  }): void {
    stmts.finishUpdateAgentRun.run({
      id: args.id,
      userId: args.userId,
      finishedAt: args.finishedAt.toISOString(),
      status: args.status,
      topicsChecked: args.topicsChecked,
      sourcesChecked: args.sourcesChecked,
      notificationsCreated: args.notificationsCreated,
      failuresJson: args.failuresJson,
    });
  }

  listUpdateAgentRuns(userId: string, limit = 20): Array<any> {
    return stmts.listUpdateAgentRunsByUser.all(userId, limit).map((r: any) => ({
      id: String(r.id),
      userId: String(r.userId),
      startedAt: String(r.startedAt),
      finishedAt: r.finishedAt ? String(r.finishedAt) : null,
      status: String(r.status),
      topicsChecked: Number(r.topicsChecked || 0),
      sourcesChecked: Number(r.sourcesChecked || 0),
      notificationsCreated: Number(r.notificationsCreated || 0),
      failuresJson: String(r.failuresJson || '[]'),
    }));
  }

  acquireUpdateAgentTopicRunLock(args: {
    userId: string;
    topicId: string;
    lockId: string;
    lockedAt: Date;
    staleBefore: Date;
  }): { lockId: string } | null {
    const row = stmts.acquireUpdateAgentTopicRunLock.get({
      userId: args.userId,
      topicId: args.topicId,
      lockId: args.lockId,
      lockedAt: args.lockedAt.toISOString(),
      staleBefore: args.staleBefore.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) as any;

    if (!row) return null;
    return { lockId: String(row.lockId || '') };
  }

  releaseUpdateAgentTopicRunLock(args: { userId: string; topicId: string; lockId: string }): void {
    stmts.releaseUpdateAgentTopicRunLock.run({
      userId: args.userId,
      topicId: args.topicId,
      lockId: args.lockId,
      updatedAt: new Date().toISOString(),
    });
  }

  updateUpdateAgentTopicRunResult(args: {
    userId: string;
    topicId: string;
    lastRunAt: Date;
    ok: boolean;
    error?: string;
  }): void {
    stmts.updateUpdateAgentTopicRunResult.run({
      userId: args.userId,
      topicId: args.topicId,
      lastRunAt: args.lastRunAt.toISOString(),
      lastRunOk: args.ok ? 1 : 0,
      lastRunError: args.error || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  getUpdateAgentTopicRunState(userId: string, topicId: string): any | null {
    const row = stmts.getUpdateAgentTopicRunState.get(userId, topicId) as any;
    if (!row) return null;
    return {
      userId: String(row.userId),
      topicId: String(row.topicId),
      lockId: String(row.lockId || ''),
      lockedAt: row.lockedAt ? String(row.lockedAt) : null,
      lastRunAt: row.lastRunAt ? String(row.lastRunAt) : null,
      lastRunOk: Boolean(Number(row.lastRunOk ?? 1)),
      lastRunError: String(row.lastRunError || ''),
    };
  }

  updateUpdateAgentSourceStatus(args: {
    userId: string;
    id: string;
    lastCheckedAt?: Date | null;
    lastSuccessAt?: Date | null;
    lastError?: string;
    lastErrorAt?: Date | null;
    lastItemUrlSeen?: string;
    lastItemPublishedAt?: string | null;
    nextEligibleAt?: Date | null;
    failureCount?: number;
  }): void {
    stmts.updateUpdateAgentSourceStatus.run(
      args.lastCheckedAt ? args.lastCheckedAt.toISOString() : null,
      args.lastSuccessAt ? args.lastSuccessAt.toISOString() : null,
      args.lastError || '',
      args.lastErrorAt ? args.lastErrorAt.toISOString() : null,
      args.lastItemUrlSeen || '',
      args.lastItemPublishedAt || null,
      args.nextEligibleAt ? args.nextEligibleAt.toISOString() : null,
      Number(args.failureCount || 0),
      args.id,
      args.userId,
    );
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
    // Iter83 trust loop fields
    topic?: string;
    sourceUrl?: string;
    sourceDomain?: string;
    checkedAt?: Date | null;
    explanation?: string;
    url?: string;
    origin?: string;
  }): void {
    stmts.insertNotification.run({
      id: row.id,
      userId: row.userId,
      type: row.type || 'update',
      title: row.title,
      body: row.body || '',
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt ? row.readAt.toISOString() : null,
      topic: row.topic || '',
      sourceUrl: row.sourceUrl || '',
      sourceDomain: row.sourceDomain || '',
      checkedAt: row.checkedAt ? row.checkedAt.toISOString() : null,
      explanation: row.explanation || '',
      url: row.url || '',
      origin: row.origin || 'user',
    });
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
      topic: String(r.topic || ''),
      sourceUrl: String(r.sourceUrl || ''),
      sourceDomain: String(r.sourceDomain || ''),
      checkedAt: r.checkedAt ? String(r.checkedAt) : null,
      explanation: String(r.explanation || ''),
      url: String(r.url || ''),
      origin: String(r.origin || 'user'),
    }));
  }

  markNotificationRead(userId: string, id: string): void {
    stmts.markNotificationRead.run(new Date().toISOString(), id, userId);
  }

  markAllNotificationsRead(userId: string): void {
    stmts.markAllNotificationsRead.run(new Date().toISOString(), userId);
  }

  hasNotificationUrl(userId: string, url: string): boolean {
    const row = stmts.hasNotificationByUserAndUrl.get(userId, url) as any;
    return Boolean(row?.id);
  }

  // Iter94: server-first delete-my-data.
  // Removes all user-associated rows across tables we own in the MVP.
  deleteUserData(userId: string): void {
    // Order matters for FK constraints.
    try {
      sqlite.prepare(`DELETE FROM refresh_tokens WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM api_keys WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM token_usage WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM usage_records WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM learning_events WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM progress WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM notes WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM illustrations WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM annotations WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM notifications WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM update_agent_sources WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM update_agent_topics WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM update_agent_topic_runs WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      // Collaboration
      sqlite.prepare(`DELETE FROM collaboration_group_messages WHERE userId = ?`).run(userId);
      // Groups where user is owner.
      sqlite.prepare(`DELETE FROM collaboration_groups WHERE ownerId = ?`).run(userId);
      // Best-effort: removing the user from memberIds JSON is out of scope for MVP.
    } catch {
      // ignore
    }

    try {
      // Courses authored by the user (cascades lessons via FK)
      sqlite.prepare(`DELETE FROM courses WHERE authorId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM invoices WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    try {
      sqlite.prepare(`DELETE FROM mindmaps WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM mindmap_suggestions WHERE userId = ?`).run(userId);
    } catch {
      // ignore
    }

    // Marketplace (best-effort)
    try {
      sqlite.prepare(`DELETE FROM marketplace_agents_activated WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM marketplace_enrollments WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM marketplace_payment_intents WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM marketplace_payouts WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM marketplace_agent_submissions WHERE userId = ?`).run(userId);
      sqlite.prepare(`DELETE FROM marketplace_course_reviews WHERE userId = ?`).run(userId);
      // marketplace_courses are creator-owned; we do not currently model ownership.
    } catch {
      // ignore
    }

    // Finally delete the user row.
    try {
      sqlite.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    } catch {
      // ignore
    }
  }

  clear(): void {
    sqlite.exec(
      `DELETE FROM users; DELETE FROM api_keys; DELETE FROM refresh_tokens; DELETE FROM token_usage; DELETE FROM usage_records; DELETE FROM courses; DELETE FROM lessons; DELETE FROM lesson_sources; DELETE FROM lesson_quality; DELETE FROM progress; DELETE FROM pipelines; DELETE FROM invoices; DELETE FROM mindmaps; DELETE FROM mindmap_suggestions; DELETE FROM marketplace_agents_activated; DELETE FROM marketplace_courses; DELETE FROM marketplace_enrollments; DELETE FROM marketplace_payment_intents; DELETE FROM marketplace_payouts; DELETE FROM marketplace_agent_submissions; DELETE FROM marketplace_course_reviews; DELETE FROM collaboration_groups; DELETE FROM collaboration_group_messages; DELETE FROM notifications;`,
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

// Iter135: persist key takeaways so the client can show a right-rail/accordion.
export const dbLessonTakeaways = {
  save(
    lessonId: string,
    courseId: string,
    takeaways: string[],
    meta?: { provider?: string; model?: string },
  ): void {
    const now = new Date().toISOString();
    stmts.upsertLessonTakeaways.run(
      lessonId,
      courseId,
      JSON.stringify(takeaways || []),
      meta?.provider || 'unknown',
      meta?.model || 'unknown',
      now,
      now,
    );
  },

  get(lessonId: string): { takeaways: string[] } {
    const row = stmts.getLessonTakeaways.get(lessonId) as any;
    if (!row) return { takeaways: [] };
    try {
      return { takeaways: JSON.parse(row.takeaways || '[]') };
    } catch {
      return { takeaways: [] };
    }
  },
};

// Iter135: persist extracted images manifest per lesson for UI rendering.
export const dbLessonImages = {
  save(lessonId: string, courseId: string, images: any[]): void {
    const now = new Date().toISOString();
    stmts.upsertLessonImages.run(lessonId, courseId, JSON.stringify(images || []), now, now);
  },

  get(lessonId: string): { images: any[] } {
    const row = stmts.getLessonImages.get(lessonId) as any;
    if (!row) return { images: [] };
    try {
      return { images: JSON.parse(row.images || '[]') };
    } catch {
      return { images: [] };
    }
  },
};

export const dbLessonQuality = {
  save(lessonId: string, courseId: string, telemetry: any): void {
    stmts.upsertLessonQuality.run(
      lessonId,
      courseId,
      JSON.stringify(telemetry || {}),
      new Date().toISOString(),
    );
  },

  get(lessonId: string): any {
    const row = stmts.getLessonQuality.get(lessonId) as any;
    if (!row) return undefined;
    try {
      return JSON.parse(row.telemetry || '{}');
    } catch {
      return undefined;
    }
  },
};

export const dbCourses = {
  getAll(): any[] {
    return (stmts.getAllCourses.all() as any[]).map((row) => ({
      ...row,
      modules: JSON.parse(row.modules || '[]'),
      progress: JSON.parse(row.progress || '{}'),
      plan: JSON.parse(row.plan || '{}'),
    }));
  },

  getById(id: string): any | undefined {
    const row = stmts.findCourseById.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      modules: JSON.parse(row.modules || '[]'),
      progress: JSON.parse(row.progress || '{}'),
      plan: JSON.parse(row.plan || '{}'),
    };
  },

  getByMarketplaceCourseId(authorId: string, marketplaceCourseId: string): any | undefined {
    const row = (stmts as any).findCourseByMarketplaceCourseId.get(
      authorId,
      marketplaceCourseId,
    ) as any;
    if (!row) return undefined;
    return {
      ...row,
      modules: JSON.parse(row.modules || '[]'),
      progress: JSON.parse(row.progress || '{}'),
      plan: JSON.parse(row.plan || '{}'),
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
      JSON.stringify(course.plan || {}),
      course.status || 'READY',
      course.error || '',
      Number.isFinite(course.generationAttempt) ? Number(course.generationAttempt) : 0,
      course.generationStartedAt || null,
      course.lastProgressAt || null,
      course.failedAt || null,
      course.failureReason || '',
      course.failureMessage || '',
      course.origin || 'user',
      (course as any).marketplaceCourseId || null,
      course.createdAt || new Date().toISOString(),
    );
  },

  setStatus(id: string, status: string, error: string = ''): void {
    stmts.updateCourseStatus.run(status, error || '', id);
  },

  setBuildTelemetry(
    id: string,
    patch: {
      generationAttempt?: number;
      generationStartedAt?: string | null;
      lastProgressAt?: string | null;
      failedAt?: string | null;
      failureReason?: string;
      failureMessage?: string;
    },
  ): void {
    const existing = this.getById(id) as any;
    const merged = {
      generationAttempt:
        patch.generationAttempt ??
        (Number.isFinite(existing?.generationAttempt) ? Number(existing.generationAttempt) : 0),
      generationStartedAt:
        patch.generationStartedAt ??
        (existing?.generationStartedAt ? String(existing.generationStartedAt) : null),
      lastProgressAt:
        patch.lastProgressAt ?? (existing?.lastProgressAt ? String(existing.lastProgressAt) : null),
      failedAt: patch.failedAt ?? (existing?.failedAt ? String(existing.failedAt) : null),
      failureReason:
        patch.failureReason ?? (existing?.failureReason ? String(existing.failureReason) : ''),
      failureMessage:
        patch.failureMessage ?? (existing?.failureMessage ? String(existing.failureMessage) : ''),
    };
    stmts.updateCourseBuildTelemetry.run(
      merged.generationAttempt,
      merged.generationStartedAt,
      merged.lastProgressAt,
      merged.failedAt,
      merged.failureReason,
      merged.failureMessage,
      id,
    );
  },

  bumpLastProgressAt(id: string, iso = new Date().toISOString()): void {
    stmts.updateCourseLastProgressAt.run(iso, id);
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
      dbEvents.add(userId, {
        type: 'lesson.completed',
        courseId,
        lessonId,
        meta: {},
        origin: 'user',
      });
    } catch {
      // best effort
    }

    // Iter138: update mastery (best-effort)
    try {
      dbMastery.applyLessonCompleted(userId, courseId, lessonId);
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

    // Iter85: derive streak + study minutes from real learning_events.
    // Streak counts consecutive days with at least 1 learning event.
    // totalStudyMinutes sums explicit durations where present and falls back to +5 per completed lesson.
    const events = dbEvents.list(userId, 2000);

    // totalStudyMinutes
    let totalStudyMinutes = 0;
    for (const e of events) {
      if (e.type === 'lesson.view_end') {
        try {
          const meta = JSON.parse(e.meta || '{}') as any;
          const ms = Number(meta?.durationMs || 0);
          if (Number.isFinite(ms) && ms > 0) {
            totalStudyMinutes += Math.max(1, Math.round(ms / 60000));
            continue;
          }
        } catch {
          // ignore
        }
      }
      if (e.type === 'lesson.completed') totalStudyMinutes += 5;
    }
    if (totalStudyMinutes === 0) totalStudyMinutes = totalLessons * 5;

    // currentStreak
    const daySet = new Set<string>();
    for (const e of events) {
      const d = new Date(e.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      daySet.add(key);
    }

    const today = new Date();
    let streak = 0;
    // Walk back day by day from today.
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      if (daySet.has(key)) streak++;
      else break;
    }

    return {
      totalCoursesEnrolled: courseIds.size,
      totalLessonsCompleted: totalLessons,
      totalStudyMinutes,
      currentStreak: streak,
    };
  },
};

// ── Learning events helpers ────────────────────────────────────────────────

export const dbEvents = {
  add(
    userId: string,
    evt: {
      type: string;
      courseId?: string;
      lessonId?: string;
      meta?: Record<string, unknown>;
      origin?: string;
    },
  ): void {
    const now = new Date().toISOString();
    // Iter86: never persist events for non-user/harness origins.
    const origin = evt.origin || 'user';
    if (origin !== 'user') return;

    stmts.insertLearningEvent.run(
      `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId,
      evt.type,
      evt.courseId || null,
      evt.lessonId || null,
      JSON.stringify(evt.meta || {}),
      origin,
      now,
    );
  },

  list(userId: string, limit = 200): any[] {
    return stmts.getLearningEventsByUser.all(userId, limit) as any[];
  },
};

// ── Mastery helpers (Iter138) ─────────────────────────────────────────────

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function scheduleNextReview(masterLevel: number, lastQuizScore?: number | null): string {
  // MVP spaced repetition: map mastery (+ quiz score) to rough intervals.
  const score = Number.isFinite(Number(lastQuizScore)) ? Number(lastQuizScore) : null;
  const m = clamp01(masterLevel);
  if (score !== null && score < 60) return daysFromNow(1);
  if (m < 0.3) return daysFromNow(1);
  if (m < 0.6) return daysFromNow(3);
  if (m < 0.8) return daysFromNow(7);
  return daysFromNow(14);
}

export const dbMastery = {
  upsert(row: {
    userId: string;
    courseId: string;
    lessonId: string;
    masteryLevel: number;
    lastStudiedAt?: string | null;
    nextReviewAt?: string | null;
    lastQuizScore?: number | null;
    lastQuizAt?: string | null;
    // Stored as JSON in mastery.gapsJson.
    // Iter140: can be either string tags or structured entries.
    gaps?: any[];
  }): void {
    const now = new Date().toISOString();
    stmts.upsertMastery.run(
      row.userId,
      row.courseId,
      row.lessonId,
      clamp01(row.masteryLevel),
      row.lastStudiedAt || null,
      row.nextReviewAt || null,
      row.lastQuizScore ?? null,
      row.lastQuizAt || null,
      JSON.stringify(row.gaps || []),
      now,
    );
  },

  getByUser(userId: string): any[] {
    return stmts.getMasteryByUser.all(userId) as any[];
  },

  getByCourse(userId: string, courseId: string): any[] {
    return stmts.getMasteryByUserCourse.all(userId, courseId) as any[];
  },

  getByLesson(userId: string, courseId: string, lessonId: string): any | null {
    const row = stmts.getMasteryByUserLesson.get(userId, courseId, lessonId) as any;
    return row || null;
  },

  listDue(userId: string, nowIso = new Date().toISOString(), limit = 5): any[] {
    return stmts.getDueReviewsByUser.all(userId, nowIso, limit) as any[];
  },

  applyLessonCompleted(userId: string, courseId: string, lessonId: string): void {
    const existing = this.getByLesson(userId, courseId, lessonId);
    const now = new Date().toISOString();
    const prev = existing ? Number(existing.masteryLevel || 0) : 0;
    const masteryLevel = clamp01(prev + 0.2);
    const lastQuizScore = existing ? existing.lastQuizScore : null;
    const nextReviewAt = scheduleNextReview(masteryLevel, lastQuizScore);
    const gaps = (() => {
      try {
        return existing?.gapsJson ? JSON.parse(existing.gapsJson) : [];
      } catch {
        return [];
      }
    })();

    this.upsert({
      userId,
      courseId,
      lessonId,
      masteryLevel,
      lastStudiedAt: now,
      nextReviewAt,
      lastQuizScore: lastQuizScore ?? null,
      lastQuizAt: existing?.lastQuizAt || null,
      gaps,
    });
  },

  applyQuizSubmitted(
    userId: string,
    courseId: string,
    lessonId: string,
    score: number | null,
    gapTags: string[],
  ): void {
    const existing = this.getByLesson(userId, courseId, lessonId);
    const now = new Date().toISOString();
    const prev = existing ? Number(existing.masteryLevel || 0) : 0;
    const s = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : null;

    let masteryLevel = prev;
    if (s !== null) {
      if (s >= 85) masteryLevel = clamp01(prev + 0.3);
      else if (s >= 70) masteryLevel = clamp01(prev + 0.2);
      else if (s >= 60) masteryLevel = clamp01(prev + 0.1);
      else masteryLevel = clamp01(prev - 0.1);
    }

    // Iter140: store gaps with recency + frequency.
    // Backward compatible with old `string[]` gapsJson.
    const existingRawGaps = (() => {
      try {
        return existing?.gapsJson ? JSON.parse(existing.gapsJson) : [];
      } catch {
        return [];
      }
    })();

    type GapEntry = { tag: string; lastSeenAt: string; count: number; lastScore: number | null };

    const asEntries = (arr: any[]): GapEntry[] => {
      if (!Array.isArray(arr)) return [];
      const out: GapEntry[] = [];
      for (const x of arr) {
        if (typeof x === 'string') {
          const tag = String(x).trim();
          if (!tag) continue;
          out.push({ tag, lastSeenAt: now, count: 1, lastScore: null });
          continue;
        }
        if (x && typeof x === 'object') {
          const tag = String((x as any).tag || '').trim();
          if (!tag) continue;
          const lastSeenAt = String((x as any).lastSeenAt || (x as any).lastSeen || now);
          const countRaw = Number((x as any).count || 0);
          const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.round(countRaw) : 1;
          const ls = (x as any).lastScore;
          const lastScore = ls === null || ls === undefined ? null : Number(ls);
          out.push({
            tag,
            lastSeenAt,
            count,
            lastScore: Number.isFinite(lastScore) ? lastScore : null,
          });
        }
      }
      return out;
    };

    const merged = new Map<string, GapEntry>();
    for (const e of asEntries(existingRawGaps)) merged.set(e.tag, e);
    for (const t of (Array.isArray(gapTags) ? gapTags : [])
      .map((x) => String(x).trim())
      .filter(Boolean)) {
      const prevE = merged.get(t);
      merged.set(t, {
        tag: t,
        lastSeenAt: now,
        count: (prevE?.count || 0) + 1,
        lastScore: s,
      });
    }

    const nextReviewAt = scheduleNextReview(masteryLevel, s);
    this.upsert({
      userId,
      courseId,
      lessonId,
      masteryLevel,
      lastStudiedAt: now,
      nextReviewAt,
      lastQuizScore: s,
      lastQuizAt: now,
      gaps: Array.from(merged.values()).sort((a, b) => {
        const ad = Date.parse(a.lastSeenAt || '');
        const bd = Date.parse(b.lastSeenAt || '');
        if (Number.isFinite(ad) && Number.isFinite(bd) && bd !== ad) return bd - ad;
        return (b.count || 0) - (a.count || 0);
      }),
    });
  },
};

// ── Bookmarks helpers (Iter123) ─────────────────────────────────────────────

export const dbBookmarks = {
  add(userId: string, courseId: string, lessonId: string): void {
    const now = new Date().toISOString();
    stmts.upsertBookmark.run(userId, courseId, lessonId, now);
  },

  remove(userId: string, lessonId: string): void {
    stmts.deleteBookmark.run(userId, lessonId);
  },

  list(userId: string, limit = 200): any[] {
    return stmts.listBookmarksByUser.all(userId, limit) as any[];
  },

  isBookmarked(userId: string, lessonId: string): boolean {
    const row = stmts.getBookmarkByUserLesson.get(userId, lessonId) as any;
    return Boolean(row);
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
      (p.updatedAt as string | undefined) || now,
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
      // Preserve pipeline-state timestamps if present; otherwise fallback to row timestamps.
      createdAt: (state as any).createdAt || row.createdAt,
      updatedAt: (state as any).updatedAt || row.updatedAt,
    };
  },

  delete(id: string): void {
    try {
      stmts.deletePipeline.run(id);
    } catch {
      // ignore
    }
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

  deactivateAgent(userId: string, agentId: string): void {
    stmts.deactivateAgent.run(userId, agentId);
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
    meta?: {
      provider?: string;
      model?: string;
      license?: string;
      attributionText?: string;
      sourcePageUrl?: string;
      imageReason?: string;
    },
    status?: 'ok' | 'openai_unavailable',
  ): any {
    const id = `ill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    const provider = meta?.provider || 'unknown';
    const model = meta?.model || 'unknown';
    const license = meta?.license || 'unknown';
    const attributionText = meta?.attributionText || '';
    const sourcePageUrl = meta?.sourcePageUrl || '';
    const imageReason = meta?.imageReason || '';

    stmts.insertIllustration.run(
      id,
      lessonId,
      sectionIndex,
      prompt,
      imageUrl,
      createdAt,
      provider,
      model,
      license,
      attributionText,
      sourcePageUrl,
      imageReason,
    );

    return {
      id,
      lessonId,
      sectionIndex,
      prompt,
      imageUrl,
      status: status || 'ok',
      createdAt,
      provider,
      model,
      license,
      attributionText,
      sourcePageUrl,
      imageReason,
    };
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
