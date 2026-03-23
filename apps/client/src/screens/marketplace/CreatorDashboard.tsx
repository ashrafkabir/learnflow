import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.js';
import { apiGet, apiPost } from '../../context/AppContext.js';
import { useToast } from '../../components/Toast.js';
import {
  IconChart,
  IconEye,
  IconPalette,
  IconStar,
  IconTrophy,
  IconCheck,
  IconX,
} from '../../components/icons/index.js';

const TABS = ['My Courses', 'Analytics', 'Earnings'] as const;
type Tab = (typeof TABS)[number];

interface CreatorCourse {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'under_review';
  enrollments: number;
  rating: number;
  revenue: number;
  created: string;
}

interface CreatorDashboardPayload {
  courses: Array<{
    id: string;
    title: string;
    status: 'draft' | 'review' | 'published' | 'rejected';
    enrollmentCount: number;
    rating: number;
    revenue: number;
    publishedAt: string | null;
  }>;
  totalEarnings: number;
  totalEnrollments: number;
  payouts: Array<{
    id: string;
    courseId: string;
    amount: number;
    creatorShare: number;
    platformShare: number;
    status: 'pending' | 'paid';
    createdAt: string;
  }>;
}

const MOCK_COURSES: CreatorCourse[] = [
  {
    id: 'c1',
    title: 'Introduction to Machine Learning',
    status: 'published',
    enrollments: 342,
    rating: 4.7,
    revenue: 1710,
    created: '2025-03-15',
  },
  {
    id: 'c2',
    title: 'Advanced React Patterns',
    status: 'published',
    enrollments: 189,
    rating: 4.5,
    revenue: 945,
    created: '2025-04-22',
  },
  {
    id: 'c3',
    title: 'Data Structures & Algorithms',
    status: 'under_review',
    enrollments: 0,
    rating: 0,
    revenue: 0,
    created: '2025-07-10',
  },
  {
    id: 'c4',
    title: 'TypeScript Design Patterns',
    status: 'draft',
    enrollments: 0,
    rating: 0,
    revenue: 0,
    created: '2025-07-18',
  },
];

const MOCK_ANALYTICS = {
  totalViews: 12480,
  enrollmentsThisMonth: 87,
  completionRate: 68,
  avgRating: 4.6,
  viewsThisWeek: [320, 280, 410, 350, 390, 220, 180],
};

const MOCK_EARNINGS = {
  totalEarnings: 2655,
  pendingPayout: 420,
  payoutHistory: [
    { id: 'p1', date: '2025-07-01', amount: 890, status: 'paid' },
    { id: 'p2', date: '2025-06-01', amount: 765, status: 'paid' },
    { id: 'p3', date: '2025-05-01', amount: 580, status: 'paid' },
  ],
};

