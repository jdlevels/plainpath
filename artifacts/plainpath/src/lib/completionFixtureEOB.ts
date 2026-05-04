// ── PlainPath Completion Engine — EOB / Medical Bill Fixture ──────────────────
// A fictional Explanation of Benefits (EOB) document for QA and testing.
// Does NOT contain real personal data, real insurer names, or real claim data.
// Do not use as a real analysis result.

import type { AnalysisInput } from "./completionTypes";

export const EOB_MEDICAL_BILL_FIXTURE: AnalysisInput = {
  id: "fixture-eob-medical-001",
  title: "Explanation of Benefits — Summit Health Insurance (Claim #EOB-2026-04-0012)",
  summary:
    "This Explanation of Benefits (EOB) summarizes how Summit Health Insurance processed a claim for services rendered on March 22, 2026. The claim was partially denied due to a missing prior authorization code. The patient has the right to appeal within 60 days of the date on this notice. The patient balance shown may differ from the provider's bill — the patient should request an itemized bill from the provider to verify the charges.",
  documentType: "Explanation of Benefits",
  overallConfidence: "high",
  processedAt: "2026-05-04T10:00:00.000Z",

  actionSteps: [
    {
      id: "as-001",
      title: "Request an itemized bill from the healthcare provider",
      description:
        "Contact the provider's billing office to request an itemized bill listing each service code, date of service, and charge. Compare it against the EOB to confirm all charges are accurate.",
      priority: "high",
      category: "Healthcare",
      completed: false,
      sourceEvidence:
        "This EOB is not a bill. Charges shown may not match your provider's bill. Contact your provider's billing office for an itemized statement.",
      confidence: "high",
    },
    {
      id: "as-002",
      title: "Obtain and submit the missing prior authorization documentation",
      description:
        "The claim was partially denied because a prior authorization code was not included. Contact your healthcare provider to obtain the authorization reference number and ask whether the claim can be resubmitted.",
      priority: "high",
      category: "Healthcare",
      completed: false,
      sourceEvidence:
        "Claim denied in part: Prior authorization was not obtained for procedure code 99213. Contact your provider to obtain the authorization reference number and resubmit.",
      confidence: "high",
    },
    {
      id: "as-003",
      title: "File an appeal if you believe the denial was incorrect",
      description:
        "If you believe the partial denial was a billing error or incorrect, you have the right to file a formal appeal within 60 days of the date on this notice.",
      priority: "high",
      category: "Healthcare",
      completed: false,
      sourceEvidence:
        "You have the right to appeal this determination. Appeals must be submitted in writing within 60 days of the date of this notice.",
      confidence: "high",
      deadline: "2026-06-22",
    },
  ],

  requiredDocuments: [
    {
      id: "rd-001",
      name: "Itemized bill from the healthcare provider",
      description:
        "An itemized bill from the provider showing each procedure code, service date, and charge amount for the March 22, 2026 visit.",
      required: true,
      obtained: false,
      sourceEvidence:
        "This EOB is not a bill. Contact your provider's billing office for an itemized statement to verify your charges.",
      confidence: "high",
    },
    {
      id: "rd-002",
      name: "Prior authorization reference number",
      description:
        "The prior authorization reference number for procedure code 99213, which is required for the claim to be reconsidered.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Contact your provider to obtain the authorization reference number. Resubmission with the correct authorization may result in the denied amount being covered.",
      confidence: "high",
    },
    {
      id: "rd-003",
      name: "Appeal form or written appeal letter",
      description:
        "A written appeal must be submitted to Summit Health Insurance within 60 days of the date of this notice if you wish to contest the partial denial.",
      required: false,
      obtained: false,
      sourceEvidence:
        "Appeals must be submitted in writing within 60 days of the date of this notice. Use the member appeals form available on the Summit Health Insurance member portal.",
      confidence: "high",
    },
  ],

  deadlines: [
    {
      id: "dl-001",
      title: "Appeal deadline — 60 days from notice date",
      date: "2026-06-22",
      description:
        "You must submit your appeal within 60 days of the date on this notice. Appeals received after this date may not be accepted.",
      isHard: true,
      sourceEvidence:
        "Appeals must be submitted in writing within 60 days of the date of this notice.",
      confidence: "high",
    },
    {
      id: "dl-002",
      title: "Patient balance payment due date",
      date: "2026-06-01",
      description:
        "The patient balance shown on this EOB is due to the provider by June 1, 2026. Verify with the provider's billing office before making payment.",
      isHard: false,
      sourceEvidence:
        "Your estimated patient responsibility is shown above. Contact your provider's billing office to confirm the amount due and the payment deadline.",
      confidence: "medium",
    },
  ],

  followUpQuestions: [
    {
      id: "fq-001",
      question: "Why was the prior authorization for procedure code 99213 not obtained before the appointment?",
      context:
        "Understanding whether the authorization was missed by the provider or the insurer will clarify who is responsible for the denied amount.",
      answered: false,
    },
    {
      id: "fq-002",
      question: "Can the provider resubmit the claim with the correct authorization code, and if so, how long will reprocessing take?",
      context:
        "Resubmission may resolve the partial denial without requiring a formal appeal.",
      answered: false,
    },
    {
      id: "fq-003",
      question: "Is the out-of-pocket amount on the EOB what I actually owe the provider, or should I wait for a separate bill?",
      context:
        "EOBs often show estimates that differ from the provider's actual bill. Paying before receiving the provider's statement may result in overpayment or underpayment.",
      answered: false,
    },
  ],

  risks: [
    {
      id: "rsk-001",
      title: "Partial claim denial may leave patient responsible for full procedure cost",
      description:
        "The denied portion of the claim may be billed directly to the patient if the appeal deadline passes without action. This amount could be significant if the procedure was high-cost.",
      severity: "high",
      sourceEvidence:
        "Denied amounts are not covered by Summit Health Insurance and may be billed to you by your provider. You have 60 days to appeal.",
    },
    {
      id: "rsk-002",
      title: "Paying the EOB balance before reviewing the itemized bill may result in incorrect payment",
      description:
        "EOBs are not bills and do not always reflect the final patient responsibility. Paying before receiving the provider's itemized bill may result in overpayment or missing a billing error.",
      severity: "medium",
      sourceEvidence:
        "This EOB is not a bill. Charges shown may not match your provider's bill. Do not pay based on this document alone.",
    },
    {
      id: "rsk-003",
      title: "Missing the 60-day appeal window eliminates the right to contest the denial",
      description:
        "If no appeal is filed within 60 days, you waive the right to contest the partial denial through Summit Health Insurance's internal process.",
      severity: "high",
      sourceEvidence:
        "Appeals received after 60 days from the date of this notice will not be accepted.",
    },
  ],

  actionPack: {
    questionsToAsk: [
      {
        id: "apq-001",
        question: "Does the provider's office have a patient advocate who can help navigate the appeal or resubmission process?",
        context:
          "Many healthcare providers have billing advocates who can assist patients in filing appeals or correcting claim errors at no additional cost.",
      },
    ],
    whatToGather: [],
    whatToSay: [],
    beforeYouActChecklist: [
      {
        id: "bya-001",
        text: "Do not pay the provider until you have received and reviewed the itemized bill.",
      },
      {
        id: "bya-002",
        text: "Mark your calendar for the appeal deadline (60 days from the date on this notice).",
      },
      {
        id: "bya-003",
        text: "Contact your provider's billing office to ask whether they can resubmit the claim with the correct prior authorization code.",
      },
    ],
  },

  sections: [],
  keyTerms: [],
};
