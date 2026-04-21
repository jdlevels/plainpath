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
      async () => compareVersionsApi.listSessions(await token()),
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

    /** Slice 5: Trigger or retry AI enrichment */
    enrichSession: useCallback(
      async (id: string, forceAll = false) =>
        compareVersionsApi.enrichSession(id, forceAll, await token()),
      [token],
    ),
  };
}
