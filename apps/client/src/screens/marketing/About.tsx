import React from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { motion } from 'framer-motion';
import {
  IconBook,
  IconChat,
  IconGitHub,
  IconInfo,
  IconLock,
  IconPeople,
  IconShieldKey,
} from '../../components/icons/index.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const TEAM = [
  {
    name: 'Alex Rivera',
    role: 'Founder & CEO',
    icon: <IconPeople className="w-8 h-8" />,
    bio: 'Former ML engineer. Passionate about democratizing education through AI.',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of AI',
    icon: <IconPeople className="w-8 h-8" />,
    bio: 'PhD in NLP. Led research teams building conversational agents for education.',
  },
  {
    name: 'Marcus Chen',
    role: 'Head of Product',
    icon: <IconPeople className="w-8 h-8" />,
    bio: '10+ years building consumer products. Previously at Duolingo and Notion.',
  },
  {
    name: 'Elena Kosova',
    role: 'Head of Engineering',
    icon: <IconPeople className="w-8 h-8" />,
    bio: 'Full-stack architect. Built scalable learning platforms serving millions.',
  },
];

const VALUES = [
  {
    icon: <IconGitHub className="w-7 h-7" />,
    title: 'Open Source First',
    desc: 'Our core platform is open source. We believe knowledge tools should be transparent and community-driven.',
  },
  {
    icon: <IconShieldKey className="w-7 h-7" />,
    title: 'BYOAI — Your Keys, Your Data',
    desc: 'Bring your own API keys. Your data stays yours. We never train on your content or share it with third parties.',
  },
  {
    icon: <IconBook className="w-7 h-7" />,
    title: 'Attribution (Best-Effort)',
    desc: 'When sources are available, AI-generated content can include citations. We believe in giving credit and enabling verification.',
  },
  {
    icon: <IconInfo className="w-7 h-7" />,
    title: 'Accessible to All',
    desc: 'WCAG 2.1 AA compliant. Learning should be available to everyone regardless of ability.',
  },
];

export function AboutPage() {
  return (
    <MarketingLayout>
      <SEO
        title="About"
        description="Learn about LearnFlow's mission, team, values, and commitment to privacy-first AI-powered education."
        path="/about"
      />
      <section className="max-w-6xl mx-auto px-6 py-20">
        {/* Mission */}
        <motion.div
          className="text-center mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-6">Our Mission</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We believe everyone deserves a personal tutor — one that supports how they learn, adapts
            over time, and can incorporate web sources (when configured). LearnFlow makes that
            possible with agents that research, teach, and quiz — and a mindmap that reflects your
            learning progress.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div
          className="mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors"
              >
                <span className="text-accent block mb-3 inline-flex justify-center">{v.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          className="mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-10">The Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((t) => (
              <div
                key={t.name}
                className="text-center p-6 rounded-2xl border border-gray-100 dark:border-gray-800"
              >
                <span className="text-accent block mb-3 inline-flex justify-center">{t.icon}</span>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="text-sm text-accent font-medium mb-2">{t.role}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Our Story */}
        <motion.div
          className="mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-6">Our Story</h2>
          <div className="max-w-3xl mx-auto space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              LearnFlow started in 2024 when our founders realized that despite billions spent on
              edtech, most learning still felt passive — watching videos, reading slides, hoping
              something sticks.
            </p>
            <p>
              We asked:{' '}
              <em>
                What if everyone could have a personal tutor that actually adapts to how they learn?
              </em>{' '}
              Not a chatbot with canned answers, but a system that can research topics from web
              sources (when configured), build structured courses, and guide you through steady
              progress.
            </p>
            <p>
              Our team brought together expertise in machine learning, education science, and
              product design. We built LearnFlow as a privacy-first, open-source platform because we
              believe the tools that shape how people learn should be transparent and owned by the
              community.
            </p>
            <p>
              Today, LearnFlow's agents can crawl the web (when a provider is configured), organize
              knowledge, synthesize lessons, and help you learn at your pace — with citations when
              sources are available.
            </p>
          </div>
        </motion.div>

        {/* By the Numbers */}
        <motion.div
          className="mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-center mb-10">By the Numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '50K+', label: 'Active Learners' },
              { value: '12K+', label: 'Courses Generated' },
              { value: '4.8', label: 'Avg Rating' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800"
              >
                <p className="text-3xl font-extrabold text-accent">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy Commitment */}
        <motion.div
          className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="text-accent block mb-4 inline-flex justify-center">
            <IconLock className="w-10 h-10" />
          </span>
          <h2 className="text-2xl font-bold mb-4">Our Privacy Commitment</h2>
          <div className="max-w-2xl mx-auto text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
            <p>
              Your learning data is yours. Period. We encrypt API keys at rest (AES-256-GCM, AEAD)
              and use TLS in transit. API keys are stored encrypted at rest on the server
              (AES-256-GCM, AEAD) and are never returned in plaintext.
            </p>
            <p>
              We aim to follow security best practices and provide user controls like export and
              deletion from Settings. We never sell your data or use it to train models.
            </p>
            <p>Our open-source codebase means you can verify our privacy practices yourself.</p>
          </div>
        </motion.div>
        {/* Contact CTA */}
        <motion.div
          className="mt-20 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">
            Whether you're an educator, institution, or learner — we'd love to hear from you. Reach
            out for partnerships, feedback, or just to say hello.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="mailto:hello@learnflow.ai"
              className="inline-flex items-center gap-2 bg-accent text-white font-medium px-6 py-3 rounded-xl hover:bg-accent-dark transition-colors"
            >
              <IconChat className="w-4 h-4" />
              Contact Us
            </a>
            <a
              href="https://github.com/learnflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-xl hover:border-accent hover:text-accent transition-colors"
            >
              <IconGitHub className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
