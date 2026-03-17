import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { SourceDrawer } from '../components/SourceDrawer.js';
import type { Source } from '../components/CitationTooltip.js';

// Agent display names
const AGENT_LABELS: Record<string, { icon: string; label: string }> = {
  notes: { icon: '📝', label: 'Notes Agent' },
  exam: { icon: '❓', label: 'Exam Agent' },
  research: { icon: '🔍', label: 'Research Agent' },
  summarizer: { icon: '📄', label: 'Summarizer' },
  course: { icon: '📚', label: 'Course Builder' },
};

// Lightweight markdown renderer — handles bold, code, inline code, lists, headers, line breaks
function renderMarkdown(content: string): React.ReactNode {
  const blocks = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const line = blocks[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLines = [];
      } else {
        elements.push(
          <pre
            key={i}
            className="bg-gray-900 dark:bg-black text-green-400 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>,
        );
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-bold mt-3 mb-1">
          {line.slice(2)}
        </h1>,
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-semibold mt-2 mb-1">
          {line.slice(3)}
        </h2>,
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-medium mt-2 mb-1">
          {line.slice(4)}
        </h3>,
      );
      continue;
    }
    if (line.startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm mb-0.5">
          {renderInline(line.slice(2))}
        </li>,
      );
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      elements.push(
        <li key={i} className="ml-4 list-decimal text-sm mb-0.5">
          {renderInline(line.replace(/^\d+\.\s/, ''))}
        </li>,
      );
      continue;
    }
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={i} className="text-sm leading-relaxed mb-1">
        {renderInline(line)}
      </p>,
    );
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle bold, inline code, and citations
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
    else if (match[4])
      parts.push(
        <sup key={match.index} className="text-accent font-medium">
          [{match[4]}]
        </sup>,
      );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? <>{parts}</> : text;
}

// Determine contextual quick-action chips based on last assistant message
function getContextChips(content: string): string[] {
  const lower = content.toLowerCase();
  if (lower.includes('course') && (lower.includes('created') || lower.includes('ready')))
    return ['View Course', 'Quiz Me', 'Take Notes'];
  if (lower.includes('lesson') || lower.includes('module'))
    return ['Take Notes', 'Quiz Me', 'Go Deeper', 'View Sources'];
  if (lower.includes('quiz') || lower.includes('question'))
    return ['Review Answers', 'Try Again', 'Move On'];
  if (lower.includes('notes') || lower.includes('cornell') || lower.includes('flashcard'))
    return ['Quiz Me', 'Go Deeper', 'Export Notes'];
  if (lower.includes('research') || lower.includes('paper') || lower.includes('source'))
    return ['Deep Dive', 'Save to Library', 'Create Course'];
  return ['Create Course', 'Quiz Me', 'Take Notes', 'Research'];
}

export function Conversation() {
  const nav = useNavigate();
  const { state, sendChat } = useApp();
  const [input, setInput] = useState('');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSources, setDrawerSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [state.chat]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || state.loading.chat) return;
    setInput('');

    // Detect agent from message
    const lower = msg.toLowerCase();
    if (lower.includes('note')) setActiveAgent('notes');
    else if (lower.includes('quiz') || lower.includes('test me')) setActiveAgent('exam');
    else if (lower.includes('research') || lower.includes('find')) setActiveAgent('research');
    else if (lower.includes('course') || lower.includes('create')) setActiveAgent('course');
    else setActiveAgent(null);

    await sendChat(msg);
    setActiveAgent(null);
  };

  const agentInfo = activeAgent
    ? AGENT_LABELS[activeAgent] || { icon: '🤖', label: 'AI Assistant' }
    : null;

  return (
    <section
      aria-label="Conversation"
      data-screen="conversation"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col h-screen"
    >
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/dashboard')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">LearnFlow AI</h1>
            <p className="text-xs text-gray-400">Your personal learning assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-xs text-gray-400">Online</span>
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
          <div className="text-center py-16 space-y-4">
            <span className="text-5xl block">🧠</span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Start a conversation
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Ask me to create a course, quiz you on a topic, take notes, or research anything.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'Teach me about Agentic AI',
                'Create a Rust course',
                'Quiz me on quantum computing',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-all"
                >
                  {s}
                </button>
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
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
              >
                <div data-component="markdown-content" className="leading-relaxed">
                  {renderMarkdown(msg.content)}
                </div>
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {/* Quick-action chips after assistant messages (Task 5) */}
            {msg.role === 'assistant' && idx === state.chat.length - 1 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-1">
                {getContextChips(msg.content).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-all"
                  >
                    {chip}
                  </button>
                ))}
                {msg.content.includes('[1]') && (
                  <button
                    onClick={() => {
                      // Parse sources from content
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
                    className="text-xs px-3 py-1.5 rounded-full border border-accent/30 text-accent hover:bg-accent/10 transition-all"
                  >
                    📚 View Sources
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Agent activity indicator (Task 4) */}
        {state.loading.chat && (
          <div
            data-component="agent-activity"
            aria-label="Agent processing"
            data-loading="true"
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {agentInfo ? (
                  <>
                    <span>{agentInfo.icon}</span>
                    <span className="font-medium">{agentInfo.label}</span>
                    <span className="text-gray-400">is working...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span className="text-gray-400">Thinking...</span>
                  </>
                )}
                <span className="flex gap-0.5 ml-1">
                  <span className="animate-bounce text-accent">●</span>
                  <span className="animate-bounce text-accent" style={{ animationDelay: '0.1s' }}>
                    ●
                  </span>
                  <span className="animate-bounce text-accent" style={{ animationDelay: '0.2s' }}>
                    ●
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask me anything..."
            aria-label="Message input"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition-all"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || state.loading.chat}
            aria-label="Send message"
            className="px-5 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Source Drawer (Task 13) */}
      <SourceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sources={drawerSources}
      />
    </section>
  );
}
