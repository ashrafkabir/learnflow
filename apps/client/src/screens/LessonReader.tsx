import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, apiPost } from '../context/AppContext.js';
import { CitationTooltip, Source } from '../components/CitationTooltip.js';
import { LessonMindmap } from '../components/LessonMindmap.js';
import { parseSources } from '../lib/sources.js';
import { SkeletonLessonContent } from '../components/Skeleton.js';
import { Confetti } from '../components/Confetti.js';
import { Button } from '../components/Button.js';
import { AttributionDrawer } from '../components/AttributionDrawer.js';
import { useSwipe } from '../hooks/useSwipe.js';
import { analytics } from '../lib/analytics.js';
import {
  IconBookmark,
  IconBook,
  IconBrainSpark,
  IconGlobe,
  IconBulb,
  IconCheck,
  IconClipboard,
  IconClose,
  IconDocument,
  IconInfo,
  IconLesson,
  IconMap,
  IconPalette,
  IconPencil,
  IconProgressRing,
  IconRefresh,
  IconScale,
  IconRocket,
  IconSearch,
  IconSparkles,
  IconTestTube,
  IconTrash,
  IconX,
} from '../components/icons/index.js';

// ── Types ──────────────────────────────────────────────────
interface Illustration {
  id: string;
  lessonId: string;
  sectionIndex: number;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  provider?: string;
  model?: string;
  license?: string;
  attributionText?: string;
  sourcePageUrl?: string;
  imageReason?: string;
}

interface Annotation {
  id: string;
  lessonId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  note: string;
  type: 'note' | 'explain' | 'example' | 'discover' | 'illustrate';
  createdAt: string;
}

interface Comparison {
  concepts: string[];
  dimensions: string[];
  cells: string[][];
  summary: string;
}

