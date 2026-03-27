import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.js';
import { SkeletonMarketplace } from '../../components/Skeleton.js';
import { useToast } from '../../components/Toast.js';
import {
  IconCheck,
  IconKey,
  IconRobot,
  IconSearch,
  IconStar,
} from '../../components/icons/index.js';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  tier: string;
  rating: number;
  usageCount: number;
  requiredProvider: string;
  category: Category;
  official: boolean;
}

const CATEGORIES = ['All', 'Study', 'Research', 'Assessment', 'Creative', 'Productivity'] as const;
type Category = (typeof CATEGORIES)[number];
type SortOption = 'popularity' | 'rating' | 'newest';

// NOTE: These are only used as UI fallbacks when the marketplace API returns no agents.
// Real marketplace agents are fetched from `GET /api/v1/marketplace/agents`.
const AGENTS_FALLBACK: Agent[] = [
  {
    id: 'a1',
    name: 'Code Tutor (Demo)',
    description:
      'Demo agent. Reviews and explains code with detailed feedback. Supports Python, JavaScript, TypeScript, Rust, and Go.',
    capabilities: ['code_review', 'explain_code'],
    tier: 'free',
    rating: 4.7,
    usageCount: 3200,
    requiredProvider: 'OpenAI',
    category: 'Study',
    official: true,
  },
  {
    id: 'a2',
    name: 'Research Pro (Demo)',
    description: 'Demo agent. Deep research with academic paper access and citation generation.',
    capabilities: ['deep_research', 'paper_analysis'],
    tier: 'pro',
    rating: 4.9,
    usageCount: 1800,
    requiredProvider: 'OpenAI',
    category: 'Research',
    official: true,
  },
];

