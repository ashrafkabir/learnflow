/**
 * Blog post data — data-driven blog engine.
 * Each post has full markdown content with syntax highlighting support.
 */

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  tag: string;
  tagColor: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'introducing-learnflow',
    title: 'Introducing LearnFlow',
    excerpt:
      'Meet LearnFlow — an AI-powered learning platform that builds personalized courses from the real web using multi-agent AI systems.',
    date: '2025-03-15',
    author: 'LearnFlow Team',
    readTime: '6 min read',
    tag: 'Product',
    tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    content: `## Welcome to LearnFlow

We built LearnFlow because learning online is broken. You paste a topic into a search engine and get millions of results — but no structure, no curriculum, no feedback loop.

**LearnFlow changes that.** Tell us what you want to learn, and our AI agents build a complete, structured course from the best content on the web.

### How It Works

1. **Set your goals** — Tell us what you want to learn and why
2. **AI agents research the web** — Our Course Builder agent crawls real sources, evaluates quality, and synthesizes content
3. **Get a structured course** — Modules, lessons, citations, and a knowledge mindmap
4. **Learn with AI tutors** — Notes agent, exam agent, research agent — all personalized to you

### The Agent Architecture

LearnFlow uses a multi-agent system where each agent specializes in a task:

\`\`\`typescript
const agents = {
  courseBuilder: "Researches and structures courses",
  notes: "Generates Cornell notes, flashcards, Zettelkasten",
  exam: "Creates adaptive quizzes targeting weak spots",
  research: "Deep-dive answers with inline citations",
  summarizer: "Condenses lessons into key takeaways",
};
\`\`\`

Each agent reads the **Student Context Object** — a living document that tracks your goals, progress, and knowledge gaps.

### What's Next

We're launching with support for any topic. Bring your own API key (OpenAI, Anthropic, etc.) and start learning for free. No subscription required for the core experience.

Try it today at [learnflow.app](https://learnflow.app).
`,
  },
  {
    id: 'how-ai-agents-build-courses',
    title: 'How AI Agents Build Your Courses',
    excerpt:
      'A deep dive into the multi-agent pipeline that transforms a topic into a full structured course with real citations.',
    date: '2025-03-10',
    author: 'LearnFlow Team',
    readTime: '8 min read',
    tag: 'Engineering',
    tagColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    content: `## The Course Generation Pipeline

When you type "Teach me about quantum computing," a lot happens behind the scenes. Here's how our multi-agent pipeline works.

### Stage 1: Research & Crawl

The Course Builder agent first identifies key subtopics and concepts:

\`\`\`json
{
  "topic": "quantum computing",
  "concepts": ["qubits", "superposition", "entanglement", "gates", "algorithms"],
  "depth": "intermediate",
  "estimatedModules": 7
}
\`\`\`

It then crawls real web sources — academic papers, tutorials, documentation — using our content pipeline. Each source gets a quality score based on:

- **Authority**: Is this from a known expert or institution?
- **Recency**: How current is the information?
- **Depth**: Does it go beyond surface-level?
- **Citation density**: Does it reference other reliable sources?

### Stage 2: Content Synthesis

The highest-quality sources are fed to the LLM for lesson generation. Each lesson includes:

- **Learning objectives** — What you'll know after reading
- **Core content** — 800-1200 words of rich, technical content
- **Inline citations** — \`[1]\`, \`[2]\` referencing real sources
- **Code blocks** — Where appropriate (Qiskit examples for quantum, etc.)
- **Key takeaways** — Summary of the most important points

### Stage 3: Structure & Sequence

The agent organizes lessons into modules following pedagogical best practices:

1. Start with foundations and prerequisites
2. Build complexity gradually
3. Include hands-on exercises where possible
4. End each module with review and assessment

### Stage 4: Knowledge Graph

Finally, the Mindmap Agent generates a knowledge graph connecting all concepts. Nodes represent topics, edges represent prerequisites and relationships.

This graph powers the Mindmap Explorer — a visual way to see what you know and what you still need to learn.

### Quality Guarantees

Every generated course goes through automated quality checks:
- All lessons have proper citations
- No duplicate content across lessons
- Reading time estimates are calibrated
- Difficulty progression is validated

The result: a university-quality course generated in under a minute.
`,
  },
  {
    id: 'byoai-bring-your-own-keys',
    title: 'BYOAI: Why We Let You Bring Your Own Keys',
    excerpt:
      "Privacy, cost control, and freedom of choice. Here's why LearnFlow uses a Bring Your Own API Key model.",
    date: '2025-03-05',
    author: 'LearnFlow Team',
    readTime: '5 min read',
    tag: 'Philosophy',
    tagColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    content: `## The Problem with AI Middlemen

Most AI-powered apps work the same way: you pay them a subscription, and they use their own API keys behind the scenes. This creates three problems:

1. **No cost transparency** — You don't know what you're paying per query
2. **Vendor lock-in** — You can't switch to a better/cheaper model
3. **Privacy concerns** — Your data flows through their servers

### Our Approach: BYOAI

LearnFlow lets you bring your own API keys. Here's why:

### You Control Your Keys

Your API keys are encrypted with AES-256-GCM before storage:

\`\`\`typescript
// Server-side encryption
const encrypted = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
// Keys are NEVER stored in plaintext
// Keys are NEVER sent to our servers unencrypted
\`\`\`

We store the encrypted key and IV. Only authenticated requests can decrypt and use them.

### You Control Your Costs

With your own API key, you see exactly what each course generation costs. A typical course generation uses:

| Operation | Tokens | Cost (GPT-4o-mini) |
|-----------|--------|---------------------|
| Course structure | ~2,000 | $0.003 |
| 21 lessons | ~63,000 | $0.095 |
| Quiz generation | ~5,000 | $0.008 |
| **Total** | **~70,000** | **~$0.11** |

That's 11 cents for a full course. Compare that to $20/month subscriptions.

### You Choose Your Model

Want to use Claude instead of GPT-4? Prefer a local model via Ollama? LearnFlow's agent system is model-agnostic. Set your preferred provider and model in settings, and all agents will use it.

### The Pro Tier

Don't want to manage API keys? Our Pro tier ($20/month) includes managed API keys, priority agent processing, and unlimited mindmap nodes. But the free tier with BYOAI is a first-class experience — not a trial.

### Trust Through Transparency

We believe the future of AI apps is transparency. You should know what model is being used, how much it costs, and where your data goes. BYOAI is our commitment to that principle.
`,
  },
  {
    id: 'ai-learning-revolution',
    title: 'The AI Learning Revolution: How Agents Are Changing Education',
    excerpt:
      'Multi-agent AI systems are transforming how we learn. From content generation to adaptive quizzes, discover how LearnFlow uses AI agents to create personalized learning experiences.',
    date: '2025-02-28',
    author: 'LearnFlow Team',
    readTime: '8 min read',
    tag: 'AI & Education',
    tagColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    content: `## The Rise of Multi-Agent Learning Systems

Traditional online courses follow a one-size-fits-all approach. You watch videos, read text, and take quizzes that don't adapt to your understanding. **Multi-agent AI systems change everything.**

At LearnFlow, we use a team of specialized AI agents that work together:

- **Course Builder Agent** — Researches the web and creates structured courses from any topic
- **Notes Agent** — Generates Cornell notes, flashcards, and Zettelkasten entries from your lessons
- **Exam Agent** — Creates adaptive quizzes that target your weak spots
- **Research Agent** — Provides deep-dive answers backed by real sources with inline citations

### Why Agents > Single Models

A single large language model can do many things, but it can't do them all well simultaneously. By decomposing the learning process into specialized agents, each one can:

1. Focus on its specific task
2. Use the right tools for the job
3. Collaborate with other agents when needed
4. Maintain context about YOUR learning journey

### The Student Context Object

At the heart of LearnFlow is the **Student Context Object** — a living document that tracks:

- Your learning goals and interests
- Knowledge graph of what you've learned
- Quiz performance and identified gaps
- Preferred learning style and pace

Every agent reads and updates this context, ensuring a truly personalized experience.

## What's Next

We're working on collaborative learning features, real-time CRDT-based note sharing, and an agent marketplace where the community can build and share specialized tutoring agents.

The future of learning isn't watching videos. It's having a team of AI agents that understand you and adapt to help you master anything.
`,
  },
  {
    id: 'cornell-notes-guide',
    title: 'The Complete Guide to Cornell Notes with AI',
    excerpt:
      'Cornell notes are one of the most effective study methods. Learn how to combine this proven technique with AI-generated cue questions and summaries for maximum retention.',
    date: '2025-02-20',
    author: 'LearnFlow Team',
    readTime: '6 min read',
    tag: 'Study Tips',
    tagColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    content: `## What Are Cornell Notes?

The Cornell Note System was developed in the 1950s by Walter Pauk at Cornell University. It divides your page into three sections:

1. **Notes Column** (right) — Main notes during the lecture/reading
2. **Cue Column** (left) — Keywords, questions, and triggers written after
3. **Summary** (bottom) — A brief summary of the page

### Why It Works

Research shows that the act of **reviewing and summarizing** is what makes Cornell notes so effective.

## AI-Enhanced Cornell Notes

LearnFlow's Notes Agent takes this to the next level with automatic cue questions, smart summaries, and flashcard generation.
`,
  },
];

export function getBlogPost(id: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.id === id);
}

export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS;
}
