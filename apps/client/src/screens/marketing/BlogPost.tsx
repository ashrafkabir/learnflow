import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getBlogPost } from '../../data/blogPosts.js';

export function BlogPostPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const post = slug ? getBlogPost(slug) : null;

  if (!post) {
    return (
      <MarketingLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button variant="ghost" onClick={() => nav('/blog')}>← Back to Blog</Button>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <SEO title={post.title} description={post.excerpt || post.title} path={`/blog/${post.id}`} />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Button variant="ghost" size="sm" onClick={() => nav('/blog')} className="mb-6">← Back to Blog</Button>
        
        <header className="mb-8">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-4 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-300">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h2: ({ children }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">{children}</h3>,
              p: ({ children }) => <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-6 space-y-1 text-gray-600 dark:text-gray-300 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-6 space-y-1 text-gray-600 dark:text-gray-300 mb-4">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
              code: ({ className, children, ...props }) => {
                const isBlock = className?.startsWith('language-') || className?.startsWith('hljs');
                if (isBlock) {
                  return <code className={className} {...props}>{children}</code>;
                }
                return <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
              },
              pre: ({ children }) => (
                <pre className="bg-gray-900 dark:bg-black text-green-400 rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">{children}</th>,
              td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">{children}</td>,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Share + CTA */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-accent/5 dark:bg-accent/5 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Ready to try LearnFlow?</h3>
            <p className="text-sm text-gray-500 mb-4">Start learning with AI agents for free.</p>
            <Button variant="primary" onClick={() => nav('/register')}>
              Get Started Free
            </Button>
          </div>
        </div>
      </article>
    </MarketingLayout>
  );
}
