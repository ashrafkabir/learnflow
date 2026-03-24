import fs from 'node:fs/promises';
import path from 'node:path';

type CacheEntry = {
  content: string;
  title: string;
  cachedAt: number;
};

type CacheFileShape = {
  version: 1;
  entries: Record<string, CacheEntry>;
};

const DEFAULT_CACHE_PATH = path.resolve(process.cwd(), '.learnflow-cache', 'scrape-cache.v1.json');

function cachePath(): string {
  return process.env.LEARNFLOW_SCRAPE_CACHE_PATH || DEFAULT_CACHE_PATH;
}

let loaded = false;
let inMemory: Map<string, CacheEntry> = new Map();

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  loaded = true;

  try {
    const p = cachePath();
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as CacheFileShape;
    if (parsed?.version !== 1 || !parsed.entries) return;
    inMemory = new Map(Object.entries(parsed.entries));
  } catch {
    // ignore missing/corrupt cache; we'll rebuild.
  }
}

let flushTimer: NodeJS.Timeout | null = null;
let flushing = false;

function scheduleFlush(): void {
  if (process.env.NODE_ENV === 'test' || !!process.env.VITEST) return;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushToDisk();
  }, 250);
}

async function flushToDisk(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const p = cachePath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    const shape: CacheFileShape = {
      version: 1,
      entries: Object.fromEntries(inMemory.entries()),
    };
    await fs.writeFile(p, JSON.stringify(shape), 'utf8');
  } finally {
    flushing = false;
  }
}

export async function cacheGet(url: string): Promise<CacheEntry | null> {
  await ensureLoaded();
  return inMemory.get(url) || null;
}

export async function cacheSet(url: string, entry: CacheEntry): Promise<void> {
  await ensureLoaded();
  inMemory.set(url, entry);
  scheduleFlush();
}

export async function cacheClear(): Promise<void> {
  await ensureLoaded();
  inMemory.clear();
  scheduleFlush();
  try {
    await fs.rm(cachePath());
  } catch {
    // ignore
  }
}

export async function cacheSize(): Promise<number> {
  await ensureLoaded();
  return inMemory.size;
}
