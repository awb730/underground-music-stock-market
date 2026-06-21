import { useState, useRef } from "react"
import axios from "axios"

function SettingsCard({ icon, title, description, children }) {
  return (
    <div className="glass-card rounded-xl p-6 border border-outline-variant/20">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-secondary text-[18px]">{icon}</span>
        </div>
        <div>
          <h3 className="font-bold text-on-surface">{title}</h3>
          <p className="text-on-surface-variant text-xs font-mono mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function AvatarSection({ user, setUser }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setError(null)
    setUploading(true)

    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/settings/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      )
      setUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }))
      localStorage.setItem("avatar_url", res.data.avatar_url)
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const currentImage = preview || user?.avatar_url

  return (
    <SettingsCard
      icon="account_circle"
      title="Profile Picture"
      description="Upload a custom avatar. JPG, PNG, or WEBP, max 5MB."
    >
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-xl bg-surface-variant border border-outline-variant/30 overflow-hidden flex items-center justify-center flex-shrink-0">
          {currentImage ? (
            <img src={currentImage} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-outline text-3xl">person</span>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-surface-container-high text-on-surface border border-outline-variant/30 font-mono text-xs px-4 py-2 rounded-lg hover:border-secondary/40 hover:text-secondary transition-all disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Choose Image"}
          </button>
          {error && <p className="text-error font-mono text-xs mt-2">{error}</p>}
        </div>
      </div>
    </SettingsCard>
  )
}

function UsernameSection({ user, setUser }) {
  const [newUsername, setNewUsername] = useState("")
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const checkAvailability = async (value) => {
    value = value.strip();
    if (!value || value === user.username) {
      setAvailable(null)
      return
    }
    setChecking(true)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/settings/check-username`,
        { username: value },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAvailable(res.data.available)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }

  const debounceTimer = useRef(null)
  const handleChange = (value) => {
    setNewUsername(value)
    setSuccess(false)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => checkAvailability(value), 500)
  }

  const handleSave = async () => {
    if (!available || !newUsername) return
    setSaving(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/settings/update-username`,
        { new_username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("username", res.data.username)
      setUser(prev => ({ ...prev, username: res.data.username }))
      setSuccess(true)
      setNewUsername("")
      setAvailable(null)
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to update username")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard
      icon="badge"
      title="Username"
      description={`Currently: ${user?.username}`}
    >
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="New username"
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
          />
          {checking && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-outline">checking...</span>
          )}
          {!checking && available === true && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          )}
          {!checking && available === false && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-error text-[18px]">cancel</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!available || saving}
          className="bg-secondary-container text-on-secondary-container font-mono text-xs font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-30"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>
      {available === false && newUsername && (
        <p className="text-error font-mono text-xs mt-2">Username already taken</p>
      )}
      {error && <p className="text-error font-mono text-xs mt-2">{error}</p>}
      {success && <p className="text-tertiary font-mono text-xs mt-2">Username updated successfully</p>}
    </SettingsCard>
  )
}

function PasswordInput({ label, field, form, setForm, show, setShow }) {
  return (
    <div>
      <label className="text-outline font-mono text-[11px] uppercase tracking-widest block mb-2">{label}</label>
      <div className="relative">
        <input
          type={show[field] ? "text" : "password"}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow({ ...show, [field]: !show[field] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline hover:text-on-surface transition-colors text-[18px]"
        >
          {show[field] ? "visibility_off" : "visibility"}
        </button>
      </div>
    </div>
  )
}

function PasswordSection() {
  const [form, setForm] = useState({ current: "", new: "", confirm: "" })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    if (form.new !== form.confirm) {
      setError("New passwords do not match")
      return
    }
    if (form.new.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(
        `${import.meta.env.VITE_API_URL}/settings/update-password`,
        { current_password: form.current, new_password: form.new },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess(true)
      setForm({ current: "", new: "", confirm: "" })
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard
      icon="lock"
      title="Password"
      description="Update your account password"
    >
      <div className="space-y-4">
        <PasswordInput label="Current Password" field="current" form={form} setForm={setForm} show={show} setShow={setShow} />
        <PasswordInput label="New Password" field="new" form={form} setForm={setForm} show={show} setShow={setShow} />
        <PasswordInput label="Confirm New Password" field="confirm" form={form} setForm={setForm} show={show} setShow={setShow} />

        {error && <p className="text-error font-mono text-xs">{error}</p>}
        {success && <p className="text-tertiary font-mono text-xs">Password updated successfully</p>}

        <button
          onClick={handleSave}
          disabled={saving || !form.current || !form.new || !form.confirm}
          className="bg-secondary-container text-on-secondary-container font-mono text-xs font-bold px-5 py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-30"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
    </SettingsCard>
  )
}

export default function Settings({ user, setUser }) {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-on-surface">Settings</h2>
        <p className="text-on-surface-variant text-sm font-mono mt-1">Manage your account and profile.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <AvatarSection user={user} setUser={setUser} />
        <UsernameSection user={user} setUser={setUser} />
        <PasswordSection />
      </div>
    </div>
  )
}