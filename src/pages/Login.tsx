import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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
  const [codeName, setCodeName] = useState("");
  const [codeEmail, setCodeEmail] = useState("");
  const [codePassword, setCodePassword] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  
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

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('redeem-purchase-code', {
        body: {
          code: purchaseCode.toUpperCase(),
          email: codeEmail,
          password: codePassword,
          fullName: codeName,
        },
      });

      setCodeLoading(false);

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || "Account created successfully!");
      
      // Sign in the user
      const { error: signInError } = await signIn(codeEmail, codePassword);
      if (!signInError) {
        navigate("/dashboard");
      }
    } catch (error: any) {
      setCodeLoading(false);
      toast.error(error.message || "Failed to redeem purchase code");
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

            <TabsContent value="code">
              <form className="space-y-4" onSubmit={handleCodeSubmit}>
                <div>
                  <Label htmlFor="purchaseCode">Purchase Code</Label>
                  <Input 
                    id="purchaseCode" 
                    type="text" 
                    placeholder="CBT-XXXX-XXXX-XXXX" 
                    value={purchaseCode} 
                    onChange={(e) => setPurchaseCode(e.target.value.toUpperCase())} 
                    required 
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Enter the purchase code provided by admin</p>
                </div>
                <div>
                  <Label htmlFor="codeName">Full Name</Label>
                  <Input id="codeName" type="text" placeholder="John Doe" value={codeName} onChange={(e) => setCodeName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="codeEmail">Email</Label>
                  <Input id="codeEmail" type="email" placeholder="you@example.com" value={codeEmail} onChange={(e) => setCodeEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="codePassword">Password</Label>
                  <Input id="codePassword" type="password" placeholder="••••••••" value={codePassword} onChange={(e) => setCodePassword(e.target.value)} required />
                  <p className="mt-1 text-xs text-muted-foreground">Choose a password for your new account</p>
                </div>
                <Button className="w-full" type="submit" disabled={codeLoading}>
                  {codeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Activate & Login
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
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
