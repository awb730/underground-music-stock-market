import { useEffect, useState } from "react"
import axios from "axios"
import SignalBadge from "../components/SignalBadge"
import ArtistAvatar from "../components/ArtistAvatar"
import LoadingScreen from "../components/LoadingScreen"


function StatCard({ icon, label, value, sub, subColor = "text-tertiary" }) {
  return (
    <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <span className="text-outline uppercase font-mono text-[11px] tracking-widest">{label}</span>
      <h3 className="text-2xl font-bold text-on-surface mt-2">{value}</h3>
      <div className={`flex items-center gap-2 mt-4 ${subColor}`}>
        <span className="font-mono text-sm">{sub}</span>
      </div>
    </div>
  )
}

function computeStats(artists) {
  if (!artists.length) return null
  const topGainer = artists.reduce((a, b) =>
    a.listener_growth_7d > b.listener_growth_7d ? a : b
  )
  const breakouts = artists.filter(a => a.signal === "BREAKOUT").length
  const avgZ = (artists.reduce((sum, a) => sum + a.z_score, 0) / artists.length).toFixed(2)
  return { topGainer, breakouts, avgZ, total: artists.length }
}

export default function Leaderboard({ onSelect, artists, setArtists, onSearch, searching, searchError }) {
  const [loading, setLoading] = useState(artists.length === 0)
  const [localSearch, setLocalSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("ALL");

  const FILTERS = ["ALL", "BREAKOUT", "RISING", "STABLE", "COOLING", "DORMANT"]

  const FILTER_COLORS = {
    ALL: "text-on-surface border-outline-variant/30 hover:border-secondary/30",
    BREAKOUT: "text-green-400 border-green-500/20 hover:border-green-500/40",
    RISING: "text-secondary border-secondary/20 hover:border-secondary/40",
    STABLE: "text-slate-400 border-slate-500/20 hover:border-slate-500/40",
    COOLING: "text-yellow-400 border-yellow-500/20 hover:border-yellow-500/40",
    DORMANT: "text-rose-400 border-rose-500/20 hover:border-rose-500/40",
  }

  const FILTER_ACTIVE_COLORS = {
    ALL: "bg-secondary/20 text-secondary border-secondary/40",
    BREAKOUT: "bg-green-500/20 text-green-400 border-green-500/40",
    RISING: "bg-secondary/20 text-secondary border-secondary/40",
    STABLE: "bg-slate-500/20 text-slate-400 border-slate-500/40",
    COOLING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    DORMANT: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  }

  const filteredArtists = activeFilter === "ALL"
    ? artists
    : artists.filter(a => a.signal === activeFilter)


  const stats = computeStats(artists)

  useEffect(() => {
    if (artists.length === 0) {
      axios.get(`${import.meta.env.VITE_API_URL}/leaderboard`)
        .then(res => setArtists(Array.isArray(res.data) ? res.data : []))
        .finally(() => setLoading(false))
    }
  }, [artists.length, setArtists]) 

  if (loading) return <LoadingScreen />

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon="bar_chart" label="Artists Tracked" value={stats.total} sub="Active signals" />
          <StatCard icon="bolt" label="Top Gainer 7D" value={stats.topGainer.name.charAt(0).toUpperCase() + stats.topGainer.name.slice(1)} sub={`+${stats.topGainer.listener_growth_7d}%`} />
          <StatCard icon="rocket_launch" label="Breakout Signals" value={stats.breakouts} sub="Artists breaking out" subColor="text-green-400" />
          <StatCard icon="monitoring" label="Avg Z-Score" value={stats.avgZ} sub="Market confidence" subColor="text-secondary" />
        </div>
      )}

      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Signal Leaderboard</h2>
          <p className="text-on-surface-variant text-sm mt-1">Real-time artist performance metrics and market sentiment.</p>
        </div>
        <div className="flex gap-2 items-center">
          {searchError && <p className="text-error text-sm font-mono">{searchError}</p>}
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch(localSearch)}
            placeholder="Search artist..."
            className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
          />
          <button
            onClick={() => onSearch(localSearch)}
            disabled={searching}
            className="bg-secondary-container text-on-secondary-container font-mono text-sm px-4 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <p className="text-on-surface-variant text-md mt-1">Filter By:</p>
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs border transition-all ${
              activeFilter === filter
                ? FILTER_ACTIVE_COLORS[filter]
                : `bg-surface-container-low ${FILTER_COLORS[filter]}`
            }`}
          >
            {filter}
            {filter !== "ALL" && (
              <span className="ml-2 opacity-60">
                {artists.filter(a => a.signal === filter).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-outline-variant/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider">Artist</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider">Signal</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider text-right">7D %</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider text-right">30D %</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider text-right">Acceleration</th>
              <th className="px-6 py-4 font-mono text-[11px] text-outline uppercase tracking-wider text-right">Z-Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filteredArtists.map((a, i) => (
              <tr
                key={i}
                onClick={() => onSelect(a)}
                className="signal-row cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-sm text-outline group-hover:text-secondary">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <ArtistAvatar name={a.name} signal={a.signal} size="sm" />
                    <span className="font-bold text-on-surface group-hover:text-secondary transition-colors">
                      {a.name.charAt(0).toUpperCase() + a.name.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4"><SignalBadge signal={a.signal} /></td>
                <td className={`px-6 py-4 text-right font-mono text-sm ${a.listener_growth_7d >= 0 ? "text-tertiary" : "text-rose-400"}`}>
                  {a.listener_growth_7d >= 0 ? "+" : ""}{a.listener_growth_7d}%
                </td>
                <td className={`px-6 py-4 text-right font-mono text-sm ${a.listener_growth_30d >= 0 ? "text-tertiary" : "text-rose-400"}`}>
                  {a.listener_growth_30d >= 0 ? "+" : ""}{a.listener_growth_30d}%
                </td>
                <td className={`px-6 py-4 text-right font-mono text-sm ${a.acceleration >= 0 ? "text-on-surface-variant" : "text-rose-400"}`}>
                  {a.acceleration}
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm text-on-surface">
                  {a.z_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}