import { Router, Request, Response } from 'express';
import { emitToUser } from '../wsHub.js';
import { z } from 'zod';
import { crawlSourcesForTopic, type FirecrawlSource } from '@learnflow/agents';
import {
  dbCourses,
  dbLessonSources,
  dbProgress,
  dbNotes,
  dbIllustrations,
  dbAnnotations,
  dbEvents,
  sqlite,
} from '../db.js';
import { parseLessonSources, type LessonSource } from '../utils/sources.js';
import { enforceBiteSizedLesson } from '../utils/lessonSizing.js';
import { getOpenAIForRequest } from '../llm/openai.js';
import { sendError } from '../errors.js';
import { validateBody } from '../validation.js';

const router = Router();

// Course generation data — topic-specific content templates
const TOPIC_CONTENT: Record<
  string,
  {
    concepts: string[];
    modules: Array<{
      title: string;
      objective: string;
      lessons: Array<{ title: string; description: string }>;
    }>;
  }
> = {
  'agentic ai': {
    concepts: [
      'agents',
      'autonomy',
      'planning',
      'tool use',
      'memory',
      'multi-agent',
      'orchestration',
      'safety',
      'reasoning',
      'perception',
    ],
    modules: [
      {
        title: 'Introduction to AI Agents and Autonomy',
        objective: 'Understand the fundamentals of autonomous AI agents and their architectures',
        lessons: [
          {
            title: 'What Are AI Agents? Definitions and Core Concepts',
            description:
              'Explore the definition of AI agents, autonomy levels, and the agent paradigm',
          },
          {
            title: 'The Agent Architecture: Perception, Reasoning, and Action',
            description: 'Learn how agents perceive, reason about, and act on their environment',
          },
          {
            title: 'History and Evolution of Autonomous Systems',
            description: 'Trace the development from rule-based systems to modern LLM agents',
          },
        ],
      },
      {
        title: 'Planning and Reasoning in Agents',
        objective: 'Master how agents decompose goals and plan multi-step actions',
        lessons: [
          {
            title: 'Goal Decomposition and Task Planning',
            description: 'How agents break complex goals into actionable sub-tasks',
          },
          {
            title: 'Chain-of-Thought and Tree-of-Thought Reasoning',
            description: 'Advanced reasoning patterns for complex decision-making',
          },
          {
            title: 'ReAct: Combining Reasoning with Action',
            description: 'The ReAct framework for interleaving thought and action',
          },
        ],
      },
      {
        title: 'Tool Use and Environment Interaction',
        objective: 'Understand how agents leverage external tools and APIs',
        lessons: [
          {
            title: 'Function Calling and Tool Integration',
            description: 'How LLM agents select and invoke external tools',
          },
          {
            title: 'Web Browsing and Code Execution Agents',
            description: 'Agents that navigate the web and write/run code',
          },
          {
            title: 'Building Custom Tool Libraries',
            description: 'Creating extensible tool registries for agent systems',
          },
        ],
      },
      {
        title: 'Memory Systems for Agents',
        objective: 'Learn how agents maintain context across interactions',
        lessons: [
          {
            title: 'Short-Term vs Long-Term Memory in Agents',
            description: 'Memory architectures including working memory and persistent storage',
          },
          {
            title: 'Retrieval-Augmented Generation (RAG) for Agents',
            description: 'Using vector databases and retrieval to extend agent knowledge',
          },
          {
            title: 'Episodic and Semantic Memory Patterns',
            description: 'How agents build and query different memory types',
          },
        ],
      },
      {
        title: 'Multi-Agent Systems and Orchestration',
        objective: 'Design systems where multiple agents collaborate',
        lessons: [
          {
            title: 'Multi-Agent Architectures: Hierarchical and Flat',
            description: 'Patterns for organizing multiple cooperating agents',
          },
          {
            title: 'Agent Communication Protocols',
            description: 'How agents share information and coordinate actions',
          },
          {
            title: 'Orchestration Frameworks: LangGraph, CrewAI, AutoGen',
            description: 'Survey of popular multi-agent orchestration tools',
          },
        ],
      },
      {
        title: 'Safety, Alignment, and Guardrails',
        objective: 'Ensure agents operate safely within defined boundaries',
        lessons: [
          {
            title: 'Agent Safety: Sandboxing and Permission Models',
            description: 'Constraining agent actions to prevent harmful outcomes',
          },
          {
            title: 'Alignment and Value Specification',
            description: 'Ensuring agents pursue intended goals faithfully',
          },
          {
            title: 'Monitoring, Observability, and Human-in-the-Loop',
            description: 'Building oversight systems for autonomous agents',
          },
        ],
      },
      {
        title: 'Advanced Applications and Future Frontiers',
        objective: 'Explore cutting-edge applications and research directions',
        lessons: [
          {
            title: 'Agentic Workflows in Enterprise Settings',
            description: 'Real-world deployments of AI agents in business processes',
          },
          {
            title: 'Self-Improving and Meta-Learning Agents',
            description: 'Agents that learn to learn and improve their own capabilities',
          },
          {
            title: 'The Future of Autonomous AI: Challenges and Opportunities',
            description: 'Open research questions and emerging trends in agentic AI',
          },
        ],
      },
    ],
  },
  rust: {
    concepts: [
      'ownership',
      'borrowing',
      'lifetimes',
      'traits',
      'pattern matching',
      'concurrency',
      'cargo',
      'unsafe',
      'error handling',
      'macros',
    ],
    modules: [
      {
        title: 'Fundamentals of Rust Programming',
        objective: 'Learn Rust syntax, types, and basic programming constructs',
        lessons: [
          {
            title: 'Getting Started with Rust and Cargo',
            description: 'Install Rust, set up cargo, and write your first program',
          },
          {
            title: 'Variables, Types, and Control Flow',
            description: 'Rust type system, mutability, and control structures',
          },
          {
            title: 'Functions, Modules, and Crates',
            description: 'Organizing Rust code into reusable components',
          },
        ],
      },
      {
        title: 'Ownership and Borrowing',
        objective: "Master Rust's unique ownership model for memory safety",
        lessons: [
          {
            title: 'The Ownership System Explained',
            description: 'Move semantics, copy semantics, and ownership rules',
          },
          {
            title: 'Borrowing and References',
            description: 'Shared and mutable references, borrowing rules',
          },
          {
            title: 'Lifetimes: Ensuring Reference Validity',
            description: 'Lifetime annotations and the borrow checker',
          },
        ],
      },
      {
        title: 'Traits and Generics',
        objective: 'Write generic, reusable code with Rust traits',
        lessons: [
          {
            title: 'Defining and Implementing Traits',
            description: 'Trait definitions, default methods, and trait bounds',
          },
          {
            title: 'Generics and Monomorphization',
            description: 'Generic types, functions, and zero-cost abstractions',
          },
          {
            title: 'Advanced Trait Patterns: Trait Objects and Dispatch',
            description: 'Dynamic dispatch, dyn Trait, and object safety',
          },
        ],
      },
      {
        title: 'Pattern Matching and Error Handling',
        objective: 'Handle complex data flows with pattern matching and Result/Option',
        lessons: [
          {
            title: 'Pattern Matching with match and if let',
            description: 'Destructuring, guards, and exhaustive matching',
          },
          {
            title: 'Error Handling with Result and Option',
            description: 'The ? operator, custom errors, and error propagation',
          },
          {
            title: 'Building Robust Error Hierarchies',
            description: 'thiserror, anyhow, and production error patterns',
          },
        ],
      },
      {
        title: 'Concurrency and Parallelism',
        objective: 'Write safe concurrent programs with Rust guarantees',
        lessons: [
          {
            title: 'Threads and Message Passing',
            description: 'std::thread, channels, and Send/Sync traits',
          },
          {
            title: 'Shared State Concurrency: Mutex and Arc',
            description: 'Safe shared mutable state in concurrent contexts',
          },
          {
            title: 'Async Rust: Futures, Tokio, and async/await',
            description: 'Asynchronous programming with the Rust async ecosystem',
          },
        ],
      },
      {
        title: 'Systems Programming with Rust',
        objective: "Build systems-level software leveraging Rust's capabilities",
        lessons: [
          {
            title: 'Working with Unsafe Rust',
            description: 'When and how to use unsafe code safely',
          },
          {
            title: 'FFI: Interfacing with C and Other Languages',
            description: 'Foreign function interface and cross-language interop',
          },
          {
            title: 'Building CLIs and System Tools',
            description: 'clap, serde, and systems programming patterns',
          },
        ],
      },
      {
        title: 'Advanced Rust and Real-World Applications',
        objective: 'Apply advanced Rust features to production systems',
        lessons: [
          {
            title: 'Macros: Declarative and Procedural',
            description: 'Writing macros for metaprogramming and code generation',
          },
          {
            title: 'Performance Optimization and Profiling',
            description: 'Benchmarking, profiling, and optimizing Rust code',
          },
          {
            title: 'Real-World Rust: Web Services, Embedded, and Beyond',
            description: 'Production Rust in web (Axum, Actix), embedded, and WASM',
          },
        ],
      },
    ],
  },
  'prompt engineering': {
    concepts: [
      'zero-shot',
      'few-shot',
      'chain of thought',
      'system prompt',
      'fine-tuning',
      'LoRA',
      'RLHF',
      'evaluation',
      'prompt injection',
      'retrieval',
    ],
    modules: [
      {
        title: 'Introduction to Prompt Engineering Fundamentals',
        objective: 'Understand how language models process prompts and generate responses',
        lessons: [
          {
            title: 'How LLMs Work: Tokens, Attention, and Generation',
            description: 'The mechanics behind language model inference',
          },
          {
            title: 'Zero-Shot Prompting: Getting Results Without Examples',
            description: 'Crafting effective zero-shot prompts for various tasks',
          },
          {
            title: 'Few-Shot Prompting: Learning from Examples',
            description: 'Using in-context examples to guide model behavior',
          },
        ],
      },
      {
        title: 'Advanced Prompting Techniques',
        objective: 'Master sophisticated prompting strategies for complex reasoning',
        lessons: [
          {
            title: 'Chain of Thought Prompting',
            description: 'Eliciting step-by-step reasoning for better accuracy',
          },
          {
            title: 'System Prompts and Role Engineering',
            description: 'Designing effective system prompts for consistent behavior',
          },
          {
            title: 'Self-Consistency and Ensemble Prompting',
            description: 'Using multiple generations to improve reliability',
          },
        ],
      },
      {
        title: 'Structured Output and Tool Integration',
        objective: 'Get LLMs to produce structured, machine-readable outputs',
        lessons: [
          {
            title: 'JSON Mode and Schema-Constrained Generation',
            description: 'Forcing structured output formats from language models',
          },
          {
            title: 'Function Calling and Tool Use Prompts',
            description: 'Prompting models to select and invoke external tools',
          },
          {
            title: 'Multi-Turn Conversation Design',
            description: 'Building effective conversation flows and memory patterns',
          },
        ],
      },
      {
        title: 'Fine-Tuning and Model Customization',
        objective: 'Adapt language models to specific domains and tasks',
        lessons: [
          {
            title: 'When to Fine-Tune vs Prompt Engineer',
            description: 'Decision framework for customization approaches',
          },
          {
            title: 'LoRA and QLoRA: Efficient Fine-Tuning',
            description: 'Low-rank adaptation for resource-efficient training',
          },
          {
            title: 'RLHF: Aligning Models with Human Preferences',
            description: 'Reinforcement learning from human feedback methodology',
          },
        ],
      },
      {
        title: 'Evaluation and Quality Assurance',
        objective: 'Measure and improve prompt and model performance systematically',
        lessons: [
          {
            title: 'Evaluation Metrics for LLM Outputs',
            description: 'BLEU, ROUGE, human evaluation, and LLM-as-judge',
          },
          {
            title: 'Building Eval Suites and Benchmarks',
            description: 'Systematic testing of prompt performance across scenarios',
          },
          {
            title: 'Prompt Injection and Security',
            description: 'Understanding and defending against adversarial prompts',
          },
        ],
      },
      {
        title: 'Retrieval-Augmented Generation',
        objective: 'Combine retrieval systems with LLMs for grounded responses',
        lessons: [
          {
            title: 'RAG Architecture: Retrieval + Generation',
            description: 'Building end-to-end RAG pipelines',
          },
          {
            title: 'Vector Databases and Embedding Models',
            description: 'Choosing and configuring retrieval infrastructure',
          },
          {
            title: 'Advanced RAG: Re-ranking, Filtering, and Hybrid Search',
            description: 'Optimizing retrieval quality for better generation',
          },
        ],
      },
      {
        title: 'Advanced Topics and Future of Prompt Engineering',
        objective: 'Explore cutting-edge techniques and emerging research',
        lessons: [
          {
            title: 'Multimodal Prompting: Images, Audio, and Video',
            description: 'Prompting models across different modalities',
          },
          {
            title: 'Autonomous Agents and Prompt Chaining',
            description: 'Building complex workflows from prompt components',
          },
          {
            title: 'The Future of Human-AI Interaction',
            description: 'Emerging patterns and research directions',
          },
        ],
      },
    ],
  },
  climate: {
    concepts: [
      'carbon credits',
      'cap and trade',
      'carbon capture',
      'renewable',
      'ESG',
      'net zero',
      'scope 1',
      'scope 2',
      'scope 3',
      'offset',
    ],
    modules: [
      {
        title: 'Foundations of Climate Science and Policy',
        objective: 'Understand the scientific basis and policy landscape of climate change',
        lessons: [
          {
            title: 'Climate Science Basics: The Greenhouse Effect',
            description: 'How greenhouse gases trap heat and drive warming',
          },
          {
            title: 'International Climate Agreements: Paris and Beyond',
            description: 'Key global agreements and their targets',
          },
          {
            title: 'Scope 1, Scope 2, and Scope 3 Emissions',
            description: 'Understanding emission categories and measurement',
          },
        ],
      },
      {
        title: 'Carbon Markets and Trading Mechanisms',
        objective: 'Learn how carbon pricing and trading systems work',
        lessons: [
          {
            title: 'Cap and Trade Systems Explained',
            description: 'How emission allowances are allocated and traded',
          },
          {
            title: 'Carbon Credits and Offset Markets',
            description: 'Voluntary and compliance carbon credit markets',
          },
          {
            title: 'Carbon Pricing: Taxes vs Trading',
            description: 'Comparing carbon tax and ETS approaches globally',
          },
        ],
      },
      {
        title: 'Renewable Energy Technologies',
        objective: 'Explore renewable energy sources and their economics',
        lessons: [
          {
            title: 'Solar and Wind: The Leading Renewables',
            description: 'Technology, costs, and deployment trends',
          },
          {
            title: 'Energy Storage and Grid Integration',
            description: 'Battery technology and grid modernization challenges',
          },
          {
            title: 'Emerging Renewables: Hydrogen, Geothermal, Tidal',
            description: 'Next-generation clean energy technologies',
          },
        ],
      },
      {
        title: 'Carbon Capture and Removal Technologies',
        objective: 'Understand technologies for removing CO2 from the atmosphere',
        lessons: [
          {
            title: 'Direct Air Capture (DAC) Technologies',
            description: 'How DAC works and current commercial deployments',
          },
          {
            title: 'Nature-Based Solutions: Forests, Oceans, Soil',
            description: 'Biological carbon sequestration approaches',
          },
          {
            title: 'Carbon Capture and Storage (CCS) at Scale',
            description: 'Industrial CCS technology and infrastructure',
          },
        ],
      },
      {
        title: 'ESG Frameworks and Corporate Sustainability',
        objective: 'Navigate ESG reporting and corporate net-zero commitments',
        lessons: [
          {
            title: 'ESG Reporting Standards: GRI, SASB, TCFD',
            description: 'Key frameworks for sustainability disclosure',
          },
          {
            title: 'Net Zero Strategies for Corporations',
            description: 'Setting and achieving science-based targets',
          },
          {
            title: 'Greenwashing and Accountability',
            description: 'Identifying and preventing false sustainability claims',
          },
        ],
      },
      {
        title: 'Climate Tech Investment and Innovation',
        objective: 'Explore the climate tech startup and investment landscape',
        lessons: [
          {
            title: 'The Climate Tech Venture Landscape',
            description: 'Key sectors, funding trends, and notable startups',
          },
          {
            title: 'Climate Finance: Green Bonds and Impact Investing',
            description: 'Financial instruments for climate action',
          },
          {
            title: 'Policy Incentives: IRA, EU Green Deal',
            description: 'Government programs driving climate innovation',
          },
        ],
      },
      {
        title: 'Practical Applications and Future Outlook',
        objective: 'Apply climate knowledge to real-world decision-making',
        lessons: [
          {
            title: 'Building a Corporate Carbon Strategy',
            description: 'Practical steps for measuring and reducing emissions',
          },
          {
            title: 'Climate Adaptation and Resilience',
            description: 'Preparing for unavoidable climate impacts',
          },
          {
            title: 'The Path to Net Zero: Challenges and Opportunities',
            description: 'Global progress, gaps, and the road ahead',
          },
        ],
      },
    ],
  },
  quantum: {
    concepts: [
      'qubit',
      'superposition',
      'entanglement',
      'quantum gate',
      'decoherence',
      'error correction',
      'algorithm',
      'measurement',
      'circuit',
    ],
    modules: [
      {
        title: 'Introduction to Quantum Computing Fundamentals',
        objective:
          'Understand the basic principles that distinguish quantum from classical computing',
        lessons: [
          {
            title: 'Classical vs Quantum Computing: Why It Matters',
            description: 'The fundamental differences and potential advantages',
          },
          {
            title: 'The Qubit: Superposition and Measurement',
            description: 'How qubits represent and process information',
          },
          {
            title: 'Quantum Entanglement and Bell States',
            description: 'The phenomenon of quantum correlations',
          },
        ],
      },
      {
        title: 'Quantum Gates and Circuits',
        objective: 'Learn how quantum computations are structured',
        lessons: [
          {
            title: 'Single-Qubit Gates: Hadamard, Pauli, Phase',
            description: 'Fundamental operations on individual qubits',
          },
          {
            title: 'Multi-Qubit Gates: CNOT, Toffoli, SWAP',
            description: 'Entangling operations for multi-qubit systems',
          },
          {
            title: 'Building Quantum Circuits',
            description: 'Composing gates into computational circuits',
          },
        ],
      },
      {
        title: 'Quantum Algorithms',
        objective: 'Study the algorithms that provide quantum advantage',
        lessons: [
          {
            title: 'Deutsch-Jozsa and Bernstein-Vazirani Algorithms',
            description: 'Early demonstrations of quantum speedup',
          },
          {
            title: "Grover's Search Algorithm",
            description: 'Quadratic speedup for unstructured search',
          },
          {
            title: "Shor's Algorithm and Quantum Factoring",
            description: 'Exponential speedup for integer factorization',
          },
        ],
      },
      {
        title: 'Quantum Error Correction and Decoherence',
        objective: 'Understand the challenges of maintaining quantum information',
        lessons: [
          {
            title: 'Decoherence and Quantum Noise',
            description: 'How environmental interactions destroy quantum states',
          },
          {
            title: 'Quantum Error Correction Codes',
            description: 'The surface code and other error correction schemes',
          },
          {
            title: 'Fault-Tolerant Quantum Computing',
            description: 'Building reliable computation from noisy qubits',
          },
        ],
      },
      {
        title: 'Quantum Hardware Platforms',
        objective: 'Survey the physical implementations of quantum computers',
        lessons: [
          {
            title: 'Superconducting Qubits: IBM, Google',
            description: 'The leading hardware approach and recent milestones',
          },
          {
            title: 'Trapped Ions, Photonics, and Neutral Atoms',
            description: 'Alternative quantum computing platforms',
          },
          {
            title: 'Quantum Simulators and Annealers',
            description: 'Special-purpose quantum devices',
          },
        ],
      },
      {
        title: 'Quantum Programming and Tools',
        objective: 'Get hands-on with quantum programming frameworks',
        lessons: [
          {
            title: 'Qiskit: Programming IBM Quantum Computers',
            description: 'Building and running quantum circuits with Qiskit',
          },
          {
            title: 'Cirq, PennyLane, and Other Frameworks',
            description: 'Survey of quantum programming tools',
          },
          {
            title: 'Quantum Machine Learning Basics',
            description: 'Variational circuits and quantum neural networks',
          },
        ],
      },
      {
        title: 'Applications and Future of Quantum Computing',
        objective: 'Explore real-world applications and the quantum roadmap',
        lessons: [
          {
            title: 'Quantum Chemistry and Drug Discovery',
            description: 'Simulating molecules for pharmaceutical applications',
          },
          {
            title: 'Quantum Cryptography and Post-Quantum Security',
            description: 'Quantum key distribution and quantum-safe algorithms',
          },
          {
            title: 'The Quantum Future: From NISQ to Fault-Tolerant',
            description: 'Timeline, challenges, and the path to quantum advantage',
          },
        ],
      },
    ],
  },
};

