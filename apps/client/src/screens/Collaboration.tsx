import React, { useState } from 'react';
import { SEO } from '../components/SEO.js';
import { Button } from '../components/Button.js';

const TABS = ['Find Study Partners', 'My Groups', 'Shared Mindmaps'] as const;

const INTEREST_TAGS = [
  'Machine Learning', 'Web Development', 'Data Science', 'Rust', 'Python',
  'Cloud Architecture', 'Cybersecurity', 'Mobile Dev', 'DevOps', 'Blockchain',
  'UI/UX Design', 'Algorithms', 'System Design', 'Quantum Computing',
];

const MOCK_GROUPS = [
  { id: '1', name: 'Rust Systems Programmers', members: 12, topic: 'Rust & Systems Programming', emoji: '🦀', active: true },
  { id: '2', name: 'ML Paper Reading Club', members: 28, topic: 'Machine Learning Research', emoji: '🧠', active: true },
  { id: '3', name: 'Full-Stack Builders', members: 19, topic: 'React + Node.js Projects', emoji: '🏗️', active: false },
];

const MOCK_PARTNERS = [
  { name: 'Alex K.', avatar: '👨‍💻', topics: ['Rust', 'System Design'], level: 'Intermediate', online: true },
  { name: 'Maria S.', avatar: '👩‍🔬', topics: ['Machine Learning', 'Python'], level: 'Advanced', online: true },
  { name: 'Jordan T.', avatar: '🧑‍🎓', topics: ['Web Development', 'DevOps'], level: 'Beginner', online: false },
];

const SHARED_NOTES = [
  { id: '1', title: 'Rust Ownership Explained', author: 'Alex K.', shared: '2h ago', collaborators: 3 },
  { id: '2', title: 'ML Pipeline Architecture', author: 'Maria S.', shared: '5h ago', collaborators: 5 },
  { id: '3', title: 'React Server Components Guide', author: 'You', shared: '1d ago', collaborators: 2 },
];

const ACTIVE_COLLABORATORS = [
  { name: 'Alex K.', avatar: '👨‍💻', status: 'Studying Rust' },
  { name: 'Maria S.', avatar: '👩‍🔬', status: 'Reading ML papers' },
  { name: 'Jordan T.', avatar: '🧑‍🎓', status: 'Offline' },
];

export function Collaboration() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Find Study Partners');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupTopic, setGroupTopic] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Group "${groupName}" created for topic "${groupTopic}"! (Mock)`);
    setShowCreateGroup(false);
    setGroupName('');
    setGroupTopic('');
  };

  return (
    <section className="min-h-screen bg-bg dark:bg-bg-dark">
      <SEO title="Collaborate" description="Learn together — find study partners, join groups, and share mindmaps." path="/collaborate" />
      <div className="max-w-4xl mx-auto px-4 py-8 md:pl-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Learn Together</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Collaborate with peers to accelerate your learning.</p>

        <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent font-medium flex items-center gap-2">
          <span>🚀</span> Collaboration features are in active development. Early access coming soon!
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <Button key={tab} variant={activeTab === tab ? 'primary' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab}
            </Button>
          ))}
        </div>

        {/* Find Study Partners */}
        {activeTab === 'Find Study Partners' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">🏷️ Select Your Interests</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Choose topics to match with study partners who share your goals.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {INTEREST_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="sm" disabled={selectedTags.length === 0} onClick={() => alert('Matching you with partners... (Mock)')}>
                Find Partners ({selectedTags.length} topics selected)
              </Button>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">🤝 Suggested Partners</h2>
              <div className="space-y-3">
                {MOCK_PARTNERS.map((p) => (
                  <div key={p.name} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors">
                    <span className="text-3xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                        <span className={`w-2 h-2 rounded-full ${p.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-gray-500">{p.level}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {p.topics.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{t}</span>
                        ))}
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => alert(`Invite sent to ${p.name}! (Mock)`)}>Connect</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Groups */}
        {activeTab === 'My Groups' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">👥 Study Groups</h2>
              <Button variant="primary" size="sm" onClick={() => setShowCreateGroup(!showCreateGroup)}>
                {showCreateGroup ? 'Cancel' : '+ Start a Group'}
              </Button>
            </div>

            {showCreateGroup && (
              <form onSubmit={handleCreateGroup} className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Create a New Group</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name</label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    placeholder="e.g., Rust Systems Club"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                  <input
                    value={groupTopic}
                    onChange={(e) => setGroupTopic(e.target.value)}
                    required
                    placeholder="e.g., Systems programming with Rust"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">Create Group</Button>
              </form>
            )}

            <div className="space-y-3">
              {MOCK_GROUPS.map((g) => (
                <div key={g.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-accent/30 transition-colors">
                  <span className="text-3xl">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{g.name}</span>
                      {g.active && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{g.topic} · {g.members} members</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => alert(`Joined ${g.name}! (Mock)`)}>Join</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Mindmaps & Collaboration Hub */}
        {activeTab === 'Shared Mindmaps' && (
          <div className="space-y-6">
            {/* Active Collaborators */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">🟢 Active Collaborators</h2>
              <div className="flex flex-wrap gap-3">
                {ACTIVE_COLLABORATORS.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <span className="text-xl">{c.avatar}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Notes */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📄 Shared Notes</h2>
                <Button variant="primary" size="sm" onClick={() => alert('Share a note... (Mock)')}>
                  + Share Note
                </Button>
              </div>
              <div className="space-y-3">
                {SHARED_NOTES.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{note.title}</p>
                      <p className="text-xs text-gray-500">by {note.author} · {note.shared} · {note.collaborators} collaborators</p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Peer */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
              <span className="text-3xl block mb-2">✉️</span>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Invite a Peer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Share your learning journey — invite friends to collaborate on mindmaps and notes.</p>
              <Button variant="primary" size="sm" onClick={() => alert('Invite link copied! (Mock)')}>
                Copy Invite Link
              </Button>
            </div>

            {/* Shared Mindmaps preview */}
            <div className="text-center py-10 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <span className="text-4xl block mb-3">🗺️</span>
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Shared Mindmaps</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-4">
                Collaborate on knowledge graphs in real-time. See what your peers know, identify complementary strengths, and fill gaps together.
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">Coming Soon</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
