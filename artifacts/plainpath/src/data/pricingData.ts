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
    price: "Free",
    period: "",
    description: "Try PlainPath and understand a few documents before upgrading.",
    features: [
      "3 analyses per month",
      "Built-in demo documents",
      "Plain English overview",
      "Basic action-plan preview",
      "Saved locally on your device"
    ],
    ctaLabel: "Start Free"
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    description: "Best for individuals who regularly need help understanding important documents.",
    features: [
      "Up to 100 analyses per month",
      "Plain English explanations",
      "Source Sections + section explainers",
      "Key Terms + Action Pack",
      "Saved Analyses",
      "Export / Share tools"
    ],
    ctaLabel: "Choose Pro",
    highlight: true
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For shared document workflows and higher volume use.",
    features: [
      "Planned multi-user access",
      "Higher monthly analysis limits",
      "Shared analysis workflows",
      "Admin / billing controls",
      "Priority support"
    ],
    ctaLabel: "Coming Soon",
    planned: true
  }
];