/** Spec §5.2.7 — Creator Dashboard: publishing flow, analytics, earnings */
export function CreatorDashboard() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('My Courses');
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [_loading, setLoading] = useState(false);
  const [creatorCourses, setCreatorCourses] = useState<CreatorCourse[]>(MOCK_COURSES);
  const [creatorAnalytics, setCreatorAnalytics] = useState(MOCK_ANALYTICS);
  const [creatorEarnings, setCreatorEarnings] = useState(MOCK_EARNINGS);
  const [publishStep, setPublishStep] = useState(0);
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const data = (await apiGet('/marketplace/creator/dashboard')) as CreatorDashboardPayload;

        const courses: CreatorCourse[] = (data.courses || []).map((c) => ({
          id: c.id,
          title: c.title,
          status:
            c.status === 'published'
              ? 'published'
              : c.status === 'review'
                ? 'under_review'
                : c.status === 'draft'
                  ? 'draft'
                  : 'draft',
          enrollments: c.enrollmentCount ?? 0,
          rating: c.rating ?? 0,
          revenue: c.revenue ?? 0,
          created: (c.publishedAt || new Date().toISOString()).slice(0, 10),
        }));

        setCreatorCourses(courses.length ? courses : MOCK_COURSES);

        // Derive high-level analytics from payload (keep mock chart series for now).
        const avgRating = courses.length
          ? courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length
          : MOCK_ANALYTICS.avgRating;

        setCreatorAnalytics({
          ...MOCK_ANALYTICS,
          enrollmentsThisMonth: data.totalEnrollments ?? MOCK_ANALYTICS.enrollmentsThisMonth,
          avgRating: Math.round(avgRating * 10) / 10,
        });

        setCreatorEarnings({
          ...MOCK_EARNINGS,
          totalEarnings: data.totalEarnings ?? MOCK_EARNINGS.totalEarnings,
          pendingPayout: (data.payouts || [])
            .filter((p) => p.status === 'pending')
            .reduce((sum, p) => sum + (p.creatorShare || 0), 0),
          payoutHistory: (data.payouts || []).slice(0, 6).map((p) => ({
            id: p.id,
            date: p.createdAt.slice(0, 10),
            amount: p.creatorShare,
            status: p.status,
          })),
        });
      } catch {
        // keep mocks
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    topic: 'programming',
    difficulty: 'beginner',
    price: '0',
  });

  const statusBadge = (status: CreatorCourse['status']) => {
    const styles = {
      published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
      under_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    };
    const labels = { published: 'Published', draft: 'Draft', under_review: 'Under Review' };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleSubmitForReview = async () => {
    if (!newCourse.title.trim()) {
      toast('Please enter a course title', 'error');
      return;
    }
    try {
      const payload = {
        title: newCourse.title,
        description: newCourse.description,
        topic: newCourse.topic,
        difficulty: newCourse.difficulty,
        price: parseFloat(newCourse.price || '0'),
        // MVP: placeholder quality inputs
        lessonCount: 7,
        attributionCount: 3,
        readabilityScore: 0.7,
      };

      await apiPost('/marketplace/courses', payload);

      toast('Course submitted for review!', 'success');

      // Refresh dashboard so table/metrics become data-driven.
      const data = (await apiGet('/marketplace/creator/dashboard')) as CreatorDashboardPayload;
      const courses: CreatorCourse[] = (data.courses || []).map((c) => ({
        id: c.id,
        title: c.title,
        status:
          c.status === 'published'
            ? 'published'
            : c.status === 'review'
              ? 'under_review'
              : c.status === 'draft'
                ? 'draft'
                : 'draft',
        enrollments: c.enrollmentCount ?? 0,
        rating: c.rating ?? 0,
        revenue: c.revenue ?? 0,
        created: (c.publishedAt || new Date().toISOString()).slice(0, 10),
      }));
      setCreatorCourses(courses.length ? courses : MOCK_COURSES);

      setShowPublishForm(false);
      setPublishStep(0);
      setNewCourse({
        title: '',
        description: '',
        topic: 'programming',
        difficulty: 'beginner',
        price: '0',
      });
    } catch {
      toast('Failed to publish course. Please try again.', 'error');
    }
  };

  const renderMyCourses = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Published & Draft Courses
        </h2>
        <Button variant="primary" size="sm" onClick={() => setShowPublishForm(true)}>
          + Publish New Course
        </Button>
      </div>

      {/* Publish New Course Form (multi-step) */}
      {showPublishForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-accent p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              New Course — Step {publishStep + 1} of 3
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPublishForm(false);
                setPublishStep(0);
              }}
            >
              <span className="inline-flex items-center">
                <IconX className="w-4 h-4" />
              </span>
            </Button>
          </div>
          <div className="flex gap-1 mb-2">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= publishStep ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>
          {publishStep === 0 && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Course Title</span>
                <input
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g., Introduction to Quantum Computing"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Description</span>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={3}
                  placeholder="What will students learn?"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </label>
              <Button variant="primary" onClick={() => setPublishStep(1)}>
                Next →
              </Button>
            </div>
          )}
          {publishStep === 1 && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Topic</span>
                <select
                  value={newCourse.topic}
                  onChange={(e) => setNewCourse({ ...newCourse, topic: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="programming">Programming</option>
                  <option value="data-science">Data Science</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="math">Mathematics</option>
                  <option value="language">Language</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Difficulty</span>
                <select
                  value={newCourse.difficulty}
                  onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPublishStep(0)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={() => setPublishStep(2)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
          {publishStep === 2 && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-600 dark:text-gray-300">Price ($)</span>
                <input
                  type="number"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                  min={0}
                  step={0.99}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-gray-500 mt-1">Set to 0 for a free course</p>
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">Review</p>
                <p className="text-gray-600 dark:text-gray-300">Title: {newCourse.title || '—'}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  Topic: {newCourse.topic} · {newCourse.difficulty}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Price: {Number(newCourse.price) === 0 ? 'Free' : `$${newCourse.price}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPublishStep(1)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={handleSubmitForReview}>
                  Submit for Review
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Creator courses">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Title</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">
                  Enrollments
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">
                  Rating
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">
                  Revenue
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {creatorCourses.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.title}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {c.enrollments.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {c.rating > 0 ? `⭐ ${c.rating}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                    {c.revenue > 0 ? `$${c.revenue}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.status === 'draft' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => nav('/conversation')}>
                            Continue Editing
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => toast(`Deleted "${c.title}"`, 'success')}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {c.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast('Opening editor...', 'success')}
                        >
                          Edit
                        </Button>
                      )}
                      {c.status === 'under_review' && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                          Pending review
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creatorCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <IconTrophy className="w-12 h-12 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No courses yet</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-sm">
            Publish your first course to see it here.
          </p>
          <Button variant="primary" onClick={() => nav('/conversation')}>
            Create Your First Course
          </Button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Analytics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Views',
            value: creatorAnalytics.totalViews.toLocaleString(),
            icon: <IconEye className="w-5 h-5" />,
          },
          {
            label: 'Enrollments This Month',
            value: creatorAnalytics.enrollmentsThisMonth.toString(),
            icon: <IconChart className="w-5 h-5" />,
          },
          {
            label: 'Completion Rate',
            value: `${creatorAnalytics.completionRate}%`,
            icon: <IconCheck className="w-5 h-5" />,
          },
          {
            label: 'Avg Rating',
            value: `${creatorAnalytics.avgRating}`,
            icon: <IconStar className="w-5 h-5" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Views Chart (simple bar) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Views This Week
        </h3>
        <div className="flex items-end gap-2 h-32">
          {creatorAnalytics.viewsThisWeek.map((v, i) => {
            const max = Math.max(...MOCK_ANALYTICS.viewsThisWeek);
            const pct = (v / max) * 100;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{v}</span>
                <div
                  className="w-full bg-accent/80 rounded-t"
                  style={{ height: `${pct}%` }}
                  title={`${days[i]}: ${v} views`}
                />
                <span className="text-xs text-gray-500">{days[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Per-Course Performance
        </h3>
        <div className="space-y-3">
          {creatorCourses
            .filter((c) => c.status === 'published')
            .map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</p>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${(c.enrollments / 400) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {c.enrollments} enrolled
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-90">Total Earnings</p>
          <p className="text-3xl font-bold mt-1">
            ${creatorEarnings.totalEarnings.toLocaleString()}
          </p>
          <p className="text-sm opacity-75 mt-1">Lifetime revenue from courses</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-5 text-white">
          <p className="text-sm opacity-90">Pending Payout</p>
          <p className="text-3xl font-bold mt-1">
            ${creatorEarnings.pendingPayout.toLocaleString()}
          </p>
          <p className="text-sm opacity-75 mt-1">Next payout: Aug 1, 2025</p>
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Payout History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Payout history">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 text-right">
                  Amount
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {creatorEarnings.payoutHistory.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {new Date(p.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    ${p.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-medium capitalize">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue per course */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Revenue by Course
        </h3>
        <div className="space-y-3">
          {creatorCourses
            .filter((c) => c.revenue > 0)
            .map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">{c.title}</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  ${c.revenue}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    <section
      aria-label="Creator Dashboard"
      data-screen="creator-dashboard"
      className="min-h-screen bg-bg dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/marketplace')}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
            <IconPalette className="w-5 h-5 text-accent" />
            Creator Dashboard
          </h1>
          <div className="ml-auto">
            <Button variant="primary" onClick={() => setShowPublishForm(true)}>
              + Create Course
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <nav
          className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1"
          aria-label="Creator tabs"
        >
          {TABS.map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTab(t)}
              className={`flex-1 ${tab === t ? '' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {t}
            </Button>
          ))}
        </nav>

        {tab === 'My Courses' && renderMyCourses()}
        {tab === 'Analytics' && renderAnalytics()}
        {tab === 'Earnings' && renderEarnings()}
      </div>
    </section>
  );
}
