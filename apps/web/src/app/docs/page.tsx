const sections = [
  {
    title: 'Getting started',
    items: [
      { label: 'Quickstart', href: '#quickstart' },
      { label: 'WebSocket protocol', href: '#ws' },
      { label: 'BYOAI keys', href: '#keys' },
      { label: 'Update Agent (MVP)', href: '#update-agent' },
      { label: 'Docs sources (repo)', href: '#sources' },
    ],
  },
  {
    title: 'API',
    items: [
      { label: 'REST endpoints', href: '#rest' },
      { label: 'Auth', href: '#auth' },
      { label: 'Courses', href: '#courses' },
    ],
  },
  {
    title: 'Extra-spec',
    items: [{ label: 'Selection tools', href: '#selection-tools' }],
  },
];

export default function DocsPage() {
  return (
    <div style={{ padding: '72px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ fontSize: 44, margin: '0 0 12px', letterSpacing: -1 }}>Docs</h1>
      <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6, maxWidth: 820 }}>
        Developer documentation for LearnFlow (Next.js + App Router). This is an MVP docs surface;
        deeper MDX-based docs can be layered in later.
      </p>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, maxWidth: 820 }}>
        API reference stub (repo): <code>apps/docs/pages/api-reference.md</code> • OpenAPI:{' '}
        <code>apps/api/openapi.yaml</code>
      </p>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <aside
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            padding: 16,
            alignSelf: 'start',
            background: 'white',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Contents</div>
          {sections.map((s) => (
            <div key={s.title} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, letterSpacing: 0.4 }}>
                {s.title.toUpperCase()}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                {s.items.map((i) => (
                  <li key={i.href} style={{ margin: '8px 0' }}>
                    <a href={i.href} style={{ color: '#111827', textDecoration: 'none' }}>
                      {i.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <article style={{ lineHeight: 1.7 }}>
          <h2 id="quickstart">Quickstart</h2>
          <pre
            style={{
              background: '#111827',
              color: 'white',
              padding: 16,
              borderRadius: 12,
              overflow: 'auto',
            }}
          >
            <code>{`# from repo root
npm install
npm run dev

# API:    http://localhost:3000
# Client: http://localhost:3001
# Web:    http://localhost:3003
#
# Note: localhost ports are for local development only.`}</code>
          </pre>

          <h2 id="ws">WebSocket protocol</h2>
          <p>
            WS endpoint: <code>/ws?token=...</code>. Messages are sent as{' '}
            <code>{`{"event":"message","data":{...}}`}</code>. The server emits streamed{' '}
            <code>response.chunk</code> and closes with <code>response.end</code>.
          </p>
          <p>
            Note: the spec previously used <code>completion%</code> in <code>progress.update</code>.
            In code we use <code>completion_percent</code>.
          </p>

          <h2 id="keys">BYOAI keys</h2>
          <p>
            Users can store encrypted provider keys via <code>POST /api/v1/keys</code>. Keys are
            encrypted at rest and never returned in plaintext.
          </p>

          <h2 id="update-agent">Update Agent (MVP)</h2>
          <p>
            Update Agent is a <strong>Pro</strong> feature that monitors only the RSS/Atom sources
            you explicitly add. It does not crawl the open web.
          </p>
          <p>
            Scheduling is external in this MVP (cron/systemd/K8s). See:{' '}
            <code>docs/update-agent.md</code> in the repo.
          </p>

          <h2 id="sources">Docs sources (repo)</h2>
          <p>
            The full developer docs live as Markdown pages under <code>apps/docs/pages</code>. If
            you are reading this on the marketing site, these are the canonical sources.
          </p>
          <ul>
            <li>
              <code>apps/docs/pages/getting-started.md</code>
            </li>
            <li>
              <code>apps/docs/pages/api-reference.md</code>
            </li>
            <li>
              <code>apps/docs/pages/architecture.md</code>
            </li>
            <li>
              <code>apps/docs/pages/selection-tools.md</code>
            </li>
          </ul>

          <h2 id="selection-tools">Selection tools (extra-spec)</h2>
          <p>
            LearnFlow supports selection tools inside the lesson reader:
            <strong> Discover</strong>, <strong>Illustrate</strong>, and <strong>Mark</strong>. See
            the repo doc: <code>apps/docs/pages/selection-tools.md</code>.
          </p>

          <h2 id="rest">REST endpoints</h2>
          <p>
            See <code>openapi.yaml</code> for the full REST API definition.
          </p>

          <h2 id="auth">Auth</h2>
          <p>
            Use <code>/api/v1/auth/register</code> and <code>/api/v1/auth/login</code> to obtain a
            JWT.
          </p>

          <h2 id="courses">Courses</h2>
          <p>
            Create a course with <code>POST /api/v1/courses</code>, read lessons, and mark
            completion via <code>POST /api/v1/courses/:id/lessons/:lessonId/complete</code>.
          </p>
        </article>
      </div>

      <div style={{ marginTop: 22, color: '#6b7280', fontSize: 13 }}>
        Want deeper docs? Add MDX pages under <code>apps/web/src/app/docs</code> and link them here.
        Canonical developer docs live under <code>apps/docs/pages</code>.
      </div>
    </div>
  );
}
