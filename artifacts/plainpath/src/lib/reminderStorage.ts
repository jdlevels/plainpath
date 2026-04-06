const STORAGE_KEY = "plainpath_reminders"

export interface Reminder {
  id: string
  title: string
  date: string
  docTitle: string
  notified: boolean
  createdAt: number
}

export function getReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Reminder[]) : []
  } catch {
    return []
  }
}

export function addReminder(r: Omit<Reminder, "id" | "notified" | "createdAt">): Reminder {
  const reminders = getReminders()
  const newR: Reminder = { ...r, id: crypto.randomUUID(), notified: false, createdAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...reminders, newR]))
  return newR
}

export function markNotified(id: string) {
  const reminders = getReminders()
  const updated = reminders.map(r => r.id === id ? { ...r, notified: true } : r)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function removeReminder(id: string) {
  const reminders = getReminders()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders.filter(r => r.id !== id)))
}

export function getDueReminders(): Reminder[] {
  const now = Date.now()
  return getReminders().filter(r => {
    if (r.notified) return false
    const deadlineDate = new Date(r.date).getTime()
    if (isNaN(deadlineDate)) return false
    const daysUntil = (deadlineDate - now) / (1000 * 60 * 60 * 24)
    return daysUntil <= 7 && daysUntil >= -1
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  const result = await Notification.requestPermission()
  return result === "granted"
}

export function showBrowserNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" })
  }
}
