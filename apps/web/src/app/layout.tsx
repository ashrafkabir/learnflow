import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LearnFlow — AI-Powered Personalized Learning',
  description:
    'LearnFlow uses AI agents to create personalized courses, notes, quizzes, and research from any topic. Your AI study companion.',
  openGraph: {
    title: 'LearnFlow — AI-Powered Personalized Learning',
    description:
      'Create personalized courses with AI agents. Notes, quizzes, research, and mindmaps.',
    type: 'website',
    url: 'https://learnflow.ai',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LearnFlow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LearnFlow — AI-Powered Personalized Learning',
    description: 'Create personalized courses with AI agents.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'LearnFlow',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'macOS, Windows, iOS, Android',
              description: 'AI-powered personalized learning platform',
            }),
          }}
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif", color: '#111827' }}>
        <nav
          data-component="site-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 100,
          }}
        >
          <a
            href="/"
            style={{ fontWeight: 700, fontSize: 20, color: '#6366F1', textDecoration: 'none' }}
          >
            LearnFlow
          </a>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/download">Download</a>
            <a href="/marketplace">Marketplace</a>
            <a href="/docs">Docs</a>
            <a href="/about">About</a>
            <a href="/blog">Blog</a>
          </div>
          <a
            href="/download"
            style={{
              padding: '8px 20px',
              background: '#6366F1',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Get Started
          </a>
        </nav>
        <main>{children}</main>
        <footer
          style={{
            padding: '48px 24px',
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            fontSize: 14,
            color: '#6b7280',
          }}
        >
          <p>© 2026 LearnFlow. AI-powered personalized learning.</p>
        </footer>
      </body>
    </html>
  );
}
