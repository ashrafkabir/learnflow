import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { CitationTooltip, Source } from '../components/CitationTooltip.js';

// Parse source references from lesson content
function parseSources(content: string): Source[] {
  const sources: Source[] = [];
  const regex = /\[(\d+)\]\s*(.*?)\.\s*"(.*?)"\s*(.*?),?\s*(\d{4})\.\s*(https?:\/\/\S+)/gm;
  let m;
  while ((m = regex.exec(content)) !== null) {
    sources.push({
      id: parseInt(m[1]),
      author: m[2],
      title: m[3],
      publication: m[4].replace(/,\s*$/, ''),
      year: parseInt(m[5]),
      url: m[6],
    });
  }
  return sources;
}

// Parse lesson content into structured sections (Task 8)
function parseStructuredContent(content: string) {
  const sections: { type: string; content: string }[] = [];
  const lines = content.split('\n');
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
    } else if (lower.startsWith('## estimated time') || lower.includes('estimated time')) {
      flush();
      currentType = 'time';
    } else if (lower.startsWith('## key takeaways') || lower.startsWith('## takeaways')) {
      flush();
      currentType = 'takeaways';
    } else if (lower.startsWith('## sources') || lower.startsWith('## references')) {
      flush();
      currentType = 'sources';
    } else if (lower.startsWith('## next steps') || lower.startsWith("## what's next")) {
      flush();
      currentType = 'nextsteps';
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
  const { state, fetchLesson, completeLesson, generateNotes, generateQuiz } = useApp();
  const [loading, setLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'notes' | 'quiz'>('none');
  const [notesFormat, setNotesFormat] = useState<'cornell' | 'flashcard'>('cornell');

  const lesson = state.activeLesson;
  const isComplete = lessonId ? state.completedLessons.has(lessonId) : false;

  useEffect(() => {
    if (courseId && lessonId) {
      setLoading(true);
      fetchLesson(courseId, lessonId).finally(() => setLoading(false));
    }
  }, [courseId, lessonId]);

  const handleMarkComplete = async () => {
    if (courseId && lessonId) await completeLesson(courseId, lessonId);
  };

  const handleNotes = async () => {
    if (activePanel === 'notes') {
      setActivePanel('none');
      return;
    }
    setActivePanel('notes');
    if (lessonId) await generateNotes(lessonId, notesFormat);
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
        className="min-h-screen bg-gray-50 dark:bg-bg-dark flex items-center justify-center"
      >
        <div className="animate-spin text-4xl">⏳</div>
      </section>
    );
  }

  const sources = parseSources(lesson.content);
  const sections = parseStructuredContent(lesson.content);

  // Render content line with inline citation tooltips
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
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => nav(`/courses/${courseId}`)}
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back to Course
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {lesson.wordCount} words · {lesson.estimatedTime} min
            </span>
            {isComplete && (
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                ✓ Complete
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Structured lesson content (Task 8) */}
        <article data-component="lesson-content" aria-label="Lesson content" className="space-y-6">
          {/* Title section */}
          {sections
            .filter((s) => s.type === 'title')
            .map((s, i) => (
              <div
                key={`title-${i}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
              >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {s.content.replace(/^#\s*/, '')}
                </h1>
                {/* Time badge (Task 8) */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs font-medium px-3 py-1 rounded-full">
                    ⏱️ {lesson.estimatedTime} min read
                  </span>
                  <span className="text-xs text-gray-400">{lesson.wordCount} words</span>
                </div>
              </div>
            ))}

          {/* Learning Objectives (Task 8) */}
          {sections
            .filter((s) => s.type === 'objectives')
            .map((s, i) => (
              <div key={`obj-${i}`} className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                  🎯 Learning Objectives
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
          {sections
            .filter((s) => s.type === 'content')
            .map((s, i) => (
              <div
                key={`content-${i}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
              >
                {s.content.split('\n').map((line, j) => renderLine(line, j))}
              </div>
            ))}

          {/* Key Takeaways (Task 8) */}
          {sections
            .filter((s) => s.type === 'takeaways')
            .map((s, i) => (
              <div
                key={`take-${i}`}
                className="bg-success/5 border border-success/20 rounded-2xl p-5"
              >
                <h2 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  💡 Key Takeaways
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
              </div>
            ))}

          {/* Sources / References (Task 7) */}
          {sources.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                📚 References
              </h2>
              <div className="space-y-3">
                {sources.map((s) => (
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
                ))}
              </div>
            </div>
          )}

          {/* Next Steps (Task 8) */}
          {sections
            .filter((s) => s.type === 'nextsteps')
            .map((s, i) => (
              <div
                key={`next-${i}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
              >
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  🚀 Next Steps
                </h2>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {s.content
                    .split('\n')
                    .filter((l) => l.trim())
                    .map((line, j) => (
                      <p key={j}>{line.replace(/^[-•]\s*/, '')}</p>
                    ))}
                </div>
              </div>
            ))}
        </article>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleMarkComplete}
            disabled={isComplete}
            aria-label="Mark Complete"
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${isComplete ? 'bg-success/10 text-success cursor-default' : 'bg-success text-white hover:bg-success/90 shadow-sm'}`}
          >
            {isComplete ? '✅ Completed' : '✅ Mark Complete'}
          </button>
          <button
            onClick={handleNotes}
            aria-label="Take Notes"
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${activePanel === 'notes' ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent'}`}
          >
            📝 Take Notes
          </button>
          <button
            onClick={handleQuiz}
            aria-label="Quiz Me"
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${activePanel === 'quiz' ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-accent'}`}
          >
            ❓ Quiz Me
          </button>
        </div>

        {/* Notes panel */}
        {activePanel === 'notes' && (
          <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📝 Notes</h3>
              <div className="flex gap-2">
                {(['cornell', 'flashcard'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setNotesFormat(f);
                      if (lessonId) generateNotes(lessonId, f);
                    }}
                    className={`text-xs px-3 py-1 rounded-full capitalize transition-all ${notesFormat === f ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {state.loading.notes ? (
              <div className="text-center py-8 text-gray-400">⏳ Generating notes...</div>
            ) : state.notes ? (
              <div className="prose dark:prose-invert max-w-none text-sm">
                {state.notes.content &&
                  state.notes.content.split('\n').map((line, i) => renderLine(line, i))}
                {state.notes.flashcards && state.notes.flashcards.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {state.notes.flashcards.map((fc, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          Q: {fc.front}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">A: {fc.back}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Quiz panel */}
        {activePanel === 'quiz' && <QuizPanel />}
      </div>
    </section>
  );
}

// Render inline text with citation tooltips (Task 7)
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

function QuizPanel() {
  const { state, dispatch } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const quiz = state.quiz;
  if (state.loading.quiz)
    return (
      <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center text-gray-400">
        ⏳ Generating quiz...
      </div>
    );
  if (!quiz || !quiz.questions.length) return null;

  const handleSubmit = () => {
    dispatch({ type: 'SUBMIT_QUIZ', answers });
  };

  return (
    <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ❓ Knowledge Check
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
                    className={`flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-accent/10 text-accent' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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
            {quiz.submitted && <p className="text-xs text-gray-500 ml-4">💡 {q.explanation}</p>}
          </div>
        ))}
      </div>
      {!quiz.submitted && (
        <button
          onClick={handleSubmit}
          className="mt-4 px-6 py-2.5 bg-accent text-white font-medium text-sm rounded-xl hover:bg-accent-dark transition-colors"
        >
          Submit Answers
        </button>
      )}
    </div>
  );
}