function matchTopic(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('agentic') || lower.includes('autonomous agent')) return 'agentic ai';
  if (lower.includes('rust')) return 'rust';
  if (lower.includes('prompt') || lower.includes('llm') || lower.includes('fine-tun'))
    return 'prompt engineering';
  if (lower.includes('climate') || lower.includes('carbon')) return 'climate';
  if (lower.includes('quantum')) return 'quantum';
  // Default fallback
  return 'quantum';
}

export async function generateLessonContentWithLLM(
  topic: string,
  moduleTitle: string,
  lessonTitle: string,
  lessonDesc: string,
  crawledSources?: FirecrawlSource[],
  llm?: { openai?: any } | null,
): Promise<string> {
  // Build source context from crawled content
  const sourceContext =
    crawledSources && crawledSources.length > 0
      ? crawledSources
          .slice(0, 4)
          .map(
            (s, i) =>
              `[Source ${i + 1}] "${s.title}" by ${s.author || 'Unknown'} (${s.domain})\nURL: ${s.url}\nContent excerpt: ${(s.content || '').slice(0, 1500)}`,
          )
          .join('\n\n')
      : '';

  const sourceRefs = crawledSources && crawledSources.length > 0 ? crawledSources.slice(0, 4) : [];

  const openai = (llm as any)?.openai || null;
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 3000,
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content writer. Write a comprehensive, engaging lesson for an online learning platform. 

Requirements:
- The lesson must be bite-sized: target 500-900 words (<= ~10 minutes at 200 wpm)
- Use specific examples, analogies, and code blocks where appropriate
- Include inline citations like [1], [2] referencing the provided sources
- Be specific and technical — avoid generic platitudes
- Use markdown formatting with headers, bold, lists, and code blocks
- Structure: Learning Objectives → Estimated Time → Core Content (2-3 subsections) → Key Takeaways → Sources → Next Steps`,
          },
          {
            role: 'user',
            content: `Write a lesson titled "${lessonTitle}" for the module "${moduleTitle}" in a course on "${topic}".

Lesson description: ${lessonDesc}

${sourceContext ? `Use these real sources as the basis for your content:\n\n${sourceContext}` : 'Write based on your knowledge of the topic.'}

Format the output as markdown starting with # ${lessonTitle}

End with a ## Sources section listing:
${sourceRefs.map((s, i) => `[${i + 1}] ${s.author || 'Unknown'}. "${s.title}". ${s.source || s.domain}, ${s.publishDate ? new Date(s.publishDate).getFullYear() : 2024}. ${s.url}`).join('\n') || '[1] Use your knowledge to cite relevant works.'}

Then a ## Next Steps section.`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      if (content && content.length > 200) {
        return content;
      }
    } catch (err) {
      console.warn('[LearnFlow] OpenAI lesson generation failed, using fallback:', err);
    }
  }

  // Fallback: structured template.
  // IMPORTANT: never emit fake/example links. If we have no crawled sources, provide a minimal
  // "no sources" section instead of placeholder citations.
  const sources =
    sourceRefs.length > 0
      ? sourceRefs.map((s) => ({
          url: s.url,
          author: s.author || 'Unknown',
          publication: s.source || s.domain,
          year: s.publishDate ? new Date(s.publishDate).getFullYear() : 2024,
        }))
      : [];

  const sel = sources.sort(() => Math.random() - 0.5).slice(0, 4);

  return `# ${lessonTitle}

## Learning Objectives

By the end of this lesson, you will be able to:

- Understand the core principles of ${lessonDesc.toLowerCase()}
- Apply key concepts from ${moduleTitle.toLowerCase()} in practical scenarios
- Evaluate different approaches and their trade-offs in the context of ${topic}

## Estimated Time

**8 minutes** (~1200 words)

## Core Content

### Understanding ${lessonTitle}

${lessonDesc}. This is a critical area within the broader field of ${topic}.

### Key Principles and Concepts

**Theoretical Foundations**: The theoretical basis draws from decades of research and practice.

**Practical Implementation**: Moving from theory to practice requires understanding tools, frameworks, and best practices that the community has developed.

**Evaluation and Metrics**: Measuring success requires both quantitative metrics and qualitative assessment.

### Real-World Applications

1. **Technology**: Automated systems leverage these concepts for improved efficiency
2. **Research**: Academic institutions use these approaches for breakthrough discoveries
3. **Industry**: Enterprises apply these techniques for competitive advantage

## Key Takeaways

1. ${lessonTitle} is foundational to understanding ${topic}
2. The field combines theoretical principles with practical implementation patterns
3. Evaluation and measurement are critical for assessing progress
4. Real-world applications demonstrate the value across multiple domains
5. Staying current with research advances is essential

## Sources

${
  sel.length > 0
    ? sel
        .map(
          (s, i) =>
            `[${i + 1}] ${s.author}. "${lessonTitle}." ${s.publication}, ${s.year}. ${s.url}`,
        )
        .join('\n\n')
    : '_No external sources were available for this lesson generation run._'
}

## Next Steps

Continue with the next lesson in this module to deepen your understanding.`;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedTime: number;
  wordCount: number;
  sources?: LessonSource[];
}

