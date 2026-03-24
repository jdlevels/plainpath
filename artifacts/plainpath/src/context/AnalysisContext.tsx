import React, { createContext, useContext, useState, useCallback } from "react";
import type { DocumentAnalysis } from "@workspace/api-client-react";

interface AnalysisContextType {
  analysis: DocumentAnalysis | null;
  setAnalysis: (analysis: DocumentAnalysis | null) => void;
  updateActionStep: (id: string, completed: boolean) => void;
  updateRequiredDoc: (id: string, obtained: boolean) => void;
  clearAnalysis: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysisState] = useState<DocumentAnalysis | null>(null);

  const setAnalysis = useCallback((newAnalysis: DocumentAnalysis | null) => {
    setAnalysisState(newAnalysis);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisState(null);
  }, []);

  const updateActionStep = useCallback((id: string, completed: boolean) => {
    setAnalysisState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        actionSteps: prev.actionSteps.map((step) =>
          step.id === id ? { ...step, completed } : step
        ),
      };
    });
  }, []);

  const updateRequiredDoc = useCallback((id: string, obtained: boolean) => {
    setAnalysisState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        requiredDocuments: prev.requiredDocuments.map((doc) =>
          doc.id === id ? { ...doc, obtained } : doc
        ),
      };
    });
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        setAnalysis,
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
