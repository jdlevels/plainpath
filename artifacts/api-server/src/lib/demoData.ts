import type { DocumentAnalysis } from "./types.js";

export const demoDocuments: Record<string, DocumentAnalysis> = {
  "event-permit": {
    id: "demo-event-permit",
    title: "Small Business Event Permit Packet",
    summary:
      "This packet outlines the requirements for obtaining a special event permit for a small business in the city. You must complete multiple applications, gather proof of insurance, coordinate with several city departments, and pay associated fees. The process typically takes 6–8 weeks, so early submission is strongly recommended.",
    documentType: "Government Permit Application",
    overallConfidence: "high",
    processedAt: new Date().toISOString(),
    actionSteps: [
      {
        id: "as-1",
        title: "Complete the Special Event Application Form",
        description:
          "Fill out the City Special Event Application (Form SE-100) with all event details including date, location, expected attendance, and organizer contact information.",
        priority: "high",
        category: "Applications",
        completed: false,
        sourceEvidence:
          "Section 2.1: 'All applicants must complete Form SE-100 in full. Incomplete applications will not be processed.'",
        confidence: "high",
      },
      {
        id: "as-2",
        title: "Obtain Certificate of Insurance",
        description:
          "Secure a Certificate of General Liability Insurance with minimum coverage of $1,000,000 per occurrence and $2,000,000 aggregate. The City must be named as an additional insured.",
        priority: "high",
        category: "Insurance",
        completed: false,
        sourceEvidence:
          "Section 4.3: 'Applicant must provide proof of general liability insurance naming the City as additional insured with minimum limits of $1M/$2M.'",
        confidence: "high",
      },
      {
        id: "as-3",
        title: "Submit Site Plan / Event Layout Map",
        description:
          "Create a detailed site map showing booth locations, food vendor areas, stage placement, parking, entrances/exits, and emergency access routes.",
        priority: "high",
        category: "Documentation",
        completed: false,
        sourceEvidence:
          "Section 3.2: 'A scaled site plan must accompany the application showing all structures, vendor locations, and emergency access.'",
        confidence: "high",
      },
      {
        id: "as-4",
        title: "Apply for Temporary Food Service Permit",
        description:
          "If serving food, submit a Temporary Food Service Permit application to the County Health Department at least 30 days before the event.",
        priority: "high",
        category: "Health & Safety",
        completed: false,
        sourceEvidence:
          "Section 6.1: 'Events with food vendors require a Temporary Food Service Permit issued by the County Health Department.'",
        confidence: "high",
      },
      {
        id: "as-5",
        title: "Submit Noise Variance Request (if applicable)",
        description:
          "If the event includes amplified music and extends past 10 PM, file a Noise Variance Request with the City Noise Control Office.",
        priority: "medium",
        category: "Permits",
        completed: false,
        sourceEvidence:
          "Section 5.4: 'Amplified sound after 10:00 PM requires a Noise Variance. Apply at least 21 days before the event.'",
        confidence: "medium",
      },
      {
        id: "as-6",
        title: "Coordinate with Police Department for Traffic Control",
        description:
          "Contact the City Police Department's Special Events Unit to arrange traffic control officers if the event will affect public roads or intersections.",
        priority: "medium",
        category: "Public Safety",
        completed: false,
        sourceEvidence:
          "Section 7.1: 'Events affecting traffic flow must coordinate with the Police Department Special Events Unit.'",
        confidence: "high",
      },
      {
        id: "as-7",
        title: "Pay Application Fee",
        description:
          "Submit payment of $150 (non-refundable application fee) plus $50 per food vendor with your application. Payment must be by check or money order.",
        priority: "medium",
        category: "Fees",
        completed: false,
        sourceEvidence:
          "Section 8.1: 'Application fee: $150 non-refundable. Additional $50 per food vendor. Payment by check or money order only.'",
        confidence: "high",
      },
      {
        id: "as-8",
        title: "Submit Application 6 Weeks Before Event",
        description:
          "Ensure your completed application and all supporting documents are submitted at least 6 weeks (42 days) before your event date to allow adequate review time.",
        priority: "high",
        category: "Timing",
        completed: false,
        sourceEvidence:
          "Section 2.3: 'Complete applications must be received no less than 42 days prior to the event date.'",
        confidence: "high",
      },
    ],
    requiredDocuments: [
      {
        id: "rd-1",
        name: "Form SE-100 (Special Event Application)",
        description:
          "The primary city permit application form, completed in full with all event details.",
        required: true,
        obtained: false,
        sourceEvidence:
          "Section 2.1: Required for all special event permit applications.",
        confidence: "high",
      },
      {
        id: "rd-2",
        name: "Certificate of General Liability Insurance",
        description:
          "Policy with minimum $1M/$2M coverage naming the City as additional insured.",
        required: true,
        obtained: false,
        sourceEvidence:
          "Section 4.3: Required insurance documentation.",
        confidence: "high",
      },
      {
        id: "rd-3",
        name: "Scaled Site Plan / Event Layout Map",
        description:
          "Detailed map of your event venue showing all structures, vendor areas, and emergency access routes.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.2: Required with application.",
        confidence: "high",
      },
      {
        id: "rd-4",
        name: "Temporary Food Service Permit",
        description:
          "County Health Department permit required for any food vendors at the event.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 6.1: Required if food is being served.",
        confidence: "high",
      },
      {
        id: "rd-5",
        name: "Copy of Business License",
        description:
          "Current valid business license for the event organizer or primary vendor.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 2.4: Must accompany the application.",
        confidence: "high",
      },
      {
        id: "rd-6",
        name: "Noise Variance Approval (if applicable)",
        description:
          "Required only if amplified music will be played after 10 PM.",
        required: false,
        obtained: false,
        sourceEvidence: "Section 5.4: Required for late-night amplified sound.",
        confidence: "medium",
      },
    ],
    deadlines: [
      {
        id: "dl-1",
        title: "Application Submission Deadline",
        date: "42 days before event",
        description:
          "Complete application packet must be received by the City Clerk's office at least 42 calendar days before the event.",
        isHard: true,
        sourceEvidence: "Section 2.3",
        confidence: "high",
      },
      {
        id: "dl-2",
        title: "Health Department Food Permit Application",
        date: "30 days before event",
        description:
          "Temporary Food Service Permit application must be filed with the County Health Department at least 30 days before the event.",
        isHard: true,
        sourceEvidence: "Section 6.1",
        confidence: "high",
      },
      {
        id: "dl-3",
        title: "Noise Variance Request",
        date: "21 days before event",
        description:
          "If amplified sound is planned after 10 PM, the Noise Variance must be filed at least 21 days before the event.",
        isHard: true,
        sourceEvidence: "Section 5.4",
        confidence: "medium",
      },
    ],
    followUpQuestions: [
      {
        id: "fq-1",
        question: "Will food be served at the event?",
        context:
          "This determines whether a Temporary Food Service Permit is required.",
        answered: false,
      },
      {
        id: "fq-2",
        question: "Will amplified music or sound be used after 10 PM?",
        context:
          "This determines whether a Noise Variance Request must be filed.",
        answered: false,
      },
      {
        id: "fq-3",
        question: "Will the event affect public roads or parking?",
        context:
          "This determines the level of police traffic coordination needed.",
        answered: false,
      },
      {
        id: "fq-4",
        question: "What is the expected number of attendees?",
        context:
          "Attendance over 500 may trigger additional crowd management requirements.",
        answered: false,
      },
    ],
    risks: [
      {
        id: "risk-1",
        title: "Late Submission Risk",
        description:
          "Submitting the application fewer than 42 days before the event will result in automatic rejection. Build in extra time to gather insurance and health permits.",
        severity: "high",
        sourceEvidence: "Section 2.3",
      },
      {
        id: "risk-2",
        title: "Insurance Gap",
        description:
          "If your current business insurance does not cover public events, you may need to purchase a separate event policy. This can take 1–2 weeks to arrange.",
        severity: "high",
        sourceEvidence: "Section 4.3",
      },
      {
        id: "risk-3",
        title: "Food Vendor Coordination",
        description:
          "Each individual food vendor may need their own Health Department permit. Confirm requirements with the Health Department early.",
        severity: "medium",
        sourceEvidence: "Section 6.2",
      },
    ],
    sections: [
      {
        id: "sec-1",
        title: "PURPOSE AND SCOPE",
        content: "This packet governs the application process for a Special Event Permit required for any public or semi-public event held on city property or public right-of-way. All events with expected attendance of 50 or more persons must obtain a permit prior to the event date. Failure to obtain a permit may result in the event being shut down by law enforcement.",
      },
      {
        id: "sec-2",
        title: "SECTION 1: ELIGIBILITY REQUIREMENTS",
        content: "The applicant must be a registered business entity, nonprofit organization, or individual resident of the city. Applicants must not have any outstanding permit violations, unpaid city fines, or revoked permits within the preceding 24 months. Organizations applying on behalf of a business must provide proof of authorization from the business owner.",
      },
      {
        id: "sec-3",
        title: "SECTION 2: APPLICATION REQUIREMENTS",
        content: "Applicants must submit Form SE-100 in its entirety at least 45 calendar days before the event date. Required attachments include a detailed site plan, event schedule, crowd management plan, and contact information for on-site coordinators. Applications submitted fewer than 30 days before the event date will not be accepted.",
      },
      {
        id: "sec-4",
        title: "SECTION 3: INSURANCE REQUIREMENTS",
        content: "All applicants must provide a Certificate of General Liability Insurance with minimum coverage of $1,000,000 per occurrence and $2,000,000 aggregate. The City must be named as an additional insured on the policy. Proof of workers' compensation coverage is required if the event involves paid staff or contractors.",
      },
      {
        id: "sec-5",
        title: "SECTION 4: DEPARTMENTAL SIGN-OFFS",
        content: "Before a permit is issued, applicants must obtain written approval from the Parks Department, Public Works, Fire Marshal, and Police Department. Each department may impose additional conditions. It is the applicant's responsibility to schedule inspections and secure all departmental approvals before the permit processing deadline.",
      },
      {
        id: "sec-6",
        title: "SECTION 5: PERMIT FEES",
        content: "The non-refundable application fee is $150. Additional fees apply based on event size: $200 for 50–200 attendees, $500 for 201–1,000 attendees, $1,200 for events exceeding 1,000 attendees. Fees for temporary road closures, park usage, and additional police or fire personnel will be assessed separately by the relevant department.",
      },
      {
        id: "sec-7",
        title: "SECTION 6: APPROVAL PROCESS AND TIMELINE",
        content: "After all departmental approvals and fees are received, the City Clerk's Office will review the complete application within 10 business days. You will receive written notification of approval, conditional approval, or denial. Denied applications may be appealed to the City Council within 14 days. Allow 6–8 weeks total from submission to permit issuance.",
      },
    ],
    actionPack: {
      questionsToAsk: [
        {
          id: "q-1",
          question: "Can I submit to all four departments simultaneously, or must I go sequentially?",
          context: "Parallel department submissions could cut weeks off your processing time — worth confirming before you start.",
        },
        {
          id: "q-2",
          question: "What happens if one department approves but another denies — is there any reconsideration process?",
          context: "Knowing whether partial approvals hold any value helps you plan your response if one department pushes back.",
        },
        {
          id: "q-3",
          question: "Is there an expedited review option if my event timeline is tight?",
          context: "Some jurisdictions offer fast-track review for an additional fee or under specific circumstances.",
        },
        {
          id: "q-4",
          question: "What documentation is required if my actual attendance exceeds the number I estimated on the application?",
          context: "Attendance can grow — knowing what triggers a permit amendment prevents a potential violation on event day.",
        },
        {
          id: "q-5",
          question: "If my application is denied, will the City provide specific written reasons so I can address them in a resubmission?",
          context: "A denial with stated reasons is a starting point for a successful resubmission — not necessarily a final answer.",
        },
      ],
      whatToGather: [
        {
          id: "g-1",
          item: "Completed Form SE-100 (Special Event Application)",
          description: "Required for submission — every field must be filled in and signed before the City will process the application.",
          category: "Applications",
        },
        {
          id: "g-2",
          item: "Certificate of General Liability Insurance naming the City as Additional Insured",
          description: "Must explicitly list the City on the certificate — general proof of insurance alone is not accepted.",
          category: "Insurance",
        },
        {
          id: "g-3",
          item: "Scaled site plan or event layout map",
          description: "Must show all structures, vendor locations, emergency access routes, parking, and entry/exit points.",
          category: "Documentation",
        },
        {
          id: "g-4",
          item: "Vendor and contractor list with contact information",
          description: "Required by the Health and Fire Departments for food service and safety reviews.",
          category: "Documentation",
        },
        {
          id: "g-5",
          item: "Proof of application fee payment ($150)",
          description: "Keep the payment receipt — it confirms your submission date, which is needed to establish the 45-day timeline.",
          category: "Financial Records",
        },
        {
          id: "g-6",
          item: "Previous City event permit approvals (if applicable)",
          description: "Prior approved permits can help establish your track record with departments and may speed up review.",
          category: "Correspondence",
        },
      ],
      whatToSay: [
        {
          id: "s-1",
          label: "Asking for a department review timeline",
          draft: "Hello,\n\nMy name is [Your Name] and I submitted a special event permit application on [Date] for an event scheduled on [Event Date] at [Location]. I wanted to confirm the application was received and ask whether you can share a rough timeline for [Department Name]'s review.\n\nI'm also happy to provide any additional information that would help move things along. You can reach me at [Phone/Email].\n\nThank you,\n[Your Name]",
        },
        {
          id: "s-2",
          label: "Requesting clarification on the insurance requirement",
          draft: "Hello,\n\nI'm completing my special event permit application and have a question about the insurance requirement. Could you confirm whether the City of [City] must be listed as an additional insured on the certificate itself, and whether there is a specific endorsement format or certificate language your office requires?\n\nI want to make sure the documentation meets your exact requirements before I submit.\n\nThank you,\n[Your Name]",
        },
        {
          id: "s-3",
          label: "Responding to a department request for more information",
          draft: "Hello,\n\nThank you for reviewing my application. I received your request for [description of what was requested]. I'm gathering that information now and expect to have it to you by [Date].\n\nPlease let me know if there's anything else needed in the meantime. I can be reached at [Phone/Email].\n\nBest,\n[Your Name]",
        },
      ],
      beforeYouActChecklist: [
        {
          id: "ba-1",
          text: "Confirm today's date gives you at least 45 calendar days before the event — less than 45 days means automatic rejection with no exceptions.",
        },
        {
          id: "ba-2",
          text: "Verify your Certificate of Insurance explicitly names the City as an additional insured — not just shows you have general liability coverage.",
        },
        {
          id: "ba-3",
          text: "Check Form SE-100 is signed and every field is complete — incomplete applications are returned without being processed.",
        },
        {
          id: "ba-4",
          text: "Identify the contact name and office for each of the 4 departments before submitting so you can follow up with the right person.",
        },
        {
          id: "ba-5",
          text: "Make and keep a complete copy of everything you submit — including the date-stamped receipt — before handing over the packet.",
        },
      ],
    },
    keyTerms: [
      {
        id: "kt-1",
        term: "Non-Refundable Application Fee",
        severity: "medium",
        category: "Fees & Penalties",
        explanation: "The $150 application fee is non-refundable regardless of whether your permit is approved, denied, or if you withdraw the application.",
        whyItMatters: "You pay up front with no guarantee of approval. If your event is turned down by even one department, you still lose the fee.",
        watchOut: "Do not submit the application until you are confident you can meet all requirements. There is no partial refund or appeal of the fee.",
        questionToAsk: "Is there any circumstance under which the fee is waived or refunded?",
      },
      {
        id: "kt-2",
        term: "45-Day Advance Submission Requirement",
        severity: "high",
        category: "Deadlines",
        explanation: "Your complete application packet must be submitted at least 45 calendar days before your event date. Applications received fewer than 30 days out are automatically rejected.",
        whyItMatters: "This is a hard structural deadline — missing it means automatic denial with no exceptions, no extensions, and no appeals on the timeline.",
        watchOut: "45 days is the minimum. The 6–8 week processing time means you should submit even earlier, especially if any department has a backlog.",
      },
      {
        id: "kt-3",
        term: "City Named as Additional Insured",
        severity: "high",
        category: "Insurance",
        explanation: "Your insurance certificate must specifically name the City of [City] as an additional insured party — not just show that you have general liability coverage.",
        whyItMatters: "Simply having insurance is not enough. The City will reject any certificate that does not explicitly list them as an additional insured. This is a frequent cause of delays.",
        watchOut: "Contact your insurer early — adding an additional insured endorsement may take several days and may incur an extra charge.",
        questionToAsk: "Does my current policy allow me to add the City as an additional insured, and what does it cost?",
      },
      {
        id: "kt-4",
        term: "All 4 Departments Must Approve Independently",
        severity: "high",
        category: "Compliance",
        explanation: "Parks & Recreation, Public Works, Fire Marshal, and Police must each independently review and sign off on your application. The process cannot proceed until all four approve.",
        whyItMatters: "Any single department can block your permit. If one department has concerns or requires changes, you cannot work around them — you must resolve every department's issue.",
        watchOut: "Each department may have its own internal review timeline. Contact all four departments immediately after submitting to understand their individual timelines.",
      },
      {
        id: "kt-5",
        term: "14-Day Appeal Window for Denied Permits",
        severity: "medium",
        category: "Appeal Rights",
        explanation: "If your permit is denied, you have exactly 14 calendar days to file an appeal with the City Council. After that window closes, the denial is final.",
        whyItMatters: "Fourteen days is a short window — especially if you receive the denial letter by mail. Missing the deadline means you cannot challenge the decision.",
        watchOut: "The clock starts from the date on the denial letter, not the date you receive it. Request confirmation of the denial date in writing.",
      },
      {
        id: "kt-6",
        term: "Fee Escalation by Attendance Size",
        severity: "medium",
        category: "Fees & Penalties",
        explanation: "Permit fees increase significantly based on expected attendance. Events over 500 attendees pay $750; events over 1,000 attendees pay $1,200 on top of the base fee.",
        whyItMatters: "Underestimating attendance to save on fees is a violation and can result in permit revocation on the day of your event.",
        watchOut: "You must report accurate attendance estimates. If actual attendance significantly exceeds your estimate, you may be liable for additional fees post-event.",
      },
      {
        id: "kt-7",
        term: "Event Shutdown Without a Valid Permit",
        severity: "high",
        category: "Legal Risk",
        explanation: "Operating a public event without a valid permit authorizes law enforcement to shut down the event immediately, including mid-event.",
        whyItMatters: "A shutdown mid-event means immediate financial loss, reputational damage, and potential liability to vendors and attendees. There is no warning step — shutdown is immediate.",
        watchOut: "Verify your permit is fully issued before the event day. Conditional approvals or pending sign-offs do not constitute a valid permit.",
      },
    ],
    plainEnglish: {
      whatItIs:
        "This is a government permit application packet issued by the city to allow a small business to host a public event. It is used by the city to ensure events are safe, insured, and coordinated with relevant departments such as police, fire, and health.",
      whatItSays:
        "The packet explains the multi-step process required to get city approval for a public event. It covers required forms, insurance minimums, departmental sign-offs, and associated fees. It also outlines timelines and what happens if requirements are not met.",
      whatItAsks:
        "You are asked to fill out Form SE-100, obtain a certificate of general liability insurance, pay a permit fee, and coordinate approvals from the Police, Fire, and Health Departments. All materials must be submitted together at least 6–8 weeks before your event.",
      obligations:
        "By submitting this application, you agree to comply with all city ordinances and department requirements for the event. You are responsible for ensuring your event has adequate insurance coverage, proper safety measures, and all required sign-offs.",
      payAttentionTo:
        "The 6–8 week processing time is critical — submitting late may result in your permit being denied. Insurance coverage must meet the minimum thresholds, and the City must be named as an additional insured. Missing any required departmental sign-off will block approval.",
      nextSteps:
        "Start by completing Form SE-100 with your full event details. Immediately contact your insurer to obtain the required certificate of liability insurance. Then schedule appointments with the Police, Fire, and Health Departments for their sign-offs.",
    },
  },

  "school-enrollment": {
    id: "demo-school-enrollment",
    title: "School Enrollment Packet",
    summary:
      "This enrollment packet is required to register a child in the public school district. You must provide proof of residency, the child's immunization records, birth certificate, and previous school records. Incomplete packets cannot be processed — all documents must be submitted together at the enrollment office during designated hours.",
    documentType: "School Enrollment Application",
    overallConfidence: "high",
    processedAt: new Date().toISOString(),
    actionSteps: [
      {
        id: "as-1",
        title: "Gather Proof of Residency Documents",
        description:
          "Collect two forms of proof that you live within the school district. Acceptable documents include a current utility bill, lease agreement, mortgage statement, or official government mail.",
        priority: "high",
        category: "Documentation",
        completed: false,
        sourceEvidence:
          "Section 1.2: 'Two forms of proof of district residency are required. Utility bills, lease/mortgage, or government correspondence dated within the last 60 days are accepted.'",
        confidence: "high",
      },
      {
        id: "as-2",
        title: "Obtain Official Birth Certificate",
        description:
          "Provide the child's official birth certificate (original or certified copy). Hospital-issued certificates may not be accepted — contact the vital records office if needed.",
        priority: "high",
        category: "Documentation",
        completed: false,
        sourceEvidence:
          "Section 1.3: 'Official birth certificate (certified copy) is required. Hospital birth certificates are not accepted.'",
        confidence: "high",
      },
      {
        id: "as-3",
        title: "Collect Complete Immunization Records",
        description:
          "Obtain the child's up-to-date immunization records from their pediatrician. All state-mandated vaccines must be completed or you must submit a medical/religious exemption form.",
        priority: "high",
        category: "Health",
        completed: false,
        sourceEvidence:
          "Section 2.1: 'Complete immunization records as required by state law must be provided. Exemptions require a separate form.'",
        confidence: "high",
      },
      {
        id: "as-4",
        title: "Request Previous School Records",
        description:
          "If your child attended school previously, request records from the prior school including transcripts, IEP/504 plans, and any disciplinary records.",
        priority: "medium",
        category: "Academic Records",
        completed: false,
        sourceEvidence:
          "Section 3.1: 'Transfer students must provide records from previous school including academic history and any special services.'",
        confidence: "high",
      },
      {
        id: "as-5",
        title: "Complete Enrollment Registration Forms",
        description:
          "Fill out all forms in the packet including the Student Information Form, Emergency Contact Form, Media Release Form, and Technology Use Agreement.",
        priority: "high",
        category: "Forms",
        completed: false,
        sourceEvidence:
          "Section 1.1: 'All forms in the enrollment packet must be completed in full before submission.'",
        confidence: "high",
      },
      {
        id: "as-6",
        title: "Schedule an Enrollment Appointment",
        description:
          "Call or visit the school office to schedule an enrollment appointment. Walk-in enrollment is limited — appointments are recommended for priority processing.",
        priority: "medium",
        category: "Process",
        completed: false,
        sourceEvidence:
          "Section 1.4: 'Enrollment appointments are available by calling the district enrollment office. Walk-in enrollment subject to availability.'",
        confidence: "medium",
      },
      {
        id: "as-7",
        title: "Submit Physical Examination Form",
        description:
          "Kindergarten and new students entering grades 6 and 9 must submit a completed physical examination form signed by a licensed physician within the last 12 months.",
        priority: "high",
        category: "Health",
        completed: false,
        sourceEvidence:
          "Section 2.3: 'Physical examination required for students entering kindergarten, grade 6, and grade 9.'",
        confidence: "high",
      },
    ],
    requiredDocuments: [
      {
        id: "rd-1",
        name: "Official Birth Certificate (Certified Copy)",
        description:
          "State-issued certified birth certificate. Hospital birth certificates are not accepted.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 1.3",
        confidence: "high",
      },
      {
        id: "rd-2",
        name: "Proof of Residency (2 documents)",
        description:
          "Two documents proving current district residency — utility bill, lease, mortgage, or official government mail (dated within 60 days).",
        required: true,
        obtained: false,
        sourceEvidence: "Section 1.2",
        confidence: "high",
      },
      {
        id: "rd-3",
        name: "Complete Immunization Records",
        description:
          "Up-to-date records from pediatrician showing all state-mandated vaccines are current.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 2.1",
        confidence: "high",
      },
      {
        id: "rd-4",
        name: "Physical Examination Form",
        description:
          "Signed by a licensed physician within the last 12 months (required for K, 6th, and 9th graders).",
        required: true,
        obtained: false,
        sourceEvidence: "Section 2.3",
        confidence: "high",
      },
      {
        id: "rd-5",
        name: "Previous School Records",
        description:
          "Academic transcripts, IEP/504 plans, and other records from prior school (for transfer students).",
        required: false,
        obtained: false,
        sourceEvidence: "Section 3.1",
        confidence: "high",
      },
      {
        id: "rd-6",
        name: "Completed Enrollment Forms",
        description:
          "All forms in the packet: Student Information, Emergency Contacts, Media Release, Technology Use Agreement.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 1.1",
        confidence: "high",
      },
    ],
    deadlines: [
      {
        id: "dl-1",
        title: "Priority Enrollment Window",
        date: "April 15",
        description:
          "Students enrolled before April 15 are guaranteed placement at their neighborhood school. After this date, placement is subject to availability.",
        isHard: false,
        sourceEvidence: "Section 4.1",
        confidence: "high",
      },
      {
        id: "dl-2",
        title: "Open Enrollment Deadline",
        date: "June 1",
        description:
          "The last day to submit enrollment for the upcoming school year. After this date, families must contact the district office directly.",
        isHard: true,
        sourceEvidence: "Section 4.2",
        confidence: "high",
      },
    ],
    followUpQuestions: [
      {
        id: "fq-1",
        question: "Is this child a transfer from another school?",
        context:
          "Transfer students need to request records from their previous school.",
        answered: false,
      },
      {
        id: "fq-2",
        question: "Does the child have an IEP, 504 Plan, or special services?",
        context:
          "Special education records and accommodation plans must be transferred and reviewed.",
        answered: false,
      },
      {
        id: "fq-3",
        question:
          "Is the child entering Kindergarten, 6th grade, or 9th grade?",
        context:
          "These grades require a physical examination form from a licensed physician.",
        answered: false,
      },
      {
        id: "fq-4",
        question:
          "Are all state-required immunizations current, or is an exemption needed?",
        context:
          "Medical or religious exemptions require separate documentation.",
        answered: false,
      },
    ],
    risks: [
      {
        id: "risk-1",
        title: "Incomplete Packet Will Not Be Processed",
        description:
          "The enrollment office will not begin processing an incomplete packet. All documents must be present at the time of submission — gather everything before your appointment.",
        severity: "high",
        sourceEvidence: "Section 1.5",
      },
      {
        id: "risk-2",
        title: "Hospital Birth Certificate Not Accepted",
        description:
          "Many parents have only a hospital-issued birth certificate. You must obtain a certified copy from the vital records office (state or county), which can take 1–3 weeks.",
        severity: "high",
        sourceEvidence: "Section 1.3",
      },
      {
        id: "risk-3",
        title: "School Placement Not Guaranteed After Priority Window",
        description:
          "Missing the April 15 priority enrollment window may result in your child being placed at a school other than your neighborhood school.",
        severity: "medium",
        sourceEvidence: "Section 4.1",
      },
    ],
    sections: [
      {
        id: "sec-1",
        content: "Welcome to Springfield Unified School District. This enrollment packet contains all forms and information required to register your child for the upcoming school year. Please read all instructions carefully and submit completed forms to your assigned school's enrollment office.",
      },
      {
        id: "sec-2",
        title: "SECTION 1: RESIDENCY REQUIREMENTS",
        content: "To enroll in the Springfield Unified School District, you must provide proof that your child resides within district boundaries. Acceptable proof of residency includes a current utility bill, mortgage statement, rental agreement, or official government mail dated within the last 60 days. A single document is sufficient if it includes both the parent/guardian name and service address.",
      },
      {
        id: "sec-3",
        title: "SECTION 2: REQUIRED DOCUMENTS",
        content: "The following documents are required for all new enrollees: (1) original birth certificate or passport, (2) proof of residency as described in Section 1, (3) immunization records meeting state requirements, (4) most recent school records or transcripts for grades 1 and above, and (5) completed emergency contact form. Enrollment cannot be processed until all required documents are received.",
      },
      {
        id: "sec-4",
        title: "SECTION 3: IMMUNIZATION RECORDS",
        content: "California state law requires all students to be fully immunized before attending school. Required vaccines include DTaP, Polio, MMR, Hepatitis B, and Varicella (chickenpox). Students without up-to-date records may be excluded from school until records are provided. Medical and religious exemptions must be accompanied by official documentation from a licensed physician.",
      },
      {
        id: "sec-5",
        title: "SECTION 4: ENROLLMENT DEADLINES",
        content: "Enrollment for the fall semester opens March 1 and closes June 30. Late enrollments received after July 15 will be placed on a waitlist and processed based on availability. Kindergarten placement requires enrollment no later than May 31. After enrollment closes, families must contact the district office to request a late enrollment waiver.",
      },
      {
        id: "sec-6",
        title: "SECTION 5: SCHOOL PLACEMENT POLICY",
        content: "Students will be assigned to their neighborhood school based on their home address. Requests for transfers to a different school within the district may be submitted using the Inter-District Transfer Request form. Transfers are not guaranteed and are subject to space availability and district approval. Transfer decisions are final and are communicated within 30 days of request.",
      },
      {
        id: "sec-7",
        title: "SECTION 6: SPECIAL NEEDS AND SUPPORT SERVICES",
        content: "If your child has an Individualized Education Program (IEP), 504 Plan, or other documented educational support needs, please include a copy with your enrollment packet. The district's Special Education office will contact you within 10 business days to discuss placement and support services. Do not assume existing accommodations transfer automatically from another school.",
      },
    ],
    actionPack: {
      questionsToAsk: [
        {
          id: "q-1",
          question: "Does our home address guarantee assignment to our neighborhood school, or could we be placed elsewhere in the zone?",
          context: "Understanding exactly how neighborhood assignments work prevents surprises about which school your child is assigned to.",
        },
        {
          id: "q-2",
          question: "If we miss the June 30 deadline, how does the waitlist work and what is the typical wait time for a placement?",
          context: "Knowing the waitlist mechanics helps you decide whether late submission is a viable option or if you need to prioritize the deadline.",
        },
        {
          id: "q-3",
          question: "My child has an active IEP — what is the process for the district to review it, and will accommodations be in place on the first day?",
          context: "Special education services require a formal transfer review; starting early is critical to avoid gaps in support.",
        },
        {
          id: "q-4",
          question: "If one document in our packet is missing on the day we submit, will the application be held or returned?",
          context: "This confirms the all-or-nothing rule and reinforces that you need a complete packet before visiting the enrollment office.",
        },
        {
          id: "q-5",
          question: "Are there any alternative residency documents accepted for families who recently moved and don't yet have a utility bill?",
          context: "Recent movers often lack the required documentation — knowing alternatives prevents delays.",
        },
      ],
      whatToGather: [
        {
          id: "g-1",
          item: "Proof of residency (utility bill, bank statement, or lease — dated within 60 days)",
          description: "Must confirm your current address and be dated within the 60-day window — older documents are not accepted.",
          category: "Identification",
        },
        {
          id: "g-2",
          item: "Child's birth certificate or government-issued ID",
          description: "Required for age verification and legal identity — original or certified copy.",
          category: "Identification",
        },
        {
          id: "g-3",
          item: "Complete immunization records (current to this school year's requirements)",
          description: "Records from a previous school may not meet current state requirements — verify with your pediatrician.",
          category: "Medical Records",
        },
        {
          id: "g-4",
          item: "Previous school records (report cards and transcripts)",
          description: "Required to confirm prior enrollment, academic level, and grade placement.",
          category: "Academic Records",
        },
        {
          id: "g-5",
          item: "IEP or 504 plan documentation (if applicable)",
          description: "Submit at enrollment to start the transfer review process as early as possible — do not wait.",
          category: "Legal Documents",
        },
        {
          id: "g-6",
          item: "Custody or guardianship documents (if enrolling adult is not the biological parent)",
          description: "Required to confirm legal authority to enroll the child.",
          category: "Legal Documents",
        },
      ],
      whatToSay: [
        {
          id: "s-1",
          label: "Asking about the waitlist and late enrollment process",
          draft: "Hello,\n\nI am registering my child for the [School Year] school year and wanted to ask a few questions about the enrollment timeline. If we are unable to submit by the June 30 deadline, how does the waitlist process work? Are placements made in the order applications are received, and roughly how long does waitlist placement typically take?\n\nWe want to make sure we plan around the right deadline. Thank you for any guidance.\n\n[Your Name]",
        },
        {
          id: "s-2",
          label: "Requesting a meeting about your child's IEP transfer",
          draft: "Hello,\n\nI am enrolling my child at [School Name] for the upcoming school year. My child has an active IEP from [Previous School] and I would like to understand the process for reviewing and continuing the plan at your school.\n\nCould you let me know who I should speak with to get the transfer review started, and what information you need from me? I want to make sure there is no gap in services when the school year begins.\n\nThank you,\n[Your Name]",
        },
        {
          id: "s-3",
          label: "Asking about alternative residency documents",
          draft: "Hello,\n\nI am preparing my enrollment packet and have a question about the residency requirement. We recently moved to the area on [Date] and our first utility bill has not yet arrived. Are there any alternative documents that can be accepted to confirm our address — such as a signed lease agreement, a bank statement showing our new address, or a letter from our landlord?\n\nThank you for letting me know what options may be available.\n\n[Your Name]",
        },
      ],
      beforeYouActChecklist: [
        {
          id: "ba-1",
          text: "Check the specific deadline for your child's grade level — kindergarten closes May 31, all other grades close June 30.",
        },
        {
          id: "ba-2",
          text: "Verify that your proof of residency document is dated within the last 60 days from the date you plan to submit.",
        },
        {
          id: "ba-3",
          text: "Confirm immunization records are current with this upcoming school year's state requirements, not a prior year's.",
        },
        {
          id: "ba-4",
          text: "Prepare the entire packet before going to the enrollment office — partial submissions are returned without processing.",
        },
        {
          id: "ba-5",
          text: "Write down the enrollment office hours and confirm they will be open on the day and time you plan to visit.",
        },
      ],
    },
    keyTerms: [
      {
        id: "kt-1",
        term: "Hard Enrollment Cutoff — June 30",
        severity: "high",
        category: "Deadlines",
        explanation: "General enrollment closes on June 30. Applications submitted after July 15 are placed on a waitlist with no guaranteed school placement.",
        whyItMatters: "Missing June 30 can mean your child is assigned to a school outside your neighborhood, or has no confirmed placement at the start of the school year.",
        watchOut: "July 15 is not a secondary deadline — it is the point at which your application is formally demoted to a waitlist. Submit by June 30 to preserve your placement.",
      },
      {
        id: "kt-2",
        term: "Kindergarten Has an Earlier Deadline — May 31",
        severity: "high",
        category: "Deadlines",
        explanation: "Kindergarten enrollment closes May 31 — a full month before the general enrollment deadline. This earlier cutoff is easy to overlook.",
        whyItMatters: "Parents registering a kindergartner often assume the general June 30 deadline applies. Missing May 31 risks late placement or waitlist status at the kindergarten level.",
        watchOut: "If your child will be entering kindergarten, treat May 31 as your personal hard deadline, not June 30.",
        questionToAsk: "Are kindergarten spots filled strictly first-come, first-served, or are siblings of current students given priority?",
      },
      {
        id: "kt-3",
        term: "All Documents Required Before Processing Begins",
        severity: "high",
        category: "Compliance",
        explanation: "Enrollment cannot be processed or a school placement made until every required document is received. Partial submissions are returned and not held.",
        whyItMatters: "One missing document freezes your entire application. You lose your place in line until the complete packet is resubmitted, potentially missing the deadline.",
        watchOut: "Do not bring an incomplete packet hoping to add documents later. The office will not accept partial packets or hold an incomplete submission.",
      },
      {
        id: "kt-4",
        term: "Immunization Exclusion Power",
        severity: "high",
        category: "Legal Risk",
        explanation: "The district has the legal authority to exclude a student from attending school if immunization records are missing, incomplete, or not up to date with state requirements.",
        whyItMatters: "Even after enrollment is complete, a student can be barred from school entry on the first day if immunization records are not current. There is no stated grace period.",
        watchOut: "Verify that immunization records are current according to this school year's state schedule — not just records from a previous school. Requirements may have changed.",
        questionToAsk: "What is the exact state immunization schedule required for my child's age group?",
      },
      {
        id: "kt-5",
        term: "IEP and 504 Plans Do Not Auto-Transfer",
        severity: "high",
        category: "Special Education",
        explanation: "Existing special education accommodations — including IEPs and 504 plans — do not automatically carry over from a previous school. You must proactively submit documentation.",
        whyItMatters: "Without proactive re-enrollment of your child's plan, they may start school without their legally required accommodations in place, affecting their first weeks of instruction.",
        watchOut: "The district will contact you to arrange a transfer review meeting, but this may take several weeks. Submit documentation at enrollment to start the process.",
        questionToAsk: "How long does the transfer review process take, and will my child's accommodations be in place on the first day of school?",
      },
      {
        id: "kt-6",
        term: "Residency Document Must Be Dated Within 60 Days",
        severity: "medium",
        category: "Documentation",
        explanation: "Proof of residency must be a document dated within the last 60 days. Older utility bills, bank statements, or lease agreements will not be accepted.",
        whyItMatters: "An outdated document will cause your packet to be rejected and returned, delaying your enrollment and potentially missing the deadline.",
        watchOut: "Request a current utility bill or bank statement in the weeks immediately before submitting. A lease agreement alone may not be sufficient — check if additional proof is needed.",
      },
      {
        id: "kt-7",
        term: "School Assignment — Transfers Not Guaranteed",
        severity: "medium",
        category: "Placement",
        explanation: "Students are automatically assigned to their neighborhood school based on home address. Transfer requests to a different school are subject to availability and not guaranteed.",
        whyItMatters: "If you are hoping to enroll in a specific school outside your zone, you cannot count on a transfer. Availability-based decisions often favor students already in the zone.",
        watchOut: "Submit a transfer request as early as possible if you want a specific school. Waitlists can be long, and availability changes closer to the school year.",
        questionToAsk: "How are transfer request spots allocated — is it lottery-based, first-come, or based on other criteria?",
      },
    ],
    plainEnglish: {
      whatItIs:
        "This is a school enrollment packet issued by the public school district. It is the formal paperwork required to register a child for classes at any district school. Without completing this packet, your child cannot be enrolled.",
      whatItSays:
        "The packet outlines all documents you must provide, the deadlines for submission, and the rules of enrollment. It specifies which documents are required versus optional, where to submit them, and what hours the enrollment office is open.",
      whatItAsks:
        "You are asked to provide proof of residency, the child's birth certificate, up-to-date immunization records, and records from any previous schools attended. All documents must be submitted in person at the enrollment office during office hours.",
      obligations:
        "You are responsible for ensuring all documents are current, complete, and accurate. The district may refuse enrollment if records are missing or forged. You must also provide the child's immunization records in compliance with state health laws.",
      payAttentionTo:
        "The April 15 priority enrollment deadline is critical — missing it may mean your child is placed at a school outside your neighborhood. Immunization records must be up to date, and the entire packet must be submitted together; partial submissions are not accepted.",
      nextSteps:
        "Gather all required documents: proof of residency, birth certificate, immunization records, and past school records. Visit the enrollment office during open hours before April 15 to submit everything in one complete packet.",
    },
  },

  "grant-application": {
    id: "demo-grant-application",
    title: "Small Business Community Grant Application",
    summary:
      "This is a competitive grant application for small businesses in the community. Eligible businesses can apply for grants between $5,000 and $25,000 for approved uses including equipment, improvements, or hiring. The application requires a detailed business plan, financial statements, project description, and multiple references. Awards are announced 90 days after the application deadline.",
    documentType: "Grant Application",
    overallConfidence: "medium",
    processedAt: new Date().toISOString(),
    actionSteps: [
      {
        id: "as-1",
        title: "Confirm Eligibility Requirements",
        description:
          "Verify your business meets all eligibility requirements: operating for at least 2 years, fewer than 50 employees, located within the target zip codes, and not currently in default on any government loans.",
        priority: "high",
        category: "Eligibility",
        completed: false,
        sourceEvidence:
          "Section 1.1: 'Eligible businesses must have been in operation for a minimum of 2 years, employ fewer than 50 full-time employees, and be located within defined target zones.'",
        confidence: "high",
      },
      {
        id: "as-2",
        title: "Prepare Your Business Plan",
        description:
          "Write or update a comprehensive business plan (minimum 5 pages) that includes executive summary, business description, market analysis, financial projections for next 3 years, and how the grant funds will be used.",
        priority: "high",
        category: "Documentation",
        completed: false,
        sourceEvidence:
          "Section 3.2: 'A complete business plan must be submitted. Plans must include financial projections, market analysis, and intended use of funds.'",
        confidence: "high",
      },
      {
        id: "as-3",
        title: "Gather 3 Years of Financial Statements",
        description:
          "Compile the last 3 years of business financial statements including profit & loss statements, balance sheets, and tax returns (business and personal if sole proprietor).",
        priority: "high",
        category: "Financials",
        completed: false,
        sourceEvidence:
          "Section 3.4: 'Three years of financial statements including tax returns, P&L, and balance sheets are required for all applicants.'",
        confidence: "high",
      },
      {
        id: "as-4",
        title: "Write Project Description and Budget",
        description:
          "Prepare a detailed description of how you will use the grant funds, with a line-item budget showing how each dollar will be spent. The description should connect the project to community impact.",
        priority: "high",
        category: "Application",
        completed: false,
        sourceEvidence:
          "Section 3.3: 'Applications must include a detailed project description with itemized budget and expected community impact.'",
        confidence: "high",
      },
      {
        id: "as-5",
        title: "Obtain 3 Letters of Reference",
        description:
          "Gather three reference letters from community leaders, customers, or business partners. Letters must be on official letterhead and signed. Personal references from family are not accepted.",
        priority: "medium",
        category: "References",
        completed: false,
        sourceEvidence:
          "Section 3.6: 'Three letters of reference from non-family community or business contacts are required. Letters must be on letterhead.'",
        confidence: "high",
      },
      {
        id: "as-6",
        title: "Get Quotes for Proposed Expenditures",
        description:
          "For any equipment or construction included in your budget, obtain at least 2 written quotes from vendors. Quotes must be attached to the application.",
        priority: "medium",
        category: "Financials",
        completed: false,
        sourceEvidence:
          "Section 3.5: 'Any capital expenditure over $1,000 must be supported by at least two vendor quotes.'",
        confidence: "medium",
      },
      {
        id: "as-7",
        title: "Complete and Sign the Application Form",
        description:
          "Fill out the official grant application form completely. All fields must be completed — leave no blanks. The application must be signed by the business owner or authorized representative.",
        priority: "high",
        category: "Application",
        completed: false,
        sourceEvidence:
          "Section 2.1: 'Incomplete applications will be disqualified without review.'",
        confidence: "high",
      },
      {
        id: "as-8",
        title: "Submit by Online Portal or Postal Mail",
        description:
          "Applications may be submitted via the online portal at grants.example.gov or mailed to the grant office. Online submissions must be completed by 11:59 PM on the deadline date. Mailed applications must be postmarked by the deadline.",
        priority: "high",
        category: "Submission",
        completed: false,
        sourceEvidence:
          "Section 5.1: 'Applications may be submitted online or by mail. Online: by 11:59 PM. Mail: postmarked by deadline date.'",
        confidence: "high",
      },
    ],
    requiredDocuments: [
      {
        id: "rd-1",
        name: "Completed Grant Application Form",
        description:
          "The official application form, fully completed and signed by authorized representative.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 2.1",
        confidence: "high",
      },
      {
        id: "rd-2",
        name: "Business Plan (minimum 5 pages)",
        description:
          "Comprehensive business plan with executive summary, market analysis, and 3-year financial projections.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.2",
        confidence: "high",
      },
      {
        id: "rd-3",
        name: "3 Years of Financial Statements",
        description:
          "P&L statements, balance sheets, and business tax returns for the last 3 fiscal years.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.4",
        confidence: "high",
      },
      {
        id: "rd-4",
        name: "Personal Tax Returns (Sole Proprietors)",
        description:
          "Last 3 years of personal tax returns for sole proprietors or single-member LLCs.",
        required: false,
        obtained: false,
        sourceEvidence: "Section 3.4, footnote",
        confidence: "medium",
      },
      {
        id: "rd-5",
        name: "Project Description with Itemized Budget",
        description:
          "Detailed description of the project and line-item budget showing planned use of funds.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.3",
        confidence: "high",
      },
      {
        id: "rd-6",
        name: "3 Letters of Reference",
        description:
          "Non-family community or business references on official letterhead.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.6",
        confidence: "high",
      },
      {
        id: "rd-7",
        name: "Vendor Quotes for Capital Expenditures",
        description:
          "At least 2 written vendor quotes for any equipment or construction item over $1,000.",
        required: false,
        obtained: false,
        sourceEvidence: "Section 3.5",
        confidence: "medium",
      },
      {
        id: "rd-8",
        name: "Proof of Business Registration",
        description:
          "Current business registration or Articles of Incorporation from your state.",
        required: true,
        obtained: false,
        sourceEvidence: "Section 3.1",
        confidence: "high",
      },
    ],
    deadlines: [
      {
        id: "dl-1",
        title: "Application Submission Deadline",
        date: "November 1",
        description:
          "Online submission must be completed by 11:59 PM. Mailed applications must be postmarked by this date.",
        isHard: true,
        sourceEvidence: "Section 5.1",
        confidence: "high",
      },
      {
        id: "dl-2",
        title: "Award Announcement",
        date: "Approximately February 1 (90 days after deadline)",
        description:
          "Grant recipients will be notified by mail and email approximately 90 days after the application deadline.",
        isHard: false,
        sourceEvidence: "Section 6.2",
        confidence: "medium",
      },
    ],
    followUpQuestions: [
      {
        id: "fq-1",
        question: "Is your business a sole proprietorship or LLC?",
        context:
          "Sole proprietors may be required to submit personal tax returns in addition to business returns.",
        answered: false,
      },
      {
        id: "fq-2",
        question:
          "Does your planned project include any capital equipment purchases?",
        context:
          "Equipment over $1,000 requires at least two written vendor quotes to be attached.",
        answered: false,
      },
      {
        id: "fq-3",
        question:
          "Have you previously received a government grant or are you currently on any government loan?",
        context:
          "Businesses in default on government loans are ineligible. Previous grants may affect scoring.",
        answered: false,
      },
    ],
    risks: [
      {
        id: "risk-1",
        title: "Incomplete Application = Automatic Disqualification",
        description:
          "Any incomplete field, missing signature, or missing required document results in disqualification without review. Triple-check the submission checklist before submitting.",
        severity: "high",
        sourceEvidence: "Section 2.1",
      },
      {
        id: "risk-2",
        title: "Competitive Process — Strong Business Plan Critical",
        description:
          "This is a competitive grant. The quality of your business plan and project description are the primary scoring factors. Consider having a business advisor or SCORE mentor review your materials before submission.",
        severity: "medium",
        sourceEvidence: "Section 4.2",
      },
      {
        id: "risk-3",
        title: "Financial Statement Accuracy",
        description:
          "Financial statements must match your tax returns exactly. Discrepancies may disqualify your application or trigger additional review. Have a bookkeeper or accountant verify before submission.",
        severity: "medium",
        sourceEvidence: "Section 3.4",
      },
    ],
    sections: [
      {
        id: "sec-1",
        content: "The Springfield Community Development Grant Program provides financial assistance to qualifying small businesses within city limits. This application is your formal request for grant funding and will be evaluated by a review committee. Submitting this application does not guarantee an award.",
      },
      {
        id: "sec-2",
        title: "SECTION 1: ELIGIBILITY REQUIREMENTS",
        content: "To qualify, your business must be located within Springfield city limits, have been in continuous operation for at least 12 months, employ 25 or fewer full-time equivalent employees, and demonstrate a net annual revenue below $2,000,000. Businesses currently in default on any government loan or with unresolved tax liens are not eligible.",
      },
      {
        id: "sec-3",
        title: "SECTION 2: APPROVED USES OF GRANT FUNDS",
        content: "Grant funds may only be used for the following approved purposes: (a) purchase of equipment or machinery directly related to business operations, (b) exterior or interior facility improvements approved by the review committee, (c) costs associated with hiring new full-time employees within the grant period. Personal expenses, debt repayment, and working capital are not eligible uses.",
      },
      {
        id: "sec-4",
        title: "SECTION 3: REQUIRED APPLICATION MATERIALS",
        content: "Your application must include: a completed application form, a current business plan (no more than 15 pages), the most recent two years of financial statements or tax returns, a specific project description detailing how grant funds will be used and measured, two vendor quotes for any equipment over $1,000, and three business or professional references. Incomplete packages will not be reviewed.",
      },
      {
        id: "sec-5",
        title: "SECTION 4: REVIEW PROCESS AND SCORING",
        content: "Applications are reviewed by a five-member panel using a 100-point scoring rubric. The primary scoring categories are: business plan quality (35 points), community economic impact (25 points), project feasibility (25 points), and financial health (15 points). Applications are ranked by score; highest scores receive awards first until funds are exhausted.",
      },
      {
        id: "sec-6",
        title: "SECTION 5: OBLIGATIONS IF AWARDED",
        content: "If you receive a grant, you are required to: use funds only for the approved purpose stated in your application, maintain receipts for all expenditures, submit a progress report at 6 months, and submit a final report within 30 days of project completion. Failure to meet reporting requirements or misuse of funds may require full repayment and disqualify you from future programs.",
      },
      {
        id: "sec-7",
        title: "SECTION 6: SUBMISSION INSTRUCTIONS",
        content: "Submit all materials in a single PDF or physical packet to the City Economic Development Office by the posted deadline at 5:00 PM. Late or partial submissions will not be accepted. Email submissions are not accepted. Award decisions will be communicated to all applicants within 90 days of the submission deadline.",
      },
    ],
    actionPack: {
      questionsToAsk: [
        {
          id: "q-1",
          question: "Is there a pre-submission review session or feedback process available before the deadline?",
          context: "Some programs offer pre-submission review — this can help you identify gaps before they disqualify your application.",
        },
        {
          id: "q-2",
          question: "Can you share the scoring rubric so I can understand how applications are evaluated?",
          context: "Understanding the rubric lets you emphasize the highest-weighted elements in your narrative and budget.",
        },
        {
          id: "q-3",
          question: "If awarded, what is the process for requesting an amendment to the approved use of funds?",
          context: "Circumstances change after award — knowing the amendment process prevents accidental misuse violations.",
        },
        {
          id: "q-4",
          question: "Are there any eligibility disqualifiers my business structure or history might trigger that aren't obvious from the form?",
          context: "Ownership percentages, prior judgments, or business age requirements sometimes affect eligibility in ways applicants don't anticipate.",
        },
        {
          id: "q-5",
          question: "What happens to unused grant funds at the end of the project period — must unused amounts be returned?",
          context: "Unspent funds are a common post-award complication that surprises many first-time grantees.",
        },
      ],
      whatToGather: [
        {
          id: "g-1",
          item: "Most recent two years of business tax returns",
          description: "All financial figures in the application must match these exactly — any discrepancy can trigger disqualification.",
          category: "Financial Records",
        },
        {
          id: "g-2",
          item: "Current business financial statements (income statement and balance sheet)",
          description: "Must be current within the past 12 months and consistent with your tax returns.",
          category: "Financial Records",
        },
        {
          id: "g-3",
          item: "Detailed project description with itemized budget",
          description: "Must clearly describe how every dollar of the requested grant will be used — vague descriptions leave you exposed.",
          category: "Applications",
        },
        {
          id: "g-4",
          item: "Three business references with current contact information",
          description: "References should know your business well and be prepared to be contacted by the review committee.",
          category: "Correspondence",
        },
        {
          id: "g-5",
          item: "Proof of business registration and any required licenses or permits",
          description: "Demonstrates the business is legally operating in the jurisdiction as required by eligibility rules.",
          category: "Legal Documents",
        },
        {
          id: "g-6",
          item: "Business plan or executive summary",
          description: "The primary scoring factor — quality and clarity of your business plan are weighted most heavily in the review.",
          category: "Applications",
        },
      ],
      whatToSay: [
        {
          id: "s-1",
          label: "Asking a clarifying question before the submission deadline",
          draft: "Hello,\n\nI am preparing my application for the Small Business Community Grant and have a question I wanted to clarify before submitting. [Describe your specific question here.]\n\nCould you help me understand how to address this correctly in my application? I want to make sure I'm presenting everything as required before the deadline.\n\nThank you for any guidance,\n[Your Name]\n[Business Name]\n[Contact Information]",
        },
        {
          id: "s-2",
          label: "Following up on application status after the deadline",
          draft: "Hello,\n\nI submitted my application for the Small Business Community Grant on [Date]. I wanted to confirm that the application was received in full and is complete.\n\nIf any information is missing or if there are follow-up items needed, please let me know as soon as possible so I can respond promptly. I can be reached at [Phone/Email].\n\nThank you,\n[Your Name]\n[Business Name]",
        },
        {
          id: "s-3",
          label: "Requesting information about the review timeline",
          draft: "Hello,\n\nI submitted my application for the Small Business Community Grant on [Date]. I understand that award decisions are communicated within 90 days of the submission deadline.\n\nIs there any way to check on application status during the review period, or are applicants notified if there are issues with their submission?\n\nThank you,\n[Your Name]",
        },
      ],
      beforeYouActChecklist: [
        {
          id: "ba-1",
          text: "Cross-check every financial figure in the application against your most recently filed tax returns — every number must match exactly.",
        },
        {
          id: "ba-2",
          text: "Verify your business meets all stated eligibility requirements: years in operation, employee count, revenue range, location, and ownership structure.",
        },
        {
          id: "ba-3",
          text: "Confirm the packet is 100% complete — no blank fields, missing signatures, or missing attachments of any kind.",
        },
        {
          id: "ba-4",
          text: "Have a trusted colleague or advisor review your project narrative for clarity and completeness before submitting.",
        },
        {
          id: "ba-5",
          text: "Confirm the submission method (physical packet or single PDF) and exact deadline time — 5:00 PM on the due date.",
        },
      ],
    },
    keyTerms: [
      {
        id: "kt-1",
        term: "Incomplete Application = Automatic Disqualification",
        severity: "high",
        category: "Submission Rules",
        explanation: "Any incomplete field, missing signature, or missing required document results in automatic disqualification. The review committee does not evaluate incomplete submissions.",
        whyItMatters: "There is no opportunity to correct a partial submission. One missing item — even a signature — eliminates your application entirely regardless of the quality of your content.",
        watchOut: "Use the provided checklist to verify every item before submitting. Have a second person review the complete packet for anything missing.",
      },
      {
        id: "kt-2",
        term: "Repayment Obligation for Misuse of Funds",
        severity: "high",
        category: "Repayment Obligation",
        explanation: "If awarded, misuse of grant funds — defined as spending on anything not explicitly listed in your approved project description — requires full repayment of the grant amount.",
        whyItMatters: "You could receive the grant, spend the money on something business-related but not specifically approved, and be required to repay the full amount with interest.",
        watchOut: "Get explicit written confirmation from the program administrator before using funds for any purpose not directly named in your approved project description.",
        questionToAsk: "What is the process for requesting an amendment to the approved use of funds if circumstances change after award?",
      },
      {
        id: "kt-3",
        term: "Funds Restricted to Approved Use Only",
        severity: "high",
        category: "Restrictions",
        explanation: "Grant funds may only be used for the specific project described in your application. Personal expenses, debt repayment, working capital, and operating costs are explicitly excluded.",
        whyItMatters: "Even well-intentioned uses of the money that fall outside the approved description are treated as misuse, triggering the repayment clause.",
        watchOut: "Be very precise in your project description. Vague descriptions like 'business improvements' may not protect you if questioned later.",
      },
      {
        id: "kt-4",
        term: "Financial Statements Must Match Tax Returns Exactly",
        severity: "high",
        category: "Accuracy",
        explanation: "All financial statements submitted with the application must exactly match your most recently filed tax returns. Reviewers cross-check these documents during scoring.",
        whyItMatters: "Any discrepancy — even a minor rounding difference — can trigger disqualification or flag your application for additional review, slowing or killing your chances.",
        watchOut: "Have your accountant prepare or verify the financial statements before submission. Do not round figures or use estimates if your tax returns show exact amounts.",
        questionToAsk: "If my financials were recently amended or restated, which version should I submit?",
      },
      {
        id: "kt-5",
        term: "Competitive Selection — Award Not Guaranteed",
        severity: "medium",
        category: "Selection",
        explanation: "This is a competitive grant program. Submitting a complete, eligible application does not guarantee funding. Applications are scored, and higher-scoring applications receive awards first until the pool is exhausted.",
        whyItMatters: "Many qualified applicants may be rejected simply because others scored higher. A technically complete application with a weak business plan may still not receive funding.",
        watchOut: "Invest serious effort in the project narrative and business plan — these are the primary scoring factors. A strong plan in a weak financial position still outscores a weak plan in a strong financial position.",
      },
      {
        id: "kt-6",
        term: "Progress and Final Reporting Obligation",
        severity: "medium",
        category: "Compliance",
        explanation: "If awarded, you must submit a written progress report at the 6-month mark and a final report within 30 days of project completion.",
        whyItMatters: "Failure to submit required reports can result in grant clawback and disqualification from future city grant programs. This obligation continues after you receive the money.",
        watchOut: "Track your report deadlines from the day of award, not the day you start spending. The 6-month clock starts at award date, regardless of when you begin your project.",
      },
      {
        id: "kt-7",
        term: "No Email Submissions Accepted",
        severity: "medium",
        category: "Submission Rules",
        explanation: "All application materials must be submitted as a single complete packet — either in person or as a single PDF to the City Economic Development Office. Email submissions are explicitly rejected.",
        whyItMatters: "Submitting by email, even if you receive an auto-reply confirming receipt, does not count as a valid submission. Your application will not be reviewed.",
        watchOut: "If submitting as a PDF, confirm the file size limit and accepted file format. If submitting in person, allow time for the office to officially stamp your packet before the deadline.",
        questionToAsk: "What is the exact deadline time on the due date — end of business day, or a specific time like 5:00 PM?",
      },
    ],
    plainEnglish: {
      whatItIs:
        "This is a competitive grant application form used by small businesses to request community development funding. The program awards grants between $5,000 and $25,000 to eligible businesses for approved uses such as equipment purchases, facility improvements, or new hires.",
      whatItSays:
        "The application describes the grant's purpose, eligibility requirements, approved uses of funds, and the review process. It explains the scoring criteria, required supporting documents, and the timeline from application to award announcement 90 days later.",
      whatItAsks:
        "You are asked to submit a detailed business plan, current financial statements, a project description explaining how the funds will be used, and at least three business references. All materials must be submitted by the deadline in one complete package.",
      obligations:
        "If awarded, you agree to use the funds only for the approved purposes described in your application. You may be required to provide receipts or progress reports. Misuse of grant funds may require repayment and could disqualify you from future programs.",
      payAttentionTo:
        "This is a competitive program — the quality of your business plan and project narrative is the primary scoring factor. Financial statements must exactly match your tax returns; discrepancies can disqualify your application. Incomplete submissions are not accepted.",
      nextSteps:
        "Start by confirming you meet all eligibility requirements. Then gather your most recent financial statements and have them verified by an accountant. Draft your project description clearly explaining the specific use and expected impact of the grant funds.",
    },
  },
};
