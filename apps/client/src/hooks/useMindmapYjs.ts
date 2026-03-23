import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

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

export function useMindmapYjs(courseId: string | null) {
  const [ready, setReady] = useState(false);

  const doc = useMemo(() => new Y.Doc(), []);

  useEffect(() => {
    if (!courseId) return;

    let provider: WebsocketProvider | null = null;
    let cancelled = false;

    (async () => {
      // Hydrate from server snapshot (optional)
      try {
        const res = await fetch(`${API}/yjs/mindmap?courseId=${encodeURIComponent(courseId)}`);
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
      const url = `${wsBaseUrl()}?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`;
      provider = new WebsocketProvider(url, `mindmap:${courseId}`, doc);

      provider.on('status', (e: { status: 'connected' | 'disconnected' | 'connecting' }) => {
        if (e.status === 'connected') setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      provider?.destroy();
      setReady(false);
    };
  }, [courseId, doc]);

  const nodes = doc.getArray<MindmapNode>('nodes');
  const edges = doc.getArray<MindmapEdge>('edges');

  return { doc, nodes, edges, ready };
}
