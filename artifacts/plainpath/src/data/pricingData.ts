export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  planKey?: "starter" | "pro";
  highlight?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$4.99",
    period: "/month",
    description:
      "Analyze any document in plain English — unlimited use of one core workflow.",
    features: [
      "Analyze a Document (unlimited)",
      "Plain-English document summary",
      "Key terms, deadlines, and required actions",
      "Local saved analyses",
      "Export and share tools"
    ],
    ctaLabel: "Start with Starter",
    planKey: "starter"
  },
  {
    name: "Pro",
    price: "$29.99",
    period: "/month",
    description:
      "All 5 live tools in one plan — unlimited use across every workflow.",
    features: [
      "Everything in Starter",
      "Document Trust Check — verify legitimacy and detect fraud",
      "Contract Review — clause-by-clause risk and negotiation analysis",
      "Build a Contract — guided wizard with professional draft output",
      "Redact sensitive info before sharing or review",
      "Saved analysis history",
      "Premium output and workflow tools"
    ],
    ctaLabel: "Get Pro",
    planKey: "pro",
    highlight: true
  }
];
