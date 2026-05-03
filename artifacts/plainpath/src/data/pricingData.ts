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
      "Analyze any document in plain English — unlimited access to PlainPath's core analysis tool.",
    features: [
      "Analyze a Document (unlimited)",
      "Plain-English document summary",
      "Key terms, deadlines, and required actions",
      "Document Risk Score",
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
      "Everything in Starter plus Contract Review — unlimited clause-by-clause risk analysis before you sign.",
    features: [
      "Everything in Starter",
      "Contract Review — clause-by-clause risk and negotiation analysis",
      "Negotiate This — AI counter-language for risky clauses",
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
