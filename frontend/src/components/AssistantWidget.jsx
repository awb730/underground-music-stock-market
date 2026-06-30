import { useState, useRef, useEffect } from "react"
import axios from "axios"

const SOURCE_LABELS = {
  "readme.md": "README",
  "api_spec.md": "API Docs",
  "explainer.md": "How It Works"
}

function SourceBadge({ source }) {
  const colors = {
    "readme.md": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "api_spec.md": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "explainer.md": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${colors[source] || "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
      {SOURCE_LABELS[source] || source}
    </span>
  )
}

function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 max-w-[80%]">
          <p className="text-on-surface text-xs">{msg.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%]">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2">
          {msg.loading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-outline font-mono text-[10px]">Searching docs...</span>
            </div>
          ) : (
            <>
              <p className="text-on-surface text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-outline-variant/20 flex-wrap">
                  {msg.sources.map(s => <SourceBadge key={s} source={s} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const SUGGESTED = [
  "What is a BREAKOUT signal?",
  "How do I open a position?",
  "How is P&L calculated?",
  "What credit bundles are available?"
]

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the UMExchange assistant. Ask me anything about signals, positions, credits, or the API.",
      sources: []
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, open])

  const handleAsk = async (question) => {
    const q = question || input.trim()
    if (!q || loading) return

    setInput("")
    setMessages(prev => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "", loading: true }
    ])
    setLoading(true)

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_ASSISTANT_URL}/ask`,
        { question: q }
      )
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources
        }
      ])
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          sources: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  const showSuggestions = messages.length === 1

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="glass-card rounded-xl border border-outline-variant/30 w-80 sm:w-96 flex flex-col overflow-hidden shadow-2xl"
          style={{ height: "480px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[14px]">auto_awesome</span>
              </div>
              <div>
                <p className="text-on-surface font-bold text-xs leading-none">UMX Assistant</p>
                <p className="text-outline font-mono text-[9px] mt-0.5">Help Center</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="material-symbols-outlined text-outline hover:text-on-surface transition-colors text-[18px]"
            >
              close
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}

            {showSuggestions && (
              <div className="mt-2 space-y-1.5">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => handleAsk(q)}
                    className="w-full text-left px-3 py-2 bg-surface-container border border-outline-variant/20 rounded-lg text-outline text-[10px] font-mono hover:border-secondary/30 hover:text-secondary transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-outline-variant/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={loading}
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs text-on-surface font-mono focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50 disabled:opacity-50"
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !input.trim()}
                className="bg-secondary/10 border border-secondary/20 text-secondary px-2.5 py-2 rounded-lg hover:bg-secondary/20 transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
        style={{ boxShadow: "0 0 20px rgba(76, 215, 246, 0.2)" }}
      >
        <span className="material-symbols-outlined text-[22px]">
          {open ? "close" : "auto_awesome"}
        </span>
      </button>
    </div>
  )
}