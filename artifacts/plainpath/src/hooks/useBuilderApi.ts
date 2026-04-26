import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import { builderApi } from "@/lib/builderApi";
import type { BuilderContent } from "@/lib/builderTypes";

/**
 * Returns builder API methods that automatically attach the current Clerk
 * session token via the `Authorization: Bearer <token>` header.
 *
 * This resolves the dev-environment issue where `clerkMiddleware()` on the
 * Express server cannot verify the session cookie forwarded through the
 * Replit proxy.  The short-lived JWT returned by `getToken()` is always
 * verifiable with the CLERK_SECRET_KEY regardless of proxy behaviour.
 */
export function useBuilderApi() {
  const { getToken } = useAuth();

  const token = useCallback(() => getToken(), [getToken]);

  return {
    listDocuments: useCallback(async () => {
      return builderApi.listDocuments(await token());
    }, [token]),

    createDocument: useCallback(
      async (data: {
        title: string;
        category: string;
        source: "blank" | "template";
        templateId?: string | null;
        content: BuilderContent;
      }) => {
        return builderApi.createDocument(data, await token());
      },
      [token],
    ),

    getDocument: useCallback(
      async (id: string) => {
        return builderApi.getDocument(id, await token());
      },
      [token],
    ),

    updateDocument: useCallback(
      async (
        id: string,
        data: {
          title?: string;
          status?: string;
          content?: BuilderContent;
          server_version: number;
        },
      ) => {
        return builderApi.updateDocument(id, data, await token());
      },
      [token],
    ),

    archiveDocument: useCallback(
      async (id: string) => {
        return builderApi.archiveDocument(id, await token());
      },
      [token],
    ),

    listTemplates: useCallback(
      async (category?: string) => {
        return builderApi.listTemplates(category, await token());
      },
      [token],
    ),

    getTemplate: useCallback(
      async (id: string) => {
        return builderApi.getTemplate(id, await token());
      },
      [token],
    ),

    aiBlockAction: useCallback(
      async (data: {
        action: string;
        blockType: string;
        blockContent: string;
        documentTitle?: string;
        category?: string;
        sectionTitle?: string;
      }) => {
        return builderApi.aiBlockAction(data, await token());
      },
      [token],
    ),
  };
}
