import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Eye, EyeOff, User } from "lucide-react";
import logo from "@/assets/logo.png";

type AuthView = "options" | "email-login" | "email-signup" | "phone-login" | "phone-signup";

const AuthPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>("options");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "email-signup") {
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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "phone-signup") {
        const { error } = await supabase.auth.signUp({
          phone,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        toast.success("Account created!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ phone, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  // Options screen (Audiomack style)
  if (view === "options") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Minimal top bar */}
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Centered card */}
        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="w-full max-w-sm">
            {/* Logo and title */}
            <div className="text-center mb-8">
              <img src={logo} alt="Sudagospel" className="h-12 w-12 mx-auto mb-4" />
              <h1 className="font-heading text-sm font-bold text-foreground uppercase tracking-widest">
                SIGN UP OR LOGIN TO SUDAGOSPEL
              </h1>
            </div>

            {/* Auth method buttons — stacked like Audiomack */}
            <div className="space-y-3">
              <button
                onClick={() => setView("email-login")}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card hover:bg-muted px-4 py-3.5 text-sm font-medium text-foreground transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                Continue with Email
              </button>

              <button
                onClick={() => setView("phone-login")}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card hover:bg-muted px-4 py-3.5 text-sm font-medium text-foreground transition-colors"
              >
                <Phone className="h-5 w-5 text-secondary" />
                Continue with Phone
              </button>
            </div>

            {/* Terms */}
            <p className="mt-8 text-center text-[11px] text-muted-foreground leading-relaxed">
              By signing into Sudagospel, you agree to our{" "}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <p className="mt-4 text-center">
              <span
                onClick={() => setView("email-login")}
                className="text-xs text-primary cursor-pointer hover:underline font-medium"
              >
                Having trouble signing in?
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email form
  const isEmailView = view === "email-login" || view === "email-signup";
  const isSignup = view === "email-signup" || view === "phone-signup";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar with back */}
      <div className="p-4">
        <button
          onClick={() => setView("options")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center mx-auto mb-4">
              {isEmailView ? <Mail className="h-5 w-5 text-primary" /> : <Phone className="h-5 w-5 text-secondary" />}
            </div>
            <h1 className="font-heading text-sm font-bold text-foreground uppercase tracking-widest">
              {isSignup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isSignup
                ? "Join the Sudagospel community"
                : `Sign in with your ${isEmailView ? "email" : "phone"}`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isEmailView ? handleEmailAuth : handlePhoneAuth} className="space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="displayName" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Display Name
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="pl-10 bg-card border-border rounded-lg h-11"
                  />
                </div>
              </div>
            )}

            {isEmailView ? (
              <div>
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-10 bg-card border-border rounded-lg h-11"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="phone" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone Number
                </Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+211..."
                    required
                    className="pl-10 bg-card border-border rounded-lg h-11"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-card border-border rounded-lg h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            {!isSignup && isEmailView && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold text-sm"
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          {/* Toggle signup/signin */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                if (isEmailView) {
                  setView(isSignup ? "email-login" : "email-signup");
                } else {
                  setView(isSignup ? "phone-login" : "phone-signup");
                }
              }}
              className="mt-1 text-sm font-semibold text-primary hover:underline"
            >
              {isSignup ? "Sign In" : "Create an Account"}
            </button>
          </div>

          {/* Switch method */}
          <p className="mt-4 text-center">
            <button
              onClick={() => setView("options")}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Use a different sign-in method
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
