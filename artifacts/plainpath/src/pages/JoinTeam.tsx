import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { motion } from "framer-motion";
import { Users, Check, AlertCircle, Loader2 } from "lucide-react";
import { fetchInviteDetails, acceptInvite, type InviteDetails } from "@/lib/teamApi";

export default function JoinTeam() {
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoaded } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
    if (t) {
      fetchInviteDetails(t)
        .then(setInvite)
        .catch((e) => {
          if (e.code === "invite_expired") setFetchError("This invite link has expired. Ask your team admin to send a new one.");
          else if (e.code === "invite_used") setFetchError("This invite has already been used.");
          else if (e.code === "invite_not_found") setFetchError("Invite not found. This link may be invalid.");
          else setFetchError("Unable to load invite. Please try again.");
        });
    }
  }, []);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      await acceptInvite(token);
      setJoined(true);
      setTimeout(() => setLocation("/team"), 2000);
    } catch (e: any) {
      const msg =
        e.code === "invite_expired" ? "This invite has expired." :
        e.code === "invite_used" ? "This invite has already been used." :
        e.code === "already_member" ? "You are already a member of this team." :
        e.message ?? "Failed to join team.";
      setAcceptError(msg);
    } finally {
      setAccepting(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Invalid invite link</h2>
        <p className="text-sm text-muted-foreground mt-2">This link is missing a token. Please use the link your team admin sent you.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
            <Users className="h-7 w-7 text-primary" />
          </div>

          {/* Loading invite */}
          {!invite && !fetchError && (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading invite…</p>
            </>
          )}

          {/* Error loading invite */}
          {fetchError && (
            <>
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Invite unavailable</h2>
              <p className="text-sm text-muted-foreground">{fetchError}</p>
            </>
          )}

          {/* Joined success */}
          {joined && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold mb-2">You've joined the team!</h2>
              <p className="text-sm text-muted-foreground">Redirecting to your team dashboard…</p>
            </>
          )}

          {/* Invite ready */}
          {invite && !joined && (
            <>
              <h2 className="text-xl font-bold mb-2">You're invited to join</h2>
              <p className="text-2xl font-semibold text-primary mb-1">{invite.teamName}</p>
              <p className="text-sm text-muted-foreground mb-6">
                This invite was sent to <span className="font-medium">{invite.invitedEmail}</span>
              </p>

              {!isLoaded && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
              )}

              {isLoaded && !isSignedIn && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Sign in to accept this invite.</p>
                  <button
                    onClick={() => setLocation(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)}
                    className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                  >
                    Sign in to accept
                  </button>
                </div>
              )}

              {isLoaded && isSignedIn && (
                <div>
                  {acceptError && (
                    <p className="text-sm text-destructive mb-3 flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> {acceptError}
                    </p>
                  )}
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Accept & join team
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
