import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Simple deterministic color from a string (user id).
function colorFromString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 50%)`;
}

export type MindmapNode = {
  id: string;
  label: string;
  x?: number;
  y?: number;
  color?: string;
};

export type MindmapEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

const API = '/api/v1';

function wsBaseUrl() {
  // Allow overriding the Yjs websocket origin for local dev/test.
  // Default: same host (historical). Current API runs Yjs on a dedicated port (3002) by default.
  const override = (globalThis as any).__LEARNFLOW_ENV__?.VITE_YJS_WS_ORIGIN as string | undefined;
  if (override) return override.replace(/\/$/, '') + '/yjs';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // If we're on localhost, default to the dedicated Yjs port.
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${protocol}//${host}:3002/yjs`;
  }

  return `${protocol}//${window.location.host}/yjs`;
}

export function useMindmapYjs(courseId: string | null, opts?: { groupId?: string | null }) {
  const [ready, setReady] = useState(false);
  const [peers, setPeers] = useState<Array<{ id: number; name?: string; color?: string }>>([]);

  const doc = useMemo(() => new Y.Doc(), []);

  useEffect(() => {
    if (!courseId) return;

    let provider: WebsocketProvider | null = null;
    let cancelled = false;

    (async () => {
      // Hydrate from server snapshot (optional)
      try {
        const groupId = opts?.groupId ? String(opts.groupId) : null;
        const qs = new URLSearchParams({ courseId });
        if (groupId) qs.set('groupId', groupId);
        const res = await fetch(`${API}/yjs/mindmap?${qs.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.yjsState) {
            const bytes = Uint8Array.from(atob(data.yjsState), (c) => c.charCodeAt(0));
            Y.applyUpdate(doc, bytes);
          }
        }
      } catch {
        // ignore
      }

      if (cancelled) return;

      const token = localStorage.getItem('learnflow-token') || (import.meta.env.DEV ? 'dev' : null);
      if (!token) return;

      // y-websocket uses URL + room name. Server keys by userId via token; the provider room
      // name only needs to be consistent per course on this client.
      const groupId = opts?.groupId ? String(opts.groupId) : null;
      const wsQs = new URLSearchParams({ token, courseId });
      if (groupId) wsQs.set('groupId', groupId);
      const url = `${wsBaseUrl()}?${wsQs.toString()}`;
      provider = new WebsocketProvider(url, `mindmap:${courseId}`, doc);

      provider.on('status', (e: { status: 'connected' | 'disconnected' | 'connecting' }) => {
        if (e.status === 'connected') setReady(true);
      });

      // Presence: publish minimal awareness state and subscribe to peers.
      try {
        const rawName =
          localStorage.getItem('learnflow-userId') ||
          localStorage.getItem('learnflow-email') ||
          token;
        const name = String(rawName || 'Anonymous').slice(0, 40);
        provider.awareness.setLocalStateField('user', {
          name,
          color: colorFromString(name),
        });

        const updatePeers = () => {
          const states = Array.from(provider!.awareness.getStates().entries());
          setPeers(
            states
              .map(([id, st]: any) => ({
                id,
                name: st?.user?.name,
                color: st?.user?.color,
              }))
              // Exclude self when possible
              .filter((p) => p.id !== provider!.awareness.clientID),
          );
        };
        updatePeers();
        provider.awareness.on('change', updatePeers);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      try {
        provider?.awareness?.destroy();
      } catch {
        // ignore
      }
      provider?.destroy();
      setReady(false);
      setPeers([]);
    };
  }, [courseId, doc, opts?.groupId]);

  const nodes = doc.getArray<MindmapNode>('nodes');
  const edges = doc.getArray<MindmapEdge>('edges');

  return { doc, nodes, edges, ready, peers };
}
