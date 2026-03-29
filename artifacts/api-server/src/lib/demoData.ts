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
