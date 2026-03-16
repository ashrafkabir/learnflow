import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Module {
  id: string;
  title: string;
  lessons: { id: string; title: string; duration: string; completed: boolean }[];
  objective: string;
}

const MOCK_MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Foundations',
    objective: 'Understand core principles and terminology',
    lessons: [
      {
        id: 'l1',
        title: 'Introduction and Historical Context',
        duration: '12 min',
        completed: true,
      },
      { id: 'l2', title: 'Core Concepts and Definitions', duration: '15 min', completed: true },
      { id: 'l3', title: 'Mathematical Foundations', duration: '18 min', completed: false },
    ],
  },
  {
    id: 'm2',
    title: 'Key Techniques',
    objective: 'Master practical implementation methods',
    lessons: [
      { id: 'l4', title: 'Algorithm Design Patterns', duration: '20 min', completed: false },
      { id: 'l5', title: 'Optimization Strategies', duration: '16 min', completed: false },
    ],
  },
  {
    id: 'm3',
    title: 'Advanced Topics',
    objective: 'Explore cutting-edge developments',
    lessons: [
      {
        id: 'l6',
        title: 'Recent Research and Breakthroughs',
        duration: '22 min',
        completed: false,
      },
      { id: 'l7', title: 'Future Directions', duration: '14 min', completed: false },
    ],
  },
];

/** S08-A06: Course view with syllabus, lesson reader, progress tracker */
export function CourseView() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const [expandedModule, setExpandedModule] = useState<string>('m1');
  const totalLessons = MOCK_MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = MOCK_MODULES.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0,
  );
  const progress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <section aria-label="Course View" data-screen="course-view" style={{ padding: 24 }}>
      <button onClick={() => nav('/dashboard')} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 8 }}>Course: {courseId}</h1>

      {/* Progress tracker */}
      <div
        data-component="progress-tracker"
        aria-label={`Course progress: ${progress}%`}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '14px' }}>
            {completedLessons}/{totalLessons} lessons
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#6366F1',
              borderRadius: 4,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Syllabus */}
      <div data-component="syllabus" aria-label="Course syllabus">
        {MOCK_MODULES.map((mod) => (
          <div
            key={mod.id}
            style={{ marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
          >
            <button
              onClick={() => setExpandedModule(expandedModule === mod.id ? '' : mod.id)}
              aria-expanded={expandedModule === mod.id}
              style={{
                width: '100%',
                padding: 12,
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <h3 style={{ fontSize: '16px' }}>{mod.title}</h3>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{mod.objective}</p>
            </button>
            {expandedModule === mod.id && (
              <div style={{ padding: '0 12px 12px' }}>
                {mod.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    role="article"
                    aria-label={lesson.title}
                    onClick={() => nav(`/courses/${courseId}/lessons/${lesson.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  >
                    <span>{lesson.completed ? '✅' : '⬜'}</span>
                    <span style={{ flex: 1, fontSize: '14px' }}>{lesson.title}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{lesson.duration}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
