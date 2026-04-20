// ─── PDF Editor API Hook — injects Clerk token automatically ──────────────────

import { useAuth } from "@clerk/react"
import { useCallback } from "react"
import { pdfEditorApi } from "@/lib/pdfEditorApi"
import type { EditOp } from "@/lib/pdfEditorTypes"

export function usePdfEditorApi() {
  const { getToken } = useAuth()
  const token = useCallback(() => getToken(), [getToken])

  return {
    createSession: useCallback(
      async (file: File, fileName: string) =>
        pdfEditorApi.createSession(file, fileName, await token()),
      [token],
    ),

    listSessions: useCallback(
      async () => pdfEditorApi.listSessions(await token()),
      [token],
    ),

    getSession: useCallback(
      async (id: string) => pdfEditorApi.getSession(id, await token()),
      [token],
    ),

    getPdf: useCallback(
      async (id: string) => pdfEditorApi.getPdf(id, await token()),
      [token],
    ),

    saveOps: useCallback(
      async (id: string, ops: EditOp[]) =>
        pdfEditorApi.saveOps(id, ops, await token()),
      [token],
    ),

    setPageCount: useCallback(
      async (id: string, pageCount: number) =>
        pdfEditorApi.setPageCount(id, pageCount, await token()),
      [token],
    ),

    exportSession: useCallback(
      async (id: string) => pdfEditorApi.exportSession(id, await token()),
      [token],
    ),
  }
}
