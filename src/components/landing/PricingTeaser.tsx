import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    features: ["20 questions/day", "3 mock exams/month", "Basic score reports", "All 3 exam types"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    price: "₦1,500",
    period: "/month",
    features: [
      "Unlimited questions",
      "Unlimited mock exams",
      "Full explanations",
      "Performance analytics",
      "Weak topic recommendations",
      "Priority support",
    ],
    cta: "Go Premium",
    popular: true,
  },
  {
    name: "Annual",
    price: "₦12,000",
    period: "/year",
    features: [
      "Everything in Premium",
      "Save ₦6,000/year",
      "Offline question packs",
      "Early access to new features",
    ],
    cta: "Save with Annual",
    popular: false,
  },
];

const PricingTeaser = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">Simple, Student-Friendly Pricing</h2>
          <p className="text-muted-foreground">Start free. Upgrade when you're ready to go all in.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="mb-1 font-display text-lg font-bold">{plan.name}</h3>
              <div className="mb-4">
                <span className="font-display text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
                asChild
              >
                <Link to="/pricing">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;
