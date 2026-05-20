/**
 * waitForToken — getToken with WKWebView race retry
 *
 * On the first launch after sign-in, Clerk's session token isn't immediately
 * cached in the WKWebView. getToken() returns null for 1-3 s before the
 * session store is ready. All API calls made in this window receive a 401.
 *
 * This helper retries up to three times (immediate → +2 s → +3 s, max 5 s
 * total) using the same backoff applied in useEntitlements.ts. Import and
 * use this instead of a bare getToken() call at page-load time.
 *
 * Usage:
 *   import { waitForToken } from "@/lib/auth"
 *   const { getToken } = useAuth()
 *   const token = await waitForToken(getToken)
 */
export async function waitForToken(
  getToken: (opts?: Record<string, unknown>) => Promise<string | null>,
): Promise<string | null> {
  let token = await getToken().catch(() => null)
  if (token) return token
  await new Promise<void>(r => setTimeout(r, 2000))
  token = await getToken().catch(() => null)
  if (token) return token
  await new Promise<void>(r => setTimeout(r, 3000))
  return getToken().catch(() => null)
}
