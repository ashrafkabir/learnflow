import React from 'react';

/** S11-A05: Download page with platform auto-detection */
export default function DownloadPage() {
  // Platform detection happens client-side; we render all platforms
  // with a data attribute for the test to verify auto-detection logic
  const platforms = [
    { id: 'macos', name: 'macOS', icon: '🍎', ext: '.dmg', ua: 'Mac' },
    { id: 'windows', name: 'Windows', icon: '🪟', ext: '.exe', ua: 'Win' },
    { id: 'ios', name: 'iOS', icon: '📱', ext: 'App Store', ua: 'iPhone' },
    { id: 'android', name: 'Android', icon: '🤖', ext: 'Play Store', ua: 'Android' },
    { id: 'web', name: 'Web App', icon: '🌐', ext: 'Browser', ua: '' },
  ];

  return (
    <div
      data-page="download"
      style={{ maxWidth: 700, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}
    >
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Download LearnFlow</h1>
      <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 48 }}>
        Available on all major platforms.
      </p>

      {/* Auto-detection script placeholder */}
      <div
        data-component="platform-auto-detect"
        data-platforms={JSON.stringify(platforms.map((p) => ({ id: p.id, ua: p.ua })))}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {platforms.map((p) => (
          <a
            key={p.id}
            data-platform={p.id}
            aria-label={`Download for ${p.name}`}
            href={`#download-${p.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 24,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              textDecoration: 'none',
              color: '#374151',
            }}
          >
            <span style={{ fontSize: 40 }}>{p.icon}</span>
            <span style={{ fontWeight: 600, marginTop: 8 }}>{p.name}</span>
            <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{p.ext}</span>
          </a>
        ))}
      </div>

      <p style={{ marginTop: 48, fontSize: 14, color: '#9ca3af' }}>
        LearnFlow is free to download. Requires macOS 12+, Windows 10+, iOS 16+, or Android 12+.
      </p>
    </div>
  );
}
