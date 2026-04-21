// ─── Compare Versions API Hook — injects Clerk token automatically ─────────────

import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import { compareVersionsApi } from "@/lib/compareVersionsApi";
import type { CVManagerNotes, CVDiffResult } from "@/lib/compareVersionsTypes";

export function useCompareVersionsApi() {
  const { getToken } = useAuth();
  const token = useCallback(() => getToken(), [getToken]);

  return {
    createSession: useCallback(
      async (
        originalFile: File,
        revisedFile: File,
        title: string,
        managerNotes?: CVManagerNotes,
      ) =>
        compareVersionsApi.createSession(
          originalFile,
          revisedFile,
          title,
          managerNotes,
          await token(),
        ),
      [token],
    ),

    listSessions: useCallback(
      async (opts?: { archived?: boolean }) =>
        compareVersionsApi.listSessions(await token(), opts),
      [token],
    ),

    getSession: useCallback(
      async (id: string) => compareVersionsApi.getSession(id, await token()),
      [token],
    ),

    getOriginalPdf: useCallback(
      async (id: string) => compareVersionsApi.getOriginalPdf(id, await token()),
      [token],
    ),

    getRevisedPdf: useCallback(
      async (id: string) => compareVersionsApi.getRevisedPdf(id, await token()),
      [token],
    ),

    updateNotes: useCallback(
      async (id: string, managerNotes: CVManagerNotes) =>
        compareVersionsApi.updateNotes(id, managerNotes, await token()),
      [token],
    ),

    rescanSession: useCallback(
      async (id: string) => compareVersionsApi.rescanSession(id, await token()),
      [token],
    ),

    patchReview: useCallback(
      async (id: string, diffResult: CVDiffResult) =>
        compareVersionsApi.patchReview(id, diffResult, await token()),
      [token],
    ),

    enrichSession: useCallback(
      async (id: string, forceAll = false) =>
        compareVersionsApi.enrichSession(id, forceAll, await token()),
      [token],
    ),

    // ── Slice 6 ─────────────────────────────────────────────────────────────

    renameSession: useCallback(
      async (id: string, title: string) =>
        compareVersionsApi.renameSession(id, title, await token()),
      [token],
    ),

    archiveSession: useCallback(
      async (id: string, archived: boolean) =>
        compareVersionsApi.archiveSession(id, archived, await token()),
      [token],
    ),

    deleteSession: useCallback(
      async (id: string) => compareVersionsApi.deleteSession(id, await token()),
      [token],
    ),

    createHandoff: useCallback(
      async (id: string, diffIds?: string[]) =>
        compareVersionsApi.createHandoff(id, diffIds, await token()),
      [token],
    ),

    exportReportUrl: compareVersionsApi.exportReportUrl,
  };
}
