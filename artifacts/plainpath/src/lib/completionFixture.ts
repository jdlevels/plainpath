// ── PlainPath Completion Engine — Fictional Test Fixture ──────────────────────
// A fictional school enrollment packet analysis for QA and testing.
// Does NOT contain real personal data.
// Do not use as a real analysis result.

import type { AnalysisInput } from "./completionTypes";

export const SCHOOL_ENROLLMENT_FIXTURE: AnalysisInput = {
  id: "fixture-school-enrollment-001",
  title: "Maplewood Elementary School — 2026 Enrollment Packet",
  summary:
    "This document outlines the enrollment requirements for the 2026–2027 academic year at Maplewood Elementary School. Parents or legal guardians must submit the completed enrollment form along with supporting documents by June 15, 2026. Required documents include proof of age, proof of residency, and a current immunization record.",
  documentType: "School Enrollment Packet",
  overallConfidence: "high",
  processedAt: "2026-05-04T10:00:00.000Z",

  actionSteps: [
    {
      id: "as-001",
      title: "Complete and return the enrollment application form",
      description:
        "Fill out every section of the official enrollment form, including the student's legal name, date of birth, address, emergency contacts, and parent/guardian signatures.",
      priority: "high",
      category: "Forms",
      completed: false,
      sourceEvidence:
        "The enrollment application form must be completed in full and returned to the school office no later than June 15, 2026.",
      confidence: "high",
    },
    {
      id: "as-002",
      title: "Obtain current immunization records",
      description:
        "Contact your child's pediatrician or the state immunization registry to obtain an up-to-date immunization record.",
      priority: "high",
      category: "Medical",
      completed: false,
      sourceEvidence:
        "A current immunization record issued by a licensed healthcare provider is required prior to the first day of school.",
      confidence: "high",
    },
    {
      id: "as-003",
      title: "Sign the enrollment application",
      description:
        "The parent or legal guardian must sign the enrollment application before submission. Unsigned applications will not be processed.",
      priority: "high",
      category: "Signatures",
      completed: false,
      sourceEvidence:
        "Parent or legal guardian signature is required on the enrollment application. Unsigned applications will be returned unprocessed.",
      confidence: "high",
    },
    {
      id: "as-004",
      title: "Review the technology use agreement",
      description:
        "Read and acknowledge the district technology and device use policy for students.",
      priority: "low",
      category: "Policy",
      completed: false,
      sourceEvidence:
        "All enrolled students must have a signed technology use agreement on file before devices are issued.",
      confidence: "medium",
    },
  ],

  requiredDocuments: [
    {
      id: "rd-001",
      name: "Child's birth certificate",
      description:
        "An official birth certificate or equivalent legal document proving the child's age and identity.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Proof of age is required for all new enrollments. Acceptable documents include an official birth certificate, passport, or court-issued identity document.",
      confidence: "high",
    },
    {
      id: "rd-002",
      name: "Proof of residency",
      description:
        "A current utility bill, lease agreement, mortgage statement, or official government mail showing the parent/guardian's address within the school district.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Parent/guardian must provide proof of current residency within district boundaries before the enrollment application is accepted.",
      confidence: "high",
    },
    {
      id: "rd-003",
      name: "Immunization record",
      description:
        "A current immunization record issued by a licensed healthcare provider showing all state-required vaccinations.",
      required: true,
      obtained: false,
      sourceEvidence:
        "A current immunization record issued by a licensed healthcare provider is required prior to the first day of school.",
      confidence: "high",
    },
    {
      id: "rd-004",
      name: "Exhibit B — District Boundary Map",
      description:
        "The district boundary map referenced in the enrollment packet. This document was referenced but not included in the uploaded packet.",
      required: true,
      obtained: false,
      sourceEvidence:
        "See Exhibit B for the current district boundary map. Applications from outside district boundaries will not be accepted.",
      confidence: "medium",
    },
    {
      id: "rd-005",
      name: "Emergency contact form",
      description:
        "The official emergency contact form provided by the school must be completed and returned.",
      required: true,
      obtained: false,
      sourceEvidence:
        "Emergency contact information must be on file before the first day of school.",
      confidence: "high",
    },
  ],

  deadlines: [
    {
      id: "dl-001",
      title: "Enrollment packet submission deadline",
      date: "2026-06-15",
      description: "All enrollment materials must be submitted to the school office by June 15, 2026.",
      isHard: true,
      sourceEvidence:
        "The enrollment application form must be completed in full and returned to the school office no later than June 15, 2026.",
      confidence: "high",
    },
    {
      id: "dl-002",
      title: "Immunization record deadline",
      date: "2026-08-15",
      description:
        "Immunization records must be on file before the first day of school, August 18, 2026.",
      isHard: true,
      sourceEvidence:
        "A current immunization record is required prior to the first day of school.",
      confidence: "high",
    },
    {
      id: "dl-003",
      title: "Open enrollment window closes",
      date: "2026-06-01",
      description:
        "Open enrollment requests for out-of-district students must be submitted by June 1, 2026.",
      isHard: false,
      sourceEvidence:
        "Open enrollment applications must be submitted prior to June 1, 2026 for consideration.",
      confidence: "medium",
    },
  ],

  followUpQuestions: [
    {
      id: "fq-001",
      question: "Does the school provide an IEP or 504 accommodation process for students with disabilities?",
      context:
        "The enrollment packet does not mention special education services. It is worth confirming whether the school can accommodate students with an existing IEP or 504 plan.",
      answered: false,
    },
    {
      id: "fq-002",
      question: "Are meal assistance programs available, and how does a family apply?",
      context:
        "No mention of reduced-price or free lunch programs was found in the enrollment packet.",
      answered: false,
    },
  ],

  risks: [
    {
      id: "rsk-001",
      title: "Late submission may result in loss of enrollment slot",
      description:
        "If enrollment materials are not submitted by June 15, 2026, the student's place may be given to another applicant.",
      severity: "high",
      sourceEvidence:
        "Enrollment slots are limited. The school district cannot guarantee placement for applications received after the deadline.",
    },
    {
      id: "rsk-002",
      title: "Enrollment rejected without proof of residency",
      description:
        "Applications without acceptable proof of residency will be rejected. The student will not be enrolled until valid proof is provided.",
      severity: "high",
      sourceEvidence:
        "Applications submitted without proof of residency will not be processed.",
    },
    {
      id: "rsk-003",
      title: "Device access withheld without signed technology agreement",
      description:
        "Students without a signed technology use agreement on file will not be issued a school device.",
      severity: "low",
      sourceEvidence:
        "All enrolled students must have a signed technology use agreement on file before devices are issued.",
    },
  ],

  plainEnglish: {
    whatItIs:
      "This is the official enrollment packet for Maplewood Elementary School for the 2026–2027 academic year.",
    whatItSays:
      "It explains what documents parents must submit, the deadlines for submission, and the school's requirements for enrollment.",
    whatItAsks:
      "You are being asked to complete and sign an enrollment application form, provide proof of your child's age and your address, and submit a current immunization record.",
    obligations:
      "You must gather the required documents, sign the enrollment application, and submit everything to the school office by June 15, 2026.",
    payAttentionTo:
      "The hard June 15 submission deadline, the residency requirement, and the immunization record requirement are the three most important items. Missing any of these could result in your child not being enrolled.",
    nextSteps:
      "Gather the birth certificate, proof of residency, and immunization records. Complete and sign the enrollment form. Submit everything to the school office before June 15, 2026.",
  },

  keyTerms: [
    {
      id: "kt-001",
      term: "Parent/guardian signature",
      severity: "high",
      category: "Authorization",
      explanation:
        "The enrollment application requires a handwritten signature from the parent or legal guardian. Electronic or typed signatures may not be accepted.",
      whyItMatters:
        "Without the parent/guardian signature, the enrollment application will not be processed.",
      watchOut:
        "Ensure you sign the correct lines. Some forms have multiple signature fields for different sections.",
      questionToAsk: "Does the school accept e-signatures or only wet (handwritten) signatures?",
    },
    {
      id: "kt-002",
      term: "District boundary",
      severity: "medium",
      category: "Eligibility",
      explanation:
        "Enrollment is restricted to students who reside within the school district's defined geographic boundaries.",
      whyItMatters:
        "If your address is outside district boundaries, your child may not be eligible for enrollment without an approved open enrollment exception.",
      watchOut:
        "Verify your address against the district boundary map (Exhibit B) before submitting.",
      questionToAsk: "How do I confirm whether my address falls within the school district boundary?",
    },
  ],

  actionPack: {
    questionsToAsk: [
      {
        id: "apq-001",
        question: "What is the school's policy for students who have recently moved and cannot provide full proof of residency?",
        context:
          "Families who have recently moved may have difficulty producing utility bills or lease agreements in their name.",
      },
    ],
    whatToGather: [
      {
        id: "apg-001",
        item: "Parent or guardian government-issued photo ID",
        description:
          "A driver's license, state ID, or passport showing your current address or matching the proof of residency you are providing.",
        category: "Identity",
      },
      {
        id: "apg-002",
        item: "Appendix A — School supply list",
        description:
          "The school supply list referenced in the enrollment packet was not included in the upload. Obtain this from the school office.",
        category: "Supplemental",
      },
    ],
    whatToSay: [
      {
        id: "aps-001",
        label: "Request for missing Exhibit B (boundary map)",
        draft:
          "Hello, I am completing the enrollment packet for Maplewood Elementary for the 2026–2027 school year. I noticed that the district boundary map (Exhibit B) was not included in the packet I received. Could you please send me a copy or direct me to where I can access it? Thank you.",
      },
    ],
    beforeYouActChecklist: [
      {
        id: "bya-001",
        text: "Confirm all signature fields on the enrollment application have been signed by the parent or legal guardian before submitting.",
      },
      {
        id: "bya-002",
        text: "Verify that your proof of residency document shows your current address and is dated within the past 90 days.",
      },
      {
        id: "bya-003",
        text: "Make a copy of all submitted documents for your own records before dropping them off.",
      },
    ],
  },

  sections: [
    {
      id: "sec-001",
      title: "Section 1 — Enrollment Requirements",
      content:
        "All students enrolling in Maplewood Elementary School must submit a completed enrollment application, proof of age, proof of residency, and a current immunization record. Applications missing any of these items will not be processed.",
    },
    {
      id: "sec-002",
      title: "Section 2 — Submission Deadlines",
      content:
        "The enrollment application and all supporting documents must be received by the school office no later than June 15, 2026. Late submissions are subject to space availability.",
    },
    {
      id: "sec-003",
      title: "Section 3 — Technology Use Agreement",
      content:
        "All enrolled students must have a signed technology use agreement on file before school-issued devices are provided. The technology use agreement must be signed by both the student and the parent or legal guardian.",
    },
  ],
};
