import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import { KnowledgeGraphBg } from '../../components/KnowledgeGraphBg.js';
import { motion } from 'framer-motion';
import {
  IconBook,
  IconBrainSpark,
  IconChat,
  IconCourse,
  IconLesson,
  IconLock,
  IconMarketplace,
  IconMindmap,
  IconSearch,
  IconSettings,
  IconShield,
  IconShieldKey,
  IconSparkles,
  IconStar,
  IconTrophy,
} from '../../components/icons/index.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  {
    icon: <IconCourse className="w-6 h-6" />,
    title: 'Course Builder',
    desc: 'Enter a topic and get a full, structured course in minutes — synthesized from public web sources with citations (best-effort).',
  },
  {
    icon: <IconLesson className="w-6 h-6" />,
    title: 'Smart Note-Taking',
    desc: 'Cornell notes, flashcards, and Zettelkasten — auto-formatted from your lessons.',
  },
  {
    icon: <IconBrainSpark className="w-6 h-6" />,
    title: 'Adaptive Quizzes',
    desc: 'Quizzes highlight areas to review and help you practice key concepts.',
  },
  {
    icon: <IconMindmap className="w-6 h-6" />,
    title: 'Knowledge Mindmap',
    desc: 'Visualize what you know. Tap nodes to explore, expand, or jump to lessons.',
  },
  {
    icon: <IconSearch className="w-6 h-6" />,
    title: 'Research Agent',
    desc: 'Ask questions and get answers backed by real sources with inline citations.',
  },
  {
    icon: <IconMarketplace className="w-6 h-6" />,
    title: 'Course Marketplace',
    desc: 'Browse and share community-created courses. Publish your own.',
  },
];

const STATS = [
  { value: 'Web-first MVP', label: 'Built for rapid learning loops' },
  { value: 'BYOK', label: 'Use your own API keys' },
  { value: 'Citations', label: 'Best-effort sources in lessons' },
  { value: 'Real-time', label: 'Streaming + live mindmap sync' },
];

const DEMO_STEPS = [
  {
    icon: <IconChat className="w-6 h-6" />,
    title: 'Tell us your goal',
    desc: 'Type any topic — "Learn Rust programming" or "Understand quantum mechanics." We turn it into a plan.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: <IconSettings className="w-6 h-6" />,
    title: 'Build your course',
    desc: 'Agents research the web (when a provider is configured), curate content, build lessons, and generate quizzes.',
    color: 'from-violet-500 to-purple-400',
  },
  {
    icon: <IconTrophy className="w-6 h-6" />,
    title: 'Learn and practice',
    desc: 'Study at your pace with quizzes, smart notes, and a mindmap that grows with your progress.',
    color: 'from-emerald-500 to-teal-400',
  },
];

