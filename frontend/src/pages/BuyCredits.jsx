import { useEffect, useState } from "react"
import axios from "axios"

const BUNDLES = [
  {
    key: "small",
    label: "Starter",
    credits: 250,
    price: "$2.99",
    description: "Perfect for trying out a few positions",
    icon: "bolt",
    color: "border-outline-variant/30 hover:border-secondary/40",
    highlight: false
  },
  {
    key: "medium",
    label: "Standard",
    credits: 500,
    price: "$4.99",
    description: "Good for tracking a handful of artists",
    icon: "trending_up",
    color: "border-outline-variant/30 hover:border-secondary/40",
    highlight: false
  },
  {
    key: "large",
    label: "Pro",
    credits: 1200,
    price: "$9.99",
    bonus: "20% bonus",
    description: "Most popular — best value for active traders",
    icon: "rocket_launch",
    color: "border-secondary/40",
    highlight: true
  },
  {
    key: "xlarge",
    label: "Elite",
    credits: 3500,
    price: "$24.99",
    bonus: "40% bonus",
    description: "For serious investors tracking many artists",
    icon: "diamond",
    color: "border-primary/30 hover:border-primary/50",
    highlight: false
  }
]

export default function BuyCredits({ user }) {
    const [loading, setLoading] = useState(null)
    const [error, setError] = useState(null)
    const [checkoutUrl, setCheckoutUrl] = useState(null)

    useEffect(() => {
        if (checkoutUrl) {
            window.location.href = checkoutUrl
        }
    }, [checkoutUrl])

    const handlePurchase = async (bundleKey) => {
        setLoading(bundleKey)
        setError(null)
        try {
            const token = localStorage.getItem("token")
            const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/payments/create-checkout-session`,
            { bundle_key: bundleKey },
            { headers: { Authorization: `Bearer ${token}` } }
            )
            setCheckoutUrl(res.data.checkout_url)
        } catch (e) {
            setError(e.response?.data?.detail || "Something went wrong")
            setLoading(null)
        }
    }

    return (
        <div>
        {/* Header */}
        <div className="mb-10">
            <h2 className="text-2xl font-bold text-on-surface">Buy Credits</h2>
            <p className="text-on-surface-variant text-sm font-mono mt-1">
            Credits allow you to invest on artists (LONG or SHORT).
            </p>
        </div>

        {/* Current balance */}
        <div className="glass-card rounded-xl p-6 mb-10 flex items-center justify-between border border-outline-variant/20">
            <div>
            <p className="text-outline font-mono text-[11px] uppercase tracking-widest mb-1">Current Balance</p>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">toll</span>
                <p className="text-3xl font-bold text-tertiary">{user?.credits?.toLocaleString()}</p>
                <span className="text-outline font-mono text-sm">credits</span>
            </div>
            </div>
            <span className="material-symbols-outlined text-outline text-4xl opacity-20">account_balance_wallet</span>
        </div>

        {/* Bundle grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {BUNDLES.map(bundle => (
            <div
                key={bundle.key}
                className={`glass-card rounded-xl p-6 border transition-all relative flex flex-col ${bundle.color} ${
                bundle.highlight ? "ring-1 ring-secondary/30" : ""
                }`}
            >
                {/* Most popular badge */}
                {bundle.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-secondary text-on-secondary font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Most Popular
                    </span>
                </div>
                )}

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary text-[20px]">{bundle.icon}</span>
                </div>

                {/* Label */}
                <p className="font-mono text-[11px] text-outline uppercase tracking-widest mb-1">{bundle.label}</p>
                <h3 className="text-2xl font-bold text-on-surface mb-1">{bundle.credits.toLocaleString()}</h3>
                <p className="text-outline font-mono text-xs mb-1">credits</p>

                {/* Bonus badge */}
                {bundle.bonus && (
                <span className="inline-block bg-tertiary/10 text-tertiary border border-tertiary/20 font-mono text-[10px] px-2 py-0.5 rounded mb-3 w-fit">
                    {bundle.bonus}
                </span>
                )}

                <p className="text-on-surface-variant text-xs font-mono mb-6 flex-grow">{bundle.description}</p>

                {/* Price + button */}
                <div>
                <p className="text-xl font-bold text-on-surface mb-3">{bundle.price}</p>
                <button
                    onClick={() => handlePurchase(bundle.key)}
                    disabled={loading === bundle.key}
                    className={`w-full py-2.5 rounded-lg font-mono font-bold text-sm transition-all disabled:opacity-50 ${
                    bundle.highlight
                        ? "bg-secondary-container text-on-secondary-container hover:brightness-110"
                        : "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:border-secondary/30 hover:text-secondary"
                    }`}
                >
                    {loading === bundle.key ? "Redirecting..." : `Buy ${bundle.label}`}
                </button>
                </div>
            </div>
            ))}
        </div>

        {error && (
            <p className="text-error font-mono text-sm text-center">{error}</p>
        )}

        {/* Fine print */}
        <p className="text-outline font-mono text-xs text-center mt-6">
            Payments are processed securely by Stripe. Credits are non-refundable.
        </p>
        </div>
    )
}