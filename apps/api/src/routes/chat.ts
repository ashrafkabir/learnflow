import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { courses } from './courses.js';
import { getOpenAIForRequest } from '../llm/openai.js';
import { crawlSourcesForTopic } from '@learnflow/agents';

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

async function generateNotesResponse(
  openai: any,
  text: string,
  lessonId?: string,
  format?: string,
) {
  const found = findLesson(lessonId);
  const lessonTitle = found?.lesson.title || 'the topic';
  const lessonContent = found?.lesson.content || '';

  if (openai && lessonContent.length > 100) {
    try {
      if (format === 'flashcard') {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 1500,
          messages: [
            {
              role: 'system',
              content:
                'Generate flashcards from the lesson content. Return JSON: { "flashcards": [{"front": "question", "back": "answer"}] }. Create 8-12 flashcards covering key concepts, definitions, and applications from the actual lesson content. Be specific — reference actual concepts from the lesson.',
            },
            {
              role: 'user',
              content: `Lesson: "${lessonTitle}"\n\n${lessonContent.slice(0, 3000)}`,
            },
          ],
          response_format: { type: 'json_object' },
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const flashcards = parsed.flashcards || [];
        if (flashcards.length > 0) {
          return {
            notes: { format: 'flashcard', content: '', flashcards },
            reply: `Generated ${flashcards.length} flashcards from "${lessonTitle}"`,
          };
        }
      } else {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 2000,
          messages: [
            {
              role: 'system',
              content: `Generate Cornell Notes from the lesson. Include:
- 7+ specific cue questions derived from the actual content
- Detailed main notes organized by topic with specific facts
- Connections to broader themes
- A thorough summary paragraph
Use markdown formatting. Be specific — reference actual concepts, examples, and details from the lesson.`,
            },
            {
              role: 'user',
              content: `Lesson: "${lessonTitle}"\n\n${lessonContent.slice(0, 3000)}`,
            },
          ],
        });
        const content = completion.choices[0]?.message?.content || '';
        if (content.length > 100) {
          const cueQuestions = content.match(/- .+\?/g)?.map((q: string) => q.slice(2)) || [];
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
      }
    } catch (err) {
      console.warn('[LearnFlow] OpenAI notes generation failed, using fallback:', err);
    }
  }

  // Fallback: template-based
  const lines = lessonContent.split('\n').filter((l) => l.trim());
  const headings = lines.filter((l) => l.startsWith('##')).map((l) => l.replace(/^#+\s*/, ''));
  const keyPoints = lines
    .filter((l) => l.startsWith('- '))
    .slice(0, 5)
    .map((l) => l.slice(2));

  if (format === 'flashcard') {
    const flashcards = headings.slice(0, 5).map((h, i) => ({
      front: `What is ${h.toLowerCase()}?`,
      back: keyPoints[i] || `A key concept in ${lessonTitle} covering ${h.toLowerCase()}.`,
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
      );
    }
    return {
      notes: { format: 'flashcard', content: '', flashcards },
      reply: `Generated ${flashcards.length} flashcards from "${lessonTitle}"`,
    };
  }

  const cueQuestions = [
    `What are the core concepts in ${lessonTitle}?`,
    `How do the key principles relate to each other?`,
    `What are the practical applications?`,
    ...headings
      .slice(0, 3)
      .map((h) => `How does ${h.toLowerCase()} relate to ${lessonTitle.toLowerCase()}?`),
    `What evidence supports the main claims?`,
  ].slice(0, 7);

  const content = `# Cornell Notes: ${lessonTitle}\n\n## Cue Questions\n${cueQuestions.map((q) => `- ${q}`).join('\n')}\n\n## Main Notes\n\n### Key Concepts\n${headings.map((h) => `- **${h}**`).join('\n') || `- Fundamental principles of ${lessonTitle}`}\n\n### Important Details\n${keyPoints.map((p) => `- ${p}`).join('\n') || '- Core implementation patterns'}\n\n## Summary\nKey concepts needed to understand ${lessonTitle}.`;

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

async function generateQuizResponse(openai: any, courseId?: string, _moduleId?: string) {
  const course = courseId ? courses.get(courseId) : null;
  const mod = course?.modules?.[0];
  const topic = course?.topic || 'the subject';
  const modTitle = mod?.title || 'core concepts';

  // Gather lesson content for context
  const lessonContent =
    mod?.lessons
      ?.map((l) => `## ${l.title}\n${l.content?.slice(0, 800) || l.description}`)
      .join('\n\n') || '';

  if (openai && lessonContent.length > 100) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 2500,
        messages: [
          {
            role: 'system',
            content: `Generate a quiz with exactly 8 questions based on the lesson content. Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "specific question about lesson content",
      "type": "multiple_choice",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "the correct option text",
      "explanation": "why this is correct, referencing lesson content"
    }
  ]
}
Include 6 multiple_choice and 2 short_answer questions. For short_answer, omit options. Make questions specific to the actual content — reference specific concepts, examples, and details from the lessons. Distractors should be plausible but clearly wrong.`,
          },
          {
            role: 'user',
            content: `Topic: ${topic}\nModule: ${modTitle}\n\n${lessonContent.slice(0, 4000)}`,
          },
        ],
        response_format: { type: 'json_object' },
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      if (parsed.questions?.length >= 4) {
        return {
          questions: parsed.questions,
          reply: `Generated a ${parsed.questions.length}-question quiz on "${modTitle}" from your ${topic} course.`,
        };
      }
    } catch (err) {
      console.warn('[LearnFlow] OpenAI quiz generation failed, using fallback:', err);
    }
  }

  // Fallback: generic questions
  const questions = [
    {
      id: 'q1',
      question: `Which best describes the primary goal of ${modTitle}?`,
      type: 'multiple_choice' as const,
      options: [
        'Theoretical overview only',
        `Comprehensive understanding of ${topic}`,
        'Memorize definitions',
        'Skip fundamentals',
      ],
      correctAnswer: `Comprehensive understanding of ${topic}`,
      explanation: `The module combines theory with practice for ${topic}.`,
    },
    {
      id: 'q2',
      question: `What is a key principle in ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Focus only on theory',
        'Ignore metrics',
        'Integrate theory with practice',
        'Avoid applications',
      ],
      correctAnswer: 'Integrate theory with practice',
      explanation: 'Effective learning combines theory and practice.',
    },
    {
      id: 'q3',
      question: `Explain why evaluation matters in ${topic}.`,
      type: 'short_answer' as const,
      correctAnswer: 'Evaluation tracks progress and identifies gaps.',
      explanation: 'Systematic evaluation helps identify weaknesses.',
    },
    {
      id: 'q4',
      question: `Which approach is best for beginners in ${topic}?`,
      type: 'multiple_choice' as const,
      options: ['Start complex', 'Skip prerequisites', 'Build from fundamentals', 'Only read'],
      correctAnswer: 'Build from fundamentals',
      explanation: 'Progressive learning from basics builds strong foundations.',
    },
    {
      id: 'q5',
      question: `Describe a real-world application of ${modTitle}.`,
      type: 'short_answer' as const,
      correctAnswer: 'Applied in automation, research, and enterprise systems.',
      explanation: 'Real-world applications connect abstract concepts to value.',
    },
    {
      id: 'q6',
      question: `What is the theory-practice relationship in ${topic}?`,
      type: 'multiple_choice' as const,
      options: [
        'Theory > practice',
        'Practice alone',
        'Theory informs practice, practice validates theory',
        'Separate disciplines',
      ],
      correctAnswer: 'Theory informs practice, practice validates theory',
      explanation: 'They are interrelated.',
    },
    {
      id: 'q7',
      question: `Best metric for learning progress in ${topic}?`,
      type: 'multiple_choice' as const,
      options: ['Time reading', 'Pages read', 'Apply to new problems', 'Notes taken'],
      correctAnswer: 'Apply to new problems',
      explanation: 'Transfer to new contexts shows deep understanding.',
    },
    {
      id: 'q8',
      question: `Name two strategies for challenges in ${modTitle}.`,
      type: 'short_answer' as const,
      correctAnswer: 'Break into components and use spaced repetition.',
      explanation: 'Multiple strategies improve retention.',
    },
  ];

  return {
    questions,
    reply: `Generated a ${questions.length}-question quiz on "${modTitle}" from your ${topic} course.`,
  };
}

async function generateChatResponse(
  openai: any,
  text: string,
  lessonId?: string,
  courseId?: string,
  history?: Array<{ role: string; content: string }>,
): Promise<{
  content: string;
  response: string;
  actions: string[];
}> {
  // Build lesson context
  const found = findLesson(lessonId);
  const courseData = courseId ? courses.get(courseId) : found?.course || null;
  const courseTitle = courseData?.title || found?.course?.title || 'your course';
  const lessonTitle = found?.lesson?.title || 'the current topic';
  const lessonContent = found?.lesson?.content || '';

  // Use OpenAI for all chat if available
  if (openai) {
    try {
      const systemPrompt = lessonContent
        ? `You are an expert AI tutor and content editor for LearnFlow. The student is studying "${courseTitle}", lesson "${lessonTitle}".

LESSON CONTENT:
${lessonContent.slice(0, 4000)}

CAPABILITIES — you can:
1. **Answer questions** about the lesson material with depth and examples
2. **Improve tone & style** — if asked to "improve the tone", "make it more engaging", "simplify", "make it more professional", etc., rewrite the relevant section(s) with the requested tone. Return the improved text in a markdown code block labeled \`\`\`improved so the UI can offer to apply it.
3. **Expand sections** — add more detail, examples, analogies, or real-world applications to any part
4. **Simplify** — rewrite complex passages at a lower reading level
5. **Add examples** — generate practical code examples, case studies, or scenarios
6. **Fix errors** — correct any factual or technical inaccuracies
7. **Restructure** — reorganize content for better flow and comprehension

When rewriting content, always return the improved version in a \`\`\`improved\n...\n\`\`\` block so the student can compare and apply changes. Be specific about what you changed and why.

Use markdown formatting. Be encouraging, educational, and engaging.`
        : `You are an expert AI tutor for LearnFlow. Help students learn effectively — answer questions, explain concepts, create study plans, suggest improvements, and provide examples. When asked to improve or rewrite text, return the improved version in a \`\`\`improved\n...\n\`\`\` block. Use markdown formatting. Be encouraging and educational.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history (last 10 messages)
      if (history && history.length > 0) {
        for (const h of history.slice(-10)) {
          messages.push({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: h.content,
          });
        }
      }

      messages.push({ role: 'user', content: text });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 2000,
        messages,
      });

      const reply = completion.choices[0]?.message?.content || '';
      if (reply.length > 10) {
        return {
          content: reply,
          response: reply,
          actions: ['Improve Tone', 'Simplify', 'Add Examples', 'Quiz Me'],
        };
      }
    } catch (err) {
      console.warn('[LearnFlow] OpenAI chat failed, using fallback:', err);
    }
  }

  // Fallback when OpenAI is unavailable
  return {
    content: `I can help you with learning! Here are some things I can do:\n\n- **Create a course** on any topic\n- **Generate quizzes** to test your knowledge\n- **Take notes** in Cornell or flashcard format\n- **Research** academic papers and sources\n- **Summarize** lesson content\n\nWhat would you like to do?`,
    response: `How can I help you learn today?`,
    actions: ['Create Course', 'Quiz Me', 'Take Notes', 'Research'],
  };
}

router.post('/', async (req: Request, res: Response) => {
  const parse = chatSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { text, message, agent, lessonId, courseId, moduleId, format } = parse.data;
  const input = text || message || '';

  const { client: openai } = getOpenAIForRequest({
    userId: req.user!.sub,
    tier: req.user!.tier,
  });

  // Handle specific agent requests
  if (agent === 'notes') {
    const notesData = await generateNotesResponse(openai, input, lessonId, format);
    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Notes Agent',
      ...notesData,
    });
    return;
  }

  if (agent === 'exam') {
    const quizData = await generateQuizResponse(openai, courseId, moduleId);
    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Exam Agent',
      ...quizData,
    });
    return;
  }

  if (agent === 'research') {
    // MVP: real web retrieval with attribution via existing agent utilities.
    // (No fake arXiv/DOI links.)
    const sources = await crawlSourcesForTopic(input);

    res.status(200).json({
      message_id: `msg-${Date.now()}`,
      agentName: 'Research Agent',
      content: `Research results for "${input}"`,
      sources: sources.map((s) => ({
        title: s.title,
        url: s.url,
        author: s.author,
        publishDate: s.publishDate,
        source: s.source,
        domain: s.domain,
      })),
    });
    return;
  }

  // General chat — route through AI with lesson context
  const historyMsgs = (parse.data.history || []) as Array<{ role: string; content: string }>;
  const generated = await generateChatResponse(openai, input, lessonId, courseId, historyMsgs);
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
