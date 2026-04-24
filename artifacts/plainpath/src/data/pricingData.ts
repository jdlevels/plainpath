export type PricingPlan = {
  name: string;
  price: string;
  annualPrice?: string;
  annualTotal?: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  planKey?: "starter" | "pro" | "team";
  highlight?: boolean;
  planned?: boolean;
  seats?: number;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$4.99",
    annualPrice: "$4.08",
    annualTotal: "$49",
    period: "/month",
    description:
      "Analyze and redact documents in plain English — unlimited use of two core tools.",
    features: [
      "Analyze a Document (unlimited)",
      "Redact Sensitive Info (automatic PII removal)",
      "Plain-English document summary",
      "Key terms, deadlines, and required actions",
      "Document Risk Score",
      "Ask PlainPath — chat with your document",
      "Local saved analyses",
      "Export and share tools"
    ],
    ctaLabel: "Start with Starter",
    planKey: "starter"
  },
  {
    name: "Pro",
    price: "$19.99",
    annualPrice: "$16.58",
    annualTotal: "$199",
    period: "/month",
    description:
      "Every tool in one plan — unlimited use across every workflow.",
    features: [
      "Everything in Starter",
      "Document Trust Check — verify legitimacy and detect fraud",
      "Contract Review — clause-by-clause risk and negotiation analysis",
      "Negotiate This — AI counter-language for risky clauses",
      "Build a Contract — guided wizard with professional draft output",
      "Compare Versions — side-by-side document comparison and audit",
      "Clause Extractor — obligations, key dates, parties, and legal clauses",
      "Saved analysis history",
      "Premium output and workflow tools"
    ],
    ctaLabel: "Get Pro",
    planKey: "pro",
    highlight: true
  },
  {
    name: "Team",
    price: "$29.99",
    annualPrice: "$24.08",
    annualTotal: "$289",
    period: "/month",
    description:
      "All Pro tools for up to 3 users — couples, families, or small business partners.",
    features: [
      "Everything in Pro",
      "Up to 3 users on one subscription",
      "Each member gets full Pro access",
      "Owner controls team membership",
      "Perfect for couples, families, or partners",
      "One invoice, one payment"
    ],
    ctaLabel: "Start Team Plan",
    planKey: "team",
    seats: 3
  }
];
