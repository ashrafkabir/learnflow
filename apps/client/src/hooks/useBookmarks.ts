import { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../context/AppContext';
import { useToast } from '../components/Toast';

export type Bookmark = {
  userId?: string;
  courseId: string;
  lessonId: string;
  createdAt: string;
};

export function useBookmarks() {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = (await apiGet('/bookmarks?limit=200')) as any;
      setBookmarks((data?.bookmarks || []) as Bookmark[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // best-effort hydrate when authenticated
    const token = localStorage.getItem('learnflow-token');
    if (!token) return;
    refresh().catch(() => {
      toast('Could not load bookmarks.', 'error');
    });
  }, [toast]);

  const byLessonId = useMemo(() => {
    const m = new Map<string, Bookmark>();
    for (const b of bookmarks) m.set(String(b.lessonId), b);
    return m;
  }, [bookmarks]);

  async function add(courseId: string, lessonId: string) {
    await apiPost('/bookmarks', { courseId, lessonId });
    await refresh();
  }

  async function remove(lessonId: string) {
    await apiDelete(`/bookmarks/${lessonId}`);
    await refresh();
  }

  function isBookmarked(lessonId: string): boolean {
    return byLessonId.has(String(lessonId));
  }

  return { bookmarks, loading, refresh, add, remove, isBookmarked };
}