interface Module {
  id: string;
  title: string;
  objective: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  depth: string;
  authorId: string;
  modules: Module[];
  progress: Record<string, number>;
  createdAt: string;
}

// Courses are now stored in SQLite via dbCourses
// This Map is a runtime cache, synced from SQLite on startup
export const courses: Map<string, Course> = new Map();
for (const c of dbCourses.getAll()) courses.set(c.id, c as Course);

const createCourseSchema = z.object({
  topic: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  depth: z.string().optional(),
  max_lessons: z.number().optional(),
});

// GET /api/v1/courses - List courses
router.get('/', (_req: Request, res: Response) => {
  const allCourses = Array.from(courses.values()).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    topic: c.topic,
    depth: c.depth,
    moduleCount: c.modules.length,
    lessonCount: c.modules.reduce((s, m) => s + m.lessons.length, 0),
  }));
  res.status(200).json({ courses: allCourses });
});

// POST /api/v1/courses - Create/generate a full course
router.post('/', validateBody(createCourseSchema), async (req: Request, res: Response) => {
  const { topic, depth = 'intermediate' } = req.body;
  const topicKey = matchTopic(topic);
  const topicData = TOPIC_CONTENT[topicKey] || TOPIC_CONTENT['quantum'];

  const courseId = `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Enforce free-tier course limit server-side (client also guards, but server must be source of truth).
  // NOTE: Marketplace/creator courses could be excluded in future; for now we cap total personal courses.
  const tier = req.user?.tier || 'free';
  if (tier !== 'pro') {
    const authorId = req.user?.sub || 'anonymous';
    const existingCount = Array.from(courses.values()).filter(
      (c) => c.authorId === authorId,
    ).length;
    const FREE_LIMIT = 3;
    if (existingCount >= FREE_LIMIT) {
      sendError(res, req, {
        status: 402,
        code: 'payment_required',
        message: 'Free plan is limited to 3 courses. Upgrade to Pro for unlimited courses.',
        details: {
          tier,
          limit: FREE_LIMIT,
          count: existingCount,
        },
      });
      return;
    }
  }

  // Task 1: Content sourcing — crawl real sources for this topic
  let crawledSources: FirecrawlSource[] = [];
  const _crawlStart = Date.now();

  if (process.env.NODE_ENV === 'test') {
    // In tests, do NOT hit the network. Keep this deterministic and fast.
    crawledSources = [
      {
        url: 'https://en.wikipedia.org/wiki/Software_testing',
        title: 'Software testing — Wikipedia',
        author: 'Wikipedia contributors',
        publishDate: null,
        source: 'wikipedia.org',
        content:
          'Software testing is the act of evaluating and verifying that a software product or application does what it is supposed to do.',
        credibilityScore: 0.72,
        relevanceScore: 0.9,
        recencyScore: 0.6,
        wordCount: 24,
        domain: 'wikipedia.org',
      },
      {
        url: 'https://developer.mozilla.org/en-US/docs/Learn',
        title: 'Learn web development — MDN',
        author: 'MDN contributors',
        publishDate: null,
        source: 'developer.mozilla.org',
        content: 'MDN provides learning resources and guides for web development.',
        credibilityScore: 0.9,
        relevanceScore: 0.6,
        recencyScore: 0.6,
        wordCount: 10,
        domain: 'developer.mozilla.org',
      },
      {
        url: 'https://kubernetes.io/docs/home/',
        title: 'Kubernetes Documentation',
        author: 'Kubernetes Authors',
        publishDate: null,
        source: 'kubernetes.io',
        content:
          'Kubernetes is an open-source system for automating deployment, scaling, and management of containerized applications.',
        credibilityScore: 0.9,
        relevanceScore: 0.55,
        recencyScore: 0.6,
        wordCount: 17,
        domain: 'kubernetes.io',
      },
    ];
    console.log(
      `[LearnFlow] (test) crawlSourcesForTopic skipped network, using ${crawledSources.length} deterministic sources`,
    );
  } else {
    try {
      crawledSources = await crawlSourcesForTopic(topic);
      console.log(
        `[LearnFlow] crawlSourcesForTopic took ${Date.now() - _crawlStart}ms, got ${crawledSources.length} sources`,
      );
      // NOTE: We no longer require FIRECRAWL_API_KEY for spec compliance in dev.
      // The default provider uses free multi-source search + readability scraping.
      if (!process.env.FIRECRAWL_API_KEY) {
        console.warn(
          '[LearnFlow] FIRECRAWL_API_KEY not set — using WebSearch provider (real sources, no paid key)',
        );
      }
    } catch (err) {
      console.warn('[LearnFlow] Firecrawl crawl failed, falling back to static sources:', err);
    }
  }

  // Generate all lessons with LLM (parallel per module, sequential per lesson for rate limits)
  const { client: openai } = getOpenAIForRequest({
    userId: req.user!.sub,
    tier: req.user!.tier,
  });

  // In tests, we should never hit the network even if OPENAI_API_KEY is set in the environment.
  const effectiveOpenAi = process.env.NODE_ENV === 'test' ? null : openai;
  const _lessonStart = Date.now();
  const modules: Module[] = [];

  // In test mode, keep course creation fast/deterministic.
  // We still return a valid course structure, but skip expensive network-based lesson generation.
  const fastTestMode = process.env.NODE_ENV === 'test';

  for (let mi = 0; mi < topicData.modules.length; mi++) {
    const mod = topicData.modules[mi];
    const lessonPromises = mod.lessons.map(async (les, li) => {
      const content = fastTestMode
        ? `# ${les.title}\n\n${les.description}\n\n(Generated in test fast mode)`
        : await generateLessonContentWithLLM(
            topic,
            mod.title,
            les.title,
            les.description,
            crawledSources,
            { openai: effectiveOpenAi },
          );
      const enforced = enforceBiteSizedLesson(content, { maxMinutes: 10 });
      const contentFinal = enforced.content;
      const wordCount = enforced.sizing.wordCount;
      const estimatedMinutes = Math.min(10, enforced.sizing.estimatedMinutes);
      const sources = parseLessonSources(contentFinal);
      const missingReason =
        sources.length >= 2 ? '' : 'attribution_gate: lesson has fewer than 2 resolvable sources';
      try {
        dbLessonSources.save(`${courseId}-m${mi}-l${li}`, courseId, sources, missingReason);
      } catch {
        // best effort
      }
      return {
        id: `${courseId}-m${mi}-l${li}`,
        title: les.title,
        description: les.description,
        content: contentFinal,
        estimatedTime: estimatedMinutes,
        wordCount,
        sources,
      };
    });
    const lessons: Lesson[] = await Promise.all(lessonPromises);
    modules.push({
      id: `${courseId}-m${mi}`,
      title: mod.title,
      objective: mod.objective,
      description: mod.objective,
      lessons,
    });
  }

  const course: Course = {
    id: courseId,
    title: req.body.title || `Mastering ${topic}`,
    description: req.body.description || `A comprehensive ${depth}-level course on ${topic}`,
    topic,
    depth,
    authorId: req.user?.sub || 'anonymous',
    modules,
    progress: {},
    createdAt: new Date().toISOString(),
  };

  courses.set(course.id, course);
  dbCourses.save(course);
  console.log(
    `[LearnFlow] Lesson generation took ${Date.now() - _lessonStart}ms for ${topicData.modules.length} modules`,
  );
  // Attribution gate: course is only "ready" when every lesson has >= 2 resolvable sources.
  const lessonsAll = course.modules.flatMap((m) => m.lessons);
  const lessonsMissing = lessonsAll.filter((l) => (l.sources?.length || 0) < 2);

  const attributionReady = lessonsMissing.length === 0;

  res.status(201).json({
    ...course,
    attributionReady,
    attributionIssues: attributionReady
      ? []
      : lessonsMissing.map((l) => ({
          lessonId: l.id,
          title: l.title,
          sourceCount: l.sources?.length || 0,
          missingReason: 'attribution_gate: lesson has fewer than 2 resolvable sources',
        })),
  });
});

