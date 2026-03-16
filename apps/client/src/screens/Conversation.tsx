import React, { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  actions?: string[];
}

/** S08-A05: Conversation interface with markdown rendering, agent indicator, action chips */
export function Conversation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your **LearnFlow AI tutor**. What would you like to learn today?",
      agent: 'orchestrator',
      actions: ['Create a Course', 'Quiz Me', 'Take Notes', 'Research'],
    },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I'll help you with "${input}". Let me process that...`,
      agent: 'course_builder',
      actions: ['View Syllabus', 'Start Lesson 1'],
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
  };

  return (
    <section
      aria-label="Conversation"
      data-screen="conversation"
      style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100vh' }}
    >
      <h1 style={{ fontSize: '20px', marginBottom: 16 }}>Chat with LearnFlow</h1>

      <div
        data-component="message-list"
        role="log"
        aria-label="Messages"
        style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            data-role={msg.role}
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: msg.role === 'user' ? '#EEF2FF' : '#f9fafb',
            }}
          >
            {msg.agent && (
              <div
                data-component="agent-indicator"
                aria-label={`Agent: ${msg.agent}`}
                style={{ fontSize: '12px', color: '#6366F1', marginBottom: 4 }}
              >
                🤖 {msg.agent}
              </div>
            )}
            <div
              data-component="markdown-content"
              dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`(.*?)`/g, '<code>$1</code>'),
              }}
            />
            {msg.actions && (
              <div
                data-component="action-chips"
                aria-label="Suggested actions"
                style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                {msg.actions.map((a) => (
                  <button
                    key={a}
                    aria-label={a}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      border: '1px solid #6366F1',
                      borderRadius: 16,
                      background: '#fff',
                      color: '#6366F1',
                      cursor: 'pointer',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask me anything..."
          aria-label="Message input"
          style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button onClick={send} aria-label="Send message" style={{ padding: '12px 24px' }}>
          Send
        </button>
      </div>
    </section>
  );
}
