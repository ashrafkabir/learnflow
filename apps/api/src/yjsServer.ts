import type { IncomingMessage } from 'http';
import { URL } from 'url';

import type { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as authProtocol from 'y-protocols/auth';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as buffer from 'lib0/buffer';

import { config } from './config.js';
import type { AuthUser } from './middleware.js';
import { dbCollaboration, dbMindmaps } from './db.js';

/**
 * Minimal Yjs websocket server for mindmap collaboration.
 *
 * Iter49 Task 5 MVP:
 * - Room per course per user: `mindmap:<userId>:<courseId>`
 * - Auth: accept `token=dev` in non-production, otherwise JWT
 * - Persist Yjs doc state to SQLite (mindmaps.yjsState)
 */

type DocEntry = {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<WebSocket>;
};

const docs = new Map<string, DocEntry>();

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;
const messageQueryAwareness = 3;

function getOrCreate(room: string): DocEntry {
  const existing = docs.get(room);
  if (existing) return existing;

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  const conns = new Set<WebSocket>();

  // Load snapshot if present
  const row = dbMindmaps.get(room);
  if (row?.yjsState) {
    try {
      const bytes = buffer.fromBase64(String(row.yjsState));
      Y.applyUpdate(doc, bytes);
    } catch {
      // ignore invalid snapshot
    }
  }

  // Persist full doc state on every update (simple but OK for MVP)
  doc.on('update', () => {
    try {
      const full = Y.encodeStateAsUpdate(doc);
      dbMindmaps.upsert(room, {
        nodes: '[]',
        edges: '[]',
        yjsState: buffer.toBase64(full),
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  });

  const entry: DocEntry = { doc, awareness, conns };
  docs.set(room, entry);
  return entry;
}

function broadcast(room: string, message: Uint8Array, except?: WebSocket) {
  const entry = docs.get(room);
  if (!entry) return;
  for (const ws of entry.conns) {
    if (ws === except) continue;
    if ((ws as any).readyState === 1) {
      try {
        (ws as any).send(message);
      } catch {
        // ignore
      }
    }
  }
}

function onMessage(room: string, ws: WebSocket, data: Uint8Array) {
  const entry = getOrCreate(room);
  const decoder = decoding.createDecoder(data);
  const encoder = encoding.createEncoder();
  const type = decoding.readVarUint(decoder);

  if (type === messageSync) {
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.readSyncMessage(decoder, encoder, entry.doc, null);
    const reply = encoding.toUint8Array(encoder);
    if (reply.length > 1) (ws as any).send(reply);

    // Forward sync messages to peers
    broadcast(room, data, ws);
    return;
  }

  if (type === messageQueryAwareness) {
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        entry.awareness,
        Array.from(entry.awareness.getStates().keys()),
      ),
    );
    (ws as any).send(encoding.toUint8Array(encoder));
    return;
  }

  if (type === messageAwareness) {
    const update = decoding.readVarUint8Array(decoder);
    // Track per-connection awareness client id for proper cleanup.
    try {
      const dec2 = decoding.createDecoder(update);
      const _numClients = decoding.readVarUint(dec2);
      const firstClientId = decoding.readVarUint(dec2);
      (ws as any).__awarenessClientId = firstClientId;
    } catch {
      // ignore
    }
    awarenessProtocol.applyAwarenessUpdate(entry.awareness, update, ws);

    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, messageAwareness);
    encoding.writeVarUint8Array(enc, update);
    broadcast(room, encoding.toUint8Array(enc), ws);
    return;
  }

  if (type === messageAuth) {
    // We don't do permission checks beyond the query token (already validated).
    authProtocol.readAuthMessage(decoder, entry.doc, () => {
      /* no-op */
    });
    return;
  }
}

export function handleYjsConnection(ws: WebSocket, req: IncomingMessage): void {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (!url.pathname.startsWith('/yjs')) return;

  const token = url.searchParams.get('token');
  const courseId = url.searchParams.get('courseId');
  const groupId = url.searchParams.get('groupId');

  if (!courseId || typeof courseId !== 'string') {
    ws.close(4400, 'Missing courseId');
    return;
  }

  if (groupId && typeof groupId !== 'string') {
    ws.close(4400, 'Invalid groupId');
    return;
  }

  let user: AuthUser | null = null;
  if (
    token === 'dev' &&
    process.env.NODE_ENV !== 'production' &&
    (process.env.LEARNFLOW_DEV_AUTH === '1' || process.env.LEARNFLOW_DEV_AUTH === 'true')
  ) {
    user = { sub: 'dev-user', email: 'dev@learnflow.local', tier: 'free' } as AuthUser;
    (user as any).origin = 'harness';
  } else if (token) {
    try {
      user = jwt.verify(token, config.jwtSecret) as AuthUser;
    } catch {
      user = null;
    }
  }

  if (!user) {
    ws.close(4401, 'Invalid token');
    return;
  }

  // Room ownership:
  // - default: user-owned room keeps mindmaps private per user.
  // - shared: when groupId is provided, room is group-owned and requires membership.
  let room = `mindmap:${user.sub}:${courseId}`;

  if (groupId) {
    // Dev auth path: allow any groupId for harness/testing.
    if ((user as any).origin !== 'harness') {
      try {
        const group = dbCollaboration.getGroupById(String(groupId));
        if (!group) {
          ws.close(4404, 'Group not found');
          return;
        }
        let memberIds: string[] = [];
        try {
          memberIds = JSON.parse((group as any).memberIds || '[]');
        } catch {
          memberIds = [];
        }
        if (!memberIds.includes(user.sub)) {
          ws.close(4403, 'Forbidden');
          return;
        }
      } catch {
        ws.close(1011, 'ACL check failed');
        return;
      }
    }

    room = `mindmap:group:${String(groupId)}:${courseId}`;
  }
  const entry = getOrCreate(room);
  entry.conns.add(ws);

  // Send initial sync step1
  {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, messageSync);
    syncProtocol.writeSyncStep1(enc, entry.doc);
    (ws as any).send(encoding.toUint8Array(enc));
  }

  // Broadcast awareness query response immediately
  {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, messageAwareness);
    encoding.writeVarUint8Array(
      enc,
      awarenessProtocol.encodeAwarenessUpdate(
        entry.awareness,
        Array.from(entry.awareness.getStates().keys()),
      ),
    );
    (ws as any).send(encoding.toUint8Array(enc));
  }

  ws.on('message', (raw: Buffer) => {
    try {
      onMessage(room, ws, new Uint8Array(raw));
    } catch {
      // ignore
    }
  });

  ws.on('close', () => {
    entry.conns.delete(ws);
    try {
      const clientId = (ws as any).__awarenessClientId ?? entry.awareness.clientID;
      awarenessProtocol.removeAwarenessStates(entry.awareness, [clientId], null);
    } catch {
      // ignore
    }
  });
}

export function attachYjsMindmapServer(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    handleYjsConnection(ws, req);
  });
}
