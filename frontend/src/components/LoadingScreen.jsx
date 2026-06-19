import logo from "../assets/logo.png"

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "radial-gradient(circle, #4cd7f6, transparent)", scale: "1.5" }}
          />
          {/* Middle glow ring */}
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ background: "radial-gradient(circle, #4cd7f6, transparent)", scale: "1.2" }}
          />
          {/* Logo */}
          <img
            src={logo}
            alt="UM Exchange"
            className="w-20 h-20 object-contain relative z-10 animate-pulse"
            style={{ filter: "drop-shadow(0 0 20px rgba(76, 215, 246, 0.6))" }}
          />
        </div>

        <div className="text-center">
          <h1 className="text-secondary font-bold text-xl tracking-wide">UM Exchange</h1>
          <p className="text-outline font-mono text-xs uppercase tracking-widest mt-1 animate-pulse">
            Loading terminal...
          </p>
        </div>
      </div>
    </div>
  )
}