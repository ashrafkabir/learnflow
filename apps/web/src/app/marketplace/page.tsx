export default function MarketplacePage() {
  return (
    <div style={{ padding: '72px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ fontSize: 44, margin: '0 0 12px', letterSpacing: -1 }}>Marketplace</h1>
      <p style={{ fontSize: 18, color: '#4b5563', lineHeight: 1.6, maxWidth: 760 }}>
        Browse curated courses and agent add-ons. This is a lightweight preview page for the website
        spec; the full marketplace experience lives in the app.
      </p>

      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {[
          {
            title: 'Course marketplace',
            desc: 'Search courses by topic, difficulty, and format.',
            cta: 'Open in app',
            href: '/download',
          },
          {
            title: 'Agent marketplace',
            desc: 'Activate agents like Notes, Quiz, Research, and Course Builder.',
            cta: 'See agents',
            href: '/features',
          },
          {
            title: 'Creators',
            desc: 'Publish courses, update lessons, and track adoption.',
            cta: 'Creator tools',
            href: '/docs',
          },
        ].map((card) => (
          <a
            key={card.title}
            href={card.href}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: 18,
              textDecoration: 'none',
              color: '#111827',
              background: 'white',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>{card.title}</h2>
            <p style={{ margin: '8px 0 14px', color: '#4b5563', lineHeight: 1.6 }}>{card.desc}</p>
            <span style={{ color: '#6366F1', fontWeight: 600, fontSize: 14 }}>{card.cta} →</span>
          </a>
        ))}
      </div>
    </div>
  );
}
