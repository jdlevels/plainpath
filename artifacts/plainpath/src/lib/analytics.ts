import { getApiBaseUrl } from "@/lib/api"

export type AnalyticsEvent =
  | "analysis_started"
  | "analysis_completed"
  | "trust_check_started"
  | "trust_check_completed"
  | "contract_draft_started"
  | "contract_draft_completed"
  | "contract_review_started"
  | "contract_review_completed"
  | "redact_started"
  | "redact_completed"
  | "upgrade_modal_shown"
  | "upgrade_cta_clicked"
  | "subscribe_started"
  | "checkout_completed"
  | "portal_opened"
  | "demo_launched"
  | "share_link_created"
  | "analysis_saved"

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  try {
    const payload = JSON.stringify({ event, props: props ?? {}, ts: Date.now() })
    const url = `${getApiBaseUrl()}/api/events`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }))
    } else {
      fetch(url, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {})
    }
  } catch {
  }
}
