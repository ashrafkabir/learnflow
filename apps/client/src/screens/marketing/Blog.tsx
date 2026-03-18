import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { getAllBlogPosts } from '../../data/blogPosts.js';

export function BlogPage() {
  const nav = useNavigate();
  const posts = getAllBlogPosts();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  /* Derive unique tags from posts */
  const tags = useMemo(() => {
    const set = new Set(posts.map((p: any) => p.tag));
    return ['All', ...Array.from(set)];
  }, [posts]);

  /* Filter posts by search query and tag */
  const filtered = useMemo(() => {
    return posts.filter((post: any) => {
      const matchesSearch = search === '' || post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt.toLowerCase().includes(search.toLowerCase());
      const matchesTag = selectedTag === 'All' || post.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }, [posts, search, selectedTag]);

  return (
    <MarketingLayout>
      <SEO title="Blog" description="Insights on AI-powered learning, study techniques, and LearnFlow product updates." path="/blog" />
      <section className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Insights on AI-powered learning, study techniques, and product updates.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Blog categories">
          {tags.map((tag) => (
            <button
              key={tag}
              role="tab"
              aria-selected={selectedTag === tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedTag === tag
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}{search ? ` matching "${search}"` : ''}{selectedTag !== 'All' ? ` in ${selectedTag}` : ''}
        </p>

        {/* Posts List */}
        <div className="space-y-6">
          {filtered.map((post: any) => (
            <article
              key={post.id}
              onClick={() => nav(`/blog/${post.id}`)}
              className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-elevated transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">{post.date}</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">·</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">{post.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{post.excerpt}</p>
              <div className="mt-3">
                <span className="text-xs font-medium text-accent group-hover:underline">Read more →</span>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-sm mt-1">Try adjusting your search or category filter.</p>
              <button onClick={() => { setSearch(''); setSelectedTag('All'); }} className="mt-4 text-sm text-accent hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 text-center">
          <h3 className="text-xl font-bold mb-2">Stay in the Loop</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Get the latest articles on AI-powered learning delivered to your inbox.</p>
          <div className="flex max-w-sm mx-auto gap-2">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:border-accent" />
            <button className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors">Subscribe</button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
