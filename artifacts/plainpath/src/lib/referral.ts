export function getReferralCode(): string {
  try {
    let code = localStorage.getItem("plainpath-ref-code")
    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase()
      localStorage.setItem("plainpath-ref-code", code)
    }
    return code
  } catch {
    return "SHARE"
  }
}

export function getReferralLink(): string {
  return `https://plain-path.replit.app/?ref=${getReferralCode()}`
}

export function captureInboundRef() {
  try {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref && !localStorage.getItem("plainpath-referred-by")) {
      localStorage.setItem("plainpath-referred-by", ref.toUpperCase())
    }
  } catch {}
}