// DELETE /api/v1/courses/:id - Delete a course (and cascade related rows)
router.delete('/:id', (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const existing = courses.get(courseId) || dbCourses.getById(courseId);
  if (!existing) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  // Remove from runtime cache
  courses.delete(courseId);

  // Best-effort cleanup of non-FK tables that reference courseId.
  // - lessons table cascades via FK from courses
  // - progress table does NOT have FK; delete explicit.
  try {
    sqlite.prepare('DELETE FROM progress WHERE courseId = ?').run(courseId);
  } catch {
    // best effort
  }

  // Remove the course row (lessons cascade)
  dbCourses.delete(courseId);

  res.status(204).end();
});

// GET /api/v1/courses/:id - Get course detail
router.get('/:id', (req: Request, res: Response) => {
  const course = courses.get(String(req.params.id));
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }
  const userId = req.user?.sub || 'anonymous';
  const completedLessons = dbProgress.getCompletedLessons(userId, course.id);
  res.status(200).json({ ...course, completedLessons });
});

// GET /api/v1/courses/:id/lessons/:lessonId - Get lesson
router.get('/:id/lessons/:lessonId', (req: Request, res: Response) => {
  const course = courses.get(String(req.params.id));
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }
  let lesson: Lesson | undefined;
  for (const mod of course.modules) {
    lesson = mod.lessons.find((l) => l.id === req.params.lessonId);
    if (lesson) break;
  }
  if (!lesson) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Lesson not found' });
    return;
  }

  // Provide structured sources when possible; client can fall back to parsing markdown.
  // NOTE: This is best-effort. If lesson content doesn't include a Sources section, sources may be empty.
  const persisted = (() => {
    try {
      return dbLessonSources.get(lesson.id) as { sources: LessonSource[]; missingReason?: string };
    } catch {
      return { sources: [] as LessonSource[], missingReason: '' };
    }
  })();

  const sources =
    (persisted?.sources?.length || 0) > 0 ? persisted.sources : parseLessonSources(lesson.content);

  const sourcesMissingReason =
    sources.length >= 2
      ? ''
      : persisted?.missingReason || 'attribution_gate: sources missing from lesson';

  // Record an event for analytics.
  try {
    dbEvents.add(req.user!.sub, {
      type: 'lesson.opened',
      courseId: course.id,
      lessonId: lesson.id,
      meta: {},
    });
  } catch {
    // best effort
  }

  res.status(200).json({ ...lesson, sources, sourcesMissingReason });
});

