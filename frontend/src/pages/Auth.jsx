import { useState } from "react"
import axios from "axios"
import logo from "../assets/logo.png"

export default function Auth({ onLogin, sessionMessage }) {
  const [mode, setMode] = useState("login")
  const [form, setForm] = useState({ username: "", email: "", confirmEmail: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)

    if (mode === "register") {
      if (form.email !== form.confirmEmail) {
        setError("Emails do not match")
        return
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }
    }

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

  const inputClass = "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card rounded-xl p-8 w-full max-w-md border border-outline-variant/20">

        {/* Logo */}
        {sessionMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-400 text-[18px]">info</span>
              <p className="text-yellow-400 font-mono text-xs">{sessionMessage}</p>
            </div>
        )}
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="UMExchange logo" className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(76,215,246,0.3)]" />
          <div>
            <h1 className="text-secondary font-bold text-xl leading-none">UMExchange</h1>
            <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest">Underground Music Exchange</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-on-surface mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-on-surface-variant text-sm font-mono mb-8">
          {mode === "login" ? "Sign in to your account" : "Start with 1,000 free credits"}
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
              className={inputClass}
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Confirm Email</label>
                <input
                  type="email"
                  value={form.confirmEmail}
                  onChange={e => setForm({ ...form, confirmEmail: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className={`${inputClass} ${
                    form.confirmEmail && form.email !== form.confirmEmail
                      ? "ring-1 ring-error/50 border-error/30"
                      : form.confirmEmail && form.email === form.confirmEmail
                      ? "ring-1 ring-tertiary/50 border-tertiary/30"
                      : ""
                  }`}
                />
                {form.confirmEmail && form.email !== form.confirmEmail && (
                  <p className="text-error font-mono text-xs mt-1">Emails do not match</p>
                )}
                {form.confirmEmail && form.email === form.confirmEmail && (
                  <p className="text-tertiary font-mono text-xs mt-1">Emails match</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline hover:text-on-surface transition-colors text-[20px]"
              >
                {showPassword ? "visibility_off" : "visibility"}
              </button>
            </div>
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
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError(null)
              setForm({ username: "", email: "", confirmEmail: "", password: "" })
            }}
            className="text-secondary font-mono ml-2 hover:text-primary transition-colors"
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  )
}