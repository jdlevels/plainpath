import { getApiBaseUrl } from "@/lib/api"

export async function startStripeCheckout(
  plan: "starter" | "pro",
  email?: string,
  clerkUserId?: string,
) {
  const apiBase = getApiBaseUrl()
  const response = await fetch(`${apiBase}/api/stripe/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan, email, clerkUserId }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || "Unable to start checkout")
  }

  if (!data?.url) {
    throw new Error("Missing checkout URL")
  }

  window.location.href = data.url
}