// POST /api/v1/courses/:id/add-topic - Add a new topic as a module+lesson to an existing course
router.post('/:id/add-topic', async (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const course = courses.get(courseId);
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  const topic = String(req.body?.topic || '').trim();
  const parentLessonId = req.body?.parentLessonId ? String(req.body.parentLessonId) : undefined;
  // parentLessonId is optional for future lesson-level insertion; v1 ignores it server-side.
  void parentLessonId;
  if (!topic) {
    sendError(res, req, { status: 400, code: 'validation_error', message: 'topic is required' });
    return;
  }

  try {
    let sources: FirecrawlSource[] = [];
    try {
      sources = await crawlSourcesForTopic(topic);
    } catch {
      sources = [];
    }

    const { client: openai } = getOpenAIForRequest({
      userId: req.user!.sub,
      tier: req.user!.tier,
    });

    const moduleIndex = course.modules.length;
    const moduleId = `${courseId}-m${moduleIndex}`;
    const moduleTitle = topic;
    const lessonTitle = `${topic}: Overview`;

    const content = await generateLessonContentWithLLM(
      topic,
      moduleTitle,
      lessonTitle,
      `A focused, practical introduction to ${topic} for learners already following this course.`,
      sources,
      { openai: process.env.NODE_ENV === 'test' ? null : openai },
    );
    const enforced = enforceBiteSizedLesson(content, { maxMinutes: 10 });
    const contentFinal = enforced.content;
    const wordCount = enforced.sizing.wordCount;
    const estimatedMinutes = Math.min(10, enforced.sizing.estimatedMinutes);

    const lessonId = `${courseId}-m${moduleIndex}-l0`;
    const newLessonSources = parseLessonSources(contentFinal);
    const missingReason =
      newLessonSources.length >= 2
        ? ''
        : 'attribution_gate: lesson has fewer than 2 resolvable sources';
    try {
      dbLessonSources.save(lessonId, course.id, newLessonSources, missingReason);
    } catch {
      // best effort
    }

    const newLesson: any = {
      id: lessonId,
      title: lessonTitle,
      description: `Add-on topic: ${topic}`,
      content: contentFinal,
      estimatedTime: estimatedMinutes,
      wordCount,
    };

    const newModule: any = {
      id: moduleId,
      title: moduleTitle,
      objective: `Learn ${topic} as an extension topic`,
      description: `Supplemental module added from suggested mindmap topic: ${topic}`,
      lessons: [newLesson],
    };

    course.modules.push(newModule);
    dbCourses.save(course);

    res.status(201).json({ course, module: newModule, lesson: newLesson });
  } catch (err: any) {
    sendError(res, req, {
      status: 500,
      code: 'add_topic_failed',
      message: err?.message || 'Failed',
    });
  }
});

