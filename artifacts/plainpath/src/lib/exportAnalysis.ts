import type { DocumentAnalysis } from "@workspace/api-client-react";

function divider(n = 50): string {
  return "─".repeat(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function buildExportText(analysis: DocumentAnalysis): string {
  const lines: string[] = [];

  // ── Header ──────────────────────────────────────
  lines.push("PLAINPATH ANALYSIS REPORT");
  lines.push(divider());
  lines.push(`Title:   ${analysis.title}`);
  lines.push(`Type:    ${analysis.documentType}`);
  lines.push(`Date:    ${formatDate(analysis.processedAt)}`);
  lines.push("");

  // ── Plain English ────────────────────────────────
  const pe = analysis.plainEnglish;
  if (pe) {
    lines.push(divider());
    lines.push("PLAIN ENGLISH SUMMARY");
    lines.push(divider());
    if (pe.whatItIs) {
      lines.push("What this is:");
      lines.push(pe.whatItIs);
      lines.push("");
    }
    if (pe.whatItSays) {
      lines.push("What it says:");
      lines.push(pe.whatItSays);
      lines.push("");
    }
    if (pe.whatItAsks) {
      lines.push("What it asks from you:");
      lines.push(pe.whatItAsks);
      lines.push("");
    }
    if (pe.obligations) {
      lines.push("What you may be agreeing to:");
      lines.push(pe.obligations);
      lines.push("");
    }
    if (pe.payAttentionTo) {
      lines.push("What to pay attention to:");
      lines.push(pe.payAttentionTo);
      lines.push("");
    }
  }

  // ── Action Steps ─────────────────────────────────
  if (analysis.actionSteps.length > 0) {
    lines.push(divider());
    lines.push(`ACTION STEPS (${analysis.actionSteps.length})`);
    lines.push(divider());
    analysis.actionSteps.forEach((step, i) => {
      const status = step.completed ? "[✓]" : "[ ]";
      lines.push(
        `${status} ${i + 1}. ${step.title}  [${step.priority.toUpperCase()} PRIORITY]`
      );
      if (step.description) lines.push(`     ${step.description}`);
      if (step.deadline) lines.push(`     Deadline: ${step.deadline}`);
    });
    lines.push("");
  }

  // ── Required Documents ───────────────────────────
  if (analysis.requiredDocuments.length > 0) {
    lines.push(divider());
    lines.push(`REQUIRED DOCUMENTS (${analysis.requiredDocuments.length})`);
    lines.push(divider());
    analysis.requiredDocuments.forEach((doc) => {
      const status = doc.obtained ? "[✓]" : "[ ]";
      const req = doc.required ? " [REQUIRED]" : "";
      lines.push(`${status} ${doc.name}${req}`);
      if (doc.description) lines.push(`     ${doc.description}`);
    });
    lines.push("");
  }

  // ── Deadlines ────────────────────────────────────
  if (analysis.deadlines.length > 0) {
    lines.push(divider());
    lines.push(`DEADLINES (${analysis.deadlines.length})`);
    lines.push(divider());
    analysis.deadlines.forEach((d) => {
      const urgency = d.isHard ? "[HARD DEADLINE]" : "[FLEXIBLE]";
      const dateStr = d.date ?? d.description ?? "";
      lines.push(`• ${d.title}: ${dateStr}  ${urgency}`);
      if (d.consequence) lines.push(`  Consequence: ${d.consequence}`);
    });
    lines.push("");
  }

  // ── Risks ────────────────────────────────────────
  if (analysis.risks.length > 0) {
    lines.push(divider());
    lines.push(`RISKS & NOTES (${analysis.risks.length})`);
    lines.push(divider());
    analysis.risks.forEach((r) => {
      lines.push(`• ${r.title}  [${r.severity.toUpperCase()}]`);
      if (r.description) lines.push(`  ${r.description}`);
    });
    lines.push("");
  }

  // ── Key Terms ────────────────────────────────────
  if (analysis.keyTerms && analysis.keyTerms.length > 0) {
    lines.push(divider());
    lines.push(`KEY TERMS (${analysis.keyTerms.length})`);
    lines.push(divider());
    analysis.keyTerms.forEach((kt) => {
      lines.push(`• ${kt.term}  [${kt.severity.toUpperCase()}]`);
      if (kt.explanation) lines.push(`  ${kt.explanation}`);
      if (kt.watchOut) lines.push(`  Look out for: ${kt.watchOut}`);
    });
    lines.push("");
  }

  // ── Action Pack ──────────────────────────────────
  const pack = analysis.actionPack;
  if (pack) {
    lines.push(divider());
    lines.push("ACTION PACK");
    lines.push(divider());

    if (pack.questionsToAsk?.length) {
      lines.push("Questions to ask:");
      pack.questionsToAsk.forEach((q, i) => {
        lines.push(`  ${i + 1}. "${q.question}"`);
        if (q.context) lines.push(`     → ${q.context}`);
      });
      lines.push("");
    }

    if (pack.whatToGather?.length) {
      lines.push("What to gather:");
      pack.whatToGather.forEach((g) => {
        lines.push(`  • ${g.item}`);
        if (g.description) lines.push(`    ${g.description}`);
      });
      lines.push("");
    }

    if (pack.whatToSay?.length) {
      lines.push("Draft messages:");
      pack.whatToSay.forEach((s) => {
        lines.push(`  ${s.label}:`);
        s.draft.split("\n").forEach((l) => lines.push(`    ${l}`));
        lines.push("");
      });
    }

    if (pack.beforeYouActChecklist?.length) {
      lines.push("Before you act:");
      pack.beforeYouActChecklist.forEach((c, i) => {
        lines.push(`  [ ] ${i + 1}. ${c.text}`);
      });
      lines.push("");
    }
  }

  // ── Footer ───────────────────────────────────────
  lines.push(divider());
  lines.push("Generated by PlainPath");
  lines.push("Not legal, financial, or professional advice.");
  lines.push(
    "This analysis is based solely on the document content you provided."
  );

  return lines.join("\n");
}

export function buildFileName(analysis: DocumentAnalysis): string {
  const slug = analysis.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);
  return `plainpath-${slug}.txt`;
}

export function downloadTextFile(analysis: DocumentAnalysis): void {
  const text = buildExportText(analysis);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFileName(analysis);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function canNativeShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof (navigator as any).share === "function"
  );
}

export async function nativeShare(analysis: DocumentAnalysis): Promise<void> {
  const text = buildExportText(analysis);
  await (navigator as any).share({
    title: `PlainPath: ${analysis.title}`,
    text,
  });
}
