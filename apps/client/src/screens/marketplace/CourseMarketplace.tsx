import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MarketplaceCourse {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  price: number;
  rating: number;
  enrollmentCount: number;
}

const COURSES: MarketplaceCourse[] = [
  {
    id: 'mc-1',
    title: 'Machine Learning Fundamentals',
    topic: 'machine-learning',
    difficulty: 'beginner',
    price: 0,
    rating: 4.5,
    enrollmentCount: 1200,
  },
  {
    id: 'mc-2',
    title: 'Advanced Python Patterns',
    topic: 'python',
    difficulty: 'advanced',
    price: 19.99,
    rating: 4.8,
    enrollmentCount: 800,
  },
  {
    id: 'mc-3',
    title: 'Kubernetes in Production',
    topic: 'devops',
    difficulty: 'intermediate',
    price: 14.99,
    rating: 4.6,
    enrollmentCount: 650,
  },
  {
    id: 'mc-4',
    title: 'Quantum Computing 101',
    topic: 'quantum',
    difficulty: 'beginner',
    price: 0,
    rating: 4.3,
    enrollmentCount: 420,
  },
];

/** S08-A09: Course marketplace with search, filter, detail, enroll */
export function CourseMarketplace() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const filtered = COURSES.filter((c) => {
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.topic.includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || c.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <section
      aria-label="Course Marketplace"
      data-screen="course-marketplace"
      style={{ padding: 24 }}
    >
      <button onClick={() => nav('/dashboard')} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>Course Marketplace</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          aria-label="Search courses"
          style={{
            flex: 1,
            minWidth: 200,
            padding: 8,
            borderRadius: 8,
            border: '1px solid #d1d5db',
          }}
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          aria-label="Filter by difficulty"
          style={{ padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div
        data-component="course-catalog"
        aria-label="Course catalog"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map((c) => (
          <div
            key={c.id}
            role="article"
            aria-label={c.title}
            style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}
          >
            <h3 style={{ fontSize: '16px', marginBottom: 4 }}>{c.title}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              {c.difficulty} · {c.topic}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {c.price === 0 ? 'Free' : `$${c.price}`}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                ⭐ {c.rating} · {c.enrollmentCount} enrolled
              </span>
            </div>
            <button
              aria-label={`Enroll in ${c.title}`}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '8px',
                borderRadius: 8,
                background: '#6366F1',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {c.price === 0 ? 'Enroll Free' : `Enroll — $${c.price}`}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