// Parse lesson content into structured sections
function parseStructuredContent(content?: string) {
  const sections: { type: string; content: string }[] = [];
  const lines = (content ?? '').split('\n');
  let currentType = 'content';
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      sections.push({ type: currentType, content: buffer.join('\n') });
      buffer = [];
    }
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('## learning objectives') || lower.startsWith('## objectives')) {
      flush();
      currentType = 'objectives';
    } else if (
      lower.startsWith('## estimated time') ||
      (lower.startsWith('**') && lower.includes('minute'))
    ) {
      flush();
      currentType = 'time';
    } else if (
      lower.startsWith('## main content') ||
      lower.startsWith('## core content') ||
      lower.startsWith('## overview')
    ) {
      flush();
      currentType = 'content';
    } else if (lower.startsWith('## key points') || lower.startsWith('## key concepts')) {
      flush();
      currentType = 'keypoints';
    } else if (lower.startsWith('## recap') || lower.startsWith('## summary recap')) {
      flush();
      currentType = 'recap';
    } else if (lower.startsWith('## key takeaways') || lower.startsWith('## takeaways')) {
      flush();
      currentType = 'takeaways';
    } else if (
      lower.startsWith('## sources') ||
      lower.startsWith('## references') ||
      lower.startsWith('## further reading')
    ) {
      flush();
      currentType = 'sources';
    } else if (lower.startsWith('## next steps') || lower.startsWith("## what's next")) {
      flush();
      currentType = 'nextsteps';
    } else if (lower.startsWith('## quick check') || lower.startsWith('## comprehension')) {
      flush();
      currentType = 'quickcheck';
    } else if (line.startsWith('# ')) {
      flush();
      currentType = 'title';
      buffer.push(line);
      flush();
      currentType = 'content';
      continue;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

export function LessonReader() {
  const { courseId, lessonId } = useParams();
  const nav = useNavigate();
  const { state, fetchLesson, completeLesson, generateQuiz } = useApp();
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'notes' | 'quiz'>('none');
  const [attributionOpen, setAttributionOpen] = useState(false);
  const [_notesFormat, _setNotesFormat] = useState<'cornell' | 'flashcard'>('cornell');
  const [savedNote, setSavedNote] = useState<any>(null);
  const [customNoteText, setCustomNoteText] = useState('');
  const [illustrationDesc, setIllustrationDesc] = useState('');
  const [illustrations, setIllustrations] = useState<
    Array<{ id: string; description: string; url: string }>
  >([]);
  const [generatingIllustration, setGeneratingIllustration] = useState(false);
  const [generatingNoteFormat, setGeneratingNoteFormat] = useState<string | null>(null);
  const [aiNoteContent, setAiNoteContent] = useState<string | null>(null);

  // Feature 1: Inline Illustrations
  const [sectionIllustrations, setSectionIllustrations] = useState<Illustration[]>([]);
  const [illustratePopover, setIllustratePopover] = useState<{
    sectionIndex: number;
    suggestedPrompt: string;
  } | null>(null);
  const [illustratePrompt, setIllustratePrompt] = useState('');
  const [generatingSectionIll, setGeneratingSectionIll] = useState(false);

  // Feature 2: Comparison Mode
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [comparingLoading, setComparingLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Iter39 Task 6: Lesson-level mindmap (lightweight v1 using vis-network)
  const [lessonMindmapOpen, setLessonMindmapOpen] = useState(false);

  // Feature 3: Text-Anchored Annotations
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [floatingToolbar, setFloatingToolbar] = useState<{
    x: number;
    y: number;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [annotationNoteText, setAnnotationNoteText] = useState('');
  const [annotationLoading, setAnnotationLoading] = useState(false);

  // Selection tool preview (Discover/Illustrate/Mark)
  const [toolPreviewOpen, setToolPreviewOpen] = useState(false);
  const [toolPreview, setToolPreview] = useState<any>(null);
  const [toolPreviewLoading, setToolPreviewLoading] = useState(false);
  const [toolSelectedText, setToolSelectedText] = useState<string>('');
  const [toolSelectedOffsets, setToolSelectedOffsets] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const lesson = state.activeLesson;
  const lessonSuggestions = React.useMemo(
    () => (state.mindmapSuggestions?.[String(courseId || 'global')] as any[]) || [],
    [state.mindmapSuggestions, courseId],
  );

  const lessonMindmapSuggestions = React.useMemo(
    () =>
      lessonSuggestions.map((s: any) => ({
        id: String(s.id || ''),
        label: String(s.label || ''),
        reason: s.reason ? String(s.reason) : undefined,
      })),
    [lessonSuggestions],
  );
  const isComplete = lessonId ? state.completedLessons.has(lessonId) : false;

  // Prefer structured sources from the API; fall back to parsing markdown.
  const sources = (lesson as any)?.sources?.length
    ? ((lesson as any).sources as any)
    : parseSources(lesson?.content);

  const [allLessons, setAllLessons] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (courseId) {
      fetch(`/api/v1/courses/${courseId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((course) => {
          if (!course?.modules) return;
          const flat: { id: string; title: string }[] = [];
          for (const mod of course.modules) {
            for (const l of mod.lessons || []) {
              flat.push({ id: l.id, title: l.title });
            }
          }
          setAllLessons(flat);
        })
        .catch(() => {});
    }
  }, [courseId]);

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const swipeProps = useSwipe({
    onSwipeLeft: () => nextLesson && nav(`/courses/${courseId}/lessons/${nextLesson.id}`),
    onSwipeRight: () => prevLesson && nav(`/courses/${courseId}/lessons/${prevLesson.id}`),
  });

  // Behavioral tracking: time-on-lesson
  // - Emit lesson.view_start on mount (best-effort)
  // - Emit lesson.view_end with durationMs on unmount / lesson change
  useEffect(() => {
    if (!courseId || !lessonId) return;

    const startedAt = Date.now();
    // Best-effort fire-and-forget (use shared helper so auth + origin tagging apply)
    apiPost('/events', { type: 'lesson.view_start', courseId, lessonId, meta: {} }).catch(() => {});

    return () => {
      const durationMs = Math.max(0, Date.now() - startedAt);
      apiPost('/events', {
        type: 'lesson.view_end',
        courseId,
        lessonId,
        meta: { durationMs },
      }).catch(() => {});
    };
  }, [courseId, lessonId]);

  useEffect(() => {
    if (courseId && lessonId) {
      setLoading(true);
      fetchLesson(courseId, lessonId).finally(() => setLoading(false));
      fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/illustrations`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.illustrations) setSectionIllustrations(data.illustrations);
        })
        .catch(() => {});
      fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/annotations`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.annotations) setAnnotations(data.annotations);
        })
        .catch(() => {});
      const cachedComp = localStorage.getItem(`learnflow-compare-${lessonId}`);
      if (cachedComp) {
        try {
          setComparison(JSON.parse(cachedComp));
        } catch {
          // ignore malformed cached JSON
        }
      }
      fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.note) {
            setSavedNote(data.note);
            if (data.note.content?.text) setAiNoteContent(data.note.content.text);
            if (data.note.content?.customText) setCustomNoteText(data.note.content.customText);
            if (data.note.illustrations?.length) setIllustrations(data.note.illustrations);
          }
        })
        .catch(() => {});
    }
  }, [courseId, lessonId]);

  const generateAiNotes = async (format: string) => {
    if (!courseId || !lessonId) return;
    setGeneratingNoteFormat(format);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const data = await res.json();
      if (data.note?.content?.text) {
        setAiNoteContent(data.note.content.text);
        setSavedNote(data.note);
      }
    } catch (err) {
      console.error('Failed to generate notes:', err);
    } finally {
      setGeneratingNoteFormat(null);
    }
  };

  const saveCustomNote = async () => {
    if (!courseId || !lessonId) return;
    try {
      await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { format: 'custom', text: aiNoteContent || '', customText: customNoteText },
          illustrations,
        }),
      });
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const generateIllustration = async () => {
    if (!courseId || !lessonId || !illustrationDesc.trim()) return;
    setGeneratingIllustration(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes/illustrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: illustrationDesc }),
      });
      const data = await res.json();
      if (data.illustration?.url) {
        setIllustrations((prev) => [...prev, { id: `ill-${Date.now()}`, ...data.illustration }]);
        setIllustrationDesc('');
      }
    } catch (err) {
      console.error('Failed to generate illustration:', err);
    } finally {
      setGeneratingIllustration(false);
    }
  };

  const generateSectionIllustration = async () => {
    if (!courseId || !lessonId || !illustratePopover || !illustratePrompt.trim()) return;
    setGeneratingSectionIll(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/illustrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionIndex: illustratePopover.sectionIndex,
          prompt: illustratePrompt,
          // Use license-safe images in production by default.
          // In test/offline environments, the API will degrade gracefully.
          provider: 'wikimedia',
        }),
      });
      const data = await res.json();
      if (data.illustration) {
        setSectionIllustrations((prev) => [...prev, data.illustration]);
        setIllustratePopover(null);
        setIllustratePrompt('');
      }
    } catch (err) {
      console.error('Failed to generate section illustration:', err);
    } finally {
      setGeneratingSectionIll(false);
    }
  };

  const deleteSectionIllustration = async (illId: string) => {
    if (!courseId || !lessonId) return;
    try {
      await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/illustrations/${illId}`, {
        method: 'DELETE',
      });
      setSectionIllustrations((prev) => prev.filter((i) => i.id !== illId));
    } catch {
      // ignore
    }
  };

  const generateComparison = async () => {
    if (!courseId || !lessonId) return;
    setComparingLoading(true);
    setShowComparison(true);
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.comparison) {
        setComparison(data.comparison);
        localStorage.setItem(`learnflow-compare-${lessonId}`, JSON.stringify(data.comparison));
      }
    } catch (err) {
      console.error('Failed to generate comparison:', err);
    } finally {
      setComparingLoading(false);
    }
  };

  // E2E hook: allow Playwright to open selection tools deterministically without relying on DOM selection.
  // This is gated behind a window flag set by tests.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (!w.__LEARNFLOW_E2E__) return;
    w.__learnflowE2E = {
      setSelection: (
        text: string,
        startOffset = 0,
        endOffset = Math.max(1, (text || '').length),
      ) => {
        setFloatingToolbar({ x: 220, y: 140, text, startOffset, endOffset });
      },
      openTool: (
        tool: 'discover' | 'illustrate' | 'mark',
        text: string,
        startOffset = 0,
        endOffset = Math.max(1, (text || '').length),
      ) => {
        setFloatingToolbar({ x: 220, y: 140, text, startOffset, endOffset });
        // Immediately open the preview without relying on a DOM-driven mouseup event.
        void runSelectionToolPreview(tool, text, startOffset, endOffset);
      },
      clearSelection: () => setFloatingToolbar(null),
    };
    return () => {
      if (w.__learnflowE2E) delete w.__learnflowE2E;
    };
  }, []);

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setTimeout(() => {
        const sel2 = window.getSelection();
        if (!sel2 || sel2.isCollapsed) setFloatingToolbar(null);
      }, 200);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 3) return;

    // Double-click selection can momentarily report text but have no ranges.
    // Guard to prevent "IndexSizeError: Failed to execute 'getRangeAt'".
    if (sel.rangeCount < 1) return;

    let range: Range;
    try {
      range = sel.getRangeAt(0);
    } catch {
      return;
    }

    // Only allow selections inside our content container.
    const container = contentRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setFloatingToolbar({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
      text,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }, []);

  const runSelectionToolPreview = async (
    tool: 'discover' | 'illustrate' | 'mark',
    selectedText: string,
    startOffset: number,
    endOffset: number,
  ) => {
    if (!courseId || !lessonId) return;
    setToolPreviewOpen(true);
    setToolPreview(null);
    setToolPreviewLoading(true);
    setToolSelectedText(selectedText);
    setToolSelectedOffsets({ start: startOffset, end: endOffset });
    try {
      const res = await fetch(
        `/api/v1/courses/${courseId}/lessons/${lessonId}/selection-tools/preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool, selectedText }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setToolPreview(data);
      } else {
        setToolPreview({ tool, selectedText, error: data?.message || 'Failed' });
      }
    } catch (err: any) {
      setToolPreview({ tool, selectedText, error: err?.message || 'Failed' });
    } finally {
      setToolPreviewLoading(false);
    }
  };

  const attachPreviewAsAnnotation = async () => {
    if (!toolPreview || !toolSelectedOffsets) return;
    const tool = toolPreview.tool as 'discover' | 'illustrate' | 'mark';

    if (tool === 'mark') {
      // Mark adds bullets to takeaways (stored in lesson notes).
      const bullets = toolPreview.preview?.bullets || [];
      await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes/mark-takeaways`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullets, selectedText: toolSelectedText }),
      });
      // Refresh notes so UI can reflect takeaways.
      // IMPORTANT: await this refresh; otherwise E2E/UI can race and never render the new takeaways.
      try {
        const refreshed = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/notes`);
        const data = refreshed.ok ? await refreshed.json() : null;
        if (data?.note) setSavedNote(data.note);
      } catch {
        // ignore
      }
    } else {
      // Discover/Illustrate attach as an annotation note.
      const note = toolPreview.preview?.note || '';
      setAnnotationNoteText(note);
      await createAnnotation(
        tool,
        toolSelectedText,
        toolSelectedOffsets.start,
        toolSelectedOffsets.end,
      );
    }

    setToolPreviewOpen(false);
  };

  const createAnnotation = async (
    type: 'note' | 'explain' | 'example' | 'discover' | 'illustrate',
    selectedText: string,
    startOffset: number,
    endOffset: number,
  ) => {
    if (!courseId || !lessonId) return;
    setAnnotationLoading(true);
    try {
      const body: any = { selectedText, startOffset, endOffset, type };

      // Selection tools can attach AI output as an annotation note.
      if (type === 'note' || type === 'discover' || type === 'illustrate') {
        body.note = annotationNoteText || '';
      }
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.annotation) {
        setAnnotations((prev) => [...prev, data.annotation]);
        setFloatingToolbar(null);
        setAnnotationNoteText('');
        window.getSelection()?.removeAllRanges();
      }
    } catch (err) {
      console.error('Failed to create annotation:', err);
    } finally {
      setAnnotationLoading(false);
    }
  };

  const deleteAnnotation = async (annId: string) => {
    if (!courseId || !lessonId) return;
    try {
      await fetch(`/api/v1/courses/${courseId}/lessons/${lessonId}/annotations/${annId}`, {
        method: 'DELETE',
      });
      setAnnotations((prev) => prev.filter((a) => a.id !== annId));
      setActiveAnnotation(null);
    } catch {
      // ignore
    }
  };

  const [showConfetti, setShowConfetti] = useState(false);

  const handleMarkComplete = async () => {
    if (courseId && lessonId) {
      await completeLesson(courseId, lessonId);
      analytics.track('lesson_completed', { courseId, lessonId });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    }
  };

  const handleNotes = async () => {
    if (activePanel === 'notes') {
      setActivePanel('none');
      return;
    }
    setActivePanel('notes');
  };

  const handleQuiz = async () => {
    if (activePanel === 'quiz') {
      setActivePanel('none');
      return;
    }
    setActivePanel('quiz');
    if (courseId) await generateQuiz(courseId, 'current');
  };

  if (loading || !lesson) {
    return (
      <section
        data-screen="lesson-reader"
        aria-label="Lesson Reader"
        className="min-h-screen bg-bg dark:bg-bg-dark"
      >
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-32" />
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-24" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <SkeletonLessonContent />
        </div>
      </section>
    );
  }

  const sections = parseStructuredContent(lesson.content);

  const renderLine = (line: string, key: number) => {
    if (line.startsWith('## '))
      return (
        <h2 key={key} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    if (line.startsWith('### '))
      return (
        <h3 key={key} className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    if (line.startsWith('- '))
      return (
        <li key={key} className="text-gray-700 dark:text-gray-300 ml-4 mb-1 list-disc">
          {renderInlineWithCitations(line.slice(2), sources)}
        </li>
      );
    if (line.match(/^\d+\.\s/))
      return (
        <li key={key} className="text-gray-700 dark:text-gray-300 ml-4 mb-1 list-decimal">
          {renderInlineWithCitations(line.replace(/^\d+\.\s/, ''), sources)}
        </li>
      );
    if (line.startsWith('**') && line.endsWith('**'))
      return (
        <p key={key} className="font-semibold text-gray-900 dark:text-white mb-2">
          {line.slice(2, -2)}
        </p>
      );
    if (line.trim() === '') return <div key={key} className="h-3" />;
    return (
      <p key={key} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
        {renderInlineWithCitations(line, sources)}
      </p>
    );
  };

  return (
    <section
      aria-label="Lesson Reader"
      data-screen="lesson-reader"
      className="min-h-screen bg-bg dark:bg-bg-dark"
      {...swipeProps}
    >
      <Confetti trigger={showConfetti} />
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => nav(`/courses/${courseId}`)}>
            ← Back to Course
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={generateComparison}
              aria-label="Compare concepts"
              title="Compare concepts in this lesson"
            >
              <IconScale className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const key = 'learnflow-bookmarks';
                const bookmarks = JSON.parse(localStorage.getItem(key) || '[]') as string[];
                const lid = lessonId || '';
                if (bookmarks.includes(lid)) {
                  localStorage.setItem(
                    key,
                    JSON.stringify(bookmarks.filter((b: string) => b !== lid)),
                  );
                } else {
                  localStorage.setItem(key, JSON.stringify([...bookmarks, lid]));
                }
                setShowConfetti((prev) => prev);
              }}
              aria-label={
                JSON.parse(localStorage.getItem('learnflow-bookmarks') || '[]').includes(
                  lessonId || '',
                )
                  ? 'Remove bookmark'
                  : 'Add bookmark'
              }
              title="Bookmark this lesson"
              className="text-lg"
            >
              {JSON.parse(localStorage.getItem('learnflow-bookmarks') || '[]').includes(
                lessonId || '',
              ) ? (
                <IconBookmark className="w-4 h-4" />
              ) : (
                <IconBook className="w-4 h-4" />
              )}
            </Button>
            <span className="text-xs text-gray-500 dark:text-gray-300">
              {lesson.wordCount} words · {lesson.estimatedTime} min
            </span>
            {isComplete && (
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                <span className="inline-flex items-center gap-2">
                  <IconCheck className="w-4 h-4" />
                  Complete
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <article data-component="lesson-content" aria-label="Lesson content" className="space-y-6">
          {/* Hero */}
          {sections
            .filter((s) => s.type === 'title')
            .map((s, i) => (
              <div
                key={`title-${i}`}
                data-component="lesson-hero"
                className="bg-gradient-to-br from-primary-900 to-primary-800 text-white rounded-2xl shadow-card overflow-hidden"
              >
                <div className="p-6 sm:p-8">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {s.content.replace(/^#\s*/, '')}
                  </h1>
                  <p className="mt-2 text-sm text-primary-200 max-w-prose">
                    <span className="font-semibold text-primary-100">Why it matters:</span>{' '}
                    {lesson.description ||
                      'This lesson builds a practical mental model you can apply immediately.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">
                      <IconProgressRing className="w-4 h-4" />
                      {lesson.estimatedTime} min read
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">
                      <IconBook className="w-4 h-4" />
                      {lesson.wordCount} words
                    </span>
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white text-xs font-medium px-3 py-1 rounded-full">
                      <IconBrainSpark className="w-4 h-4" />
                      {(state.profile as any)?.difficulty || 'intermediate'}
                    </span>
                    {isComplete && (
                      <span className="inline-flex items-center gap-1 bg-success/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        <IconCheck className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Illustration (hero) */}
                  {sectionIllustrations?.[0]?.imageUrl && (
                    <div className="mt-5 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <img
                        src={sectionIllustrations[0].imageUrl}
                        alt={sectionIllustrations[0].prompt || 'Lesson illustration'}
                        className="w-full h-56 sm:h-64 object-cover"
                        loading="lazy"
                      />
                      {sectionIllustrations[0].prompt && (
                        <div className="px-4 py-3 text-xs text-primary-100/90">
                          {sectionIllustrations[0].prompt}
                        </div>
                      )}
                      {(sectionIllustrations[0].attributionText ||
                        sectionIllustrations[0].license ||
                        sectionIllustrations[0].sourcePageUrl) && (
                        <div className="px-4 pb-3 text-[11px] text-primary-100/80">
                          {sectionIllustrations[0].attributionText ||
                            `Image attribution: ${sectionIllustrations[0].license || 'unknown'}`}
                          {sectionIllustrations[0].sourcePageUrl ? (
                            <>
                              {' '}
                              <a
                                className="underline"
                                href={sectionIllustrations[0].sourcePageUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Source
                              </a>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Learning Objectives */}
          {sections
            .filter((s) => s.type === 'objectives')
            .map((s, i) => (
              <div key={`obj-${i}`} className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                  <IconBrainSpark className="w-4 h-4" />
                  Learning Objectives
                </h2>
                <div className="space-y-1">
                  {s.content
                    .split('\n')
                    .filter((l) => l.trim())
                    .map((line, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-accent mt-0.5">•</span>
                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          {/* Main Content */}
          <div ref={contentRef} onMouseUp={handleTextSelection} className="relative">
            {/* Selection tool preview modal */}
            {toolPreviewOpen && (
              <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-modal p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {toolPreview?.tool ? `Tool: ${toolPreview.tool}` : 'Tool'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        “{toolSelectedText.slice(0, 140)}
                        {toolSelectedText.length > 140 ? '…' : ''}”
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToolPreviewOpen(false)}
                      className="text-gray-500"
                    >
                      <IconClose className="w-4 h-4" />
                    </Button>
                  </div>

                  {toolPreviewLoading ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <IconSparkles className="w-4 h-4" />
                      Working…
                    </div>
                  ) : toolPreview?.error ? (
                    <div className="text-sm text-red-600">{toolPreview.error}</div>
                  ) : toolPreview?.tool === 'mark' ? (
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Proposed takeaways:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1">
                        {(toolPreview.preview?.bullets || []).map((b: string, idx: number) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {toolPreview?.preview?.note || ''}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="secondary" onClick={() => setToolPreviewOpen(false)}>
                      Discard
                    </Button>
                    <Button
                      variant="primary"
                      onClick={attachPreviewAsAnnotation}
                      disabled={toolPreviewLoading}
                    >
                      Attach
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Floating toolbar */}
            {floatingToolbar && (
              <div
                className="absolute z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl shadow-modal px-2 py-1.5 flex items-center gap-1 -translate-x-1/2 -translate-y-full"
                style={{ left: floatingToolbar.x, top: floatingToolbar.y }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const note = prompt('Add a note:');
                    if (note !== null) {
                      setAnnotationNoteText(note);
                      createAnnotation(
                        'note',
                        floatingToolbar.text,
                        floatingToolbar.startOffset,
                        floatingToolbar.endOffset,
                      );
                    }
                  }}
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="Add a note"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconLesson className="w-4 h-4" />
                    Note
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    createAnnotation(
                      'explain',
                      floatingToolbar.text,
                      floatingToolbar.startOffset,
                      floatingToolbar.endOffset,
                    )
                  }
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="AI explanation"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconSearch className="w-4 h-4" />
                    Explain
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    createAnnotation(
                      'example',
                      floatingToolbar.text,
                      floatingToolbar.startOffset,
                      floatingToolbar.endOffset,
                    )
                  }
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="AI example"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconBulb className="w-4 h-4" />
                    Example
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    runSelectionToolPreview(
                      'discover',
                      floatingToolbar.text,
                      floatingToolbar.startOffset,
                      floatingToolbar.endOffset,
                    )
                  }
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="Discover related topics/resources"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconGlobe className="w-4 h-4" />
                    Discover
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    runSelectionToolPreview(
                      'illustrate',
                      floatingToolbar.text,
                      floatingToolbar.startOffset,
                      floatingToolbar.endOffset,
                    )
                  }
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="Illustrate this selection"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconPalette className="w-4 h-4" />
                    Illustrate
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    runSelectionToolPreview(
                      'mark',
                      floatingToolbar.text,
                      floatingToolbar.startOffset,
                      floatingToolbar.endOffset,
                    )
                  }
                  disabled={annotationLoading}
                  className="text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 h-7"
                  title="Add to key takeaways"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconBookmark className="w-4 h-4" />
                    Mark
                  </span>
                </Button>
                {annotationLoading && (
                  <span className="text-xs px-1 inline-flex items-center gap-1">
                    <IconSparkles className="w-3.5 h-3.5" />
                    Loading
                  </span>
                )}
              </div>
            )}

            {sections
              .filter((s) => s.type === 'content')
              .map((s, contentIdx) => {
                const lines = s.content.split('\n');
                const subSections: { heading: string; lines: string[]; globalIndex: number }[] = [];
                let currentHeading = '';
                let currentLines: string[] = [];
                let sIdx = contentIdx * 100;
                for (const line of lines) {
                  if (line.startsWith('### ') || line.startsWith('## ')) {
                    if (currentLines.length > 0 || currentHeading)
                      subSections.push({
                        heading: currentHeading,
                        lines: currentLines,
                        globalIndex: sIdx++,
                      });
                    currentHeading = line.replace(/^#{2,3}\s*/, '');
                    currentLines = [];
                  } else {
                    currentLines.push(line);
                  }
                }
                if (currentLines.length > 0 || currentHeading)
                  subSections.push({
                    heading: currentHeading,
                    lines: currentLines,
                    globalIndex: sIdx++,
                  });

                return (
                  <div
                    key={`content-${contentIdx}`}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 sm:p-8"
                  >
                    {subSections.map((sub) => (
                      <div key={sub.globalIndex} className="group/section relative">
                        {sub.heading && (
                          <div className="flex items-center gap-2 mt-6 mb-3">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-1">
                              {sub.heading}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const suggested = `Educational diagram showing ${sub.heading.toLowerCase()}`;
                                setIllustratePopover({
                                  sectionIndex: sub.globalIndex,
                                  suggestedPrompt: suggested,
                                });
                                setIllustratePrompt(suggested);
                              }}
                              className="opacity-0 group-hover/section:opacity-100 bg-accent/10 text-accent hover:bg-accent/20"
                              title="Generate illustration for this section"
                            >
                              <span className="inline-flex items-center gap-2">
                                <IconPalette className="w-4 h-4" />
                                Illustrate
                              </span>
                            </Button>
                          </div>
                        )}
                        {illustratePopover?.sectionIndex === sub.globalIndex && (
                          <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                            <label className="text-xs font-medium text-accent mb-2 block">
                              Illustration prompt:
                            </label>
                            <input
                              value={illustratePrompt}
                              onChange={(e) => setIllustratePrompt(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && generateSectionIllustration()}
                              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={generateSectionIllustration}
                                disabled={generatingSectionIll || !illustratePrompt.trim()}
                              >
                                {generatingSectionIll ? (
                                  <span className="inline-flex items-center gap-2">
                                    <IconSparkles className="w-4 h-4" />
                                    Generating...
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2">
                                    <IconPalette className="w-4 h-4" />
                                    Generate
                                  </span>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIllustratePopover(null);
                                  setIllustratePrompt('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        {sub.lines.map((line, j) => renderLine(line, sub.globalIndex * 1000 + j))}
                        {sectionIllustrations
                          .filter((ill) => ill.sectionIndex === sub.globalIndex)
                          .map((ill) => (
                            <div
                              key={ill.id}
                              className="my-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                            >
                              <img
                                src={ill.imageUrl}
                                alt={ill.prompt}
                                className="w-full max-h-96 object-contain"
                              />
                              <div className="p-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-gray-500 italic">{ill.prompt}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteSectionIllustration(ill.id)}
                                    className="text-red-400 hover:text-red-600"
                                    title="Remove illustration"
                                  >
                                    <IconX className="w-4 h-4" />
                                  </Button>
                                </div>
                                {(ill.attributionText || ill.license || ill.sourcePageUrl) && (
                                  <div className="mt-1 text-[11px] text-gray-500">
                                    {ill.attributionText ||
                                      `Image attribution: ${ill.license || 'unknown'}`}
                                    {ill.sourcePageUrl ? (
                                      <>
                                        {' '}
                                        <a
                                          className="underline"
                                          href={ill.sourcePageUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Source
                                        </a>
                                      </>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                );
              })}

            {/* Annotations display */}
            {annotations.length > 0 && (
              <div className="mt-4 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 dark:border-yellow-800/30 p-5">
                <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-3">
                  <span className="inline-flex items-center gap-2">
                    <IconLesson className="w-4 h-4" />
                    Your Annotations ({annotations.length})
                  </span>
                </h3>
                <div className="space-y-3">
                  {annotations.map((ann) => (
                    <div key={ann.id} className="relative">
                      <Button
                        variant="ghost"
                        fullWidth
                        onClick={() =>
                          setActiveAnnotation(activeAnnotation === ann.id ? null : ann.id)
                        }
                        className="text-left p-3 bg-white/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 h-auto justify-start"
                      >
                        <span className="inline-block bg-yellow-200 dark:bg-yellow-700/40 px-1 rounded text-sm text-gray-900 dark:text-white">
                          "{ann.selectedText.slice(0, 80)}
                          {ann.selectedText.length > 80 ? '…' : ''}"
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-300">
                          {ann.type === 'note'
                            ? 'Note'
                            : ann.type === 'explain'
                              ? 'Explain'
                              : 'Example'}
                        </span>
                      </Button>
                      {activeAnnotation === ann.id && (
                        <div className="mt-2 ml-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {ann.note}
                          </p>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteAnnotation(ann.id)}
                            className="mt-2"
                          >
                            <span className="inline-flex items-center gap-2">
                              <IconTrash className="w-4 h-4" />
                              Delete
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comparison Mode */}
          {showComparison && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <IconScale className="w-5 h-5 text-accent" />
                  Concept Comparison
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateComparison}
                    className="text-accent"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconRefresh className="w-4 h-4" />
                      Regenerate
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowComparison(false)}>
                    <span className="inline-flex items-center gap-2">
                      <IconClose className="w-4 h-4" />
                      Close
                    </span>
                  </Button>
                </div>
              </div>
              {comparingLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <IconSparkles className="w-4 h-4" />
                    Analyzing lesson for comparable concepts...
                  </span>
                </div>
              ) : comparison && comparison.concepts.length > 0 ? (
                <>
                  {comparison.concepts.length === 2 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {comparison.concepts.map((concept, ci) => (
                        <div
                          key={ci}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                        >
                          <h3 className="font-semibold text-accent mb-3 text-center">{concept}</h3>
                          <div className="space-y-2">
                            {comparison.dimensions.map((dim, di) => (
                              <div key={di}>
                                <p className="text-xs font-medium text-gray-500 uppercase">{dim}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {comparison.cells[di]?.[ci] || '—'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left p-2 text-gray-500 font-medium border-b dark:border-gray-700">
                              Dimension
                            </th>
                            {comparison.concepts.map((c, i) => (
                              <th
                                key={i}
                                className="text-left p-2 text-accent font-semibold border-b dark:border-gray-700"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.dimensions.map((dim, di) => (
                            <tr key={di} className="border-b dark:border-gray-800">
                              <td className="p-2 font-medium text-gray-700 dark:text-gray-300">
                                {dim}
                              </td>
                              {comparison.concepts.map((_, ci) => (
                                <td key={ci} className="p-2 text-gray-600 dark:text-gray-300">
                                  {comparison.cells[di]?.[ci] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {comparison.summary && (
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                      {comparison.summary}
                    </p>
                  )}
                </>
              ) : comparison ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {comparison.summary || 'No comparable concepts found in this lesson.'}
                </p>
              ) : null}
            </div>
          )}

          {/* Key Points */}
          {sections
            .filter((s) => s.type === 'keypoints')
            .map((s, i) => (
              <div key={`kp-${i}`} className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                  <IconSparkles className="w-4 h-4" />
                  Key Points
                </h2>
                <div className="space-y-2">
                  {s.content
                    .split('\n')
                    .filter((l) => l.trim())
                    .slice(0, 10)
                    .map((line, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-accent font-bold">•</span>
                        <span>{line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '')}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          {/* Recap */}
          {sections
            .filter((s) => s.type === 'recap')
            .map((s, i) => (
              <div
                key={`recap-${i}`}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <IconClipboard className="w-4 h-4" />
                  Recap
                </h2>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-wrap">
                  {s.content
                    .split('\n')
                    .filter((l) => l.trim())
                    .slice(0, 12)
                    .map((line, j) => (
                      <p key={j}>{renderInlineWithCitations(line, sources as any)}</p>
                    ))}
                </div>
              </div>
            ))}

          {/* Key Takeaways */}
          {sections
            .filter((s) => s.type === 'takeaways')
            .map((s, i) => (
              <div
                key={`take-${i}`}
                className="bg-success/5 border border-success/20 rounded-2xl p-5"
                data-testid="key-takeaways"
              >
                <h2 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  <IconBulb className="w-4 h-4" />
                  Key Takeaways
                </h2>
                <div className="space-y-2">
                  {s.content
                    .split('\n')
                    .filter((l) => l.trim())
                    .map((line, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-success font-bold">{j + 1}.</span>
                        <span>{line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '')}</span>
                      </div>
                    ))}
                </div>

                {Array.isArray(savedNote?.content?.keyTakeawaysExtras) &&
                savedNote.content.keyTakeawaysExtras.length > 0 ? (
                  <div
                    className="mt-4 pt-4 border-t border-success/20"
                    data-testid="marked-takeaways"
                  >
                    <h3 className="text-xs font-semibold text-success/90 mb-2">
                      Your marked takeaways
                    </h3>
                    <div className="space-y-2">
                      {savedNote.content.keyTakeawaysExtras.map((b: string, j: number) => (
                        <div
                          key={`extra-${j}`}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-success font-bold">•</span>
                          <span>{String(b).trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

          {/* Iter73 P2.15: Action chips */}
          <div
            className="flex flex-wrap gap-2 mb-4"
            data-testid="action-chips"
            aria-label="Lesson actions"
          >
            <button
              onClick={() => setActivePanel('notes')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 inline-flex items-center gap-2"
            >
              <IconPencil className="w-4 h-4" />
              Take Notes
            </button>
            <button
              onClick={() => setActivePanel('quiz')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 inline-flex items-center gap-2"
            >
              <IconTestTube className="w-4 h-4" />
              Quiz Me
            </button>
            <button
              onClick={() => {
                // MVP: jump to Next Steps if present; otherwise open attribution.
                const el = document.querySelector('[data-testid="next-steps"]');
                if (el) (el as any).scrollIntoView({ behavior: 'smooth', block: 'start' });
                else setAttributionOpen(true);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-success/10 text-success hover:bg-success/20 inline-flex items-center gap-2"
            >
              <IconRocket className="w-4 h-4" />
              Go Deeper
            </button>
            <button
              onClick={() => setAttributionOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 inline-flex items-center gap-2"
            >
              <IconBook className="w-4 h-4" />
              See Sources
            </button>
          </div>

          {/* Sources / References */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <IconBook className="w-4 h-4" />
              References
            </h2>
            <div className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No sources were attached to this lesson yet.
                </p>
              ) : (
                sources.map((s: any) => (
                  <div key={s.id} className="flex items-start gap-3 text-sm">
                    <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      [{s.id}]
                    </span>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{s.title}</p>
                      <p className="text-gray-500 text-xs">
                        {s.author} · {s.publication} · {s.year}
                      </p>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-xs hover:underline"
                      >
                        {s.url}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Next Steps */}
          {sections.filter((s) => s.type === 'nextsteps').length > 0 ? (
            sections
              .filter((s) => s.type === 'nextsteps')
              .map((s, i) => (
                <div
                  key={`next-${i}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5"
                >
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <IconRocket className="w-4 h-4" />
                    Next Steps
                  </h2>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {s.content
                      .split('\n')
                      .filter((l) => l.trim())
                      .map((line: string, j) => (
                        <p key={j}>{line.replace(/^[-•]\s*/, '')}</p>
                      ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-300 italic">
              No next steps listed for this lesson.
            </div>
          )}

          {/* Quick Check */}
          {sections.filter((s) => s.type === 'quickcheck').length > 0 ? (
            sections
              .filter((s) => s.type === 'quickcheck')
              .map((s, i) => <InlineQuickCheck key={`qc-${i}`} content={s.content} />)
          ) : (
            <div className="bg-accent/5 dark:bg-accent/5 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-300 italic">
              No quick check questions for this lesson. Try the "Quiz Me" button below!
            </div>
          )}

          {sections.filter((s) => s.type === 'objectives').length === 0 && (
            <div className="bg-accent/5 dark:bg-accent/5 rounded-2xl p-5 text-sm text-gray-500 dark:text-gray-300 italic">
              No learning objectives listed for this lesson.
            </div>
          )}
        </article>

        <AttributionDrawer
          open={attributionOpen}
          onClose={() => setAttributionOpen(false)}
          sources={sources as any}
          images={(sectionIllustrations as any).map((i: any) => ({
            imageUrl: i.imageUrl,
            sourcePageUrl: i.sourcePageUrl,
            license: i.license,
            attributionText: i.attributionText,
            provider: i.provider,
            createdAt: i.createdAt,
            imageReason: (i as any).imageReason,
          }))}
          sourcesMissingReason={(lesson as any)?.sourcesMissingReason}
          // @ts-expect-error server may include sourceMode
          sourceMode={(lesson as any)?.sourceMode}
        />

        {/* Previous / Next Lesson Navigation */}
        {(prevLesson || nextLesson) && (
          <div className="mt-8 flex items-center justify-between gap-4">
            {prevLesson ? (
              <Button
                variant="secondary"
                onClick={() => nav(`/courses/${courseId}/lessons/${prevLesson.id}`)}
                className="max-w-[45%]"
              >
                <span>←</span>
                <span className="truncate">Previous: {prevLesson.title}</span>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button
                variant="secondary"
                onClick={() => nav(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                className="max-w-[45%] ml-auto"
              >
                <span className="truncate">Next: {nextLesson.title}</span>
                <span>→</span>
              </Button>
            ) : (
              <div />
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant={isComplete ? 'ghost' : 'primary'}
            onClick={handleMarkComplete}
            disabled={isComplete}
            aria-label="Mark Complete"
            className={
              isComplete
                ? 'bg-success/10 text-success cursor-default'
                : 'bg-success hover:bg-success/90'
            }
          >
            {isComplete ? (
              <span className="inline-flex items-center gap-2">
                <IconCheck className="w-4 h-4" />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <IconCheck className="w-4 h-4" />
                Mark Complete
              </span>
            )}
          </Button>
          <Button
            variant={activePanel === 'notes' ? 'primary' : 'secondary'}
            onClick={handleNotes}
            aria-label="Take Notes"
          >
            <span className="inline-flex items-center gap-2">
              <IconPencil className="w-4 h-4" />
              Take Notes
            </span>
          </Button>
          <Button
            variant={activePanel === 'quiz' ? 'primary' : 'secondary'}
            onClick={handleQuiz}
            aria-label="Quiz Me"
          >
            <span className="inline-flex items-center gap-2">
              <IconTestTube className="w-4 h-4" />
              Quiz Me
            </span>
          </Button>
          <Button
            variant={lessonMindmapOpen ? 'primary' : 'secondary'}
            onClick={() => setLessonMindmapOpen((v) => !v)}
            aria-label="Lesson mindmap"
          >
            <span className="inline-flex items-center gap-2">
              <IconMap className="w-4 h-4" />
              Lesson Map
            </span>
          </Button>
        </div>

        {/* Enhanced Notes panel */}
        {activePanel === 'notes' && (
          <div className="mt-4 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
                <IconPencil className="w-5 h-5 text-accent" />
                Notes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">
                Auto-format notes from this lesson (template-based) or write your own:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  {
                    key: 'summary',
                    label: 'Auto-Summary',
                    desc: 'Concise lesson summary',
                    icon: <IconDocument className="w-4 h-4" />,
                  },
                  {
                    key: 'cornell',
                    label: 'Cornell Notes',
                    desc: 'Cues, notes, summary',
                    icon: <IconClipboard className="w-4 h-4" />,
                  },
                  {
                    key: 'zettelkasten',
                    label: 'Zettelkasten',
                    desc: 'Atomic linked notes',
                    icon: <IconBook className="w-4 h-4" />,
                  },
                  {
                    key: 'flashcards',
                    label: 'Flashcards',
                    desc: 'Q/A study cards',
                    icon: <IconTestTube className="w-4 h-4" />,
                  },
                  {
                    key: 'mindmap',
                    label: 'Mind Map',
                    desc: 'Hierarchical outline',
                    icon: <IconMap className="w-4 h-4" />,
                  },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    variant="ghost"
                    onClick={() => generateAiNotes(opt.key)}
                    disabled={!!generatingNoteFormat}
                    className="flex-col items-start px-4 py-3 border border-gray-200 dark:border-gray-700 hover:border-accent hover:bg-accent/5 h-auto text-left"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-accent">{opt.icon}</span>
                        {opt.label}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">{opt.desc}</span>
                    {generatingNoteFormat === opt.key && (
                      <span className="text-xs text-accent mt-1 inline-flex items-center gap-1">
                        <IconSparkles className="w-3.5 h-3.5" />
                        Generating...
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {aiNoteContent && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-accent uppercase">
                      Auto-formatted Notes
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveCustomNote}
                      className="text-accent"
                    >
                      <span className="inline-flex items-center gap-2">
                        <IconBook className="w-4 h-4" />
                        Save
                      </span>
                    </Button>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    {aiNoteContent.split('\n').map((line, i) => renderLine(line, i))}
                  </div>
                </div>
              )}

              {state.notes?.flashcards && state.notes.flashcards.length > 0 && (
                <div className="space-y-3 mb-4">
                  <span className="text-xs font-medium text-gray-500 uppercase">Flashcards</span>
                  {state.notes.flashcards.map((fc, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <p className="font-medium text-gray-900 dark:text-white mb-2">
                        Q: {fc.front}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">A: {fc.back}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  <span className="inline-flex items-center gap-2">
                    <IconPencil className="w-4 h-4" />
                    Your Notes
                  </span>
                </label>
                <textarea
                  value={customNoteText}
                  onChange={(e) => setCustomNoteText(e.target.value)}
                  onBlur={saveCustomNote}
                  placeholder="Write your own notes here..."
                  className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-y min-h-[100px]"
                  rows={4}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                <span className="inline-flex items-center gap-2">
                  <IconPalette className="w-5 h-5 text-accent" />
                  Generate Illustration
                </span>
              </h3>
              <div className="flex gap-2">
                <input
                  value={illustrationDesc}
                  onChange={(e) => setIllustrationDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateIllustration()}
                  placeholder="Describe what you want illustrated..."
                  className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={generateIllustration}
                  disabled={generatingIllustration || !illustrationDesc.trim()}
                >
                  {generatingIllustration ? (
                    <span className="inline-flex items-center gap-2">
                      <IconSparkles className="w-4 h-4" />
                      Generating
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <IconPalette className="w-4 h-4" />
                      Generate
                    </span>
                  )}
                </Button>
              </div>
              {illustrations.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {illustrations.map((ill) => (
                    <div
                      key={ill.id}
                      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={ill.url}
                        alt={ill.description}
                        className="w-full h-48 object-cover"
                      />
                      <p className="text-xs text-gray-500 p-2">{ill.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activePanel === 'quiz' && <QuizPanel />}
      </main>

      {/* Lesson mindmap (Iter39 Task 6) */}
      <LessonMindmap
        open={lessonMindmapOpen}
        onClose={() => setLessonMindmapOpen(false)}
        lessonTitle={lesson?.title || 'Lesson'}
        lessonContent={lesson?.content || ''}
        suggestions={lessonMindmapSuggestions}
      />

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-2 sm:px-6 py-3 flex items-center justify-around gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (courseId && lessonId) await completeLesson(courseId, lessonId);
            }}
            className={`flex-col gap-1 h-auto ${state.completedLessons.has(lessonId || '') ? 'text-success' : ''}`}
          >
            <span className="text-lg">
              {state.completedLessons.has(lessonId || '') ? (
                <IconCheck className="w-5 h-5" />
              ) : (
                <IconProgressRing className="w-5 h-5" />
              )}
            </span>
            <span>Mark Complete</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              nav(`/conversation?courseId=${courseId}&lessonId=${lessonId}&action=notes`)
            }
            className="flex-col gap-1 h-auto"
          >
            <IconPencil className="w-5 h-5" />
            <span>Take Notes</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              nav(`/conversation?courseId=${courseId}&lessonId=${lessonId}&action=quiz`)
            }
            className="flex-col gap-1 h-auto"
          >
            <IconTestTube className="w-5 h-5" />
            <span>Quiz Me</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              nav(`/conversation?courseId=${courseId}&lessonId=${lessonId}&action=question`)
            }
            className="flex-col gap-1 h-auto"
          >
            <IconInfo className="w-5 h-5" />
            <span>Ask Question</span>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Render inline text with citation tooltips
function renderInlineWithCitations(text: string, sources: Source[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.*?)\*\*|`(.*?)`|\[(\d+)\])/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3])
      parts.push(
        <code
          key={match.index}
          className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono"
        >
          {match[3]}
        </code>,
      );
    else if (match[4]) {
      const num = parseInt(match[4]);
      const source = sources.find((s) => s.id === num);
      parts.push(<CitationTooltip key={match.index} num={num} source={source} />);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? <>{parts}</> : text;
}

function InlineQuickCheck({ content }: { content: string }) {
  const [revealed, setRevealed] = React.useState<Set<number>>(new Set());
  const lines = content.split('\n').filter((l) => l.trim());

  return (
    <div className="bg-accent/5 dark:bg-accent/5 border border-accent/20 dark:border-accent/20/30 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-accent dark:text-accent-light mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-2">
          <IconCheck className="w-4 h-4" />
          Quick Check
        </span>
      </h2>
      <div className="space-y-3">
        {lines.map((line, j) => {
          const clean = line.replace(/^[-•\d.]\s*/, '').trim();
          const isQ =
            clean.endsWith('?') ||
            clean.toLowerCase().startsWith('what') ||
            clean.toLowerCase().startsWith('how') ||
            clean.toLowerCase().startsWith('why');
          if (!isQ) {
            const qIdx = lines
              .slice(0, j)
              .reverse()
              .findIndex((l) => {
                const c = l.replace(/^[-•\d.]\s*/, '').trim();
                return (
                  c.endsWith('?') ||
                  c.toLowerCase().startsWith('what') ||
                  c.toLowerCase().startsWith('how') ||
                  c.toLowerCase().startsWith('why')
                );
              });
            const parentQ = qIdx >= 0 ? j - 1 - qIdx : j;
            if (!revealed.has(parentQ)) return null;
            return (
              <p
                key={j}
                className="text-sm text-green-700 dark:text-green-400 pl-4 border-l-2 border-green-300 dark:border-green-700 page-enter"
              >
                <span className="inline-flex items-center gap-2">
                  <IconBulb className="w-4 h-4" />
                  {clean}
                </span>
              </p>
            );
          }
          return (
            <Button
              key={j}
              variant="ghost"
              fullWidth
              onClick={() => setRevealed((prev) => new Set([...prev, j]))}
              className="text-left p-3 bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 h-auto justify-start"
            >
              <span className="font-medium">{clean}</span>
              {!revealed.has(j) && (
                <span className="text-xs text-blue-500 ml-2">(tap to reveal answer)</span>
              )}
              {revealed.has(j) && (
                <span className="text-xs text-green-500 ml-2 inline-flex items-center gap-1">
                  <IconCheck className="w-3.5 h-3.5" />
                  Revealed
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function QuizPanel() {
  const { state, dispatch } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const quiz = state.quiz;
  if (state.loading.quiz)
    return (
      <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 text-center text-gray-500 dark:text-gray-300">
        <span className="inline-flex items-center gap-2 justify-center">
          <IconSparkles className="w-4 h-4" />
          Generating quiz...
        </span>
      </div>
    );
  if (!quiz || !quiz.questions.length) return null;

  const handleSubmit = () => {
    dispatch({ type: 'SUBMIT_QUIZ', answers });
  };

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <span className="inline-flex items-center gap-2">
          <IconTestTube className="w-5 h-5 text-accent" />
          Knowledge Check
        </span>
      </h3>
      {quiz.submitted && quiz.score !== undefined && (
        <div
          className={`mb-4 p-4 rounded-xl ${quiz.score >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
        >
          <p className="font-bold text-lg">Score: {quiz.score}%</p>
          {quiz.gaps && quiz.gaps.length > 0 && (
            <p className="text-sm mt-1">Review: {quiz.gaps.join(', ')}</p>
          )}
        </div>
      )}
      <div className="space-y-6">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {i + 1}. {q.question}
            </p>
            {q.type === 'multiple_choice' && q.options ? (
              <div className="space-y-1.5 ml-4">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 text-sm p-2 rounded-xl cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-accent/10 text-accent' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      className="accent-accent"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Your answer..."
                className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={2}
              />
            )}
            {quiz.submitted && (
              <p className="text-xs text-gray-500 ml-4 inline-flex items-start gap-2">
                <IconBulb className="w-4 h-4 flex-shrink-0" />
                <span>{q.explanation}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      {!quiz.submitted && (
        <Button variant="primary" onClick={handleSubmit} className="mt-4">
          Submit Answers
        </Button>
      )}
    </div>
  );
}
