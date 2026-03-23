import React from 'react';
import { useToast } from './Toast.js';
import { Button } from './Button.js';

type AdminSearchConfig = {
  stage1Templates: string[];
  stage2Templates: string[];
  enabledSources: Record<string, boolean>;
  perQueryLimit: number;
  maxSourcesPerLesson: number;
  maxStage1Queries: number;
  maxStage2Queries: number;
};

const SOURCE_LABELS: Array<[string, string]> = [
  ['wikipedia', 'Wikipedia'],
  ['arxiv', 'arXiv'],
  ['github', 'GitHub'],
  ['reddit', 'Reddit'],
  ['medium', 'Medium'],
  ['substack', 'Substack'],
  ['quora', 'Quora'],
  ['thenewstack', 'The New Stack'],
  ['devto', 'Dev.to'],
  ['hackernews', 'Hacker News'],
  ['stackoverflow', 'Stack Overflow'],
  ['freecodecamp', 'freeCodeCamp'],
  ['towardsdatascience', 'Towards Data Science'],
  ['digitalocean', 'DigitalOcean'],
  ['mdn', 'MDN'],
  ['smashingmag', 'Smashing Magazine'],
  ['coursera', 'Coursera'],
  ['baiduscholar', 'Baidu Scholar'],
  ['tavily', 'Tavily'],
];

function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function AdminSearchConfigPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [config, setConfig] = React.useState<AdminSearchConfig | null>(null);

  const [stage1Text, setStage1Text] = React.useState('');
  const [stage2Text, setStage2Text] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('learnflow-token') || '';
        const res = await fetch('/api/v1/admin/search-config', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        if (!res.ok) throw new Error('Failed to load admin config');
        const data = await res.json();
        setConfig(data.config);
        setStage1Text((data.config.stage1Templates || []).join('\n'));
        setStage2Text((data.config.stage2Templates || []).join('\n'));
      } catch (e: any) {
        toast(e?.message || 'Failed to load admin search config', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateEnabled = (id: string, enabled: boolean) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, enabledSources: { ...prev.enabledSources, [id]: enabled } };
    });
  };

  const onSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const payload: AdminSearchConfig = {
        ...config,
        stage1Templates: parseLines(stage1Text),
        stage2Templates: parseLines(stage2Text),
      };

      const token = localStorage.getItem('learnflow-token') || '';
      const res = await fetch('/api/v1/admin/search-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to save');
      setConfig(data.config);
      toast('Saved admin search settings', 'success');
    } catch (e: any) {
      toast(e?.message || 'Failed to save admin search config', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Loading…</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4"
      aria-label="Admin Search Config"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin</h2>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            Configure the web searches used during course creation.
          </p>
        </div>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
        <div className="font-semibold mb-1">Placeholders</div>
        <div className="flex flex-wrap gap-2">
          {['{courseTopic}', '{moduleTitle}', '{lessonTitle}', '{lessonDescription}'].map((p) => (
            <code key={p} className="px-2 py-0.5 rounded bg-white/70 dark:bg-black/30">
              {p}
            </code>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Stage 1 (Topic trending) query templates
          </h3>
          <textarea
            value={stage1Text}
            onChange={(e) => setStage1Text(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="One template per line"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Stage 2 (Per-lesson) query templates
          </h3>
          <textarea
            value={stage2Text}
            onChange={(e) => setStage2Text(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="One template per line"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOURCE_LABELS.map(([id, label]) => (
              <label
                key={id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
                <input
                  type="checkbox"
                  checked={config.enabledSources?.[id] !== false}
                  onChange={(e) => updateEnabled(id, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Caps</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['perQueryLimit', 'Per-query limit', 1, 10],
              ['maxSourcesPerLesson', 'Max sources/lesson', 1, 12],
              ['maxStage1Queries', 'Max stage 1 queries', 1, 20],
              ['maxStage2Queries', 'Max stage 2 queries', 1, 20],
            ].map(([key, label, min, max]) => (
              <label key={String(key)} className="block">
                <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                <input
                  type="number"
                  min={Number(min)}
                  max={Number(max)}
                  value={(config as any)[key]}
                  onChange={(e) =>
                    setConfig((prev) =>
                      prev ? ({ ...prev, [key]: Number(e.target.value) } as any) : prev,
                    )
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
