export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href?: string;
  highlight?: boolean;
  planned?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$4.99",
    period: "/month",
    description:
      "For light users who need occasional help understanding important documents.",
    features: [
      "Up to 10 analyses per month",
      "Plain English overview",
      "Key Terms",
      "Basic Action Pack",
      "Local Saved Analyses",
      "Export / Share tools"
    ],
    ctaLabel: "Choose Starter"
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/month",
    description:
      "Best for regular users who need the full PlainPath document-understanding workflow.",
    features: [
      "Up to 100 analyses per month",
      "Plain English explanations",
      "Source Sections + section explainers",
      "Checklist + Required Docs",
      "Deadlines + Risks + What's Missing",
      "Key Terms + Full Action Pack",
      "Saved Analyses",
      "Export / Share tools"
    ],
    ctaLabel: "Choose Pro",
    highlight: true
  },
  {
    name: "Team",
    price: "$39.99",
    period: "/month",
    description:
      "For higher-volume or shared workflows. Planned for a later release.",
    features: [
      "Higher monthly analysis limits",
      "Planned shared workflows",
      "Planned multi-user access",
      "Planned admin / billing controls",
      "Priority support"
    ],
    ctaLabel: "Coming Soon",
    planned: true
  }
];
