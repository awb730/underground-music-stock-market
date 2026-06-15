import { useState } from "react"
import axios from "axios"

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login")
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === "login" ? "/login" : "/register"
      const payload = mode === "login"
        ? { username: form.username, password: form.password }
        : { username: form.username, email: form.email, password: form.password }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("username", res.data.username)
      localStorage.setItem("credits", res.data.credits)
      onLogin({ username: res.data.username, credits: res.data.credits })
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md border border-outline-variant/20">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container">music_note</span>
          </div>
          <div>
            <h1 className="text-secondary font-bold text-xl leading-none">UMX Terminal</h1>
            <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest">Underground Music Exchange</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-on-surface mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-on-surface-variant text-sm font-mono mb-8">
          {mode === "login" ? "Sign in to your terminal" : "Start with 1,000 free credits"}
        </p>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="your_username"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
              />
            </div>
          )}

          <div>
            <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
            />
          </div>

          {error && (
            <p className="text-error text-sm font-mono">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-secondary-container text-on-secondary-container font-bold font-mono py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-on-surface-variant text-sm mt-6">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
            className="text-secondary font-mono ml-2 hover:text-primary transition-colors"
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  )
}