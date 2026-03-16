/**
 * Robots.txt checker — respects crawling rules.
 */

export interface RobotsRules {
  disallowedPaths: string[];
  crawlDelay?: number;
}

/**
 * Parse a robots.txt file content for user-agent "*".
 */
export function parseRobotsTxt(content: string): RobotsRules {
  const lines = content.split('\n');
  const rules: RobotsRules = { disallowedPaths: [] };
  let isRelevantAgent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      const agent = trimmed.split(':')[1].trim();
      isRelevantAgent = agent === '*';
    } else if (isRelevantAgent && trimmed.toLowerCase().startsWith('disallow:')) {
      const path = trimmed.split(':').slice(1).join(':').trim();
      if (path) rules.disallowedPaths.push(path);
    } else if (isRelevantAgent && trimmed.toLowerCase().startsWith('crawl-delay:')) {
      rules.crawlDelay = parseInt(trimmed.split(':')[1].trim(), 10);
    }
  }

  return rules;
}

/**
 * Check if a URL path is allowed by robots.txt rules.
 */
export function isUrlAllowed(urlPath: string, rules: RobotsRules): boolean {
  for (const disallowed of rules.disallowedPaths) {
    if (urlPath.startsWith(disallowed)) return false;
  }
  return true;
}
