export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    period: "/ forever",
    description: "Perfect for small schools getting started.",
    cta: "Start free",
    features: [
      "Up to 100 students",
      "5 teacher accounts",
      "Basic attendance",
      "Grade entry",
      "Email support",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "$49",
    period: "/ month",
    description: "Everything a growing school needs.",
    cta: "Start 30-day trial",
    featured: true,
    features: [
      "Up to 1,000 students",
      "Unlimited teachers",
      "Fee management",
      "Parent portal",
      "Advanced reports",
      "SMS notifications",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large institutions and school networks.",
    cta: "Talk to sales",
    features: [
      "Unlimited students",
      "Multi-school management",
      "Custom integrations",
      "Dedicated success manager",
      "On-premise option",
      "SSO & SAML",
      "SLA guarantee",
    ],
  },
];
