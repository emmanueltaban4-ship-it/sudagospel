import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

type AuthMode = "signin" | "signup";
type AuthMethod = "email" | "phone";

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (method === "email") {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName },
              emailRedirectTo: window.location.origin,
            },
          });
          if (error) throw error;
          toast.success("Check your email to confirm your account!");
        } else {
          const { error } = await supabase.auth.signUp({
            phone,
            password,
            options: { data: { display_name: displayName } },
          });
          if (error) throw error;
          toast.success("Account created!");
          navigate("/");
        }
      } else {
        if (method === "email") {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signInWithPassword({ phone, password });
          if (error) throw error;
        }
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center mb-8">
          <img src={logo} alt="Sudagospel" className="h-16 w-16 mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {mode === "signin" ? "Welcome Back" : "Join Sudagospel"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin"
              ? "Sign in to your account"
              : "Create an account to start sharing gospel music"}
          </p>
        </div>

        {/* Method toggle */}
        <div className="flex rounded-full bg-muted p-1 mb-6">
          <button
            onClick={() => setMethod("email")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
              method === "email"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            onClick={() => setMethod("phone")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors ${
              method === "phone"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Phone className="h-4 w-4" /> Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="mt-1"
              />
            </div>
          )}

          {method === "email" ? (
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+211..."
                required
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </Layout>
  );
};

export default AuthPage;
