/** Generate a simple unique ID */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Calculate estimated reading time in minutes */
export function estimateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}
