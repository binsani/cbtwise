import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import cbtwiseLogo from "@/assets/cbtwise-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img src={cbtwiseLogo} alt="CBTWise" className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain" />
            <h1 className="font-display text-2xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted-foreground">We'll send you a link to reset your password</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
