import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface UpgradeGateProps {
  title: string;
  message: string;
  used: number;
  limit: number;
  unit: string;
}

const UpgradeGate = ({ title, message, used, limit, unit }: UpgradeGateProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container flex max-w-md flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-accent/10 p-4 mb-6">
          <Lock className="h-8 w-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <div className="rounded-xl border border-border bg-card p-4 w-full mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{unit} used today</span>
            <span className="font-bold">{used} / {limit}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>
        <Button asChild className="gap-2">
          <Link to="/pricing">
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium
          </Link>
        </Button>
        <Button variant="outline" asChild className="mt-3">
          <Link to="/dashboard">← Back to Dashboard</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
};

export default UpgradeGate;
