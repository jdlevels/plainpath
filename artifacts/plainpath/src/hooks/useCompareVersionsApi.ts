// ─── Compare Versions API Hook — injects Clerk token automatically ─────────────

import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import { compareVersionsApi } from "@/lib/compareVersionsApi";
import type { CVManagerNotes } from "@/lib/compareVersionsTypes";

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
  };
}
