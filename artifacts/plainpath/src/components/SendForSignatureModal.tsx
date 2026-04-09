import { useState } from "react"
import { motion } from "framer-motion"
import {
  Pen, X as XIcon, Loader2, CheckCircle2, AlertCircle, Mail, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiBaseUrl } from "@/lib/api"

interface Party {
  label: string
  name: string
  type?: string
}

interface SendForSignatureModalProps {
  open: boolean
  onClose: () => void
  draft: Record<string, unknown>
  parties: Record<string, Party>
}

export default function SendForSignatureModal({ open, onClose, draft, parties }: SendForSignatureModalProps) {
  const partyValues = Object.values(parties)
  const partyA = partyValues[0]
  const partyB = partyValues[1]

  const [partyAEmail, setPartyAEmail] = useState("")
  const [partyBEmail, setPartyBEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!partyAEmail.trim() || !partyBEmail.trim()) {
      setError("Both email addresses are required.")
      return
    }
    if (!/\S+@\S+\.\S+/.test(partyAEmail) || !/\S+@\S+\.\S+/.test(partyBEmail)) {
      setError("Please enter valid email addresses for both parties.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const base = getApiBaseUrl()
      const response = await fetch(`${base}/api/contracts/send-for-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          partyAEmail: partyAEmail.trim(),
          partyAName: partyA?.name || "Party A",
          partyBEmail: partyBEmail.trim(),
          partyBName: partyB?.name || "Party B",
          message: message.trim(),
        }),
      })
      const data = await response.json() as { message?: string; error?: string }
      if (!response.ok) {
        if (response.status === 503) {
          setError("E-signature is not configured yet. A Dropbox Sign API key is needed to activate this feature.")
        } else {
          setError(data.message ?? "Failed to send. Please try again.")
        }
        return
      }
      setSent(true)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setPartyAEmail("")
    setPartyBEmail("")
    setMessage("")
    setError(null)
    setSent(false)
    setLoading(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative bg-background border border-border/60 rounded-2xl shadow-2xl w-full max-w-md z-10"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Pen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold text-base">Send for Signature</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-lg">Signing emails sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Both parties will receive an email with a link to review and sign the contract. You'll both get a certified copy when complete.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Mail className="w-3.5 h-3.5" />
                Powered by Dropbox Sign · Legally binding e-signatures
              </div>
              <Button onClick={handleClose} className="w-full mt-2">Done</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Both parties will receive an email with a secure link to review and sign. Dropbox Sign handles identity verification, the audit trail, and the certified signed copy.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="partyAEmail" className="text-sm">
                    {partyA?.label ? `${partyA.label}${partyA.name ? ` — ${partyA.name}` : ""}` : "Party A"} Email
                  </Label>
                  <Input
                    id="partyAEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={partyAEmail}
                    onChange={e => { setPartyAEmail(e.target.value); setError(null) }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partyBEmail" className="text-sm">
                    {partyB?.label ? `${partyB.label}${partyB.name ? ` — ${partyB.name}` : ""}` : "Party B"} Email
                  </Label>
                  <Input
                    id="partyBEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={partyBEmail}
                    onChange={e => { setPartyBEmail(e.target.value); setError(null) }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sigMessage" className="text-sm text-muted-foreground">Message (optional)</Label>
                  <Textarea
                    id="sigMessage"
                    placeholder="Add a short note to both parties…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                Legally binding e-signatures powered by Dropbox Sign
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSend}
                  disabled={loading || !partyAEmail.trim() || !partyBEmail.trim()}
                  className="flex-1 gap-1.5"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send for Signature</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