// POST /api/v1/courses/:id/lessons/:lessonId/complete - Mark lesson complete
router.post('/:id/lessons/:lessonId/complete', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const courseId = String(req.params.id);
  const lessonId = String(req.params.lessonId);
  const course = courses.get(courseId);

  // Track per-user per-lesson completion
  dbProgress.markComplete(userId, courseId, lessonId);
  const completedLessons = dbProgress.getCompletedLessons(userId, courseId);

  if (course) {
    course.progress[userId] = completedLessons.length;
    dbCourses.save(course);
  }

  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const completion_percent = totalLessons ? (completedLessons.length / totalLessons) * 100 : 0;

  // Emit a progress.update WS event for real UI updates.
  emitToUser(userId, 'progress.update', {
    course_id: courseId,
    lesson_id: lessonId,
    completion_percent,
  });

  res.status(200).json({
    message: 'Lesson marked complete. Great job!',
    progress: completedLessons.length,
    completedLessons,
    completion_percent,
    nextActions: ['Continue to next lesson', 'Take a quiz', 'Review notes'],
    next: 'Continue learning',
    actions: ['next_lesson', 'quiz', 'notes'],
  });
});

// ── Notes CRUD endpoints ────────────────────────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/notes
router.get('/:id/lessons/:lessonId/notes', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const note = dbNotes.get(String(req.params.lessonId), userId);
  if (!note) {
    res.status(200).json({ note: null });
    return;
  }
  res.status(200).json({ note });
});

