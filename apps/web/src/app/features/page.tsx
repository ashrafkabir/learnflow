import React from 'react';

/** S11-A03: Features page — all 6 feature sections */
export default function FeaturesPage() {
  const features = [
    {
      id: 'course-builder',
      title: 'AI Course Builder',
      description:
        'Enter any topic and our AI generates a structured, multi-module course with real web sources. Each lesson includes learning objectives, examples, code blocks, and full source attribution.',
      highlights: [
        'Firecrawl-powered web research',
        'Credibility-scored sources',
        'Prerequisite-ordered modules',
      ],
    },
    {
      id: 'smart-notes',
      title: 'Smart Notes & Flashcards',
      description:
        'Automatically generate study materials from any lesson. Choose from Cornell format, Zettelkasten atomic notes, or spaced-repetition flashcards.',
      highlights: [
        'Cornell note format',
        'Zettelkasten with inter-links',
        '10+ flashcards per lesson',
      ],
    },
    {
      id: 'adaptive-exams',
      title: 'Adaptive Exams & Knowledge Gaps',
      description:
        'AI-generated quizzes that test comprehension, not just recall. Get detailed knowledge gap analysis showing exactly what to review.',
      highlights: [
        'Multiple choice & short answer',
        "Bloom's taxonomy coverage",
        'Knowledge gap analysis',
      ],
    },
    {
      id: 'research-agent',
      title: 'Research Agent',
      description:
        'Search academic papers, synthesize findings, and get structured research summaries. Powered by Semantic Scholar and web scraping.',
      highlights: ['Academic paper search', 'Structured synthesis', 'Citation management'],
    },
    {
      id: 'knowledge-mindmap',
      title: 'Knowledge Mindmap',
      description:
        'Visualize how your learning connects across courses. Interactive graph with mastery indicators and CRDT-powered collaborative editing.',
      highlights: [
        'Interactive visualization',
        'Cross-course connections',
        'Collaborative editing',
      ],
    },
    {
      id: 'marketplace',
      title: 'Course & Agent Marketplace',
      description:
        'Share your AI-generated courses with the community. Browse, enroll, and rate courses from other creators. Extend LearnFlow with custom agents.',
      highlights: ['Publish & monetize courses', 'Community ratings', 'Custom agent SDK'],
    },
  ];

  return (
    <div data-page="features" style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>
        Features
      </h1>
      <p style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', marginBottom: 64 }}>
        Six AI agents working together to transform how you learn.
      </p>

      {features.map((f, i) => (
        <section
          key={f.id}
          data-feature={f.id}
          aria-label={f.title}
          style={{
            display: 'flex',
            flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
            gap: 48,
            alignItems: 'center',
            marginBottom: 80,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700 }}>{f.title}</h2>
            <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.6, marginTop: 12 }}>
              {f.description}
            </p>
            <ul style={{ marginTop: 16, listStyle: 'none', padding: 0 }}>
              {f.highlights.map((h) => (
                <li key={h} style={{ fontSize: 14, color: '#6366F1', marginBottom: 8 }}>
                  ✓ {h}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 280,
              height: 220,
              background: '#f3f4f6',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#9ca3af',
            }}
          >
            [Screenshot: {f.title}]
          </div>
        </section>
      ))}
    </div>
  );
}
