import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import cbtwiseLogo from "@/assets/cbtwise-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Purchase code states
  const [purchaseCode, setPurchaseCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [activatedCredentials, setActivatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const extractFunctionErrorMessage = async (error: unknown) => {
    const fallback = "Failed to redeem purchase code";

    if (!error || typeof error !== "object") return fallback;

    const maybeError = error as { message?: string; context?: Response };
    const response = maybeError.context;

    if (response) {
      try {
        const raw = await response.text();
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { error?: string; message?: string };
            if (parsed.error) return parsed.error;
            if (parsed.message) return parsed.message;
          } catch {
            return raw;
          }
        }
      } catch {
        // no-op
      }
    }

    return maybeError.message || fallback;
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseCode.trim()) {
      toast.error("Please enter your purchase code");
      return;
    }
    setCodeLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("redeem-purchase-code", {
        body: { code: purchaseCode.toUpperCase().trim() },
      });

      if (error) {
        const message = await extractFunctionErrorMessage(error);
        throw new Error(message);
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Show credentials and auto-sign in
      const { email: assignedEmail, password: assignedPassword } = data;
      setActivatedCredentials({ email: assignedEmail, password: assignedPassword });
      toast.success("Account activated! Signing you in...");

      const { error: signInError } = await signIn(assignedEmail, assignedPassword);
      if (!signInError) {
        navigate("/dashboard");
      } else {
        toast.error("Account created but auto-login failed. Use the credentials below to log in.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : await extractFunctionErrorMessage(error);
      toast.error(message || "Failed to redeem purchase code");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <img src={cbtwiseLogo} alt="CBTWise" className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain" />
            <h1 className="font-display text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Log in to continue your exam prep</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="code">Purchase Code</TabsTrigger>
            </TabsList>

            {/* Standard login */}
            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Log in
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
              </p>
            </TabsContent>

            {/* Purchase code redemption */}
            <TabsContent value="code">
              {activatedCredentials ? (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium">Your login credentials have been created:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-mono text-sm">{activatedCredentials.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(activatedCredentials.email, "email")}>
                        {copiedField === "email" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Password</p>
                        <p className="font-mono text-sm">{activatedCredentials.password}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(activatedCredentials.password, "password")}>
                        {copiedField === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Save these credentials — you'll need them to log in next time.</p>
                  <Button className="w-full" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleCodeSubmit}>
                  <div>
                    <Label htmlFor="purchaseCode">Purchase Code</Label>
                    <Input
                      id="purchaseCode"
                      type="text"
                      placeholder="CBT-XXXX-XXXX-XXXX"
                      value={purchaseCode}
                      onChange={(e) => setPurchaseCode(e.target.value.toUpperCase())}
                      className="font-mono tracking-widest"
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the purchase code provided by your admin. Your login credentials are already assigned to the code.
                    </p>
                  </div>
                  <Button className="w-full" type="submit" disabled={codeLoading}>
                    {codeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Activate & Login
                  </Button>
                </form>
              )}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already activated?{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    const tab = document.querySelector('[data-value="login"]') as HTMLElement;
                    tab?.click();
                  }}
                >
                  Log in here
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
