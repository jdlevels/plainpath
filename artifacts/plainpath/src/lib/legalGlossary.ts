export interface LegalGlossaryEntry {
  formalName: string;
  definition: string;
  learnMoreUrl?: string;
}

/**
 * Plain-English legal definitions for common contract clauses and legal terms.
 * Definitions written in accessible language, referencing Cornell LII and consumer law sources.
 * Keys are lowercase search strings — a term card matches if its text contains the key.
 */
export const LEGAL_GLOSSARY: Array<{ keys: string[]; entry: LegalGlossaryEntry }> = [
  {
    keys: ["arbitration"],
    entry: {
      formalName: "Arbitration Clause",
      definition:
        "Requires disputes to be resolved by a private arbitrator instead of a court. You typically lose the right to sue in court or appeal the decision. Mandatory arbitration is common in consumer contracts and often favors the company.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/arbitration",
    },
  },
  {
    keys: ["class action", "class-action"],
    entry: {
      formalName: "Class Action Waiver",
      definition:
        "Prevents you from joining a group lawsuit with others who have the same complaint. You must pursue any claim alone, which makes small individual claims economically impractical to pursue.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/class_action",
    },
  },
  {
    keys: ["acceleration clause", "accelerate"],
    entry: {
      formalName: "Acceleration Clause",
      definition:
        "Allows the lender or creditor to demand the entire remaining balance immediately if you miss a payment or violate a term. Your next payment could become the full loan balance.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/acceleration_clause",
    },
  },
  {
    keys: ["confession of judgment", "cognovit"],
    entry: {
      formalName: "Confession of Judgment (Cognovit Note)",
      definition:
        "Authorizes the lender to obtain a court judgment against you without notice or hearing. You waive your right to defend yourself. Banned in many states for consumer loans.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/confession_of_judgment",
    },
  },
  {
    keys: ["personal guarantee", "personal guaranty", "personal guarantor"],
    entry: {
      formalName: "Personal Guarantee",
      definition:
        "Makes you personally liable for a debt even if it belongs to a business or another party. Creditors can pursue your personal assets — home, savings, wages — if the primary borrower defaults.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/guaranty",
    },
  },
  {
    keys: ["cross-collateral", "cross collateral"],
    entry: {
      formalName: "Cross-Collateralization",
      definition:
        "Your collateral for one loan automatically secures all your other debts with the same lender. Defaulting on a credit card could put your car or home at risk, even if those loans are current.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/cross-collateralization",
    },
  },
  {
    keys: ["dragnet clause", "future advances"],
    entry: {
      formalName: "Dragnet / Future Advances Clause",
      definition:
        "Extends the collateral you pledged today to cover any future loans or debts with the same lender. Taking out a second loan could put your existing collateral at risk.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/dragnet_clause",
    },
  },
  {
    keys: ["waiver of jury trial", "jury trial waiver", "waives jury"],
    entry: {
      formalName: "Jury Trial Waiver",
      definition:
        "You give up your constitutional right to have a jury decide disputes. Cases are decided solely by a judge. Common in credit card, mortgage, and business agreements.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/jury_trial",
    },
  },
  {
    keys: ["indemnif", "hold harmless"],
    entry: {
      formalName: "Indemnification / Hold Harmless",
      definition:
        "Requires you to pay the other party's legal costs, damages, and losses — even for their own negligence. In consumer contracts this is often one-sided, protecting only the company.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/indemnification",
    },
  },
  {
    keys: ["limitation of liability"],
    entry: {
      formalName: "Limitation of Liability",
      definition:
        "Caps the amount a company can be held responsible for, regardless of actual harm caused. Often set to the amount you paid for the service, leaving you to absorb larger losses.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/limitation_of_liability",
    },
  },
  {
    keys: ["consequential damage", "incidental damage", "indirect damage"],
    entry: {
      formalName: "Exclusion of Consequential Damages",
      definition:
        "Prevents you from recovering losses that flow from a breach — lost income, downstream costs, or other harms beyond the direct loss. Courts generally enforce these in commercial contracts.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/consequential_damages",
    },
  },
  {
    keys: ["right of setoff", "right of offset", "right to setoff", "right to offset"],
    entry: {
      formalName: "Right of Setoff",
      definition:
        "Allows a bank or lender to take money directly from your other accounts held with them to cover a debt. If you miss a loan payment, they can sweep your checking account without notice.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/right_of_setoff",
    },
  },
  {
    keys: ["deficiency balance", "deficiency judgment"],
    entry: {
      formalName: "Deficiency Judgment",
      definition:
        "If collateral is repossessed and sold for less than what you owe, you remain liable for the difference. A deficiency judgment lets the lender sue you for that remaining amount.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/deficiency_judgment",
    },
  },
  {
    keys: ["repossession"],
    entry: {
      formalName: "Repossession",
      definition:
        "The creditor can take back financed property (car, equipment) if you miss payments — often without a court order. Some states allow self-help repossession with no advance notice.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/repossession",
    },
  },
  {
    keys: ["force-placed insurance", "lender-placed insurance"],
    entry: {
      formalName: "Force-Placed Insurance",
      definition:
        "If you let your own insurance lapse, the lender buys coverage on your behalf and charges you — at rates far higher than market. The policy protects the lender, not you.",
      learnMoreUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-force-placed-insurance-en-1030/",
    },
  },
  {
    keys: ["balloon payment"],
    entry: {
      formalName: "Balloon Payment",
      definition:
        "A large lump-sum payment due at the end of a loan term, sometimes equal to most of the original principal. If you cannot pay or refinance, you may lose the asset.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/balloon_payment",
    },
  },
  {
    keys: ["negative amortization"],
    entry: {
      formalName: "Negative Amortization",
      definition:
        "Unpaid interest is added to the loan principal, making your balance grow even when you make payments. Common in some adjustable-rate mortgages and income-driven loan products.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/negative_amortization",
    },
  },
  {
    keys: ["liquidated damages"],
    entry: {
      formalName: "Liquidated Damages",
      definition:
        "A pre-set penalty amount specified in the contract for a particular breach. Courts enforce these when the amount is a reasonable estimate of actual harm — they can be difficult to challenge.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/liquidated_damages",
    },
  },
  {
    keys: ["prepayment penalty", "prepayment fee", "prepayment charge"],
    entry: {
      formalName: "Prepayment Penalty",
      definition:
        "A fee charged for paying off a loan early. It protects the lender's expected interest income, but limits your ability to refinance or escape a high-rate loan.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/prepayment_penalty",
    },
  },
  {
    keys: ["wage garnishment", "garnish your wages"],
    entry: {
      formalName: "Wage Garnishment",
      definition:
        "A court order requiring your employer to withhold a portion of your paycheck to satisfy a debt. Federal law limits garnishment to 25% of disposable income but some state exemptions are lower.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/garnishment",
    },
  },
  {
    keys: ["wage assignment"],
    entry: {
      formalName: "Wage Assignment",
      definition:
        "A voluntary agreement allowing a creditor to collect payments directly from your employer — without a court judgment. Many states restrict or prohibit wage assignments in consumer loans.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/wage_assignment",
    },
  },
  {
    keys: ["blanket lien"],
    entry: {
      formalName: "Blanket Lien",
      definition:
        "A security interest covering all of a borrower's present and future assets, not just specific collateral. The lender can claim virtually any property you own if you default.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/security_interest",
    },
  },
  {
    keys: ["security interest"],
    entry: {
      formalName: "Security Interest",
      definition:
        "A legal claim on property (collateral) given to a lender as assurance of repayment. If you default, the lender has the right to seize and sell the collateral.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/security_interest",
    },
  },
  {
    keys: ["auto-renewal", "automatic renewal", "automatically renews", "unless cancelled", "until cancelled"],
    entry: {
      formalName: "Auto-Renewal Clause",
      definition:
        "The contract renews automatically at the end of each period unless you cancel within a specific window. Missing the cancellation deadline can lock you into another full term.",
      learnMoreUrl: "https://www.ftc.gov/business-guidance/resources/negative-option-rule",
    },
  },
  {
    keys: ["non-disparagement"],
    entry: {
      formalName: "Non-Disparagement Clause",
      definition:
        "Prohibits you from making negative statements about the company or its products, even if truthful. Violating this clause can result in financial penalties and lawsuits.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/defamation",
    },
  },
  {
    keys: ["non-compete", "noncompete"],
    entry: {
      formalName: "Non-Compete Clause",
      definition:
        "Restricts you from working for competitors or starting a competing business for a defined period and geographic area. Enforceability varies widely by state; some states refuse to enforce them.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/non-compete_agreement",
    },
  },
  {
    keys: ["forum selection", "exclusive jurisdiction"],
    entry: {
      formalName: "Forum Selection Clause",
      definition:
        "Requires any lawsuit to be filed in a specific court or jurisdiction — often the company's home state. You may have to travel and hire attorneys in another state to pursue a claim.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/forum_selection_clause",
    },
  },
  {
    keys: ["choice of law", "governing law"],
    entry: {
      formalName: "Choice of Law Clause",
      definition:
        "Specifies which state's laws govern the contract, regardless of where you live or where the contract was signed. Some states have weaker consumer protections that may apply instead of your own.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/choice_of_law",
    },
  },
  {
    keys: ["may assign", "right to assign", "assign this agreement", "assignable without"],
    entry: {
      formalName: "Assignment Clause",
      definition:
        "Allows the company to transfer your contract — and your obligations — to another company without your consent. Your original terms may be preserved but your counterparty changes.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/assignment",
    },
  },
  {
    keys: ["may modify", "may amend", "right to modify", "may change these terms", "reserves the right to change"],
    entry: {
      formalName: "Unilateral Modification Clause",
      definition:
        "Allows the company to change the contract terms at any time, often with only limited notice. Your continued use of the service is typically treated as acceptance of the new terms.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/contract_modification",
    },
  },
  {
    keys: ["rollover", "roll over the loan"],
    entry: {
      formalName: "Rollover Provision",
      definition:
        "Allows a short-term loan (payday, title) to be extended by paying a fee instead of the principal. Each rollover resets the fee cycle, potentially trapping borrowers in a debt spiral.",
      learnMoreUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-payday-loan-en-1567/",
    },
  },
  {
    keys: ["right of rescission", "right to rescind", "cooling-off period"],
    entry: {
      formalName: "Right of Rescission",
      definition:
        "A federally protected right (under TILA) to cancel certain loan agreements within three business days without penalty. Does not apply to all loan types — notably not to purchase-money mortgages.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/rescission",
    },
  },
  {
    keys: ["attorneys' fees", "attorney fees", "attorney's fees", "prevailing party"],
    entry: {
      formalName: "Attorneys' Fees Clause",
      definition:
        "Shifts legal costs to the losing party, or one-sidedly requires you to pay the company's legal fees if they win. One-sided fee provisions can deter legitimate consumer claims.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/attorneys_fees",
    },
  },
  {
    keys: ["force majeure"],
    entry: {
      formalName: "Force Majeure Clause",
      definition:
        "Excuses a party from performing contractual obligations due to extraordinary events (natural disasters, pandemics, war). Courts interpret these clauses narrowly — ordinary business difficulty rarely qualifies.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/force_majeure",
    },
  },
  {
    keys: ["early termination"],
    entry: {
      formalName: "Early Termination Fee (ETF)",
      definition:
        "A penalty for cancelling a contract before its end date, often calculated as a lump sum or months of remaining service fees. The earlier you cancel, the higher the fee.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/liquidated_damages",
    },
  },
  {
    keys: ["penalty apr", "penalty rate", "default apr", "default rate"],
    entry: {
      formalName: "Penalty / Default APR",
      definition:
        "A significantly higher interest rate that applies when you miss a payment or violate a credit agreement term. On credit cards this can jump to 29.99% or more and apply to your entire balance.",
      learnMoreUrl: "https://www.consumerfinance.gov/ask-cfpb/what-is-a-penalty-rate-en-44/",
    },
  },
  {
    keys: ["evergreen"],
    entry: {
      formalName: "Evergreen Clause",
      definition:
        "A contract that renews automatically and indefinitely until one party gives formal notice. Without active cancellation, you may be bound perpetually with no natural end date.",
      learnMoreUrl: "https://www.law.cornell.edu/wex/contract",
    },
  },
];

/**
 * Find the best matching glossary entry for a key term name and category.
 * Returns the first entry whose search keys appear in the combined term text.
 */
export function findGlossaryEntry(termName: string, category?: string): LegalGlossaryEntry | null {
  const haystack = `${termName} ${category ?? ""}`.toLowerCase();
  for (const { keys, entry } of LEGAL_GLOSSARY) {
    if (keys.some((k) => haystack.includes(k.toLowerCase()))) {
      return entry;
    }
  }
  return null;
}
