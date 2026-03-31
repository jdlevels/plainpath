export async function startStripeCheckout(plan: "starter" | "pro" | "team") {
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ plan })
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
