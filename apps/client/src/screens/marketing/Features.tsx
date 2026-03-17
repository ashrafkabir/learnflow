import React from 'react';

export function FeaturesPage() {
  return (
    <section aria-label="Features" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Features</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        LearnFlow combines AI agent technology with personalized course generation to help you learn
        anything faster.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>🤖 AI Agent Tutoring</h3>
          <p>Intelligent agent assistants that adapt to your learning style and pace.</p>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>📚 Dynamic Course Generation</h3>
          <p>Generate personalized courses on any topic with structured modules and lessons.</p>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>🧠 Knowledge Mindmaps</h3>
          <p>Visualize your learning journey with interactive knowledge graphs.</p>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>📝 Smart Notes</h3>
          <p>Cornell-format notes generated automatically from your course content.</p>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>🔑 BYOAI Keys</h3>
          <p>Bring your own API keys for OpenAI, Anthropic, and other providers.</p>
        </div>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h3>📊 Learning Analytics</h3>
          <p>Track your progress with detailed analytics and study streak tracking.</p>
        </div>
      </div>
    </section>
  );
}
