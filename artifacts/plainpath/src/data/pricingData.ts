export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  planKey?: "starter" | "pro" | "team";
  highlight?: boolean;
  planned?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$4.99",
    period: "/month",
    description:
      "For individuals who occasionally need help understanding documents.",
    features: [
      "Up to 10 document analyses / month",
      "Plain English overview",
      "Key Terms + Basic Action Pack",
      "Local saved analyses",
      "Export / Share tools"
    ],
    ctaLabel: "Start with Starter",
    planKey: "starter"
  },
  {
    name: "Pro",
    price: "$24.99",
    period: "/month",
    description:
      "Everything in Starter, plus Document Trust Check and Contract Builder — the full PlainPath toolkit.",
    features: [
      "Up to 100 document analyses / month",
      "Plain English + source explainers",
      "Checklist, Required Docs, Deadlines, Risks",
      "Key Terms + Full Action Pack",
      "Document Trust Check — up to 30 / month",
      "Contract Builder — up to 10 drafts / month",
      "AI Insight panel across all tools",
      "Saved analyses + Export / Share tools"
    ],
    ctaLabel: "Get Pro",
    planKey: "pro",
    highlight: true
  },
  {
    name: "Team",
    price: "$49.99",
    period: "/month",
    description:
      "Higher limits and shared workflows for teams. Planned for a later release.",
    features: [
      "Everything in Pro",
      "Unlimited document analyses",
      "Unlimited Trust Checks",
      "Unlimited contract drafts",
      "Planned multi-user access",
      "Planned shared workflows + admin controls",
      "Priority support"
    ],
    ctaLabel: "Join Team Waitlist",
    planned: true
  }
];
