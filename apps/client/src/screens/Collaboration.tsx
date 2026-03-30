import React, { useEffect, useMemo, useState } from 'react';
import { SEO } from '../components/SEO.js';
import { Button } from '../components/Button.js';
import { apiGet, apiPost, useApp } from '../context/AppContext.js';
import {
  IconBrainSpark,
  IconCourse,
  IconHandshake,
  IconMap,
  IconPeople,
  IconRocket,
  IconSettings,
} from '../components/icons/index.js';

const TABS = ['Study Partners (Preview)', 'My Groups', 'Shared Mindmaps'] as const;

const INTEREST_TAGS = [
  'Machine Learning',
  'Web Development',
  'Data Science',
  'Rust',
  'Python',
  'Cloud Architecture',
  'Cybersecurity',
  'Mobile Dev',
  'DevOps',
  'Blockchain',
  'UI/UX Design',
  'Algorithms',
  'System Design',
  'Quantum Computing',
];

// Groups are now backed by API (Iter70). Keep UI-friendly icon selection local.

// Partner matches are now returned by API (Iter70).

// Shared mindmaps/notes: Iter96 implements group-owned Yjs rooms + invite links.

export function Collaboration() {
  const { dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Study Partners (Preview)');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupTopic, setGroupTopic] = useState('');

  const [matches, setMatches] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Shared mindmaps
  const [shareGroupId, setShareGroupId] = useState<string | null>(null);
  const [shareCourseId, setShareCourseId] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const notify = (message: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: {
        id: `notif-${Date.now()}`,
        type: 'system',
        message,
        timestamp: new Date().toISOString(),
        read: false,
      },
    });
  };

  const groupIcon = (topic: string) => {
    const t = String(topic || '').toLowerCase();
    if (t.includes('rust')) return <IconSettings className="w-6 h-6" />;
    if (t.includes('ml') || t.includes('machine')) return <IconBrainSpark className="w-6 h-6" />;
    if (t.includes('react') || t.includes('web')) return <IconCourse className="w-6 h-6" />;
    return <IconPeople className="w-6 h-6" />;
  };

  const refreshGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await apiGet('/collaboration/groups');
      setGroups(res?.groups || []);
      if (!selectedGroupId && (res?.groups || []).length > 0) {
        setSelectedGroupId(res.groups[0].id);
      }
    } catch {
      // errors already logged by apiGet
    } finally {
      setLoadingGroups(false);
    }
  };

  const refreshMessages = async (groupId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiGet(`/collaboration/groups/${groupId}/messages`);
      setMessages(res?.messages || []);
    } catch {
      // errors already logged
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiPost('/collaboration/groups', { name: groupName, topic: groupTopic });
      notify(`Group "${res?.group?.name || groupName}" created.`);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupTopic('');
      await refreshGroups();
      if (res?.group?.id) {
        setSelectedGroupId(res.group.id);
        await refreshMessages(res.group.id);
      }
    } catch {
      // silent
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMessage.trim()) return;
    try {
      await apiPost(`/collaboration/groups/${selectedGroupId}/messages`, {
        content: newMessage.trim(),
      });
      setNewMessage('');
      await refreshMessages(selectedGroupId);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    // Load groups on entering the screen
    void refreshGroups();
    void apiGet('/collaboration/matches')
      .then((res) => setMatches(res?.matches || []))
      .catch(() => undefined);
  }, []);

  // Shared mindmap deep-link handling.
  // URL: /collaborate?tab=Shared%20Mindmaps&groupId=...&courseId=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const gid = params.get('groupId');
      const cid = params.get('courseId');
      if (tab && (TABS as any).includes(tab)) setActiveTab(tab as any);
      if (gid) setJoinCode(gid);
      if (cid) setShareCourseId(cid);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (selectedGroupId) void refreshMessages(selectedGroupId);
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((g: any) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );

  return (
    <section className="min-h-screen bg-bg dark:bg-bg-dark">
      <SEO
        title="Collaborate"
        description="Learn together — find study partners, join groups, and share mindmaps."
        path="/collaborate"
      />
      <div className="max-w-4xl mx-auto px-4 py-8 md:pl-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Learn Together</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Collaborate with peers to accelerate your learning.
        </p>

        <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent font-medium flex items-center gap-2">
          <span className="inline-flex items-center">
            <IconRocket className="w-4 h-4" />
          </span>
          Collaboration (MVP): groups + messages are persisted. Study partner matches are{' '}
          <span className="font-semibold">synthetic suggestions</span> (not verified, not real-time,
          and not based on real user availability). Shared mindmaps use live sync links for group
          members.
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Study Partners (Preview) */}
        {activeTab === 'Study Partners (Preview)' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white inline-flex items-center gap-2">
                <IconSettings className="w-5 h-5 text-accent" />
                Select Your Interests
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Preview: study partner suggestions are generated from your selected topics.
                <span className="font-semibold">They are synthetic suggestions</span> and do not
                reflect verified accounts or real-time availability.
              </p>
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
              <Button
                variant="primary"
                size="sm"
                disabled={selectedTags.length === 0}
                onClick={() =>
                  notify(
                    `Generating topic-based suggestions for: ${selectedTags.slice(0, 5).join(', ')} (Preview)`,
                  )
                }
              >
                Generate suggestions ({selectedTags.length} topics selected)
              </Button>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white inline-flex items-center gap-2">
                <IconHandshake className="w-5 h-5 text-accent" />
                Suggested Partners (Preview)
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                These are topic-based, synthetic suggestions. Availability/identity is not verified
                in this MVP.
              </p>
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-300">No matches yet.</div>
                ) : (
                  matches.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 transition-colors"
                    >
                      <span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <IconPeople className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {p.displayName || p.name}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold">
                            {p.source === 'synthetic' ? 'Suggested (synthetic preview)' : 'Match'}
                          </span>
                          {/* Online indicator is decorative in preview mode; do not imply real-time presence. */}
                          <span className="text-xs text-gray-500">{p.level || 'Intermediate'}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                          Suggested based on topics (preview)
                        </div>
                        <div className="flex gap-1 mt-1">
                          {(p.topics || []).slice(0, 3).map((t: string) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => notify('Connect request sent (preview).')}
                      >
                        Connect (preview)
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Groups */}
        {activeTab === 'My Groups' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                <IconPeople className="w-5 h-5 text-accent" />
                Study Groups
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateGroup(!showCreateGroup)}
              >
                {showCreateGroup ? 'Cancel' : '+ Start a Group'}
              </Button>
            </div>

            {showCreateGroup && (
              <form
                onSubmit={handleCreateGroup}
                className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-4"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">Create a New Group</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    placeholder="e.g., Rust Systems Club"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic
                  </label>
                  <input
                    value={groupTopic}
                    onChange={(e) => setGroupTopic(e.target.value)}
                    required
                    placeholder="e.g., Systems programming with Rust"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  Create Group
                </Button>
              </form>
            )}

            <div className="space-y-3">
              {loadingGroups ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">Loading groups…</div>
              ) : groups.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  No groups yet. Start one to collaborate.
                </div>
              ) : (
                groups.map((g: any) => (
                  <div
                    key={g.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-gray-900 transition-colors cursor-pointer ${
                      selectedGroupId === g.id
                        ? 'border-accent/60'
                        : 'border-gray-100 dark:border-gray-800 hover:border-accent/30'
                    }`}
                    onClick={() => setSelectedGroupId(g.id)}
                  >
                    <span className="text-accent">{groupIcon(g.topic)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {g.name}
                        </span>
                        {selectedGroupId === g.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {g.topic} · {(g.memberIds || []).length} members
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(g.id)}>
                      Open
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Thread */}
            {selectedGroup && (
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedGroup.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {selectedGroup.topic}
                </p>

                <div className="space-y-2 mb-4 max-h-64 overflow-auto pr-1">
                  {loadingMessages ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">No messages yet.</div>
                  ) : (
                    messages.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="text-xs text-gray-500 mb-1">{m.userId}</div>
                        <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={!newMessage.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Shared Mindmaps & Collaboration Hub */}
        {activeTab === 'Shared Mindmaps' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white inline-flex items-center gap-2">
                <IconMap className="w-5 h-5 text-accent" />
                Shared Mindmaps
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Shared mindmaps are group-owned rooms. Anyone with access to the group can open the
                same mindmap and collaborate live.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                MVP note: invite code = group id (not a secret). ACL is enforced by group
                membership.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Create a share link
                </h3>

                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group
                </label>
                <select
                  value={shareGroupId || ''}
                  onChange={(e) => setShareGroupId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select a group…</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-3 mb-1">
                  Course ID (room namespace)
                </label>
                <input
                  value={shareCourseId}
                  onChange={(e) => setShareCourseId(e.target.value)}
                  placeholder="e.g., course-123 (or any shared key)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!shareGroupId || !shareCourseId.trim()}
                    onClick={async () => {
                      const gid = shareGroupId;
                      const cid = shareCourseId.trim();
                      if (!gid || !cid) return;
                      const link = `${window.location.origin}/mindmap?groupId=${encodeURIComponent(gid)}&courseId=${encodeURIComponent(cid)}`;
                      try {
                        await navigator.clipboard.writeText(link);
                        notify('Share link copied.');
                      } catch {
                        notify(link);
                      }
                    }}
                  >
                    Copy share link
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Join a shared mindmap
                </h3>

                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invite code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Paste group invite code"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-3 mb-1">
                  Course ID (room namespace)
                </label>
                <input
                  value={shareCourseId}
                  onChange={(e) => setShareCourseId(e.target.value)}
                  placeholder="Same courseId used by the group"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!joinCode.trim() || !shareCourseId.trim()}
                    onClick={() => {
                      const gid = joinCode.trim();
                      const cid = shareCourseId.trim();
                      if (!gid || !cid) return;
                      window.location.href = `/mindmap?groupId=${encodeURIComponent(gid)}&courseId=${encodeURIComponent(cid)}`;
                    }}
                  >
                    Open mindmap
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