export function HomePage() {
  const nav = useNavigate();

  return (
    <MarketingLayout>
      <SEO
        title="Learn anything. Master everything."
        description="AI-powered personalized learning platform. Set your goals, and intelligent agents build your learning path from the best web content."
        path="/"
        jsonLd={{
          '@type': 'Organization',
          name: 'LearnFlow',
          url: 'https://learnflow.ai',
          logo: 'https://learnflow.ai/logo.png',
          description: 'AI-powered personalized learning platform',
          sameAs: [],
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-purple-50 to-pink-50 dark:from-accent/10 dark:via-gray-950 dark:to-gray-900" />
        <KnowledgeGraphBg />
        <motion.div
          className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-6 border border-accent/30"
          >
            <span className="inline-flex items-center gap-2">
              <IconSparkles className="w-4 h-4" />
              Now with multi-agent AI pipeline
            </span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 text-gray-900 dark:text-white"
          >
            Learn anything.
            <br />
            <span className="text-accent">Master everything.</span>
            <br />
            Powered by AI agents.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Set your goals, and intelligent agents build your personalized learning path from the
            best content on the web. Free with your own API key.
          </motion.p>

          <motion.div variants={fadeUp} className="max-w-2xl mx-auto mb-10">
            <div className="rounded-2xl border border-amber-200/70 dark:border-amber-400/30 bg-amber-50/70 dark:bg-amber-950/30 px-5 py-4 text-left">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Platform availability (this build)
              </p>
              <ul className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-1">
                <li>
                  <span className="font-medium">Web app:</span> available (recommended)
                </li>
                <li>
                  <span className="font-medium">iOS / Android:</span> planned (not shipped in this
                  MVP)
                </li>
                <li>
                  <span className="font-medium">Desktop:</span> planned (not shipped in this MVP)
                </li>
              </ul>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </motion.div>
        </motion.div>
      </section>

      {/* Social proof */}
      <motion.section
        className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
        initial={false}
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <motion.div key={s.label} className="text-center" variants={fadeUp}>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Demo Section */}
      <section id="demo-section" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-3">See how it works</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            From idea to progress in three simple steps.
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {DEMO_STEPS.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} className="relative text-center group">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-3xl mx-auto mb-4 shadow-elevated group-hover:scale-110 transition-transform duration-300`}
              >
                {step.icon}
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-md md:left-1/2 md:right-auto md:ml-8 md:-top-1">
                {i + 1}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-3">Everything you need to learn effectively</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
            AI agents work together to create, teach, test, and track your learning journey.
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-card transition-all group"
            >
              <span className="text-accent block mb-3">{f.icon}</span>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            className="text-center mb-12"
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-gray-600 dark:text-gray-300">Three steps to progress</p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={false}
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                step: '1',
                icon: <IconChat className="w-6 h-6" />,
                title: 'Tell us what to learn',
                desc: 'Type any topic. Our AI agents research public web sources and synthesize a structured course with citations (best-effort; availability varies by topic).',
              },
              {
                step: '2',
                icon: <IconBook className="w-6 h-6" />,
                title: 'Learn at your pace',
                desc: 'Read lessons with inline citations, take smart notes, and get quizzed on what matters.',
              },
              {
                step: '3',
                icon: <IconMindmap className="w-6 h-6" />,
                title: 'Watch your knowledge grow',
                desc: 'Your mindmap expands as you learn. See connections, identify gaps, and level up.',
              },
            ].map((s) => (
              <motion.div key={s.step} className="text-center" variants={fadeUp}>
                <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust (MVP-safe: no fabricated endorsements/testimonials) */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-3">Built with honest defaults</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Web-first MVP — outcomes vary by learner and content.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={false}
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {[
            {
              title: 'Bring your own AI',
              desc: 'Connect your own OpenAI-compatible API key. LearnFlow does not provide a bundled model in this MVP.',
            },
            {
              title: 'Clear demo labeling',
              desc: 'When an agent runs in mock/demo mode, the UI will tell you in the same screen where results appear.',
            },
            {
              title: 'Privacy-conscious by design',
              desc: 'We minimize data retention and keep the product simple while we iterate with early users.',
            },
          ].map((c) => (
            <motion.div
              key={c.title}
              variants={fadeUp}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-card"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {c.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            {
              icon: <IconLock className="w-4 h-4" />,
              label: 'API keys encrypted at rest (AES-256-GCM, AEAD)',
            },
            { icon: <IconShield className="w-4 h-4" />, label: 'Security-first (MVP)' },
            { icon: <IconShieldKey className="w-4 h-4" />, label: 'BYOK — Your Keys, Your Data' },
          ].map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300"
            >
              <span className="text-gray-500 dark:text-gray-300">{b.icon}</span>
              <span>{b.label}</span>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-12">
            {[
              { value: 'Security-first', label: 'Encrypted API keys at rest' },
              { value: 'Marketplace', label: 'Share and discover courses' },
              {
                value: 'Beta',
                label: 'Early product — feedback welcome',
                icon: <IconStar className="w-4 h-4 text-amber-500" />,
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 inline-flex items-center justify-center gap-1.5">
                  {stat.icon}
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className="max-w-6xl mx-auto px-6 py-20 text-center"
        initial={false}
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
      >
        <h2 className="text-3xl font-bold mb-4">Ready to learn smarter?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
          Start learning with a web-first MVP designed for fast iteration and honest defaults.
        </p>
        <Button variant="primary" size="large" onClick={() => nav('/register')}>
          Start Learning for Free
        </Button>
      </motion.section>
    </MarketingLayout>
  );
}
