// frontend/src/components/ai/AIChatPanel.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../service/api.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────
const MAX_CHARS = 1000;

const QUICK_PROMPTS = [
  {
    label: "📊 Portfolio Risk",
    text: "Analyze my current portfolio risk and concentration.",
  },
  {
    label: "📈 Buy Signals",
    text: "What are the best buy signals in my holdings right now?",
  },
  {
    label: "📰 Market News",
    text: "Give me the latest news affecting my portfolio stocks.",
  },
  {
    label: "🔀 Diversify",
    text: "How can I better diversify my portfolio?",
  },
  {
    label: "⚠️ Risk Alerts",
    text: "Are there any high-risk positions I should exit?",
  },
  {
    label: "📉 RSI Analysis",
    text: "Explain the RSI levels for my top holdings.",
  },
];

// ── INLINE RENDERER — handles **bold**, `code`, $TICKER ───────────────
function renderInline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[A-Z]{1,5})/g);

  return (
    <span key={key}>
      {parts.map((part, i) => {
        // Bold
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-slate-900 font-extrabold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Inline code
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-indigo-600 text-xs font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Stock ticker
        if (/^\$[A-Z]{1,5}$/.test(part)) {
          return (
            <span
              key={i}
              onClick={() =>
                window.open(
                  `https://www.tradingview.com/symbols/${part.slice(1)}/`,
                  "_blank"
                )
              }
              className="cursor-pointer hover:bg-indigo-100 inline-flex items-center px-2 py-0.5 mx-0.5 rounded-lg bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-xs font-mono font-black tracking-wider transition-colors"
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ── MARKDOWN-LIKE CONTENT PARSER ──────────────────────────────────────
function parseContent(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      output.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // ## Heading
    if (line.startsWith("## ")) {
      output.push(
        <p
          key={i}
          className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-3 mb-1.5 border-b border-slate-100 pb-1"
        >
          {renderInline(line.slice(3), "h" + i)}
        </p>
      );
      i++;
      continue;
    }

    // # Heading
    if (line.startsWith("# ")) {
      output.push(
        <p key={i} className="text-slate-900 font-black text-sm mt-3 mb-1.5">
          {renderInline(line.slice(2), "h" + i)}
        </p>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-═]{3,}$/.test(line.trim())) {
      output.push(<hr key={i} className="border-slate-100 my-2" />);
      i++;
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];

      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\.\s+(.+)/);

        if (m) {
          items.push(
            <li key={i} className="flex gap-2 items-start">
              <span className="text-indigo-600 font-bold text-xs mt-0.5 flex-shrink-0 w-4">
                {m[1]}.
              </span>

              <span className="text-slate-700">
                {renderInline(m[2], i)}
              </span>
            </li>
          );
        }

        i++;
      }

      output.push(
        <ol key={"ol" + i} className="space-y-1.5 my-1.5">
          {items}
        </ol>
      );

      continue;
    }

    // Bullet list
    if (/^[-•▸]\s/.test(line)) {
      const items = [];

      while (i < lines.length && /^[-•▸]\s/.test(lines[i])) {
        const content = lines[i].replace(/^[-•▸]\s+/, "");

        items.push(
          <li key={i} className="flex gap-2 items-start">
            <span className="text-indigo-500 mt-1 flex-shrink-0 text-xs">
              ▸
            </span>

            <span className="text-slate-700">
              {renderInline(content, i)}
            </span>
          </li>
        );

        i++;
      }

      output.push(
        <ul key={"ul" + i} className="space-y-1.5 my-1.5">
          {items}
        </ul>
      );

      continue;
    }

    // Normal paragraph
    output.push(
      <p key={i} className="leading-relaxed text-slate-700">
        {renderInline(line, i)}
      </p>
    );

    i++;
  }

  return output;
}

// ── TYPING INDICATOR ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2">
      <div
        className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0 mb-1 ml-1 mt-1 shadow-sm"
        style={{
          clipPath:
            "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
        }}
      >
        AI
      </div>

      <div className="flex items-center gap-3 rounded-2xl rounded-tl-xs px-5 py-3.5 bg-slate-50 border border-slate-200/60 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>

        <span className="text-slate-400 text-xs font-semibold">
          Alpha-Insight is processing…
        </span>
      </div>
    </div>
  );
}

