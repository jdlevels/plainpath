// ── PlainPath Completion Engine — Contract/Service Agreement Fixture ───────────
// A fictional residential renovation service agreement for QA and testing.
// Does NOT contain real personal data or real company information.
// Do not use as a real analysis result.

import type { AnalysisInput } from "./completionTypes";

export const CONTRACT_SERVICE_AGREEMENT_FIXTURE: AnalysisInput = {
  id: "fixture-contract-service-001",
  title: "Residential Renovation Service Agreement — Brightwork Contracting LLC",
  summary:
    "This is a service agreement between a homeowner (Client) and Brightwork Contracting LLC (Contractor) for a kitchen renovation project. The Client agrees to pay a 25% deposit upon signing, with the balance due within 5 business days of project completion. The agreement includes a limitation of liability clause, an early termination penalty, and requires both parties to sign before work begins.",
  documentType: "Service Agreement",
  overallConfidence: "high",
  processedAt: "2026-05-04T10:00:00.000Z",

  actionSteps: [
    {
      id: "as-001",
      title: "Pay 25% deposit before work begins",
      description:
        "A deposit equal to 25% of the total contract value is due upon signing this agreement. Work will not begin until the deposit is received.",
      priority: "high",
      category: "Finance",
      completed: false,
      sourceEvidence:
        "Client shall pay a deposit of 25% of the total project cost upon signing this agreement. No work shall commence prior to receipt of the deposit.",
      confidence: "high",
    },
    {
      id: "as-002",
      title: "Review and confirm the project scope of work",
      description:
        "Review Exhibit A (Scope of Work) carefully before signing. Any changes to the scope after signing are subject to a change order process and may increase the project cost.",
      priority: "high",
      category: "Legal",
      completed: false,
      sourceEvidence:
        "The scope of work is defined in Exhibit A, attached hereto and incorporated by reference. Any modifications to the scope of work after execution shall require a written change order signed by both parties.",
      confidence: "high",
    },
    {
      id: "as-003",
      title: "Confirm contractor's certificate of insurance is current",
      description:
        "Request and verify Brightwork Contracting's certificate of insurance before work begins. Coverage must include general liability and workers' compensation.",
      priority: "high",
      category: "Legal",
      completed: false,
      sourceEvidence:
        "Contractor represents and warrants that it maintains general liability insurance of no less than $1,000,000 per occurrence and workers' compensation coverage as required by law.",
      confidence: "high",
    },
    {
      id: "as-004",
      title: "Sign the service agreement before work begins",
      description:
        "Both the Client and the Contractor must sign the agreement before any work begins. An unsigned agreement has no legal effect.",
      priority: "high",
      category: "Signatures",
      completed: false,
      sourceEvidence:
        "This Agreement shall not be effective until signed by both the Client and an authorized representative of the Contractor.",
      confidence: "high",
    },
  ],

  requiredDocuments: [
    {
      id: "rd-001",
      name: "Certificate of Insurance",
      description:
        "A current certificate of insurance naming the Client as an additional insured and confirming the Contractor's general liability and workers' compensation coverage.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Contractor shall provide Client with a certificate of insurance evidencing the above coverage prior to commencement of work.",
      confidence: "high",
    },
    {
      id: "rd-002",
      name: "Exhibit A — Scope of Work",
      description:
        "The detailed scope of work document referenced in the agreement was not included in the uploaded file.",
      required: true,
      obtained: false,
      sourceEvidence:
        "See Exhibit A attached hereto for the complete scope of work, materials, and specifications for the renovation project.",
      confidence: "high",
    },
    {
      id: "rd-003",
      name: "Building permit",
      description:
        "The agreement states that applicable building permits are required and must be obtained before structural work begins.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Contractor shall obtain all required building permits prior to commencing structural or electrical work. Permit costs are included in the total project price.",
      confidence: "high",
    },
  ],

  deadlines: [
    {
      id: "dl-001",
      title: "Deposit payment due upon signing",
      date: "",
      description:
        "The 25% deposit is due upon signing this agreement. Work will not begin until the deposit is received.",
      isHard: true,
      sourceEvidence:
        "Client shall pay a deposit of 25% of the total project cost upon signing this agreement.",
      confidence: "high",
    },
    {
      id: "dl-002",
      title: "Final payment due within 5 business days of completion",
      date: "",
      description:
        "The remaining balance is due within 5 business days of project completion, as certified by the Contractor.",
      isHard: true,
      sourceEvidence:
        "Client shall pay the remaining balance within 5 business days of Contractor's written notice of project completion.",
      confidence: "high",
    },
    {
      id: "dl-003",
      title: "Change order approval window",
      date: "",
      description:
        "Any proposed change order must be approved in writing by both parties within 3 business days of submission or it is deemed rejected.",
      isHard: false,
      sourceEvidence:
        "Change orders not signed by both parties within 3 business days of submission shall be deemed rejected and work shall proceed under the original scope.",
      confidence: "medium",
    },
  ],

  followUpQuestions: [
    {
      id: "fq-001",
      question: "What is the dispute resolution process if the work does not meet the agreed specifications?",
      context:
        "The agreement includes a limitation of liability clause but does not clearly describe the dispute resolution or warranty claim process for defective work.",
      answered: false,
    },
    {
      id: "fq-002",
      question: "Is the project completion date guaranteed, and what are the consequences if the Contractor misses it?",
      context:
        "The agreement lists an estimated completion date but does not specify penalties for delays caused by the Contractor.",
      answered: false,
    },
  ],

  risks: [
    {
      id: "rsk-001",
      title: "Early termination penalty of 15% of remaining contract value",
      description:
        "If the Client terminates the agreement after work has begun, a penalty of 15% of the remaining contract value is owed to the Contractor in addition to costs already incurred.",
      severity: "high",
      sourceEvidence:
        "In the event Client terminates this Agreement after commencement of work, Client shall pay Contractor a termination fee equal to 15% of the remaining unpaid contract value, in addition to all costs and labor incurred to date.",
    },
    {
      id: "rsk-002",
      title: "Limitation of liability capped at total contract price",
      description:
        "The Contractor's total liability for any damages or claims is limited to the total amount paid under this agreement. This may limit your ability to recover costs exceeding the contract value.",
      severity: "high",
      sourceEvidence:
        "In no event shall Contractor's total liability exceed the total contract price paid by Client under this Agreement.",
    },
    {
      id: "rsk-003",
      title: "Client responsible for damage caused by pre-existing conditions",
      description:
        "If pre-existing structural issues are discovered during work, additional costs may be billed as a change order. The Client is responsible for accepting or rejecting these additional charges.",
      severity: "medium",
      sourceEvidence:
        "Client acknowledges that pre-existing structural deficiencies, mold, or hazardous materials discovered during work are not covered under this Agreement and shall be addressed via written change order.",
    },
  ],

  actionPack: {
    questionsToAsk: [
      {
        id: "apq-001",
        question: "Does the Contractor carry a bond in addition to general liability insurance?",
        context:
          "Bonding provides additional protection if the Contractor fails to complete the work or causes property damage.",
      },
    ],
    whatToGather: [],
    whatToSay: [],
    beforeYouActChecklist: [
      {
        id: "bya-001",
        text: "Confirm both Client and Contractor have signed the agreement before any work begins.",
      },
      {
        id: "bya-002",
        text: "Request the Certificate of Insurance and verify it is current before the start date.",
      },
    ],
  },

  sections: [],
  keyTerms: [],
};
