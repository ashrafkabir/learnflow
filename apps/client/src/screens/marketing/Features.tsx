import React from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const GRADIENT_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-violet-500 to-purple-400',
  'from-pink-500 to-rose-400',
  'from-indigo-500 to-blue-400',
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Course Generation',
    desc: 'Enter any topic and our multi-agent pipeline researches the web, synthesizes content, and builds a structured course with modules, lessons, and citations.',
    benefits: ['Real web sources with citations', 'Quality-gated content', 'Retry logic for comprehensive coverage'],
  },
  {
    icon: '📝',
    title: 'Smart Note-Taking',
    desc: 'Generate Cornell notes, flashcards, or Zettelkasten entries from any lesson. Notes are contextualized to your learning level.',
    benefits: ['Three note formats', 'Auto-generated cue questions', 'Export to Markdown/PDF'],
  },
  {
    icon: '🧪',
    title: 'Adaptive Quizzes',
    desc: 'Our Exam Agent generates quizzes that target your weak areas. Get explanations for every answer and track improvement over time.',
    benefits: ['Gap analysis', 'Multiple question types', 'Spaced repetition ready'],
  },
  {
    icon: '🗺️',
    title: 'Knowledge Mindmap',
    desc: 'Visualize your entire knowledge graph. Color-coded by mastery level — tap nodes to expand, jump to lessons, or add connections.',
    benefits: ['Interactive vis-network graph', 'Mastery-based coloring', 'Click-to-navigate'],
  },
  {
    icon: '💬',
    title: 'AI Chat Assistant',
    desc: 'Have conversations with specialized AI agents. Ask questions, get research summaries, or create new courses — all through chat.',
    benefits: ['Markdown + LaTeX rendering', 'Contextual quick-action chips', 'Source drawer with citations'],
  },
  {
    icon: '🏪',
    title: 'Marketplace',
    desc: 'Browse community-created courses, activate specialized agents, and share your own courses with the world.',
    benefits: ['Course search & filter', 'Agent marketplace', 'One-click publish'],
  },
];

export function FeaturesPage() {
  return (
    <MarketingLayout>
      <SEO title="Features" description="Explore LearnFlow's AI-powered features: course generation, smart notes, adaptive quizzes, knowledge mindmaps, and more." path="/features" />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Features</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A complete AI-powered learning platform with agents that research, teach, quiz, and track your progress.
          </p>
        </div>

        <motion.div className="space-y-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''} group`}>
              <div className="flex-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} flex items-center justify-center mb-4 shadow-elevated group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl filter drop-shadow-sm">{f.icon}</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-2">
                  {f.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-accent">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 h-48 md:h-64 bg-gradient-to-br from-accent/10 via-purple-50 to-pink-50 dark:from-accent/20 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden group-hover:shadow-xl group-hover:border-accent/30 transition-all duration-300">
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-accent/5 dark:bg-accent/10" />
                <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-purple-200/30 dark:bg-purple-500/10" />
                <span className="text-7xl drop-shadow-sm">{f.icon}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {f.benefits.slice(0, 3).map((b, j) => (
                    <span key={j} className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 font-medium shadow-card border border-gray-200/50 dark:border-gray-600/50">{b}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
