import { v4 as uuidv4 } from "uuid";
import type { TrustCheckAnalysis } from "./types.js";

export const trustCheckDemoDocuments: Record<string, TrustCheckAnalysis> = {
  "fake-utility-shutoff": {
    id: "demo-tc-utility",
    processedAt: new Date().toISOString(),
    riskScore: 87,
    verdict: "High scam risk",
    verdictExplanation:
      "This notice shows multiple high-severity indicators of a utility scam. It demands payment exclusively via gift cards — a method no legitimate utility company would accept — and uses urgent threat language to pressure immediate action. The combination of gift-card payment demand, a 48-hour shutoff threat, and an unverified phone number suggests this is very likely not a legitimate utility notice.",
    whatItClaims:
      "The letter claims to be from Citywide Electric Services, stating the recipient has an overdue balance of $287.50. It claims the account is scheduled for immediate service disconnection unless payment is made within 48 hours.",
    demandedAction:
      "The letter demands the recipient call a toll-free number immediately and pay $287.50 using Google Play gift cards or wire transfer. It states that card numbers must be read over the phone to prevent service shutoff.",
    scamIndicators: [
      {
        indicator: "Gift card payment demand",
        severity: "high",
        sourceEvidence: "Pay using Google Play gift cards by calling 1-855-289-4471 within 48 hours.",
      },
      {
        indicator: "Wire transfer as alternative payment",
        severity: "high",
        sourceEvidence: "Alternatively, wire funds immediately to account 447821930 at First National Holdings.",
      },
      {
        indicator: "Extreme time pressure — 48-hour shutoff threat",
        severity: "high",
        sourceEvidence: "Service will be permanently disconnected within 48 hours of this notice.",
      },
      {
        indicator: "No official account number or service reference",
        severity: "medium",
        sourceEvidence: "No account number, customer ID, or service address referenced in the notice.",
      },
      {
        indicator: "Unverified phone number not matching known utility",
        severity: "medium",
        sourceEvidence: "Contact our billing department at 1-855-289-4471 to resolve immediately.",
      },
      {
        indicator: "Generic greeting — no customer name",
        severity: "low",
        sourceEvidence: "Dear Valued Customer,",
      },
    ],
    contactDetails: [
      {
        type: "phone",
        value: "1-855-289-4471",
        suspicious: true,
        note: "Verify this number against your actual utility provider's official website — do not call until confirmed",
      },
    ],
    deadlines: [
      { text: "48 hours", type: "threat", note: "Shutoff threat if payment not received" },
      { text: "Immediately", type: "relative" },
    ],
    whatToVerify: [
      "Call your utility company at the number printed on your actual bill or their official website — not the number in this letter",
      "Log in to your utility account online to check your real balance and account status",
      "Confirm whether 'Citywide Electric Services' is actually your utility provider",
      "Contact your state's public utility commission if you cannot verify the sender",
      "Check whether the account number on this letter matches your real account number",
    ],
    safeNextSteps: [
      "Do not call the number in this letter until you have verified it through your utility provider's official website",
      "Do not purchase any gift cards — no legitimate utility company accepts gift card payments",
      "Look up your actual utility company's customer service number on their official website or your monthly bill",
      "Log into your account online to check your real balance and payment status",
      "If you cannot verify the sender, report this to the FTC at reportfraud.ftc.gov",
      "Preserve this document — it may be useful if you report it to authorities",
    ],
  },

  "fake-irs-collection": {
    id: "demo-tc-irs",
    processedAt: new Date().toISOString(),
    riskScore: 96,
    verdict: "High scam risk",
    verdictExplanation:
      "This document contains multiple hallmarks of an IRS impersonation scam — one of the most common fraud schemes in the United States. The IRS never demands cryptocurrency or gift card payments, never threatens immediate arrest in a first notice, and never demands payment without first mailing an official bill. The combination of these factors indicates this is almost certainly not a legitimate IRS communication.",
    whatItClaims:
      "The letter claims to be from the Internal Revenue Service, asserting the recipient owes $4,382.17 in unpaid federal taxes and penalties from prior years. It claims a federal arrest warrant will be issued within 24 hours if payment is not made.",
    demandedAction:
      "The letter demands the recipient call an agent immediately and pay $4,382.17 in Bitcoin or iTunes gift cards. It states that failure to respond will result in immediate arrest and asset seizure.",
    scamIndicators: [
      {
        indicator: "Bitcoin / cryptocurrency payment demand",
        severity: "high",
        sourceEvidence: "Payment must be made via Bitcoin to wallet address 1A2B3c4D5e6F... or via iTunes gift cards.",
      },
      {
        indicator: "Threat of immediate arrest in first notice",
        severity: "high",
        sourceEvidence: "A federal arrest warrant will be issued within 24 hours if payment is not received.",
      },
      {
        indicator: "Gift card payment demand (iTunes)",
        severity: "high",
        sourceEvidence: "Call immediately with iTunes gift card numbers ready for processing.",
      },
      {
        indicator: "Extreme urgency — 24-hour arrest threat",
        severity: "high",
        sourceEvidence: "You have 24 hours to respond before law enforcement is dispatched to your location.",
      },
      {
        indicator: "IRS does not contact taxpayers by phone first",
        severity: "high",
        sourceEvidence: "The IRS communicates through official mail — not unsolicited calls demanding immediate payment.",
      },
      {
        indicator: "No official case number or notice number",
        severity: "medium",
        sourceEvidence: "No CP notice number, EIN, or SSN referenced to verify the tax year or account.",
      },
      {
        indicator: "Vague sender identity — no district office named",
        severity: "medium",
        sourceEvidence: "Signed by 'Agent Williams, Federal Tax Collection Division' with no badge number or office address.",
      },
    ],
    contactDetails: [
      {
        type: "phone",
        value: "1-800-TAX-9182",
        suspicious: true,
        note: "This is not the IRS's official number. IRS can be reached at 1-800-829-1040.",
      },
    ],
    deadlines: [
      { text: "24 hours", type: "threat", note: "Claimed arrest warrant timing" },
      { text: "Immediately", type: "relative" },
    ],
    whatToVerify: [
      "The IRS will always send a written notice by mail before contacting you — check your mail for any official IRS CP notices",
      "Call the IRS directly at 1-800-829-1040 (their official number) to check whether you have any outstanding balance",
      "Log into IRS.gov and check your tax account to see if any balance is owed",
      "Verify that the letter has an official IRS letterhead, notice number (e.g., CP2000, CP14), and return address",
      "The IRS never accepts Bitcoin, gift cards, wire transfer, or cryptocurrency — any demand for these is a scam",
    ],
    safeNextSteps: [
      "Do not call the number in this letter — it is not the IRS",
      "Do not purchase any gift cards or Bitcoin — the IRS does not accept these payment methods under any circumstances",
      "Visit IRS.gov and log into 'View Your Account' to check your actual tax balance",
      "Call the real IRS at 1-800-829-1040 if you have questions about your tax account",
      "Report this document to the IRS at phishing@irs.gov and the FTC at reportfraud.ftc.gov",
      "Preserve this document in case you choose to file a report with local law enforcement",
    ],
  },

  "debt-collection-letter": {
    id: "demo-tc-debt",
    processedAt: new Date().toISOString(),
    riskScore: 55,
    verdict: "Suspicious — verify before acting",
    verdictExplanation:
      "This letter appears to be from a debt collection company but shows several indicators that warrant caution before taking action. The demand for Western Union payment, combined with missing account reference numbers and aggressive legal language, suggests this may not be from a legitimate collection agency — or the terms may be significantly different from what is legally owed. Verification through official channels is strongly recommended before making any payment.",
    whatItClaims:
      "The letter claims to be from National Credit Recovery Associates, asserting the recipient owes $1,847.32 to a former credit card issuer. It claims the account has been referred for legal processing and threatens a civil judgment.",
    demandedAction:
      "The letter demands the recipient pay $1,847.32 via Western Union or money order within 10 days to avoid a civil judgment. It offers a 'settlement' option of $923.66 if paid within 5 days.",
    scamIndicators: [
      {
        indicator: "Western Union payment demand",
        severity: "high",
        sourceEvidence: "Payment must be submitted via Western Union or money order only — no exceptions.",
      },
      {
        indicator: "Missing original account number or creditor reference",
        severity: "medium",
        sourceEvidence: "No original account number, creditor name, or date of default referenced.",
      },
      {
        indicator: "Aggressive legal language without case number",
        severity: "medium",
        sourceEvidence: "Legal proceedings will commence immediately — no court case number or jurisdiction named.",
      },
      {
        indicator: "Unusual 'settlement' pressure within 5 days",
        severity: "medium",
        sourceEvidence: "Settle for 50% — offer expires in 5 days. This offer is non-negotiable.",
      },
      {
        indicator: "No FDCPA disclosure or validation notice",
        severity: "medium",
        sourceEvidence: "Missing the legally required 30-day validation notice under the Fair Debt Collection Practices Act.",
      },
    ],
    contactDetails: [
      {
        type: "phone",
        value: "1-877-334-9921",
        suspicious: true,
        note: "Verify this number is associated with a legitimate licensed collection agency before calling",
      },
      {
        type: "email",
        value: "collections@natcreditrecovery.net",
        suspicious: true,
        note: "Verify the domain is registered to a legitimate business before responding",
      },
    ],
    deadlines: [
      { text: "5 days", type: "relative", note: "Claimed settlement offer expiry" },
      { text: "10 days", type: "threat", note: "Claimed judgment filing deadline" },
    ],
    whatToVerify: [
      "Request written debt validation — under the FDCPA, you have 30 days to request proof of the debt in writing",
      "Look up 'National Credit Recovery Associates' in your state's licensed debt collector registry",
      "Check your credit report (annualcreditreport.com) to see whether this debt appears",
      "Confirm the original creditor name, account number, and date the debt allegedly originated",
      "Do not make any payment until you have confirmed the debt is valid and the collector is licensed",
    ],
    safeNextSteps: [
      "Send a written debt validation letter to the collector within 30 days — they must stop collection until they validate",
      "Do not pay via Western Union or money order — use traceable payment methods only if you verify the debt is legitimate",
      "Check your credit report for any record of this debt at annualcreditreport.com",
      "Search your state attorney general's website for the collector's license status",
      "If you believe this is fraudulent, report it to the FTC and your state attorney general",
      "Consider consulting a consumer rights attorney — many offer free consultations for FDCPA violations",
    ],
  },

  "legitimate-utility-notice": {
    id: "demo-tc-legit",
    processedAt: new Date().toISOString(),
    riskScore: 8,
    verdict: "Likely legitimate",
    verdictExplanation:
      "This notice shows the characteristics of a standard, legitimate late payment reminder from a utility company. It references a specific account number, provides multiple official payment channels, does not demand unusual payment methods, and gives a reasonable response timeframe. While it should still be verified against your account, no significant scam indicators are present.",
    whatItClaims:
      "The notice is from Metro Water & Power, referencing account number MW-7734219-B, stating the recipient has an outstanding balance of $94.17 for services rendered in October. A late payment fee of $8.50 will apply if not paid by the due date.",
    demandedAction:
      "The notice asks the recipient to pay $94.17 by November 15 via the utility's website, automated phone system, mail-in check, or in-person at any district office. It provides the official 24-hour account line for questions.",
    scamIndicators: [
      {
        indicator: "Generic closing — no agent name",
        severity: "low",
        sourceEvidence: "Sincerely, Customer Accounts Department",
      },
    ],
    contactDetails: [
      {
        type: "phone",
        value: "1-800-638-7700",
        suspicious: false,
        note: "Verify this matches the number on your Metro Water & Power account paperwork",
      },
      {
        type: "url",
        value: "https://www.metrowaterpower.gov/pay",
        suspicious: false,
        note: "Confirm this URL matches the utility's official website before entering payment information",
      },
    ],
    deadlines: [
      { text: "November 15", type: "explicit_date", note: "Payment due date" },
    ],
    whatToVerify: [
      "Confirm account number MW-7734219-B matches your actual Metro Water & Power account number",
      "Verify the balance matches what is shown in your online account or previous bill",
      "Confirm the payment URL (metrowaterpower.gov) is the utility's official domain before entering payment information",
    ],
    safeNextSteps: [
      "Log into your Metro Water & Power online account to verify the balance and due date",
      "Pay through the official website (metrowaterpower.gov) or their automated phone line — not through third-party links",
      "Keep a record of your payment confirmation number",
    ],
  },
};
