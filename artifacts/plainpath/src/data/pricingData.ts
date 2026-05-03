export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaLabel: string;
  planKey?: "pro" | "team";
  highlight?: boolean;
  planned?: boolean;
  seats?: number;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "PlainPath Pro",
    price: "$19.99",
    period: "/month",
    description:
      "Analyze any document in plain English and get a full contract review before you sign — both tools, one plan.",
    features: [
      "Analyze a Document",
      "Contract Review — clause-by-clause risk and negotiation analysis",
      "Plain-English summary and full action plan",
      "Key terms, deadlines, and required actions",
      "Saved analysis history",
      "Export and share tools"
    ],
    ctaLabel: "Get PlainPath Pro",
    planKey: "pro",
    highlight: true
  },
  {
    name: "Team",
    price: "$29.99",
    period: "/month",
    description:
      "All PlainPath Pro tools for up to 3 users — couples, families, or small business partners.",
    features: [
      "Everything in PlainPath Pro",
      "Up to 3 users on one subscription",
      "Each member gets full Pro access",
      "Owner controls team membership",
      "One invoice, one payment"
    ],
    ctaLabel: "Start Team Plan",
    planKey: "team",
    seats: 3
  }
];