// ── MESSAGE BUBBLE ────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  const isUser = msg.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex group items-end gap-2 max-w-[85%] ${
          isUser ? "flex-row-reverse ml-auto" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 bg-slate-100 border border-slate-200 text-slate-700">
            YOU
          </div>
        ) : (
          <div
            className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-[8px] font-black text-white flex-shrink-0 mb-1 ml-1 mt-1 shadow-sm"
            style={{
              clipPath:
                "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
            }}
          >
            AI
          </div>
        )}

        <div
          className={`space-y-1 ${
            isUser ? "items-end" : "items-start"
          } flex flex-col`}
        >
          {/* Bubble */}
          <div
            className={`rounded-2xl px-5 py-3.5 border text-sm space-y-1.5 shadow-xs ${
              isUser
                ? "bg-indigo-50/50 border-indigo-100 text-slate-850 rounded-tr-xs"
                : "bg-white border-slate-150 text-slate-700 rounded-tl-xs"
            }`}
          >
            {isUser ? (
              <p className="leading-relaxed font-semibold">{msg.content}</p>
            ) : (
              parseContent(msg.content)
            )}
          </div>

          {/* Footer */}
          <div
            className={`flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {msg.time && (
              <span className="text-slate-400 text-[10px] font-bold">
                {msg.time}
              </span>
            )}

            {!isUser && (
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-indigo-600 text-[10px] font-black transition-colors cursor-pointer"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
function AIChatPanel({ onClose, isFloating = false }) {
  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "**Alpha-Insight Engine online.**\n\nI'm your institutional-grade AI trading assistant. Ask me anything about tickers, portfolio risk, or indicators.",
      time: getTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Send message
  const sendMessage = useCallback(async () => {
    const text = input.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
        time: getTime(),
      },
    ]);

    setInput("");
    setCharCount(0);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            res?.data?.response ||
            "AI engine could not generate a response.",
          time: getTime(),
        },
      ]);
    } catch (err) {
      const is429 = err?.response?.status === 429;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: is429
            ? "⚠️ **Rate limit reached.** Please wait before sending another message."
            : "⚠️ **AI engine temporarily unavailable.**",
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [input, loading]);

  const handleInputChange = (e) => {
    const val = e.target.value;

    if (val.length <= MAX_CHARS) {
      setInput(val);
      setCharCount(val.length);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const containerClasses = isFloating
    ? "glass-card bg-white rounded-[2.5rem] border border-slate-150 flex flex-col overflow-hidden w-[380px] sm:w-[480px] h-[600px] max-h-[85vh] shadow-2xl"
    : "glass-card bg-white rounded-[2.5rem] border border-slate-150 h-[700px] flex flex-col overflow-hidden w-full shadow-sm";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="border-b border-slate-100 px-6 py-4.5 flex items-center justify-between bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm"
            style={{
              clipPath:
                "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)",
            }}
          >
            <span className="text-white font-black text-[10px]">AI</span>
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Alpha-Insight Chat
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0 bg-slate-50/30">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-5 pb-3 flex gap-2 flex-wrap flex-shrink-0 bg-slate-50/30">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => setInput(p.text)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-100 px-5 pt-4 pb-5 bg-white flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about market trends, RSI, portfolio risk..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 text-sm outline-none resize-none placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 transition shadow-2xs"
              style={{ minHeight: "52px" }}
            />

            {charCount > 0 && (
              <span className="absolute bottom-3.5 right-4 text-[9px] font-bold font-mono text-slate-450">
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 min-w-[80px] h-[52px] px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition cursor-pointer"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;