/** Spec §5.2.6, §7.2 — Agent Marketplace with activation flow, categories, search, sort */
export function AgentMarketplace() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsError, setAgentsError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');

  // Load marketplace agents from API. If none are returned, fall back to demo agents.
  useEffect(() => {
    const token = localStorage.getItem('learnflow-token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    setLoading(true);
    setAgentsError('');
    fetch('/api/v1/marketplace/agents', { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      })
      .then((data) => {
        const rows = Array.isArray(data?.agents) ? data.agents : [];

        const normalized: Agent[] = rows.map((a: any) => {
          const name = String(a?.name || 'Untitled Agent');
          const description = String(a?.description || '');

          // Best-effort: derive lightweight labels from manifest when possible.
          const manifest = (a?.manifest && typeof a.manifest === 'object') ? a.manifest : {};
          const capabilities = Array.isArray((manifest as any)?.capabilities)
            ? (manifest as any).capabilities.map((c: any) => String(c))
            : [];
          const requiredProvider =
            String((manifest as any)?.provider || (manifest as any)?.requiredProvider || '') ||
            'BYOAI';

          return {
            id: String(a?.id || ''),
            name,
            description,
            capabilities,
            tier: String((manifest as any)?.tier || 'pro'),
            rating: Number((manifest as any)?.rating || 0),
            usageCount: Number((manifest as any)?.usageCount || 0),
            requiredProvider,
            category: 'All',
            official: false,
          };
        });

        setAgents(normalized.length ? normalized : AGENTS_FALLBACK);
      })
      .catch((_e) => {
        setAgentsError('Could not load marketplace agents.');
        setAgents(AGENTS_FALLBACK);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load activated agents for this user from the API (so activation affects runtime).
  useEffect(() => {
    const token = localStorage.getItem('learnflow-token');
    if (!token) return;
    fetch('/api/v1/marketplace/agents/activated', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.activatedAgentIds && Array.isArray(data.activatedAgentIds)) {
          setActivatedIds(new Set(data.activatedAgentIds));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleActivate = async (agent: Agent) => {
    const isActive = activatedIds.has(agent.id);
    if (isActive) {
      setActivatedIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
      toast(`Deactivated "${agent.name}"`, 'info');
      return;
    }

    setActivating(agent.id);
    try {
      const token = localStorage.getItem('learnflow-token');
      if (!token) {
        toast('Please log in to activate agents.', 'error');
        return;
      }

      const res = await fetch(`/api/v1/marketplace/agents/${agent.id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        toast(`Could not activate "${agent.name}". Please try again.`, 'error');
        return;
      }

      setActivatedIds((prev) => new Set([...prev, agent.id]));
      toast(`Activated "${agent.name}"`, 'success');
    } catch {
      toast(`Could not activate "${agent.name}". Please try again.`, 'error');
    } finally {
      setActivating(null);
    }
  };

  const filteredAgents = useMemo(() => {
    const filtered = agents.filter((a) => {
      // Some agents fetched from the API won't have a category; treat as All.
      const effectiveCategory = (a.category || 'All') as Category;
      if (category !== 'All' && effectiveCategory !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      }
      return true;
    });
    const sorted = [...filtered];
    if (sortBy === 'popularity') sorted.sort((a, b) => b.usageCount - a.usageCount);
    else if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    // newest: reverse order by id
    else sorted.sort((a, b) => b.id.localeCompare(a.id));
    return sorted;
  }, [agents, search, category, sortBy]);

  return (
    <section
      aria-label="Agent Marketplace"
      data-screen="agent-marketplace"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
            <IconRobot className="w-5 h-5 text-accent" />
            Agent Marketplace
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* My Activated Agents */}
        {activatedIds.size > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              <span className="inline-flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                My Agents
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {agents.filter((a) => activatedIds.has(a.id)).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
                >
                  <IconRobot className="w-4 h-4 text-green-700 dark:text-green-300" /> {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              aria-label="Search agents"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSearch className="w-4 h-4" />
            </span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort agents"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            <option value="popularity">Sort: Popularity</option>
            <option value="rating">Sort: Rating</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>

        {/* Category Filter Tabs */}
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-1" aria-label="Agent categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-accent text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Agent Grid */}
        {loading ? (
          <SkeletonMarketplace />
        ) : (
          <>
            {agentsError && (
              <div className="mb-4 text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-xl px-4 py-3">
                {agentsError} Showing demo agents.
              </div>
            )}
            {filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <IconSearch className="w-10 h-10 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-300">
                  No results found. Try a different search or category.
                </p>
              </div>
            ) : (
              <div
                data-component="agent-catalog"
                aria-label="Agent catalog"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredAgents.map((a) => {
                  const isActivated = activatedIds.has(a.id);
                  return (
                    <div
                      key={a.id}
                      role="article"
                      aria-label={a.name}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-accent hover:shadow-card transition-all flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {a.name}
                          </h3>
                          {a.official ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                              Official
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 font-medium">
                              Community
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.tier === 'free' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}
                        >
                          {a.tier}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                        {a.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <IconStar className="w-3.5 h-3.5 text-amber-500" />
                          {a.rating}
                        </span>
                        <span>·</span>
                        <span>{a.usageCount.toLocaleString()} uses</span>
                      </div>
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                          <IconKey className="w-3.5 h-3.5" />
                          Requires {a.requiredProvider}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {a.capabilities.map((c) => (
                          <span
                            key={c}
                            className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      {/* Activation Toggle */}
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {isActivated ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleActivate(a)}
                          disabled={activating === a.id}
                          aria-label={`Toggle ${a.name} activation`}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            isActivated ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          } ${activating === a.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          role="switch"
                          aria-checked={isActivated}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              isActivated ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {/* Agent count summary */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Showing {filteredAgents.length} of {agents.length} agents
            {category !== 'All' && ` in ${category}`}
            {search && ` matching "${search}"`}
          </p>
          <p className="mt-1">
            {activatedIds.size} agent{activatedIds.size !== 1 ? 's' : ''} activated
          </p>
        </div>
      </div>
    </section>
  );
}
