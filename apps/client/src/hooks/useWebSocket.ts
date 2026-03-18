import { useRef, useEffect, useCallback, useState } from 'react';

import type { WsServerEvent } from '@learnflow/shared';

type WsHandler = (event: WsServerEvent) => void;

export function useWebSocket(onEvent: WsHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(onEvent);
  handlersRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem('learnflow-token') || (import.meta.env.DEV ? 'dev' : null);
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, /ws is proxied to the API via Vite (see vite.config.ts).
    // In prod, API and client are expected to be same-origin.
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;

    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data) as WsServerEvent;
          handlersRef.current(evt);
        } catch {
          // ignore malformed ws payload
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const send = useCallback((event: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  return { connected, send };
}
