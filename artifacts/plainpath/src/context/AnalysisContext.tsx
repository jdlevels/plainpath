import React, { createContext, useContext, useState, useCallback } from "react";
import type { DocumentAnalysis } from "@workspace/api-client-react";
import type { TrustCheckAnalysis } from "@/lib/trustCheckTypes";

// sessionStorage keys — persist analysis across Clerk re-initialization cycles
// so a PlanGate spinner during Clerk auth-state changes never loses in-flight results.
const SS_ANALYSIS_KEY = "pp_analysis";
const SS_HINT_KEY = "pp_doc_type_hint";

function ssGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function ssSet(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // sessionStorage unavailable (private mode, quota, etc.) — silently ignore
  }
}

interface AnalysisContextType {
  analysis: DocumentAnalysis | null;
  documentTypeHint: string | null;
  trustCheckAnalysis: TrustCheckAnalysis | null;
  setAnalysis: (analysis: DocumentAnalysis | null) => void;
  setDocumentTypeHint: (hint: string | null) => void;
  setTrustCheckAnalysis: (analysis: TrustCheckAnalysis | null) => void;
  updateActionStep: (id: string, completed: boolean) => void;
  updateRequiredDoc: (id: string, obtained: boolean) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from sessionStorage on mount so the analysis survives PlanGate
  // spinner cycles caused by Clerk auth-state re-initialization.
  const [analysis, setAnalysisState] = useState<DocumentAnalysis | null>(
    () => ssGet<DocumentAnalysis>(SS_ANALYSIS_KEY)
  );
  const [documentTypeHint, setDocumentTypeHintState] = useState<string | null>(
    () => ssGet<string>(SS_HINT_KEY)
  );
  const [trustCheckAnalysis, setTrustCheckAnalysisState] = useState<TrustCheckAnalysis | null>(null);

  const setAnalysis = useCallback((newAnalysis: DocumentAnalysis | null) => {
    ssSet(SS_ANALYSIS_KEY, newAnalysis);
    setAnalysisState(newAnalysis);
  }, []);

  const setDocumentTypeHint = useCallback((hint: string | null) => {
    ssSet(SS_HINT_KEY, hint);
    setDocumentTypeHintState(hint);
  }, []);

  const setTrustCheckAnalysis = useCallback((newAnalysis: TrustCheckAnalysis | null) => {
    setTrustCheckAnalysisState(newAnalysis);
  }, []);

  const clearAnalysis = useCallback(() => {
    ssSet(SS_ANALYSIS_KEY, null);
    ssSet(SS_HINT_KEY, null);
    setAnalysisState(null);
    setDocumentTypeHintState(null);
    setTrustCheckAnalysisState(null);
  }, []);

  const updateActionStep = useCallback((id: string, completed: boolean) => {
    setAnalysisState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        actionSteps: prev.actionSteps.map((step) =>
          step.id === id ? { ...step, completed } : step
        ),
      };
      ssSet(SS_ANALYSIS_KEY, next);
      return next;
    });
  }, []);

  const updateRequiredDoc = useCallback((id: string, obtained: boolean) => {
    setAnalysisState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        requiredDocuments: prev.requiredDocuments.map((doc) =>
          doc.id === id ? { ...doc, obtained } : doc
        ),
      };
      ssSet(SS_ANALYSIS_KEY, next);
      return next;
    });
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        documentTypeHint,
        trustCheckAnalysis,
        setAnalysis,
        setDocumentTypeHint,
        setTrustCheckAnalysis,
        updateActionStep,
        updateRequiredDoc,
        clearAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error("useAnalysisContext must be used within an AnalysisProvider");
  }
  return context;
}
