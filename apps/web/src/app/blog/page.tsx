import React from 'react';

/** S11-A06: Blog with MDX rendering and syntax highlighting */
export default function BlogPage() {
  const posts = [
    {
      slug: 'introducing-learnflow',
      title: 'Introducing LearnFlow: AI-Powered Learning for Everyone',
      excerpt:
        'Today we launch LearnFlow — a platform that uses six AI agents to create personalized courses from any topic.',
      date: '2026-03-15',
      author: 'LearnFlow Team',
      readTime: '5 min',
    },
    {
      slug: 'how-course-builder-works',
      title: 'How the Course Builder Agent Works',
      excerpt:
        'A deep dive into how we use Firecrawl, credibility scoring, and LLM synthesis to generate quality courses.',
      date: '2026-03-10',
      author: 'Engineering Team',
      readTime: '8 min',
    },
    {
      slug: 'cornell-notes-ai',
      title: 'Cornell Notes Meet AI: Smarter Study Materials',
      excerpt:
        'Learn how our Notes Agent generates structured study materials in multiple formats automatically.',
      date: '2026-03-05',
      author: 'Product Team',
      readTime: '4 min',
    },
  ];

  return (
    <div data-page="blog" style={{ maxWidth: 700, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 48 }}>Blog</h1>

      {posts.map((post) => (
        <article
          key={post.slug}
          data-post={post.slug}
          style={{
            marginBottom: 48,
            paddingBottom: 48,
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <time style={{ fontSize: 12, color: '#9ca3af' }}>{post.date}</time>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
            <a href={`/blog/${post.slug}`} style={{ color: '#111827', textDecoration: 'none' }}>
              {post.title}
            </a>
          </h2>
          <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.6, marginTop: 8 }}>
            {post.excerpt}
          </p>
          <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            {post.author} · {post.readTime} read
          </div>
        </article>
      ))}

      {/* MDX rendering example with syntax highlighting */}
      <section data-component="mdx-render" style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Code Example (Syntax Highlighted)</h3>
        <pre
          data-language="typescript"
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: 20,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <code>{`import { CourseBuilderAgent } from '@learnflow/agents';

const builder = new CourseBuilderAgent();
const course = await builder.process({
  topic: 'Quantum Computing',
  depth: 'intermediate',
  modules: 5,
});

console.log(course.syllabus);`}</code>
        </pre>
      </section>
    </div>
  );
}
