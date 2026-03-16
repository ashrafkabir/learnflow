/**
 * Topic Decomposition — breaks a learning goal into a concept hierarchy tree.
 */

export interface ConceptNode {
  id: string;
  label: string;
  children: ConceptNode[];
  depth: number;
}

/**
 * Decompose a topic into a concept tree.
 * In production, this would use an LLM. Here we use a deterministic approach.
 */
export function decomposeTopic(topic: string, maxDepth: number = 3): ConceptNode {
  const root: ConceptNode = {
    id: 'root',
    label: topic,
    children: [],
    depth: 0,
  };

  // Generate subtopics based on common learning patterns
  const subtopics = generateSubtopics(topic);

  for (let i = 0; i < subtopics.length; i++) {
    const child: ConceptNode = {
      id: `node-${i}`,
      label: subtopics[i],
      children: [],
      depth: 1,
    };

    if (maxDepth > 1) {
      const grandchildren = generateSubtopics(subtopics[i]).slice(0, 3);
      child.children = grandchildren.map((gc, j) => ({
        id: `node-${i}-${j}`,
        label: gc,
        children: [],
        depth: 2,
      }));
    }

    root.children.push(child);
  }

  return root;
}

function generateSubtopics(topic: string): string[] {
  // Deterministic subtopic generation based on common learning patterns
  const lower = topic.toLowerCase();
  const baseTopics = [
    `Introduction to ${topic}`,
    `Core Concepts of ${topic}`,
    `${topic} Fundamentals`,
    `Advanced ${topic}`,
    `${topic} Best Practices`,
    `${topic} Applications`,
  ];

  // Add domain-specific subtopics
  if (lower.includes('machine learning') || lower.includes('ml') || lower.includes('ai')) {
    return [
      'Supervised Learning',
      'Unsupervised Learning',
      'Neural Networks',
      'Model Evaluation',
      'Feature Engineering',
      'Deep Learning',
    ];
  }

  if (lower.includes('python') || lower.includes('programming')) {
    return [
      'Variables and Data Types',
      'Control Flow',
      'Functions',
      'Object-Oriented Programming',
      'Libraries and Frameworks',
      'Testing and Debugging',
    ];
  }

  return baseTopics;
}

/**
 * Count total nodes in a concept tree.
 */
export function countNodes(node: ConceptNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
