import React from 'react';

export function BlogPage() {
  return (
    <section aria-label="Blog" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Blog</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Latest news, tips, and insights from the LearnFlow team.
      </p>
      <article
        style={{ padding: 24, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 }}
      >
        <h2 style={{ fontSize: 20 }}>Introducing LearnFlow: AI-Powered Learning for Everyone</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>January 2025 · 5 min read</p>
        <p>
          We're excited to announce LearnFlow, a new platform that uses AI agents to create
          personalized learning experiences. Read about our vision and what makes this post special.
        </p>
      </article>
      <article
        style={{ padding: 24, border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 }}
      >
        <h2 style={{ fontSize: 20 }}>How AI Agents Transform Education</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>January 2025 · 7 min read</p>
        <p>
          A deep dive into how autonomous AI agents can adapt to each student's learning style and
          pace in this article about the future of education.
        </p>
      </article>
    </section>
  );
}
