import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/** S08-A06: Lesson reader with content, sources, and actions */
export function LessonReader() {
  const { courseId, lessonId } = useParams();
  const nav = useNavigate();

  return (
    <section
      aria-label="Lesson Reader"
      data-screen="lesson-reader"
      style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}
    >
      <button onClick={() => nav(`/courses/${courseId}`)} style={{ marginBottom: 16 }}>
        ← Back to Course
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 8 }}>Lesson {lessonId}: Core Concepts</h1>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: 24 }}>~15 min read</p>

      <article data-component="lesson-content" aria-label="Lesson content">
        <h2 style={{ fontSize: '20px', marginBottom: 12 }}>Learning Objectives</h2>
        <ul>
          <li>Understand the fundamental principles</li>
          <li>Apply concepts to real-world scenarios</li>
          <li>Identify key patterns and techniques</li>
        </ul>

        <h2 style={{ fontSize: '20px', marginTop: 24, marginBottom: 12 }}>Introduction</h2>
        <p>
          This lesson covers the essential concepts that form the foundation of the topic.
          Understanding these principles is critical for progressing to more advanced material.
          According to recent research [1], these fundamentals have been validated across multiple
          domains.
        </p>

        <h2 style={{ fontSize: '20px', marginTop: 24, marginBottom: 12 }}>Key Concepts</h2>
        <p>
          The primary mechanisms involve several interconnected components. As documented in
          official sources [2], the architecture follows established patterns that have proven
          effective in production environments.
        </p>

        <pre
          style={{
            background: '#1f2937',
            color: '#f9fafb',
            padding: 16,
            borderRadius: 8,
            overflowX: 'auto',
            marginTop: 16,
          }}
        >
          <code>{`// Example implementation\nfunction processData(input: DataType): Result {\n  const validated = validate(input);\n  return transform(validated);\n}`}</code>
        </pre>

        <h2 style={{ fontSize: '20px', marginTop: 24, marginBottom: 12 }}>Practical Example</h2>
        <p>
          Consider a real-world scenario where these concepts are applied. Leading organizations [3]
          have demonstrated that systematic application of these principles yields measurable
          improvements in efficiency.
        </p>

        <div
          data-component="sources-section"
          aria-label="References"
          style={{ marginTop: 32, padding: 16, background: '#f9fafb', borderRadius: 8 }}
        >
          <h3 style={{ fontSize: '16px', marginBottom: 8 }}>References & Further Reading</h3>
          <ol style={{ fontSize: '14px' }}>
            <li>
              <a href="https://arxiv.org/abs/2024.12345" target="_blank" rel="noopener noreferrer">
                Chen et al. "Comprehensive Survey" arXiv, 2025
              </a>
            </li>
            <li>
              <a
                href="https://docs.python.org/3/library/asyncio.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Python Official Documentation - asyncio
              </a>
            </li>
            <li>
              <a
                href="https://www.nature.com/articles/s41586-025-example"
                target="_blank"
                rel="noopener noreferrer"
              >
                Johnson, S. "Recent Advances" Nature, 2025
              </a>
            </li>
          </ol>
        </div>
      </article>

      {/* Action buttons */}
      <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button aria-label="Take Notes" style={{ padding: '8px 16px' }}>
          📝 Take Notes
        </button>
        <button aria-label="Quiz Me" style={{ padding: '8px 16px' }}>
          ❓ Quiz Me
        </button>
        <button aria-label="Summarize" style={{ padding: '8px 16px' }}>
          📋 Summarize
        </button>
        <button aria-label="Research" style={{ padding: '8px 16px' }}>
          🔬 Research
        </button>
      </div>
    </section>
  );
}
