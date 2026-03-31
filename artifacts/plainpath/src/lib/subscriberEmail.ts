const STORAGE_KEY = "plainpath_subscriber_email";

export function getStoredSubscriberEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredSubscriberEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
}

export function clearStoredSubscriberEmail() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
