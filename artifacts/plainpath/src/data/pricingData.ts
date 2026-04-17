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
      "Unlimited document analysis — plain English breakdowns of any document, any time.",
    features: [
      "Unlimited document analyses",
      "Plain English overview",
      "Key Terms + Basic Action Pack",
      "Deadlines, Required Docs",
      "Local saved analyses",
      "Export / Share tools"
    ],
    ctaLabel: "Start with Starter",
    planKey: "starter"
  },
  {
    name: "Pro",
    price: "$29.99",
    period: "/month",
    description:
      "Full access to all 5 live tools — Analyze, Trust Check, Contract Builder, Contract Review, and Redact. Unlimited use across every tool.",
    features: [
      "Everything in Starter",
      "Unlimited Document Trust Checks",
      "Unlimited Contract Builder drafts",
      "Unlimited Contract Reviews",
      "Unlimited Redactions",
      "Full Action Pack across all tools",
      "Source section explainers",
      "AI Insight panel across all tools",
      "Saved analysis history"
    ],
    ctaLabel: "Get Pro",
    planKey: "pro",
    highlight: true
  }
];
