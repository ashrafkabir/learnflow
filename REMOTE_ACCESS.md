# Remote access (LAN + Cloudflare Tunnel)

LearnFlow’s dev stack runs multiple services:

- **API**: `http://localhost:3000`
- **Client** (Vite): `http://localhost:3001`
- **Web** (Next marketing/docs): `http://localhost:3003`

This repo is configured so the **client binds to all interfaces** for LAN access.

## 1) What does `0.0.0.0` mean (and why you can’t browse it)

You may see logs like:

- `LearnFlow API running on port 3000`
- `Vite dev server running on http://0.0.0.0:3001`

`0.0.0.0` is a **bind address** meaning “listen on all network interfaces”.

It is **not a routable destination address**, so you cannot open:

- `http://0.0.0.0:3001` in a browser

Instead you must use one of:

- `http://localhost:3001` (same machine)
- `http://<LAN_IP>:3001` (another device on your network)

## 2) Access from another device on your LAN

### Step A — confirm the dev servers are running

From the machine running LearnFlow:

```bash
npm run dev:status
```

You want to see **API** + **client** as `RUNNING`.

### Step B — find your LAN IP

```bash
ip addr
```

Look for an interface like `wlan0` / `eth0` and an `inet` address such as `192.168.x.x` or `10.0.x.x`.

Example:

- `192.168.1.50`

### Step C — open from another device

On your phone/laptop (same Wi‑Fi/LAN):

- Client: `http://192.168.1.50:3001`
- API (rarely needed directly): `http://192.168.1.50:3000`

### Common LAN troubleshooting

- Ensure your firewall allows inbound TCP on **3001** (and **3000** if you’re hitting the API directly).
- If you’re on a corporate/guest Wi‑Fi, **client isolation** may block device-to-device access.

## 3) Cloudflare “quick tunnel” (share a temporary public URL)

Cloudflare can expose your local Vite client to the internet without opening router ports.

### Install cloudflared

- macOS: `brew install cloudflare/cloudflare/cloudflared`
- Linux: see Cloudflare docs for your distro

### Run a quick tunnel to the client

On the machine running LearnFlow:

```bash
cloudflared tunnel --url http://localhost:3001
```

Cloudflared will print a public URL like:

- `https://<random-words>.trycloudflare.com`

Open that URL from anywhere.

### Important caveats (read this)

- **The URL rotates** every time you restart the tunnel.
- Treat quick-tunnel URLs as **public**: anyone with the link can access your dev client.
- The client uses `/api` and `/ws` via the Vite proxy; if you tunnel **:3001** everything should route correctly.
- For longer-lived sharing, you need a **named tunnel** (not covered here).

## 4) Confirm bindings (what the repo currently does)

### Client binding

`apps/client/vite.config.ts` sets:

- `server.host: true` → binds to `0.0.0.0`
- `server.port: 3001`

So **LAN + tunnel access** works for the client.

### API binding

In normal dev (`apps/api/src/index.ts`) the API calls:

- `server.listen(config.port)`

This typically binds to all interfaces on Node (implementation-dependent), but it is not explicitly pinned.

There is also a legacy/dev helper `apps/api/src/server.ts` that _does_ bind explicitly:

- `app.listen(PORT, '0.0.0.0', …)`

If you need guaranteed LAN access to the API itself, consider updating `apps/api/src/index.ts` to:

```ts
server.listen(config.port, '0.0.0.0', () => {
  console.log(`LearnFlow API running on port ${config.port}`);
});
```

(But tunneling the **client** is usually enough.)
