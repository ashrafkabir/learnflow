import React from 'react';

/** S11-A02: Homepage hero with headline, subhead, CTA, background animation */
export default function HomePage() {
  return (
    <div data-page="home">
      {/* Hero Section */}
      <section
        data-component="hero"
        aria-label="Hero"
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background animation placeholder */}
        <div
          data-component="background-animation"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.1) 0%, transparent 50%)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 800,
            position: 'relative',
          }}
        >
          Learn Anything with <span style={{ color: '#6366F1' }}>AI-Powered</span> Courses
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#4b5563',
            maxWidth: 600,
            marginTop: 24,
            lineHeight: 1.6,
            position: 'relative',
          }}
        >
          LearnFlow creates personalized courses, notes, quizzes, and research from any topic —
          powered by a team of AI agents working together.
        </p>
        <p
          data-component="mvp-disclosure"
          style={{
            marginTop: 14,
            fontSize: 14,
            color: '#6b7280',
            maxWidth: 640,
            lineHeight: 1.5,
            position: 'relative',
          }}
        >
          Web-first MVP today (works on desktop + mobile browsers). Native iOS/Android and desktop
          apps are planned.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 40, position: 'relative' }}>
          <a
            href="/download"
            aria-label="Get Started Free"
            style={{
              padding: '14px 32px',
              background: '#6366F1',
              color: 'white',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Get Started Free
          </a>
          <a
            href="/features"
            aria-label="See How It Works"
            style={{
              padding: '14px 32px',
              border: '2px solid #6366F1',
              color: '#6366F1',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* Social proof (MVP-safe: no institutional claims) */}
      <section style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>Built for</p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
            opacity: 0.8,
          }}
        >
          {['Self-learners', 'Teams', 'Bootcamps', 'Creators', 'Students'].map((name) => (
            <span
              key={name}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                border: '1px solid #e5e7eb',
                padding: '8px 12px',
                borderRadius: 999,
                background: '#fff',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Feature highlights (abbreviated — full on /features) */}
      <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 48 }}>
          One Platform. Six AI Agents.
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
          }}
        >
          {[
            {
              icon: '📚',
              title: 'Course Builder',
              desc: 'Generate structured courses from any topic with real web sources.',
            },
            {
              icon: '📝',
              title: 'Notes Agent',
              desc: 'Cornell notes, Zettelkasten, and flashcards from any lesson.',
            },
            {
              icon: '🧪',
              title: 'Exam Agent',
              desc: 'Quizzes (best-effort). Adaptive targeting is planned.',
            },
            {
              icon: '🔬',
              title: 'Research Agent',
              desc: 'Find and synthesize web sources (best-effort). Academic paper workflows are planned.',
            },
            {
              icon: '🗺️',
              title: 'Knowledge Mindmap',
              desc: 'Visualize your course map and progress (MVP). Richer knowledge graphs are planned.',
            },
            {
              icon: '🏪',
              title: 'Marketplace',
              desc: 'Share courses and discover community-created content.',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{ padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}
            >
              <div style={{ fontSize: 32 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '80px 24px',
          background: '#6366F1',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 32, fontWeight: 700 }}>Start Learning Smarter Today</h2>
        <p style={{ fontSize: 16, opacity: 0.9, marginTop: 12 }}>
          Free forever. No credit card required.
        </p>
        <a
          href="/download"
          style={{
            display: 'inline-block',
            marginTop: 32,
            padding: '14px 40px',
            background: 'white',
            color: '#6366F1',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Open LearnFlow (Web)
        </a>
      </section>
    </div>
  );
}
