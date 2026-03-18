import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { getAllBlogPosts } from '../../data/blogPosts.js';

export function BlogPage() {
  const nav = useNavigate();
  const posts = getAllBlogPosts();

  return (
    <MarketingLayout>
      <SEO title="Blog" description="Insights on AI-powered learning, study techniques, and LearnFlow product updates." path="/blog" />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Insights on AI-powered learning, study techniques, and product updates.</p>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => nav(`/blog/${post.id}`)}
              className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{post.date}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">·</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{post.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
