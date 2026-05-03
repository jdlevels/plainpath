import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Smartphone } from "lucide-react"

type Platform = "ios" | "android" | "both"

interface Props {
  open: boolean
  onClose: () => void
  defaultPlatform?: Platform
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export function WaitlistModal({ open, onClose, defaultPlatform = "both" }: Props) {
  const [email, setEmail] = useState("")
  const [platform, setPlatform] = useState<Platform>(defaultPlatform)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const platformOptions: { value: Platform; label: string; sub: string }[] = [
    { value: "ios", label: "iPhone", sub: "iOS" },
    { value: "android", label: "Android", sub: "Google Play" },
    { value: "both", label: "Both", sub: "Notify me for both" },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), platform, source: "marketing-hero" }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "invalid_email") {
          setErrorMsg("Please enter a valid email address.")
        } else {
          setErrorMsg("Something went wrong. Please try again.")
        }
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setErrorMsg("Connection error. Please try again.")
      setStatus("error")
    }
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      onClose()
      setTimeout(() => {
        setStatus("idle")
        setEmail("")
        setErrorMsg("")
        setPlatform(defaultPlatform)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {status === "success" ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">You're on the list!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We'll email you as soon as PlainPath launches on{" "}
                {platform === "ios" ? "iPhone" : platform === "android" ? "Android" : "iPhone and Android"}.
              </p>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Try a free demo to see PlainPath in action.
            </p>
            <div className="flex gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button size="sm" asChild>
                <a href="/demo">Try a demo</a>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coming Soon</span>
              </div>
              <DialogTitle className="text-xl">Get notified at launch</DialogTitle>
              <DialogDescription>
                Be first in line when PlainPath arrives on mobile. We'll send you one email — no spam.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Notify me for</p>
                <div className="grid grid-cols-3 gap-2">
                  {platformOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPlatform(opt.value)}
                      className={cn(
                        "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border text-center transition-all",
                        platform === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-[10px] leading-tight mt-0.5">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="h-11 font-semibold"
              >
                {status === "loading" ? "Saving…" : "Notify me at launch"}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground/70 -mt-1">
                One email. No spam. Unsubscribe any time.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
