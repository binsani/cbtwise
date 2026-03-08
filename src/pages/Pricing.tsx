import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    description: "Get started with basic exam practice",
    features: ["20 questions per day", "3 mock exams per month", "Basic score reports", "All 3 exam types", "Community support"],
    limitations: ["No detailed explanations", "No analytics dashboard", "No weak topic recommendations"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Premium Monthly",
    price: "₦2,500",
    period: "/month",
    description: "Full access for serious exam candidates",
    features: ["Unlimited questions", "Unlimited mock exams", "Full detailed explanations", "Performance analytics", "Weak topic recommendations", "Bookmark & revision mode", "Priority support"],
    limitations: [],
    cta: "Go Premium",
    popular: true,
  },
  {
    name: "Premium Annual",
    price: "₦20,000",
    period: "/year",
    description: "Best value — save ₦10,000",
    features: ["Everything in Premium Monthly", "Save ₦10,000 per year", "Offline question packs", "Early access to new features", "Dedicated support"],
    limitations: [],
    cta: "Save with Annual",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-3 font-display text-3xl font-bold md:text-4xl">Simple, Student-Friendly Pricing</h1>
          <p className="text-muted-foreground">Start free. Upgrade when you're ready to go all in on your exam prep.</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.popular ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Most Popular
                </span>
              )}
              <h3 className="mb-1 font-display text-lg font-bold">{plan.name}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mb-6">
                <span className="font-display text-4xl font-bold">{plan.price}</span>
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
              <Button variant={plan.popular ? "default" : "outline"} className="w-full">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-sm text-muted-foreground">
            Payment integration coming soon via Paystack and Flutterwave. All plans include access to UTME, WAEC, and NECO questions.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
