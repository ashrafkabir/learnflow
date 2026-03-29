import React from 'react';

/** S11-A03: Features page — all 6 feature sections */
export default function FeaturesPage() {
  const mvpDisclosureId = 'mvp-disclosure';

  const features = [
    {
      id: 'course-builder',
      title: 'AI Course Builder',
      description:
        'Enter any topic and our AI generates a structured, multi-module course with real web sources. Each lesson includes learning objectives, examples, code blocks, and full source attribution.',
      highlights: [
        'Best-effort web research (BYOAI keys)',
        'Citations + source attribution (best-effort)',
        'Prerequisite-ordered modules',
      ],
    },
    {
      id: 'smart-notes',
      title: 'Study Tools (MVP)',
      description:
        'Generate study materials from lessons (best-effort). This MVP focuses on course creation, lesson reading, and attribution; advanced study tool formats are planned.',
      highlights: [
        'Reading-first lesson UX',
        'Sources & attribution drawer',
        'Planned: flashcards + note formats',
      ],
    },
    {
      id: 'adaptive-exams',
      title: 'Adaptive Quizzes (Planned)',
      description:
        'Adaptive exams and knowledge-gap analysis are planned. The current MVP includes course/lesson creation and structured reading, and will expand into assessment workflows.',
      highlights: [
        'Planned: quizzes (multiple choice + short answer)',
        'Planned: knowledge-gap analysis',
        "Planned: Bloom's taxonomy coverage",
      ],
    },
    {
      id: 'research-agent',
      title: 'Research (Best-effort)',
      description:
        'LearnFlow can attach web sources to lessons (best-effort). Dedicated academic-paper search and full research workflows are planned.',
      highlights: [
        'Web sources (best-effort)',
        'Citations in lessons',
        'Planned: academic paper search',
      ],
    },
    {
      id: 'knowledge-mindmap',
      title: 'Knowledge Mindmap',
      description:
        'Visualize how your learning connects across courses. Interactive graph view with navigation and mastery-style affordances (MVP). Real-time collaborative editing is planned.',
      highlights: [
        'Interactive visualization',
        'Cross-course connections',
        'Planned: real-time collaboration',
      ],
    },
    {
      id: 'marketplace',
      title: 'Course & Agent Marketplace (MVP)',
      description:
        'Browse and publish courses/agents in a lightweight marketplace. Monetization and real “ratings” signals are not finalized in this MVP.',
      highlights: [
        'Browse listings',
        'Publish (best-effort)',
        'Planned: payments + stronger trust signals',
      ],
    },
  ];

  return (
    <div data-page="features" style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>
        Features
      </h1>
      <p style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', marginBottom: 12 }}>
        A web-first MVP focused on fast course creation and readable lessons.
      </p>
      <p
        id={mvpDisclosureId}
        style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginBottom: 64 }}
      >
        Some items below are marked “planned” to avoid implying functionality that isn’t fully
        shipped.
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
