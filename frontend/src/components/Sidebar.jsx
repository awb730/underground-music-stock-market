import logo from "../assets/logo.png"

export default function Sidebar({ activePage, setActivePage }) {

  function get_subtitle(activePage) {
    switch(activePage) {
      case "leaderboard":
        return "Market Open"
      case "portfolio":
        return "Your Holdings"
      case "buyCredits":
        return "Add Credits"
      case "settings":
        return "Settings"
      default:
        "Market Open"
    }
  }


  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant/20 py-6 z-[60]">
      
      <div className="px-6 mb-10 flex items-center gap-3">
        <img src={logo} alt="UMExchange logo" className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(76,215,246,0.3)]" />
        <div>
          <h2 className="text-secondary font-bold text-lg leading-none">UMExchange</h2>
          <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest mt-1 block">{get_subtitle(activePage)}</span>
        </div>
      </div>

      <nav className="flex-grow space-y-1">
        <button
          onClick={() => setActivePage("leaderboard")}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
            activePage === "leaderboard"
              ? "bg-secondary-container/20 text-secondary border-l-4 border-secondary"
              : "text-on-surface-variant hover:bg-white/5"
          }`}
        >
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="font-mono text-sm">Leaderboard</span>
        </button>
        <button
          onClick={() => setActivePage("portfolio")}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
            activePage === "portfolio"
              ? "bg-secondary-container/20 text-secondary border-l-4 border-secondary"
              : "text-on-surface-variant hover:bg-white/5"
          }`}
        >
          <span className="material-symbols-outlined">pie_chart</span>
          <span className="font-mono text-sm">Portfolio</span>
        </button>
      </nav>
      
      {/* Buy Credits button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setActivePage("buyCredits")}
          className="w-full bg-secondary-container text-on-secondary-container font-mono text-sm py-3 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          Buy Credits
        </button>
      </div>

      <div className="space-y-1">
        <a href="#" className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined">help</span>
          <span className="font-mono text-sm">Support</span>
        </a>
        <button
          onClick={() => setActivePage("settings")}
          className="w-full flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-mono text-sm">Settings</span>
        </button>
      </div>
    </aside>
  )
}