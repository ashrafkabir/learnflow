import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../design-system/ThemeProvider.js';

/** S08-A04: Home dashboard with course carousel, daily lessons, mindmap, streaks */
export function Dashboard() {
  const nav = useNavigate();
  const { mode, toggle } = useTheme();

  return (
    <section aria-label="Dashboard" data-screen="dashboard" style={{ padding: 24 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: '24px' }}>Dashboard</h1>
        <div>
          <button
            onClick={toggle}
            aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            style={{ marginRight: 8 }}
          >
            {mode === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => nav('/settings')} aria-label="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* Streak tracker */}
      <div
        data-component="streak-tracker"
        aria-label="Learning streak"
        style={{ padding: 16, marginBottom: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}
      >
        <h2 style={{ fontSize: '20px' }}>🔥 Learning Streak</h2>
        <p style={{ fontSize: '32px', fontWeight: 700 }}>7 days</p>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Keep it up! Study today to maintain your streak.
        </p>
      </div>

      {/* Course carousel */}
      <div data-component="course-carousel" aria-label="Your courses" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '20px', marginBottom: 8 }}>Your Courses</h2>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0' }}>
          {['Machine Learning Basics', 'Rust Programming', 'Quantum Computing'].map((title) => (
            <div
              key={title}
              role="article"
              aria-label={title}
              onClick={() => nav('/courses/c-1')}
              style={{
                minWidth: 200,
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              <h3 style={{ fontSize: '16px' }}>{title}</h3>
              <div
                aria-label="Progress"
                style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 8 }}
              >
                <div
                  style={{ width: '60%', height: '100%', background: '#6366F1', borderRadius: 2 }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>60% complete</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily lessons */}
      <div data-component="daily-lessons" aria-label="Daily lessons" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: '20px', marginBottom: 8 }}>Today's Lessons</h2>
        {['Neural Networks Fundamentals', 'Ownership in Rust'].map((title) => (
          <div
            key={title}
            role="article"
            aria-label={title}
            style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8 }}
          >
            <p style={{ fontSize: '16px' }}>{title}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>~15 min</p>
          </div>
        ))}
      </div>

      {/* Mindmap preview */}
      <div
        data-component="mindmap-preview"
        aria-label="Knowledge mindmap"
        onClick={() => nav('/mindmap')}
        style={{
          padding: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: 8 }}>Knowledge Map</h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Visualize your learning connections</p>
        <div
          style={{
            height: 120,
            background: '#f3f4f6',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>🗺️ Click to explore</span>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => nav('/conversation')} style={{ padding: '8px 16px' }}>
          💬 Chat
        </button>
        <button onClick={() => nav('/marketplace/courses')} style={{ padding: '8px 16px' }}>
          🏪 Marketplace
        </button>
      </div>
    </section>
  );
}
