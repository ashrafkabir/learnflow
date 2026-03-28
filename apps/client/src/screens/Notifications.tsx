import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import {
  IconBrainSpark,
  IconClose,
  IconProgressRing,
  IconSpark,
} from '../components/icons/index.js';
import { toast } from '../components/Toast.js';
import { apiGet, apiPost } from '../context/AppContext.js';

export function NotificationsScreen() {
  const { state, dispatch } = useApp();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(true);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  );

  async function refresh() {
    setLoading(true);
    try {
      const n = await apiGet('/notifications?limit=100');
      if (Array.isArray(n?.notifications)) {
        const mapped = n.notifications.map((row: any) => ({
          id: String(row.id),
          type: (row.type as any) || 'system',
          message: String(row.title || row.body || ''),
          timestamp: row.createdAt || new Date().toISOString(),
          read: Boolean(row.readAt),
          meta: {
            topic: String(row.topic || ''),
            url: String(row.url || ''),
            sourceUrl: String(row.sourceUrl || ''),
            sourceDomain: String(row.sourceDomain || ''),
            checkedAt: row.checkedAt ? String(row.checkedAt) : null,
            explanation: String(row.explanation || ''),
          },
        }));
        dispatch({ type: 'SET_NOTIFICATIONS', notifications: mapped });
      }
    } catch (e: any) {
      toast(String(e?.message || 'Failed to load notifications'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Best-effort refresh on load.
    refresh();
  }, []);

  const list = useMemo(() => {
    const all = state.notifications || [];
    return showAll ? all : all.filter((n) => !n.read);
  }, [state.notifications, showAll]);

  return (
    <section
      aria-label="Notifications"
      data-screen="notifications"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
              ←
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <Button variant="ghost" size="sm" disabled={loading} onClick={() => refresh()}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant={showAll ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowAll(true)}
          >
            All
          </Button>
          <Button
            variant={!showAll ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowAll(false)}
          >
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={loading || state.notifications.length === 0}
            onClick={async () => {
              setLoading(true);
              try {
                await apiPost('/notifications/read-all', {});
                // Local optimistic mark-all-read.
                dispatch({
                  type: 'SET_NOTIFICATIONS',
                  notifications: state.notifications.map((n) => ({ ...n, read: true })),
                });
                toast('Marked all as read', 'success');
              } catch (e: any) {
                toast(String(e?.message || 'Failed to mark all read'), 'error');
              } finally {
                setLoading(false);
              }
            }}
          >
            Mark all read
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4">
          {list.length === 0 ? (
            <p className="text-sm text-gray-800/80 dark:text-gray-200 text-center py-6">
              {showAll ? 'No notifications yet.' : 'No unread notifications.'}
            </p>
          ) : (
            <div className="space-y-2">
              {list.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    n.read ? 'border-gray-100 dark:border-gray-800' : 'border-accent/30 bg-accent/5'
                  }`}
                >
                  <span className="text-accent mt-0.5" aria-hidden>
                    {n.type === 'agent' ? (
                      <IconBrainSpark size={16} />
                    ) : n.type === 'progress' ? (
                      <IconProgressRing size={16} />
                    ) : (
                      <IconSpark size={16} />
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800/90 dark:text-gray-100">{n.message}</div>
                    {(n as any).meta?.sourceDomain || (n as any).meta?.url ? (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                        <span>
                          Checked:{' '}
                          {(n as any).meta?.sourceDomain || (n as any).meta?.sourceUrl || 'unknown'}
                        </span>
                        {(n as any).meta?.checkedAt ? (
                          <span> · {new Date((n as any).meta.checkedAt).toLocaleString()}</span>
                        ) : null}
                        {(n as any).meta?.explanation ? (
                          <div className="mt-1">Why: {(n as any).meta.explanation}</div>
                        ) : null}
                        {(n as any).meta?.url ? (
                          <div className="mt-1">
                            <a
                              href={(n as any).meta.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline break-all"
                            >
                              {(n as any).meta.url}
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] text-gray-400">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: n.id })}
                      aria-label="Dismiss notification"
                    >
                      <IconClose size={14} className="text-current" decorative />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
          Notes: The dashboard shows only a small slice. This screen loads up to 100 recent items
          from the server.
        </div>
      </div>
    </section>
  );
}
