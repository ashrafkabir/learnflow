import React from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { motion } from 'framer-motion';
import {
  IconChat,
  IconCheck,
  IconCourse,
  IconLesson,
  IconMarketplace,
  IconMindmap,
  IconRocket,
  IconSettings,
  IconSparkles,
  IconTestTube,
} from '../../components/icons/index.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
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
    icon: <IconCourse className="w-6 h-6" />,
    title: 'AI Course Generation',
    desc: 'Enter a topic and our multi-agent pipeline synthesizes a structured course with modules, lessons, and citations. Source availability varies by topic and deployment configuration.',
    benefits: [
      'Best-effort sources with citations',
      'Quality-gated content',
      'Retry logic for broader coverage',
    ],
  },
  {
    icon: <IconLesson className="w-6 h-6" />,
    title: 'Smart Note-Taking',
    desc: 'Auto-format Cornell notes, flashcards, or Zettelkasten entries from any lesson (template-based in this MVP).',
    benefits: [
      'Three note formats',
      'Auto-generated cue questions',
      'Export to Markdown (PDF/SCORM coming soon)',
    ],
  },
  {
    icon: <IconTestTube className="w-6 h-6" />,
    title: 'Adaptive Quizzes',
    desc: 'Practice with quizzes and review the concepts you missed. Track progress over time.',
    benefits: ['Review highlights', 'Multiple question types', 'Spaced repetition ready'],
  },
  {
    icon: <IconMindmap className="w-6 h-6" />,
    title: 'Mindmap',
    desc: 'Visualize your course map (courses/modules/lessons). Color-coded by progress level — tap nodes to explore and jump to lessons.',
    benefits: ['Interactive vis-network graph', 'Progress-based coloring', 'Click-to-navigate'],
  },
  {
    icon: <IconChat className="w-6 h-6" />,
    title: 'AI Chat Assistant',
    desc: 'Have conversations with specialized AI agents. Ask questions, get research summaries, or create new courses — all through chat.',
    benefits: [
      'Markdown + LaTeX rendering',
      'Contextual quick-action chips',
      'Source drawer with citations',
    ],
  },
  {
    icon: <IconMarketplace className="w-6 h-6" />,
    title: 'Marketplace',
    desc: 'Browse community-created courses, activate specialized agents, and share your own courses with the world (marketplace publishing is MVP/mock).',
    benefits: [
      'Course search & filter',
      'Agent marketplace',
      'Shareable course pages (publish flow is MVP/mock)',
    ],
  },
];

export function FeaturesPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Features"
        description="Explore LearnFlow's AI-powered features: course generation, smart notes, adaptive quizzes, mindmaps, and more."
        path="/features"
      />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Features</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A complete AI-powered learning platform with agents that research, teach, quiz, and
            track your progress.
          </p>
        </div>

        <motion.div
          className="space-y-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className={`flex flex-col md:flex-row gap-8 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''} group`}
            >
              <div className="flex-1">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENT_COLORS[i % GRADIENT_COLORS.length]} flex items-center justify-center mb-4 shadow-elevated group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className="text-accent filter drop-shadow-sm">{f.icon}</span>
                </div>
                <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-2">
                  {f.benefits.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <span className="text-accent inline-flex items-center">
                        <IconCheck className="w-4 h-4" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 h-48 md:h-64 bg-gradient-to-br from-accent/10 via-purple-50 to-pink-50 dark:from-accent/20 dark:via-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden group-hover:shadow-xl group-hover:border-accent/30 transition-all duration-300">
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-accent/5 dark:bg-accent/10" />
                <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-purple-200/30 dark:bg-purple-500/10" />
                <span className="text-accent drop-shadow-sm">{f.icon}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {f.benefits.slice(0, 3).map((b, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 font-medium shadow-card border border-gray-200/50 dark:border-gray-600/50"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* How It Works */}
        <motion.div
          className="mt-24 mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: <IconChat className="w-8 h-8" />,
                title: 'Tell Us What to Learn',
                desc: 'Enter a topic. Agents can research public web sources (when configured) and synthesize a structured course with citations (best-effort).',
              },
              {
                step: '2',
                icon: <IconSettings className="w-8 h-8" />,
                title: 'Build Your Course',
                desc: 'Our pipeline organizes sources, reduces near-duplicates, checks basic quality signals, and synthesizes structured lessons with citations (best-effort).',
              },
              {
                step: '3',
                icon: <IconRocket className="w-8 h-8" />,
                title: 'Learn & Practice',
                desc: 'Study at your pace with interactive lessons, quizzes, smart notes, and a mindmap that reflects your progress.',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="text-center p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-card">
                  {s.step}
                </div>
                <span className="text-accent block mb-4 mt-2 inline-flex justify-center">
                  {s.icon}
                </span>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          className="mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-10">How LearnFlow Compares</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Feature
                  </th>
                  <th className="py-3 px-4 font-bold text-accent">LearnFlow</th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    ChatGPT
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Coursera
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Duolingo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  {
                    feature: 'AI Course Generation',
                    lf: true,
                    gpt: false,
                    coursera: false,
                    duo: false,
                  },
                  {
                    feature: 'Citations (when sources available)',
                    lf: true,
                    gpt: false,
                    coursera: true,
                    duo: false,
                  },
                  { feature: 'Adaptive Quizzes', lf: true, gpt: false, coursera: false, duo: true },
                  {
                    feature: 'Mindmap',
                    lf: true,
                    gpt: false,
                    coursera: false,
                    duo: false,
                  },
                  {
                    feature: 'Multi-Agent System',
                    lf: true,
                    gpt: false,
                    coursera: false,
                    duo: false,
                  },
                  {
                    feature: 'BYOAI / Own Keys',
                    lf: true,
                    gpt: false,
                    coursera: false,
                    duo: false,
                  },
                  {
                    feature: 'Offline Support (PWA)',
                    lf: true,
                    gpt: false,
                    coursera: true,
                    duo: true,
                  },
                  { feature: 'Open Source', lf: true, gpt: false, coursera: false, duo: false },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{row.feature}</td>
                    <td className="py-2.5 px-4 text-center">
                      {row.lf ? <IconCheck className="w-4 h-4 text-success inline" /> : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.gpt ? <IconCheck className="w-4 h-4 text-success inline" /> : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.coursera ? <IconCheck className="w-4 h-4 text-success inline" /> : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.duo ? <IconCheck className="w-4 h-4 text-success inline" /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Testimonials removed (MVP trust): avoid unverified learner quotes/outcome claims. */}

        {/* CTA */}
        <motion.div
          className="text-center py-16 rounded-2xl bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform How You Learn?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
            Start with a free account. No credit card required. Build your first AI-generated course
            in minutes.
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-8 py-3 rounded-xl hover:bg-accent-dark transition-colors shadow-card"
          >
            <IconSparkles className="w-4 h-4" />
            Get Started Free
          </a>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
