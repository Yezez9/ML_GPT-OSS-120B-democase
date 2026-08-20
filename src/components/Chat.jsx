import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chat.css';

/* ─── Inline SVG Icons ─── */

const ShieldIcon = () => (
  <svg className="nav-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
    <line x1="12" y1="22" x2="12" y2="15.5" />
    <line x1="22" y1="8.5" x2="12" y2="15.5" />
    <line x1="2" y1="8.5" x2="12" y2="15.5" />
  </svg>
);

const BotAvatar = () => (
  <div className="bot-avatar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="8" y="8" width="8" height="12" rx="2" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </svg>
  </div>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ─── Suggested questions ─── */

const SUGGESTED_QUESTIONS = [
  'Top banned heroes',
  'Best support picks',
  'Compare two heroes',
  'Underrated heroes to try',
  'Highest win rate marksman',
];

/* ─── Chat Component ─── */

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ────────────────────────────────────────────
   * sendMessage — handles the full send cycle.
   *
   * TODO: Replace the placeholder inside this function with a real
   *       fetch() call to /api/chat once the backend is wired up.
   *       The function already manages loading state and error handling;
   *       you only need to fill in the API call itself.
   * ──────────────────────────────────────────── */
  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    // 1. Append user message
    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Call the serverless API endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);


    } catch (err) {
      // Show the error inline as an assistant message so the UI never crashes
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ ${err.message}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleChipClick(question) {
    setInput(question);
    inputRef.current?.focus();
  }

  // Load avatar URL from environment variables, or use a default bot SVG
  const aiAvatarUrl = import.meta.env.VITE_AI_AVATAR_URL || 
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='padding:4px;'%3E%3Cpath d='M12 8V4H8'/%3E%3Crect x='8' y='8' width='8' height='12' rx='2'/%3E%3Cpath d='M10 12h4'/%3E%3Cpath d='M10 16h4'/%3E%3C/svg%3E";

  /* ─── Render ─── */

  return (
    <div className="chat-shell">
      {/* ═══ NAVBAR ═══ */}
      <nav className="navbar">
        <div className="nav-left">
          <img 
            src={aiAvatarUrl} 
            alt="AI Assistant Avatar" 
            className="nav-avatar-img" 
          />
          <span className="nav-title">MLBB Hero Insights</span>
        </div>

        <div className="nav-center">
          <a href="#" className="nav-link active">Chat</a>
          <a href="#" className="nav-link">Metas</a>
          <a href="#" className="nav-link">Heroes</a>
        </div>

        <div className="nav-right">
          <span className="nav-data-label">Data as of Aug 18, 2026</span>
          <div className="nav-user-icon">
            <UserIcon />
          </div>
        </div>
      </nav>

      {/* ═══ CHAT AREA ═══ */}
      <main className="chat-area">
        <div className="chat-scroll">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">
              <div className="empty-icon">
                <ShieldIcon />
              </div>
              <h2 className="empty-title">MLBB Hero Insights</h2>
              <p className="empty-sub">
                Ask me anything about hero win rates, ban rates, roles, and
                specialties. Powered by data from August 18, 2026.
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}${msg.isError ? ' error' : ''}`}
            >
              {msg.role === 'assistant' && <BotAvatar />}
              <div className="bubble">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="msg-row bot">
              <BotAvatar />
              <div className="bubble typing-bubble">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* ═══ SUGGESTED CHIPS ═══ */}
      <div className="chips-bar">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            className="chip"
            onClick={() => handleChipClick(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {/* ═══ INPUT BAR ═══ */}
      <div className="input-bar">
        <div className="input-wrap">
          <input
            ref={inputRef}
            type="text"
            className="msg-input"
            placeholder="Ask about a hero or stat..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        © 2026 MLBB Hero Insights. Professional Analytics for Legend &amp; Mythic Tiers.
      </footer>
    </div>
  );
}
