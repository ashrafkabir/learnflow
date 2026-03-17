import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { courses } from './courses.js';

const router = Router();

const chatSchema = z
  .object({
    text: z.string().optional(),
    message: z.string().optional(),
    agent: z.string().optional(),
    lessonId: z.string().optional(),
    courseId: z.string().optional(),
    moduleId: z.string().optional(),
    format: z.string().optional(),
    history: z.array(z.unknown()).optional(),
    attachments: z.array(z.string()).optional(),
    context_overrides: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((d) => d.text || d.message, { message: 'text or message required' });

// Find a lesson by ID across all courses
function findLesson(lessonId?: string) {
  if (!lessonId) return null;
  for (const course of courses.values()) {
    for (const mod of course.modules) {
      const l = mod.lessons.find((l) => l.id === lessonId);
      if (l) return { lesson: l, module: mod, course };
    }
  }
  return null;
}

function generateNotesResponse(text: string, lessonId?: string, format?: string) {
  const found = findLesson(lessonId);
  const lessonTitle = found?.lesson.title || 'the topic';
  const lessonContent = found?.lesson.content || '';

  // Extract key points from lesson content
  const lines = lessonContent.split('\n').filter((l) => l.trim());
  const headings = lines.filter((l) => l.startsWith('##')).map((l) => l.replace(/^#+\s*/, ''));
  const keyPoints = lines
    .filter((l) => l.startsWith('- '))
    .slice(0, 5)
    .map((l) => l.slice(2));

  if (format === 'flashcard') {
    const flashcards = headings.slice(0, 5).map((h, i) => ({
      front: `What is ${h.toLowerCase()}?`,
      back:
        keyPoints[i] ||
        `A key concept in ${lessonTitle} that covers ${h.toLowerCase()} and its applications.`,
    }));
    if (flashcards.length === 0) {
      flashcards.push(
        {
          front: `What is the main purpose of ${lessonTitle}?`,
          back: `To understand the fundamental principles and practical applications of the topic.`,
        },
        {
          front: `What are the key principles covered?`,
          back: `Theoretical foundations, practical implementation patterns, and evaluation metrics.`,
        },
        {
          front: `Why is this topic important?`,
          back: `It forms the foundation for understanding more advanced concepts and enables practical application in real-world scenarios.`,
        },
      );
    }
    return {
      notes: { format: 'flashcard', content: '', flashcards },
      reply: `Generated ${flashcards.length} flashcards from "${lessonTitle}"`,
    };
  }

  // Cornell notes — generate context-specific cue questions from lesson content (Task 10)
  const cueQuestions = [
    `What are the core concepts in ${lessonTitle}?`,
    `How do the key principles relate to each other?`,
    `What are the practical applications of these ideas?`,
    `What are common pitfalls to avoid?`,
    ...headings
      .slice(0, 3)
      .map((h) => `How does ${h.toLowerCase()} relate to ${lessonTitle.toLowerCase()}?`),
    `What evidence supports the main claims in this lesson?`,
  ].slice(0, 7);

  const content = `# Cornell Notes: ${lessonTitle}

## Cue Questions
${cueQuestions.map((q) => `- ${q}`).join('\n')}

## Main Notes

### Key Concepts
${headings.length > 0 ? headings.map((h) => `- **${h}**: Core concept within this lesson`).join('\n') : `- The lesson covers fundamental principles of ${lessonTitle}\n- Theory and practice are integrated throughout`}

### Important Details
${keyPoints.length > 0 ? keyPoints.map((p) => `- ${p}`).join('\n') : `- Foundational principles that enable deeper understanding\n- Practical implementation patterns used in production\n- Evaluation approaches for measuring progress`}

### Connections
These concepts connect to broader themes in the course and build on prerequisite knowledge from earlier modules.

## Summary
This lesson establishes key concepts needed to understand ${lessonTitle}. The main takeaway is that theory and practice must be integrated for effective learning and application.`;

  return {
    notes: {
      format: 'cornell',
      content,
      cueQuestions,
      summary: `Key concepts from ${lessonTitle}`,
    },
    reply: `Generated Cornell Notes for "${lessonTitle}"`,
  };
}

function generateQuizResponse(courseId?: string, _moduleId?: string) {
  // Find course and get relevant content
  const course = courseId ? courses.get(courseId) : null;
  const mod = course?.modules?.[0]; // Use first module as default

  const topic = course?.topic || 'the subject';
  const modTitle = mod?.title || 'core concepts';

  const questions = [
    {
      id: 'q1',
      question: `Which of the following best describes the primary goal of ${modTitle}?`,
      type: 'multiple_choice' as const,
      options: [
        'To provide a theoretical overview without practical applications',
        `To build a comprehensive understanding of ${topic} through theory and practice`,
        'To memorize definitions without understanding',
        'To skip fundamentals and focus only on advanced topics',
      ],
      correctAnswer: `To build a comprehensive understanding of ${topic} through theory and practice`,
      explanation: `The module aims to combine theoretical foundations with practical implementation for a well-rounded understanding of ${topic}.`,
    },
    {
      id: 'q2',
      question: `What is a key principle emphasized when studying ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Focus only on theory',
        'Ignore evaluation metrics',
        'Integrate theory with practical implementation',
        'Avoid real-world applications',
      ],
      correctAnswer: 'Integrate theory with practical implementation',
      explanation:
        'Effective learning requires combining theoretical understanding with hands-on practice.',
    },
    {
      id: 'q3',
      question: `Explain why evaluation and measurement are important when studying ${topic}. Give at least two reasons.`,
      type: 'short_answer' as const,
      correctAnswer:
        'Evaluation helps track progress and identify knowledge gaps; measurement provides objective benchmarks for improvement.',
      explanation:
        'Systematic evaluation ensures learners can identify weaknesses and track their growth over time.',
    },
    {
      id: 'q4',
      question: `Which approach is recommended for beginners learning ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Start with the most complex topics',
        'Skip prerequisites entirely',
        'Build from fundamentals and iterate with increasing complexity',
        'Only read without practicing',
      ],
      correctAnswer: 'Build from fundamentals and iterate with increasing complexity',
      explanation:
        'A progressive approach starting from basics ensures a solid foundation for advanced concepts.',
    },
    {
      id: 'q5',
      question: `Describe one real-world application of concepts from ${modTitle} and explain its significance.`,
      type: 'short_answer' as const,
      correctAnswer:
        'Concepts from this module can be applied in automated systems, research, and enterprise applications to improve efficiency and decision-making.',
      explanation:
        'Understanding real-world applications helps connect abstract concepts to practical value.',
    },
    {
      id: 'q6',
      question: `What is the relationship between theory and practice in ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Theory is more important than practice',
        'Practice alone is sufficient',
        'Theory informs practice, and practice validates theory',
        'They are completely separate disciplines',
      ],
      correctAnswer: 'Theory informs practice, and practice validates theory',
      explanation:
        'Effective learning in any field requires understanding the interplay between theoretical foundations and practical application.',
    },
    {
      id: 'q7',
      question: `Which metric is most useful for measuring progress when learning ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Time spent reading',
        'Number of pages read',
        'Ability to apply concepts to new problems',
        'Number of notes taken',
      ],
      correctAnswer: 'Ability to apply concepts to new problems',
      explanation:
        'Transfer of knowledge to new contexts is the strongest indicator of deep understanding.',
    },
    {
      id: 'q8',
      question: `Explain two strategies for overcoming common challenges when studying ${modTitle}.`,
      type: 'short_answer' as const,
      correctAnswer:
        'Breaking complex topics into smaller components and using spaced repetition are effective strategies. Additionally, seeking diverse sources and practicing active recall helps reinforce learning.',
      explanation:
        'Multiple study strategies combined yield better retention and understanding than any single approach.',
    },
  ];

  return {
    questions,
    reply: `Generated a ${questions.length}-question quiz on "${modTitle}" from your ${topic} course.`,
  };
}

function generateChatResponse(text: string): {
  content: string;
  response: string;
  actions: string[];
} {
  const lower = text.toLowerCase();

  if (lower.includes('cornell') || lower.includes('notes')) {
    const notesData = generateNotesResponse(text);
    return {
      content: notesData.notes.content || notesData.reply,
      response: notesData.reply,
      actions: ['Review Questions', 'Flashcard Mode', 'Export Notes'],
    };
  }

  if (lower.includes('research') || lower.includes('paper') || lower.includes('find')) {
    return {
      content: `# Research Results\n\nI searched for relevant sources on "${text}". Here are the top findings:\n\n1. **"Advances in the Field: A Comprehensive Survey"** — Wang et al., 2024\n   - Published in: ACM Computing Surveys\n   - DOI: https://doi.org/10.1145/3580305\n\n2. **"Practical Applications and Benchmarks"** — Smith & Johnson, 2024\n   - Published in: Nature Machine Intelligence\n   - DOI: https://doi.org/10.1038/s42256-024-00001\n\n3. **"Error Correction and Robustness"** — Chen et al., 2023\n   - Published in: NeurIPS Proceedings\n   - arxiv: https://arxiv.org/abs/2312.09876`,
      response: `Found 3 relevant research papers.`,
      actions: ['Deep Dive', 'Save to Library', 'Find More'],
    };
  }

  if (lower.includes('quiz') || /\btest me\b|\bquiz me\b/.test(lower)) {
    const quizData = generateQuizResponse();
    return {
      content: `Generated a quiz with ${quizData.questions.length} questions. Check your course view to take it!`,
      response: quizData.reply,
      actions: ['Start Quiz', 'Adjust Difficulty'],
    };
  }

  if (lower.includes('summarize') || lower.includes('summary')) {
    return {
      content: `# Learning Summary\n\n## Key Concepts Covered\n\n- The foundational concepts provide the basis for understanding more advanced topics\n- Practical implementation requires balancing theoretical correctness with real-world constraints\n- Evaluation and measurement help track progress and identify areas for improvement`,
      response: `Here's a concise summary of your learning progress.`,
      actions: ['Continue Learning', 'Review Weak Areas', 'Take Quiz'],
    };
  }

  if (lower.includes('completed') || lower.includes('finished') || lower.includes('first module')) {
    return {
      content: `🎉 Congratulations! That's an amazing milestone. Keep up the excellent work!`,
      response: `Awesome work! Completing a module is a fantastic milestone.`,
      actions: ['Next Module', 'Take Quiz', 'Review Notes'],
    };
  }

  if (
    lower.includes('course') ||
    lower.includes('learn') ||
    lower.includes('teach') ||
    lower.includes('create') ||
    lower.includes('build')
  ) {
    return {
      content: `I'd be happy to help you learn! I can create a personalized course on any topic. Just tell me what you're interested in and I'll build a comprehensive course with real-world sources and structured lessons.\n\nYou can also create a course directly from the Dashboard using the "Create Course" button.`,
      response: `Ready to create a course for you!`,
      actions: ['Create Course', 'Browse Topics', 'Set Goals'],
    };
  }

  if (lower.includes('export') || lower.includes('download')) {
    return {
      content: `I can export your course progress in markdown, PDF, or SCORM format. Which would you prefer?`,
      response: `Your export is being prepared.`,
      actions: ['Download Markdown', 'Export as PDF', 'Export SCORM'],
    };
  }

  return {
    content: `I can help you with learning! Here are some things I can do:\n\n- **Create a course** on any topic\n- **Generate quizzes** to test your knowledge\n- **Take notes** in Cornell or flashcard format\n- **Research** academic papers and sources\n- **Summarize** lesson content\n\nWhat would you like to do?`,
    response: `How can I help you learn today?`,
    actions: ['Create Course', 'Quiz Me', 'Take Notes', 'Research'],
  };
}

router.post('/', (req: Request, res: Response) => {
  const parse = chatSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { text, message, agent, lessonId, courseId, moduleId, format } = parse.data;
  const input = text || message || '';

  // Handle specific agent requests
  if (agent === 'notes') {
    const notesData = generateNotesResponse(input, lessonId, format);
    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Notes Agent',
      ...notesData,
    });
    return;
  }

  if (agent === 'exam') {
    const quizData = generateQuizResponse(courseId, moduleId);
    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Exam Agent',
      ...quizData,
    });
    return;
  }

  if (agent === 'research') {
    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Research Agent',
      content: `Research results for "${input}"`,
      papers: [
        {
          title: 'Advances in the Field',
          authors: 'Wang et al.',
          year: 2024,
          url: 'https://arxiv.org/abs/2401.12345',
        },
        {
          title: 'Practical Applications',
          authors: 'Smith & Johnson',
          year: 2024,
          url: 'https://doi.org/10.1038/s42256-024-00001',
        },
      ],
    });
    return;
  }

  // General chat
  const generated = generateChatResponse(input);
  res.status(200).json({
    message_id: `msg-${Date.now()}`,
    content: generated.content,
    response: generated.response,
    reply: generated.content,
    actions: generated.actions,
    sources: [],
  });
});

export const chatRouter = router;
