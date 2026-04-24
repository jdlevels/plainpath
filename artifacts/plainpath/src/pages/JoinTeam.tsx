import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Loader2, Check, AlertTriangle, LogIn } from "lucide-react"
import { useParams } from "wouter"
import { getApiBaseUrl } from "@/lib/api"
import { useUser } from "@clerk/react"

type InviteInfo = {
  invitation: { id: string; email: string; expiresAt: string }
  team: { id: string; name: string }
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

export default function JoinTeam() {
  const params = useParams<{ token: string }>()
  const token = params?.token ?? ""
  const { isLoaded, isSignedIn } = useUser()

  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const apiBase = getApiBaseUrl()

  useEffect(() => {
    document.title = "Join Team — PlainPath"
    return () => { document.title = "PlainPath" }
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${apiBase}/api/teams/invite/${token}`)
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setInfo(data)
        } else {
          setLoadError(data.error === "invite_expired" ? "This invitation has expired." : data.error === "invite_used" ? "This invitation has already been accepted." : "Invitation not found.")
        }
      })
      .catch(() => setLoadError("Unable to load invitation. Please try again."))
  }, [token])

  const handleJoin = async () => {
    if (!isSignedIn) {
      const redirectBack = `${basePath}/join/${token}`
      window.location.href = `${basePath}/sign-in?redirect_url=${encodeURIComponent(redirectBack)}`
      return
    }
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch(`${apiBase}/api/teams/invite/${token}/accept`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Failed to join team")
      setJoined(true)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join team")
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-950/40 items-center justify-center mb-4">
            <Users className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-display font-bold">Team Invitation</h1>
        </div>

        {!isLoaded && (
          <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        )}

        {isLoaded && loadError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/8 p-5 text-center">
            <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="font-semibold text-destructive mb-1">{loadError}</p>
            <p className="text-sm text-muted-foreground">Ask your team owner to send a new invitation.</p>
          </div>
        )}

        {isLoaded && !loadError && info && !joined && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 text-center">
            <div>
              <p className="text-muted-foreground text-sm mb-1">You've been invited to join</p>
              <p className="text-xl font-bold">{info.team.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Expires {new Date(info.invitation.expiresAt).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Joining gives you full PlainPath Pro access — all tools included — shared under the team owner's subscription.
            </p>
            {joinError && <p className="text-sm text-destructive">{joinError}</p>}
            <button
              onClick={() => void handleJoin()}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {joining ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Joining…</>
              ) : !isSignedIn ? (
                <><LogIn className="w-4 h-4" />Sign in to join</>
              ) : (
                <>Accept invitation</>
              )}
            </button>
            {!isSignedIn && (
              <p className="text-xs text-muted-foreground">You'll be redirected back after signing in.</p>
            )}
          </div>
        )}

        {joined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">You're in!</p>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-400/70 mt-1">
                You now have full Pro access as part of <strong>{info?.team.name}</strong>.
              </p>
            </div>
            <a
              href={`${basePath}/`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Start using PlainPath
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
