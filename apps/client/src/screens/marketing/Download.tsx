import React from 'react';

export function DownloadPage() {
  return (
    <section aria-label="Download" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Download LearnFlow</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Get LearnFlow on your favorite platform. Available for macOS, Windows, and Linux.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        <div
          style={{
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <h3>🍎 macOS</h3>
          <p>Requires macOS 12 or later</p>
          <button
            style={{
              marginTop: 12,
              padding: '8px 24px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Download for macOS
          </button>
        </div>
        <div
          style={{
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <h3>🪟 Windows</h3>
          <p>Requires Windows 10 or later</p>
          <button
            style={{
              marginTop: 12,
              padding: '8px 24px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Download for Windows
          </button>
        </div>
        <div
          style={{
            padding: 24,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <h3>🐧 Linux</h3>
          <p>AppImage and .deb available</p>
          <button
            style={{
              marginTop: 12,
              padding: '8px 24px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
            }}
          >
            Download for Linux
          </button>
        </div>
      </div>
    </section>
  );
}
