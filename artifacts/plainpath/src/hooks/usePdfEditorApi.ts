// ─── PDF Editor API Hook — injects Clerk token automatically ──────────────────

import { useAuth } from "@clerk/react"
import { useCallback } from "react"
import { pdfEditorApi, pdfUtilitiesApi } from "@/lib/pdfEditorApi"
import type { EditOp, OcrData } from "@/lib/pdfEditorTypes"

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

    runOcr: useCallback(
      async (id: string, pages: Array<{ pageIndex: number; imageDataUrl: string }>) =>
        pdfEditorApi.runOcr(id, pages, await token()),
      [token],
    ),

    saveOcrEdits: useCallback(
      async (id: string, ocrData: OcrData) =>
        pdfEditorApi.saveOcrEdits(id, ocrData, await token()),
      [token],
    ),

    renameSession: useCallback(
      async (id: string, fileName: string) =>
        pdfEditorApi.renameSession(id, fileName, await token()),
      [token],
    ),

    deleteSession: useCallback(
      async (id: string) => pdfEditorApi.deleteSession(id, await token()),
      [token],
    ),
  }
}

export function usePdfUtilitiesApi() {
  const { getToken } = useAuth()
  const token = useCallback(() => getToken(), [getToken])

  return {
    merge: useCallback(
      async (files: File[]) => pdfUtilitiesApi.merge(files, await token()),
      [token],
    ),

    extractPages: useCallback(
      async (file: File, pageRange: string) =>
        pdfUtilitiesApi.extractPages(file, pageRange, await token()),
      [token],
    ),

    pageOps: useCallback(
      async (
        file: File,
        ops: Array<
          | { type: "delete"; pageIndexes: number[] }
          | { type: "rotate"; pageIndexes: number[]; degrees: 90 | 180 | 270 }
          | { type: "reorder"; order: number[] }
        >,
      ) => pdfUtilitiesApi.pageOps(file, ops, await token()),
      [token],
    ),

    compress: useCallback(
      async (file: File) => pdfUtilitiesApi.compress(file, await token()),
      [token],
    ),

    getPageCount: useCallback(
      async (file: File) => pdfUtilitiesApi.getPageCount(file, await token()),
      [token],
    ),
  }
}
