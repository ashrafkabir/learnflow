import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { useApp } from '../context/AppContext.js';
import { SourceDrawer } from '../components/SourceDrawer.js';
import type { Source } from '../components/CitationTooltip.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { Button } from '../components/Button.js';

// Agent display names and activity messages
const AGENT_LABELS: Record<string, { icon: string; label: string; activity: string }> = {
  notes: { icon: '📝', label: 'Notes Agent', activity: 'is organizing your notes...' },
  exam: { icon: '❓', label: 'Exam Agent', activity: 'is crafting questions...' },
  research: { icon: '🔍', label: 'Research Agent', activity: 'is finding sources...' },
  summarizer: { icon: '📄', label: 'Summarizer', activity: 'is condensing content...' },
  course: { icon: '📚', label: 'Course Builder', activity: 'is synthesizing curriculum...' },
};

// Rich markdown renderer
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
      components={{
        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mt-2 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-relaxed mb-1">{children}</p>,
        ul: ({ children }) => <ul className="ml-4 list-disc text-sm space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="ml-4 list-decimal text-sm space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5">{children}</li>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.startsWith('language-') || className?.startsWith('hljs');
          if (isBlock) {
            return <code className={className} {...props}>{children}</code>;
          }
          return (
            <code className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs font-mono" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-gray-900 dark:bg-black text-green-400 rounded-xl p-3 my-2 overflow-x-auto text-xs font-mono">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-800 font-semibold text-left">{children}</th>,
        td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{children}</td>,
        sup: ({ children }) => <sup className="text-accent font-medium">{children}</sup>,
        a: ({ href, children }) => <a href={href} className="text-accent underline hover:opacity-80" target="_blank" rel="noopener noreferrer">{children}</a>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-accent pl-3 my-2 italic text-sm opacity-80">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function renderMarkdown(content: string): React.ReactNode {
  return <MarkdownContent content={content} />;
}

// Quick-action chips
interface QuickChip {
  label: string;
  message: string;
}

function getContextChips(content: string): QuickChip[] {
  const lower = content.toLowerCase();
  if (lower.includes('course') && (lower.includes('created') || lower.includes('ready')))
    return [
      { label: 'Take Notes', message: 'Take detailed notes on this lesson' },
      { label: 'Quiz Me', message: 'Generate a quiz to test my understanding' },
      { label: 'Go Deeper', message: 'Research this topic in more depth with sources' },
    ];
  if (lower.includes('lesson') || lower.includes('module'))
    return [
      { label: 'Take Notes', message: 'Take detailed notes on this lesson' },
      { label: 'Quiz Me', message: 'Generate a quiz to test my understanding' },
      { label: 'Go Deeper', message: 'Research this topic in more depth with sources' },
      { label: 'See Sources', message: '__open_sources__' },
    ];
  if (lower.includes('quiz') || lower.includes('question'))
    return [
      { label: 'Review Answers', message: 'Review my quiz answers and explain mistakes' },
      { label: 'Try Again', message: 'Generate a new quiz on the same topic' },
      { label: 'Take Notes', message: 'Take detailed notes on what I got wrong' },
    ];
  if (lower.includes('notes') || lower.includes('cornell') || lower.includes('flashcard'))
    return [
      { label: 'Quiz Me', message: 'Generate a quiz to test my understanding' },
      { label: 'Go Deeper', message: 'Research this topic in more depth with sources' },
    ];
  return [
    { label: 'Take Notes', message: 'Take detailed notes on this lesson' },
    { label: 'Quiz Me', message: 'Generate a quiz to test my understanding' },
    { label: 'Go Deeper', message: 'Research this topic in more depth with sources' },
    { label: 'See Sources', message: '__open_sources__' },
  ];
}

export function Conversation() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, sendChat, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [contextBadge, setContextBadge] = useState<string | null>(null);

  // Handle query params from lesson action bar
  useEffect(() => {
    const action = searchParams.get('action');
    const courseId = searchParams.get('courseId');
    const lessonId = searchParams.get('lessonId');
    if (action && (courseId || lessonId)) {
      const courseTitle = state.activeCourse?.title || `Course ${courseId}`;
      const lessonTitle = state.activeLesson?.title || `Lesson ${lessonId}`;
      setContextBadge(`${courseTitle} › ${lessonTitle}`);
      const prompts: Record<string, string> = {
        notes: `Take detailed notes on the current lesson "${lessonTitle}"`,
        quiz: `Quiz me on the lesson "${lessonTitle}"`,
        question: `I have a question about the lesson "${lessonTitle}": `,
      };
      if (prompts[action]) setInput(prompts[action]);
    }
  }, [searchParams]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSources, setDrawerSources] = useState<Source[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket streaming
  const { connected: wsConnected, send: wsSend } = useWebSocket((evt) => {
    switch (evt.event) {
      case 'agent.spawned':
        setActiveAgent(evt.data?.agent_name?.toLowerCase()?.split(' ')[0] || 'orchestrator');
        break;
      case 'response.chunk':
        setStreamingContent((prev) => prev + (evt.data?.content_delta || evt.data?.content || ''));
        break;
      case 'response.end': {
        if (streamingContent) {
          dispatch({
            type: 'ADD_CHAT_MESSAGE',
            message: {
              id: evt.data?.message_id || `msg-${Date.now()}-ws`,
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date().toISOString(),
            },
          });
        }
        if (evt.data?.sources?.length) {
          setDrawerSources(evt.data.sources.map((s: any, i: number) => ({
            id: i + 1,
            title: s.title || `Source ${i + 1}`,
            author: s.author || 'Source',
            publication: s.publication || '',
            year: s.year || 2024,
            url: s.url || '#',
          })));
        }
        setStreamingContent('');
        setActiveAgent(null);
        dispatch({ type: 'SET_LOADING', key: 'chat', value: false });
        break;
      }
      case 'agent.complete':
        setActiveAgent(null);
        dispatch({
          type: 'ADD_NOTIFICATION',
          notification: {
            id: `notif-${Date.now()}`,
            type: 'agent',
            message: `${evt.data?.agent_name || 'Agent'} completed: ${evt.data?.result_summary || 'Task finished'}`,
            timestamp: new Date().toISOString(),
            read: false,
          },
        });
        break;
      case 'progress.update':
        dispatch({
          type: 'ADD_NOTIFICATION',
          notification: {
            id: `notif-${Date.now()}`,
            type: 'progress',
            message: evt.data?.metric === 'lesson_completed' ? 'Lesson completed! 🎉' : `Progress updated: ${evt.data?.metric || 'learning'}`,
            timestamp: new Date().toISOString(),
            read: false,
          },
        });
        break;
      case 'mindmap.update':
        break;
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [state.chat]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || state.loading.chat) return;
    setInput('');

    const lower = msg.toLowerCase();
    if (lower.includes('note')) setActiveAgent('notes');
    else if (lower.includes('quiz') || lower.includes('test me')) setActiveAgent('exam');
    else if (lower.includes('research') || lower.includes('find')) setActiveAgent('research');
    else if (lower.includes('course') || lower.includes('create')) setActiveAgent('course');
    else setActiveAgent(null);

    if (wsConnected) {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        message: { id: `msg-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() },
      });
      dispatch({ type: 'SET_LOADING', key: 'chat', value: true });
      setStreamingContent('');
      wsSend('message', { text: msg });
    } else {
      await sendChat(msg);
      setActiveAgent(null);
    }
  };

  const agentInfo = activeAgent
    ? AGENT_LABELS[activeAgent] || { icon: '🤖', label: 'AI Assistant', activity: 'is thinking...' }
    : null;

  return (
    <section
      aria-label="Conversation"
      data-screen="conversation"
      className="min-h-screen bg-bg dark:bg-bg-dark flex flex-col h-screen"
    >
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav('/dashboard')}
          >
            ←
          </Button>
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">LearnFlow AI</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Your personal learning assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {state.chat.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'SET_CHAT', messages: [] })}
              className="border border-gray-200 dark:border-gray-700"
            >
              + New Chat
            </Button>
          )}
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400" title="AI assistant is ready to help">Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        data-component="message-list"
        role="log"
        aria-label="Messages"
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4"
      >
        {state.chat.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ask me anything about your learning
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                I can create courses, quiz you, generate study notes, and research topics with real sources.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
              {[
                { icon: '📚', title: 'Create a course', desc: 'On any topic from the web', text: 'Create a course on Rust programming' },
                { icon: '🧠', title: 'Quiz me', desc: 'Test your knowledge', text: 'Quiz me on React hooks' },
                { icon: '📝', title: 'Summarize notes', desc: 'From your lessons', text: 'Summarize my machine learning notes' },
              ].map((s) => (
                <Button
                  key={s.title}
                  variant="ghost"
                  onClick={() => send(s.text)}
                  className="flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-accent hover:shadow-card-hover h-auto"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{s.desc}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: '💡 Explain transformers', text: 'Explain transformer architecture simply' },
                { label: '🔍 Research agentic AI', text: 'Teach me about Agentic AI' },
                { label: '🗺️ DevOps roadmap', text: 'Create a learning roadmap for DevOps' },
              ].map((s) => (
                <Button
                  key={s.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput(s.text)}
                  className="rounded-full border border-gray-200 dark:border-gray-700"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        {state.chat.map((msg, idx) => (
          <div key={msg.id}>
            <div
              data-role={msg.role}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
              >
                <div data-component="markdown-content" className="leading-relaxed">
                  {renderMarkdown(msg.content)}
                </div>
                {msg.role === 'assistant' && msg.content.includes('```improved') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const match = msg.content.match(/```improved\n([\s\S]*?)```/);
                      if (match) {
                        navigator.clipboard.writeText(match[1].trim());
                        alert('Improved content copied to clipboard! You can paste it into the lesson editor.');
                      }
                    }}
                    className="mt-2 rounded-full bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20"
                  >
                    ✨ Copy Improved Content
                  </Button>
                )}
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {/* Quick-action chips after assistant messages */}
            {msg.role === 'assistant' && idx === state.chat.length - 1 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-1">
                {getContextChips(msg.content).map((chip) => (
                  <Button
                    key={chip.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (chip.message === '__open_sources__') {
                        setDrawerOpen(true);
                      } else {
                        send(chip.message);
                      }
                    }}
                    className="rounded-full border border-gray-200 dark:border-gray-700"
                  >
                    {chip.label}
                  </Button>
                ))}
                {msg.content.includes('[1]') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const sourceRegex = /\[(\d+)\]\s*(.*?)(?:\.|$)/gm;
                      const parsed: Source[] = [];
                      let m;
                      while ((m = sourceRegex.exec(msg.content)) !== null) {
                        parsed.push({
                          id: parseInt(m[1]),
                          title: m[2].trim(),
                          author: 'Author',
                          publication: 'Source',
                          year: 2024,
                          url: '#',
                        });
                      }
                      setDrawerSources(
                        parsed.length
                          ? parsed
                          : [
                              {
                                id: 1,
                                title: 'Source referenced in response',
                                author: 'Various',
                                publication: 'Web',
                                year: 2024,
                                url: '#',
                              },
                            ],
                      );
                      setDrawerOpen(true);
                    }}
                    className="rounded-full border border-accent/30 text-accent hover:bg-accent/10"
                  >
                    📚 View Sources
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Streaming response */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card text-gray-900 dark:text-gray-100 rounded-bl-md">
              <div data-component="markdown-content" className="leading-relaxed">
                {renderMarkdown(streamingContent)}
              </div>
              <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-0.5" />
            </div>
          </div>
        )}
        {/* Agent activity indicator — Task 5 */}
        {state.loading.chat && !streamingContent && (
          <div
            data-component="agent-activity"
            aria-label="Agent processing"
            data-loading="true"
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-card rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {agentInfo ? (
                  <>
                    <span className="text-lg">{agentInfo.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{agentInfo.label}</span>
                    <span className="text-gray-500 dark:text-gray-400">{agentInfo.activity}</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🤖</span>
                    <span className="text-gray-500 dark:text-gray-400">Thinking...</span>
                  </>
                )}
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0.3s' }} />
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 safe-area-bottom">
        {(contextBadge || state.activeCourse || state.activeLesson) && (
          <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>📚</span>
            {contextBadge ? (
              <span className="font-medium text-gray-600 dark:text-gray-300">{contextBadge}</span>
            ) : (
              <>
                {state.activeCourse && <span className="font-medium text-gray-600 dark:text-gray-300">{state.activeCourse.title}</span>}
                {state.activeLesson && <><span>›</span><span className="text-accent">{state.activeLesson.title}</span></>}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => setContextBadge(null)} className="ml-auto text-gray-300 hover:text-gray-500 h-6 w-6 p-0">✕</Button>
          </div>
        )}
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask me anything..."
            aria-label="Message input"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition-all"
          />
          <Button
            variant="primary"
            onClick={() => send()}
            disabled={!input.trim() || state.loading.chat}
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
      </div>

      {/* Source Drawer */}
      <SourceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sources={drawerSources}
      />
    </section>
  );
}