// POST /api/v1/courses/:id/lessons/:lessonId/notes
router.post('/:id/lessons/:lessonId/notes', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const courseId = String(req.params.id);
  const { format, content, customContent } = req.body;

  const course = courses.get(courseId);
  let lesson: Lesson | undefined;
  if (course) {
    for (const mod of course.modules) {
      lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) break;
    }
  }

  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  let noteContent: any = { format: format || 'custom', text: customContent || '' };

  if (format && format !== 'custom' && openai && lesson) {
    try {
      const lessonText = lesson.content.slice(0, 3000);
      let prompt = '';

      if (format === 'summary') {
        prompt = `Create a concise, well-structured summary of this lesson. Use bullet points and bold key terms. Keep it under 500 words.\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      } else if (format === 'cornell') {
        prompt = `Create Cornell-style notes for this lesson with three clear sections:\n1. **Cue Questions** (left column) — 5-7 key questions\n2. **Notes** (right column) — detailed notes organized by topic\n3. **Summary** — a concise paragraph summarizing the main ideas\n\nUse markdown formatting.\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      } else if (format === 'mindmap') {
        prompt = `Create a hierarchical mind map outline for this lesson. Use indented bullet points to show relationships:\n- Main topic\n  - Subtopic 1\n    - Detail\n    - Detail\n  - Subtopic 2\n    - Detail\n\nLesson: "${lesson.title}"\n\n${lessonText}`;
      }

      if (prompt) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 2000,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert note-taker and study skills instructor. Generate clear, well-organized notes that help students review and retain information.',
            },
            { role: 'user', content: prompt },
          ],
        });
        const text = completion.choices[0]?.message?.content || '';
        if (text.length > 50) {
          noteContent = { format, text };
        }
      }
    } catch (err) {
      console.warn('[LearnFlow] AI note generation failed:', err);
      noteContent = {
        format,
        text: `# Notes: ${lesson?.title || 'Lesson'}\n\n_AI generation failed. Write your own notes here._`,
      };
    }
  } else if (content) {
    noteContent = content;
  }

  const note = dbNotes.save(lessonId, userId, noteContent);
  res.status(201).json({ note });
});

// PUT /api/v1/courses/:id/lessons/:lessonId/notes
router.put('/:id/lessons/:lessonId/notes', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { content, illustrations } = req.body;
  const existing = dbNotes.get(lessonId, userId);
  const note = dbNotes.save(
    lessonId,
    userId,
    content || existing?.content || {},
    illustrations || existing?.illustrations || [],
  );
  res.status(200).json({ note });
});

// POST /api/v1/courses/:id/lessons/:lessonId/notes/illustrate
router.post('/:id/lessons/:lessonId/notes/illustrate', async (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { description } = req.body;

  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    sendError(res, req, {
      status: 400,
      code: 'openai_unavailable',
      message: 'OpenAI API key not configured',
    });
    return;
  }

  try {
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${description}. Clean, professional, suitable for a learning platform. No text in image.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      sendError(res, req, {
        status: 500,
        code: 'generation_failed',
        message: 'No image generated',
      });
      return;
    }

    // Save illustration to notes
    const existing = dbNotes.get(lessonId, userId);
    const illustrations = existing?.illustrations || [];
    illustrations.push({
      id: `ill-${Date.now()}`,
      description,
      url: imageUrl,
      createdAt: new Date().toISOString(),
    });
    dbNotes.save(lessonId, userId, existing?.content || {}, illustrations);

    res.status(200).json({ illustration: { url: imageUrl, description } });
  } catch (err: any) {
    console.error('[LearnFlow] DALL-E generation failed:', err);
    sendError(res, req, {
      status: 500,
      code: 'generation_failed',
      message: err.message || 'Image generation failed',
    });
  }
});

// ── Illustrations (per-section, persistent) ─────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/illustrations
router.get('/:id/lessons/:lessonId/illustrations', (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const illustrations = dbIllustrations.getByLesson(lessonId);
  res.json({ illustrations });
});

// POST /api/v1/courses/:id/lessons/:lessonId/illustrations
router.post('/:id/lessons/:lessonId/illustrations', async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { sectionIndex, prompt } = req.body;

  const userId = req.user?.sub || 'anonymous';
  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    // Graceful degradation when no OpenAI key configured: still create a record
    // so the client can attach a summary/note even without an image.
    const illustration = dbIllustrations.create(
      lessonId,
      sectionIndex ?? 0,
      prompt,
      '',
      'openai_unavailable',
    );
    res.status(201).json({ illustration, degraded: true });
    return;
  }

  try {
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational illustration: ${prompt}. Clean, professional diagram suitable for a learning platform. No text in image.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });
    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      sendError(res, req, {
        status: 500,
        code: 'generation_failed',
        message: 'No image generated',
      });
      return;
    }
    const illustration = dbIllustrations.create(lessonId, sectionIndex ?? 0, prompt, imageUrl);
    res.status(201).json({ illustration });
  } catch (err: any) {
    console.error('[LearnFlow] Illustration generation failed:', err);
    sendError(res, req, { status: 500, code: 'generation_failed', message: err.message });
  }
});

// DELETE /api/v1/courses/:id/lessons/:lessonId/illustrations/:illId
router.delete('/:id/lessons/:lessonId/illustrations/:illId', (req: Request, res: Response) => {
  dbIllustrations.delete(String(req.params.illId));
  res.status(204).end();
});

// ── Comparison Mode ─────────────────────────────────────────────────────────

