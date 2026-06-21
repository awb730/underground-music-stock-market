import { useState } from "react"
import axios from "axios"
import logo from "../assets/logo.png"

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient grid lines */}
      <div className="absolute inset-0 grid-pulse" />

      {/* Top radial glow */}
      <div className="absolute inset-0 animate-pulse" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(76, 215, 246, 0.06) 0%, transparent 70%)"
      }} />

      {/* Bottom fade to background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 50%, #020617 100%)"
      }} />
    </div>
  )
}

function HeroSection({ onSignIn, onRegister }) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <GridBackground />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 relative flex items-center justify-center">
          {/* Tight glow ring only */}
          <div className="absolute animate-pulse rounded-full" style={{
            background: "radial-gradient(circle, rgba(76,215,246,0.2), transparent)",
            width: "120px",
            height: "120px"
          }} />
          <img
            src={logo}
            alt="UMExchange"
            className="w-24 h-24 object-contain relative z-10"
            style={{ filter: "drop-shadow(0 0 16px rgba(76, 215, 246, 0.5))" }}
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-on-surface mb-3 tracking-tight">
          UMExchange
        </h1>
        <p className="text-secondary font-mono text-sm uppercase tracking-widest mb-6">
          Underground Music Exchange
        </p>

        {/* Tagline */}
        <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mb-4 leading-relaxed">
          The first platform where you can invest in artists like stocks.
        </p>
        <p className="text-outline font-mono text-sm max-w-md mb-12">
          Track momentum. Read signals. Go long on the next breakout.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button
            onClick={onRegister}
            className="flex-1 bg-secondary-container text-on-secondary-container font-mono font-bold py-3.5 px-8 rounded-lg hover:brightness-110 transition-all text-md"
          >
            Get Started Free
          </button>
          <button
            onClick={onSignIn}
            className="flex-1 bg-surface-container-low text-on-surface border border-outline-variant/30 font-mono font-bold py-3.5 px-8 rounded-lg hover:border-secondary/40 hover:text-secondary transition-all text-md"
          >
            Sign In
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-6 mt-12">
          <div className="text-center">
            <p className="text-xl font-bold text-on-surface">Live</p>
            <p className="text-outline font-mono text-[11px] uppercase tracking-widest">Data</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="text-center">
            <p className="text-xl font-bold text-on-surface">5</p>
            <p className="text-outline font-mono text-[11px] uppercase tracking-widest">Signals</p>
          </div>
          <div className="w-px h-8 bg-outline-variant/30" />
          <div className="text-center">
            <p className="text-xl font-bold text-on-surface">1,000</p>
            <p className="text-outline font-mono text-[11px] uppercase tracking-widest">Free Credits</p>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <span className="material-symbols-outlined text-outline text-[20px]">keyboard_arrow_down</span>
      </div>
    </div>
  )
}

function AuthForm({ mode, onBack, onLogin, sessionMessage }) {
  const [form, setForm] = useState({ username: "", email: "", confirmEmail: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formMode, setFormMode] = useState(mode)

  const handleSubmit = async () => {
    setError(null)

    if (formMode === "register") {
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
      const endpoint = formMode === "login" ? "/login" : "/register"
      const payload = formMode === "login"
        ? { username: form.username, password: form.password }
        : { username: form.username, email: form.email, password: form.password }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("username", res.data.username)
      localStorage.setItem("credits", res.data.credits)
      localStorage.setItem("avatar_url", res.data.avatar_url || "")
      onLogin({ username: res.data.username, credits: res.data.credits, avatar_url: res.data.avatar_url })
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
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4">
      <GridBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors mb-6 font-mono text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>

        <div className="glass-card rounded-xl p-8 border border-outline-variant/20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src={logo}
              alt="UMExchange"
              className="w-10 h-10 object-contain"
              style={{ filter: "drop-shadow(0 0 8px rgba(76, 215, 246, 0.4))" }}
            />
            <div>
              <h1 className="text-secondary font-bold text-xl leading-none">UMExchange</h1>
              <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest">Underground Music Exchange</span>
            </div>
          </div>

          {/* Session message */}
          {sessionMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-400 text-[18px]">info</span>
              <p className="text-yellow-400 font-mono text-xs">{sessionMessage}</p>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-on-surface mb-1">
            {formMode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-on-surface-variant text-sm font-mono mb-8">
            {formMode === "login" ? "Sign in to your terminal" : "Start with 1,000 free credits"}
          </p>

          {/* Form fields */}
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

            {formMode === "register" && (
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

            {error && <p className="text-error text-sm font-mono">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-secondary-container text-on-secondary-container font-bold font-mono py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Please wait..." : formMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          {/* Toggle mode */}
          <p className="text-center text-on-surface-variant text-sm mt-6">
            {formMode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setFormMode(formMode === "login" ? "register" : "login")
                setError(null)
                setForm({ username: "", email: "", confirmEmail: "", password: "" })
              }}
              className="text-secondary font-mono ml-2 hover:text-primary transition-colors"
            >
              {formMode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Auth({ onLogin, sessionMessage }) {
  const [view, setView] = useState(sessionMessage ? "login" : "hero")

  if (view === "hero") {
    return (
      <HeroSection
        onSignIn={() => setView("login")}
        onRegister={() => setView("register")}
      />
    )
  }

  return (
    <AuthForm
      mode={view}
      onBack={() => setView("hero")}
      onLogin={onLogin}
      sessionMessage={sessionMessage}
    />
  )
}