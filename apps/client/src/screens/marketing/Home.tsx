import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';

const FEATURES = [
  { icon: '🤖', title: 'AI-Generated Courses', desc: 'Paste a topic and get a full, structured course in minutes — sourced from the real web.' },
  { icon: '📝', title: 'Smart Note-Taking', desc: 'Cornell notes, flashcards, and Zettelkasten — auto-generated from your lessons.' },
  { icon: '🧪', title: 'Adaptive Quizzes', desc: 'AI identifies your weak spots and generates targeted quizzes to close gaps.' },
  { icon: '🗺️', title: 'Knowledge Mindmap', desc: 'Visualize what you know. Tap nodes to explore, expand, or jump to lessons.' },
  { icon: '🔍', title: 'Research Agent', desc: 'Ask questions and get answers backed by real sources with inline citations.' },
  { icon: '🏪', title: 'Course Marketplace', desc: 'Browse and share community-created courses. Publish your own.' },
];

const METRICS = {
  courses: '50,000+',
  learners: '12,000+',
  rating: '4.9',
  satisfaction: '98%',
};

const STATS = [
  { value: METRICS.courses, label: 'Courses Created' },
  { value: METRICS.learners, label: 'Active Learners' },
  { value: METRICS.rating, label: 'App Store Rating' },
  { value: METRICS.satisfaction, label: 'Completion Rate' },
];

export function HomePage() {
  const nav = useNavigate();

  return (
    <MarketingLayout>
      <SEO title="Learn anything. Master everything." description="AI-powered personalized learning platform. Set your goals, and intelligent agents build your learning path from the best web content." path="/" />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-purple-50 to-pink-50 dark:from-accent/10 dark:via-gray-950 dark:to-gray-900" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30">
            <span>✨</span> Now with multi-agent AI pipeline
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Learn anything.<br />
            <span className="text-accent">Master everything.</span><br />
            Powered by AI agents.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Set your goals, and intelligent agents build your personalized learning path from the best content on the web. Free with your own API key.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="large" onClick={() => nav('/download')}>
              Get Started Free
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={() => {
                document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need to learn effectively</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">AI agents work together to create, teach, test, and track your learning journey.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-card transition-all group">
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-gray-600 dark:text-gray-400">Three steps to mastery</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '💬', title: 'Tell us what to learn', desc: 'Type any topic. Our AI agents research, curate, and build a full course from real web sources.' },
              { step: '2', icon: '📖', title: 'Learn at your pace', desc: 'Read lessons with inline citations, take smart notes, and get quizzed on what matters.' },
              { step: '3', icon: '🗺️', title: 'Watch your knowledge grow', desc: 'Your mindmap expands as you learn. See connections, identify gaps, and level up.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl mx-auto mb-4">{s.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Social Proof */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Trusted by learners worldwide</h2>
          <p className="text-gray-600 dark:text-gray-400">See what our community says</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { quote: 'LearnFlow completely changed how I study. The AI-generated courses are better than most online courses I\'ve paid for.', name: 'Sarah Chen', role: 'Software Engineer', avatar: '👩💻' },
            { quote: 'The mindmap feature is incredible. I can finally see how all the concepts connect. My retention has improved dramatically.', name: 'Marcus Johnson', role: 'Data Scientist', avatar: '👨🔬' },
            { quote: 'I used LearnFlow to prepare for my AWS certification and passed on the first try. The adaptive quizzes found my weak spots.', name: 'Priya Patel', role: 'Cloud Architect', avatar: '👩🏫' },
          ].map((t) => (
            <div key={t.name} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-card">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.avatar}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: '🔒', label: 'AES-256 Encryption' },
            { icon: '🛡️', label: 'SOC 2 Compliant' },
            { icon: '🇪🇺', label: 'GDPR Ready' },
            { icon: '🔑', label: 'BYOK — Your Keys, Your Data' },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              <span>{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-12">
            {[
              { value: METRICS.courses, label: 'Courses created' },
              { value: METRICS.learners, label: 'Active learners' },
              { value: `${METRICS.rating}★`, label: 'Average rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to learn smarter?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto">Join thousands of learners using AI to master new topics faster than ever.</p>
        <Button variant="primary" size="large" onClick={() => nav('/register')}>
          Start Learning for Free
        </Button>
      </section>
    </MarketingLayout>
  );
}