// POST /api/v1/courses/:id/lessons/:lessonId/compare
router.post('/:id/lessons/:lessonId/compare', async (req: Request, res: Response) => {
  const courseId = String(req.params.id);
  const lessonId = String(req.params.lessonId);

  const userId = req.user?.sub || 'anonymous';
  const { client: openai } = getOpenAIForRequest({
    userId,
    tier: req.user?.tier || 'free',
    apiKeyOverride: (req.body as any)?.apiKey,
  });
  if (!openai) {
    sendError(res, req, {
      status: 400,
      code: 'openai_unavailable',
      message: 'OpenAI API key not configured',
    });
    return;
  }

  // Get lesson content
  const course = dbCourses.getById(courseId);
  let lessonContent = '';
  if (course?.modules) {
    for (const mod of course.modules) {
      for (const l of mod.lessons || []) {
        if (l.id === lessonId) lessonContent = l.content || l.description || '';
      }
    }
  }
  // Also try the lessons table
  const { sqlite } = await import('../db.js');
  const lessonRow = sqlite.prepare('SELECT content FROM lessons WHERE id = ?').get(lessonId) as any;
  if (lessonRow?.content) lessonContent = lessonRow.content;

  if (!lessonContent) {
    sendError(res, req, { status: 404, code: 'lesson_not_found', message: 'Lesson not found' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You analyze educational content and create structured comparisons. Always return valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this lesson and create a structured comparison of the key concepts discussed. If the lesson compares technologies, frameworks, approaches, or ideas, extract them. Return JSON: { "concepts": string[], "dimensions": string[], "cells": string[][] (rows=dimensions, cols=concepts), "summary": string }. If there are no comparable concepts, return { "concepts": [], "dimensions": [], "cells": [], "summary": "No comparable concepts found in this lesson." }\n\nLesson content:\n${lessonContent.slice(0, 8000)}`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content || '{}';
    const comparison = JSON.parse(text);
    res.json({ comparison });
  } catch (err: any) {
    console.error('[LearnFlow] Comparison failed:', err);
    sendError(res, req, { status: 500, code: 'comparison_failed', message: err.message });
  }
});

// ── Selection Tools (Discover / Illustrate / Mark) ─────────────────────────

const selectionToolsPreviewSchema = z.object({
  tool: z.enum(['discover', 'illustrate', 'mark']),
  selectedText: z
    .string()
    .min(3)
    .max(5000, 'selectedText too long (max 5000 chars)')
    .transform((s) => s.trim()),
});

// POST /api/v1/courses/:id/lessons/:lessonId/selection-tools/preview
// Returns a preview payload for side tools without persisting anything.
router.post(
  '/:id/lessons/:lessonId/selection-tools/preview',
  validateBody(selectionToolsPreviewSchema),
  async (req: Request, res: Response) => {
    const { tool, selectedText } = req.body;

    const userId = req.user?.sub || 'anonymous';
    const tier = req.user?.tier || 'free';

    try {
      if (tool === 'discover') {
        // Use the existing web search provider (no paid key required).
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { searchSources } = require('@learnflow/agents');
        const results = (await searchSources(String(selectedText))) as any[];
        const trimmed = (results || []).slice(0, 5).map((r: any) => ({
          title: r.title,
          url: r.url,
          source: (() => {
            try {
              return new URL(r.url).hostname;
            } catch {
              return r.source || '';
            }
          })(),
          description: r.description,
        }));

        const note =
          `Discover: related topics/resources\n\n` +
          trimmed
            .map(
              (r: any, i: number) =>
                `${i + 1}. ${r.title}\n${r.url}${r.description ? `\n${r.description}` : ''}`,
            )
            .join('\n\n');

        res.status(200).json({
          tool,
          selectedText,
          preview: { note, results: trimmed },
        });
        return;
      }

      if (tool === 'illustrate') {
        const { client: openai } = getOpenAIForRequest({
          userId,
          tier,
          apiKeyOverride: (req.body as any)?.apiKey,
        });

        // Graceful degradation: allow text-only illustrate even without a configured OpenAI key.
        // In test mode we must be deterministic and avoid network.
        if (!openai || process.env.NODE_ENV === 'test') {
          const summary =
            `- Key idea: ${String(selectedText).slice(0, 140)}${String(selectedText).length > 140 ? '…' : ''}\n` +
            `- Try restating it in your own words\n` +
            `- If you add an OpenAI key, LearnFlow can generate an image for this concept`;
          const note =
            `Illustrate (text-only)\n\n${summary}\n\n` +
            `Note: OpenAI key not configured; image generation is disabled.`;
          res.status(200).json({ tool, selectedText, preview: { note, summary, imageUrl: null } });
          return;
        }

        // 1) Simplified explanation
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful tutor. Explain simply in 2-4 bullets.',
            },
            { role: 'user', content: `Simplify this for a learner:\n\n"${selectedText}"` },
          ],
        });
        const summary = completion.choices[0]?.message?.content || '';

        // 2) Image (best-effort).
        let imageUrl: string | null = null;
        try {
          const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: `Educational illustration for this concept: ${selectedText}. Clean, professional, no text in image.`,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
          });
          imageUrl = imageResponse.data?.[0]?.url || null;
        } catch {
          imageUrl = null;
        }

        const note = `Illustrate\n\n${summary}${imageUrl ? `\n\nImage: ${imageUrl}` : ''}`;
        res.status(200).json({ tool, selectedText, preview: { note, summary, imageUrl } });
        return;
      }

      if (tool === 'mark') {
        const { client: openai } = getOpenAIForRequest({
          userId,
          tier,
          apiKeyOverride: (req.body as any)?.apiKey,
        });
        let bullets: string[] = [];
        if (openai) {
          try {
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'Extract 3-5 concise key takeaways as a JSON array of strings. Return ONLY JSON.',
                },
                { role: 'user', content: selectedText },
              ],
            });
            const text = completion.choices[0]?.message?.content || '[]';
            bullets = JSON.parse(text);
          } catch {
            bullets = [];
          }
        }
        if (!bullets.length) {
          bullets = String(selectedText)
            .split(/[.\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 8)
            .slice(0, 5);
        }

        res.status(200).json({ tool, selectedText, preview: { bullets } });
        return;
      }

      sendError(res, req, { status: 400, code: 'validation_error', message: 'unknown tool' });
    } catch (err: any) {
      sendError(res, req, { status: 500, code: 'tool_failed', message: err?.message || 'Failed' });
    }
  },
);

// POST /api/v1/courses/:id/lessons/:lessonId/notes/mark-takeaways
// Appends takeaways to the user's notes for this lesson (so it can be shown in UI).
router.post('/:id/lessons/:lessonId/notes/mark-takeaways', (req: Request, res: Response) => {
  const userId = req.user?.sub || 'anonymous';
  const lessonId = String(req.params.lessonId);
  const { bullets, selectedText } = req.body as { bullets?: string[]; selectedText?: string };

  const existing = dbNotes.get(lessonId, userId);
  const content = existing?.content || {};

  const extras: string[] = Array.isArray(content.keyTakeawaysExtras)
    ? content.keyTakeawaysExtras
    : [];

  const toAdd = Array.isArray(bullets)
    ? bullets
    : String(selectedText || '')
        .split(/[.\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8)
        .slice(0, 5);

  for (const b of toAdd) {
    const clean = String(b).trim();
    if (!clean) continue;
    if (!extras.includes(clean)) extras.push(clean);
  }

  const note = dbNotes.save(lessonId, userId, { ...content, keyTakeawaysExtras: extras });
  res.status(200).json({ note, keyTakeawaysExtras: extras });
});

// ── Annotations (text-anchored notes) ───────────────────────────────────────

// GET /api/v1/courses/:id/lessons/:lessonId/annotations
router.get('/:id/lessons/:lessonId/annotations', (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const annotations = dbAnnotations.getByLesson(lessonId);
  res.json({ annotations });
});

// POST /api/v1/courses/:id/lessons/:lessonId/annotations
router.post('/:id/lessons/:lessonId/annotations', async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId);
  const { selectedText, startOffset, endOffset, note, type } = req.body;

  let finalNote = note || '';

  if ((type === 'explain' || type === 'example') && selectedText) {
    const userId = req.user?.sub || 'anonymous';
    const { client: openai } = getOpenAIForRequest({
      userId,
      tier: req.user?.tier || 'free',
      apiKeyOverride: (req.body as any)?.apiKey,
    });
    if (openai) {
      try {
        const prompt =
          type === 'explain'
            ? `Explain this concept clearly and concisely for a student:\n\n"${selectedText}"`
            : `Give a practical, real-world example of this concept:\n\n"${selectedText}"`;
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful tutor. Be concise but thorough.' },
            { role: 'user', content: prompt },
          ],
        });
        finalNote = completion.choices[0]?.message?.content || finalNote;
      } catch (err) {
        console.warn('[LearnFlow] Annotation AI failed:', err);
      }
    }
  }

  const annotation = dbAnnotations.create(
    lessonId,
    selectedText,
    startOffset ?? 0,
    endOffset ?? 0,
    finalNote,
    type || 'note',
  );
  res.status(201).json({ annotation });
});

// DELETE /api/v1/courses/:id/lessons/:lessonId/annotations/:annId
router.delete('/:id/lessons/:lessonId/annotations/:annId', (req: Request, res: Response) => {
  dbAnnotations.delete(String(req.params.annId));
  res.status(204).end();
});

export const coursesRouter = router;
