import { useState, useEffect } from "react"
import axios from "axios"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Leaderboard from "./pages/Leaderboard"
import ArtistDetail from "./pages/ArtistDetail"
import Portfolio from "./pages/Portfolio"
import Auth from "./pages/Auth"
import BuyCredits from "./pages/BuyCredits"
import LoadingScreen from "./components/LoadingScreen";

export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token")
    const username = localStorage.getItem("username")
    const credits = localStorage.getItem("credits")
    if (token && username) {
      return { username, credits: parseInt(credits) }
    }
    return null
  })
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activePage, setActivePage] = useState("leaderboard")
  const [artists, setArtists] = useState([])
  const [searchError, setSearchError] = useState(null)
  const [searching, setSearching] = useState(false)
  const [sessionMessage, setSessionMessage] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedArtist(null);
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    localStorage.removeItem("credits")
    setUser(null)
  }

  const handleSearch = async (query) => {
      if (!query.trim()) return
      setSearching(true)
      setSearchError(null)
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/search?name=${encodeURIComponent(query)}`)
        setArtists(prev => {
          const exists = prev.find(a => a.artist_id === res.data.artist_id)
          const updated = exists ? prev : [...prev, res.data]
          const priority = { BREAKOUT: 0, RISING: 1, STABLE: 2, COOLING: 3, DORMANT: 4 }
          return [...updated].sort((a, b) => {
            const sigDiff = (priority[a.signal] ?? 99) - (priority[b.signal] ?? 99)
            if (sigDiff !== 0) return sigDiff
            return b.listener_growth_30d - a.listener_growth_30d
          })
        })
        setSelectedArtist(res.data)
        setSearchQuery("")
      } catch {
        setSearchError("Artist not found. Try a different name.")
      } finally {
        setSearching(false)
      }
  }

  useEffect(() => {
    // Brief delay to show loading screen while session is verified
    const timer = setTimeout(() => setAppLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        const isLoginOrRegister = error.config?.url?.includes("/login") || error.config?.url?.includes("/register");
        if (error.response?.status === 401 && !isLoginOrRegister) {
          localStorage.removeItem("token")
          localStorage.removeItem("username")
          localStorage.removeItem("credits")
          setSessionMessage("Your session expired. Please log in again.")
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get("payment")
    if (payment === "success") {
      // Refetch user credits from backend
      const token = localStorage.getItem("token")
      if (token) {
        axios.get(`${import.meta.env.VITE_API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          const newCredits = res.data.credits
          localStorage.setItem("credits", newCredits)
          setUser(prev => ({ ...prev, credits: newCredits }))
        })
      }
      // Clean up URL
      window.history.replaceState({}, "", "/")
    }
  }, [])

  if (appLoading) return <LoadingScreen />
  if (!user) return <Auth onLogin={handleLogin} sessionMessage={sessionMessage} />

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar activePage={activePage} setActivePage={handleNavigate} />

      <main className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activePage={activePage}
          setActivePage={handleNavigate}
          onSearch={handleSearch}
          searching={searching}
          searchError={searchError}
          user={user}
          onLogout={handleLogout}
        />

        <section className="p-6 max-w-[1440px] mx-auto w-full">
          <section className="p-6 max-w-[1440px] mx-auto w-full">
            {selectedArtist ? (
              <ArtistDetail
                artist={selectedArtist}
                onBack={() => setSelectedArtist(null)}
                user={user}
                setUser={setUser}
              />
            ) : activePage === "portfolio" ? (
              <Portfolio user={user} setUser={setUser} />
            ) : activePage === "buyCredits" ? (
              <BuyCredits user={user} />
            ) : (
              <Leaderboard
                onSelect={setSelectedArtist}
                artists={artists}
                setArtists={setArtists}
                onSearch={handleSearch}
                searching={searching}
                searchError={searchError}
              />
            )}
          </section>
        </section>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-surface-container-lowest flex justify-around items-center py-4 px-6 border-t border-outline-variant/10">
        <button
          onClick={() => setActivePage("leaderboard")}
          className={`flex flex-col items-center gap-1 ${activePage === "leaderboard" ? "text-secondary" : "text-outline"}`}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="font-mono text-[10px]">Leaderboard</span>
        </button>
        <button
          onClick={() => setActivePage("portfolio")}
          className={`flex flex-col items-center gap-1 ${activePage === "portfolio" ? "text-secondary" : "text-outline"}`}
        >
          <span className="material-symbols-outlined">pie_chart</span>
          <span className="font-mono text-[10px]">Portfolio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-outline">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-mono text-[10px]">Settings</span>
        </button>
      </nav>
    </div>
  )
}