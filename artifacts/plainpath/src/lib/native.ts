/**
 * Native platform services for PlainPath (Capacitor).
 *
 * All functions in this module are safe to call in both web and native
 * environments. On web they are no-ops or graceful fallbacks so the same
 * code path works without conditional guards at every call site.
 */

import { isNative, getPlatform } from "./platform"

// ─── Haptics ────────────────────────────────────────────────────────────────

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error"

/**
 * Trigger haptic feedback. No-op on web or if the plugin is unavailable.
 */
export async function haptic(style: HapticStyle = "light"): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics")
    if (style === "success" || style === "warning" || style === "error") {
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      }
      await Haptics.notification({ type: typeMap[style] })
    } else {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      await Haptics.impact({ style: styleMap[style] })
    }
  } catch {
    // silently ignore — haptics are optional
  }
}

// ─── Status Bar ─────────────────────────────────────────────────────────────

/**
 * Initialize the native status bar to overlay the web view and use dark
 * text icons (matching the app's light-background design).
 *
 * Should be called once at app startup on native platforms.
 */
export async function initStatusBar(): Promise<void> {
  if (!isNative()) return
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar")
    const platform = getPlatform()
    if (platform === "android") {
      await StatusBar.setOverlaysWebView({ overlay: true })
    }
    await StatusBar.setStyle({ style: Style.Light })
  } catch {
    // silently ignore
  }
}

// ─── Native File Picker ──────────────────────────────────────────────────────

export interface PickedFile {
  file: File
  name: string
  mimeType: string
  size: number
}

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

/**
 * Open the native file picker (iOS/Android).
 *
 * Returns the picked file as a standard browser `File` object so it can be
 * passed to the same upload flow as a drag-drop or `<input type="file">`.
 *
 * Returns `null` if the user cancelled, or throws if an unexpected error
 * occurs.
 */
export async function pickFileNative(): Promise<PickedFile | null> {
  const { FilePicker } = await import("@capawesome/capacitor-file-picker")

  let result: Awaited<ReturnType<typeof FilePicker.pickFiles>>
  try {
    result = await FilePicker.pickFiles({
      types: ACCEPTED_MIME_TYPES,
      multiple: false,
      readData: true,
    })
  } catch (err: unknown) {
    // User cancelled — the plugin throws a specific cancel error
    if (err instanceof Error && err.message?.toLowerCase().includes("cancel")) {
      return null
    }
    throw err
  }

  if (!result.files || result.files.length === 0) return null

  const picked = result.files[0]

  if (!picked.data) {
    throw new Error("File picker did not return file data. Please try again.")
  }

  // Convert base64 → Uint8Array → Blob → File
  const binary = atob(picked.data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const mimeType = picked.mimeType || "application/octet-stream"
  const blob = new Blob([bytes], { type: mimeType })
  const file = new File([blob], picked.name, { type: mimeType })

  return {
    file,
    name: picked.name,
    mimeType,
    size: picked.size ?? file.size,
  }
}
