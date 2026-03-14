import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import cbtwiseLogo from "@/assets/cbtwise-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash (before Supabase clears it)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    }

    // Also listen for PASSWORD_RECOVERY event from Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValid(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img src={cbtwiseLogo} alt="CBTWise" className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain" />
            <h1 className="font-display text-2xl font-bold">Set New Password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>

          {!valid ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Invalid or expired reset link. Please request a new one.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/forgot-password")}>
                Request New Link
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
