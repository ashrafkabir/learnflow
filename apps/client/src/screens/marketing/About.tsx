import React from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const TEAM = [
  { name: 'Alex Rivera', role: 'Founder & CEO', emoji: '🧑‍💻', bio: 'Former ML engineer at Google. Passionate about democratizing education through AI.' },
  { name: 'Priya Sharma', role: 'Head of AI', emoji: '👩‍🔬', bio: 'PhD in NLP. Led research teams building conversational agents for education.' },
  { name: 'Marcus Chen', role: 'Head of Product', emoji: '👨‍🎨', bio: '10+ years building consumer products. Previously at Duolingo and Notion.' },
  { name: 'Elena Kosova', role: 'Head of Engineering', emoji: '👩‍🏭', bio: 'Full-stack architect. Built scalable learning platforms serving millions.' },
];

const VALUES = [
  { icon: '🔓', title: 'Open Source First', desc: 'Our core platform is open source. We believe knowledge tools should be transparent and community-driven.' },
  { icon: '🔑', title: 'BYOAI — Your Keys, Your Data', desc: 'Bring your own API keys. Your data stays yours. We never train on your content or share it with third parties.' },
  { icon: '📚', title: 'Attribution Always', desc: 'Every piece of AI-generated content cites its sources. We believe in giving credit and enabling verification.' },
  { icon: '♿', title: 'Accessible to All', desc: 'WCAG 2.1 AA compliant. Learning should be available to everyone regardless of ability.' },
];

export function AboutPage() {
  return (
    <MarketingLayout>
      <SEO title="About" description="Learn about LearnFlow's mission, team, values, and commitment to privacy-first AI-powered education." path="/about" />
      <section className="max-w-6xl mx-auto px-6 py-20">
        {/* Mission */}
        <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h1 className="text-4xl font-extrabold tracking-tight mb-6">Our Mission</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We believe everyone deserves a personal tutor — one that understands how they learn, adapts in real-time, and draws from the entire web. LearnFlow makes that possible with AI agents that research, teach, quiz, and track your mastery.
          </p>
        </motion.div>

        {/* Values */}
        <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-3xl font-bold text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors">
                <span className="text-3xl block mb-3">{v.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="text-3xl font-bold text-center mb-10">The Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((t) => (
              <div key={t.name} className="text-center p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-5xl block mb-3">{t.emoji}</span>
                <h3 className="font-semibold text-lg">{t.name}</h3>
                <p className="text-sm text-accent font-medium mb-2">{t.role}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{t.bio}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy Commitment */}
        <motion.div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <span className="text-4xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold mb-4">Our Privacy Commitment</h2>
          <div className="max-w-2xl mx-auto text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
            <p>Your learning data is yours. Period. We use AES-256 encryption at rest and in transit. API keys are stored encrypted and never leave your device in our BYOAI model.</p>
            <p>We are SOC 2 compliant and GDPR ready. You can export or delete all your data at any time from Settings. We never sell your data or use it to train models.</p>
            <p>Our open-source codebase means you can verify our privacy practices yourself.</p>
          </div>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}
