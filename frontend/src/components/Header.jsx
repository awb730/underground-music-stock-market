export default function Header({ searchQuery, setSearchQuery, activePage, setActivePage, onSearch, searching, searchError, user, onLogout }) {

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch(searchQuery)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 flex justify-between items-center px-6 py-4 w-full">
      <div className="flex items-center gap-6 flex-grow">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searching ? "Searching..." : "Search any artist..."}
            className="w-full bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50 placeholder:text-outline/50"
          />
          {searchError && (
            <p className="absolute top-full mt-1 left-3 text-error text-xs font-mono">{searchError}</p>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setActivePage("leaderboard")}
            className={`font-mono text-sm transition-colors ${
              activePage === "leaderboard"
                ? "text-secondary border-b-2 border-secondary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActivePage("portfolio")}
            className={`font-mono text-sm transition-colors ${
              activePage === "portfolio"
                ? "text-secondary border-b-2 border-secondary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActivePage("buyCredits")}
            className={`font-mono text-sm transition-colors ${
              activePage === "buyCredits"
                ? "text-secondary border-b-2 border-secondary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Buy Credits
          </button>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Credits balance */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
          <span className="material-symbols-outlined text-tertiary text-[16px]">toll</span>
          <span className="font-mono text-sm text-tertiary font-bold">{user?.credits?.toLocaleString()}</span>
          <span className="font-mono text-[11px] text-outline">credits</span>
        </div>
            
        {/* Username */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-outline text-[18px]">person</span>
            )}
          </div>
          <span className="hidden md:block font-mono text-sm text-on-surface-variant">{user?.username}</span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="material-symbols-outlined text-outline hover:text-error transition-colors"
          title="Logout"
        >
          logout
        </button>

        <button
          onClick={() => setActivePage("settings")}
          className="material-symbols-outlined text-outline hover:text-on-surface transition-colors"
        >
          settings
        </button>
      </div>
    </header>
  )
}