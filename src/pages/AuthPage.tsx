import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Eye, EyeOff, User, Mic2, Headphones, Music2, Disc3 } from "lucide-react";
import logo from "@/assets/logo.png";

type AuthView = "options" | "email-login" | "email-signup" | "phone-login" | "phone-signup";
type AccountType = "fan" | "artist";

const AuthPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>("options");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("fan");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      toast.success("Welcome!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "email-signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").update({ account_type: accountType }).eq("user_id", data.user.id);
          if (accountType === "artist") {
            await supabase.from("artists").insert({ name: displayName, user_id: data.user.id });
          }
        }
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
        const { data, error } = await supabase.auth.signUp({
          phone,
          password,
          options: { data: { display_name: displayName, account_type: accountType } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").update({ account_type: accountType }).eq("user_id", data.user.id);
          if (accountType === "artist") {
            await supabase.from("artists").insert({ name: displayName, user_id: data.user.id });
          }
        }
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
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent!");
  };

  const isEmailView = view === "email-login" || view === "email-signup";
  const isSignup = view === "email-signup" || view === "phone-signup";

  // === OPTIONS SCREEN ===
  if (view === "options") {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-secondary/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
        </div>

        {/* Floating music icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Music2 className="absolute top-[15%] left-[10%] h-6 w-6 text-primary/10 animate-bounce" style={{ animationDuration: "3s" }} />
          <Disc3 className="absolute top-[25%] right-[15%] h-8 w-8 text-primary/8 animate-spin" style={{ animationDuration: "8s" }} />
          <Headphones className="absolute bottom-[30%] left-[20%] h-7 w-7 text-secondary/10 animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
          <Music2 className="absolute bottom-[20%] right-[10%] h-5 w-5 text-primary/8 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "1s" }} />
        </div>

        {/* Back button */}
        <div className="relative z-10 p-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-16 pt-8">
          <div className="w-full max-w-sm">
            {/* Logo & branding */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150" />
                <img src={logo} alt="Sudagospel" className="relative h-16 w-16 mx-auto rounded-2xl shadow-2xl" />
              </div>
              <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
                Sudagospel
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-[260px] mx-auto">
                Stream, discover & share the best gospel music from South Sudan
              </p>
            </div>

            {/* Auth options */}
            <div className="space-y-3">
              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-foreground/20 hover:shadow-lg px-5 py-4 text-sm font-semibold text-foreground transition-all group"
              >
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border/40">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <span className="flex-1 text-left">Continue with Google</span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => setView("email-login")}
                className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 px-5 py-4 text-sm font-semibold text-foreground transition-all group"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 text-left">Continue with Email</span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => setView("phone-login")}
                className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/5 px-5 py-4 text-sm font-semibold text-foreground transition-all group"
              >
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Phone className="h-5 w-5 text-secondary" />
                </div>
                <span className="flex-1 text-left">Continue with Phone</span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">or</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Guest CTA */}
            <button
              onClick={() => navigate("/")}
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue as Guest →
            </button>

            {/* Terms */}
            <p className="mt-10 text-center text-[11px] text-muted-foreground/70 leading-relaxed">
              By signing in, you agree to our{" "}
              <span className="text-foreground/60 hover:text-primary cursor-pointer transition-colors">Terms</span>{" "}
              and{" "}
              <span className="text-foreground/60 hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === LOGIN / SIGNUP FORM ===
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0">
        <div className="absolute top-10 -right-20 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-secondary/6 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <div className="relative z-10 p-4">
        <button onClick={() => setView("options")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      {/* Form */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              {isEmailView ? <Mail className="h-5 w-5 text-primary-foreground" /> : <Phone className="h-5 w-5 text-primary-foreground" />}
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isSignup ? "Join millions of gospel music fans" : `Sign in with your ${isEmailView ? "email" : "phone"}`}
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-xl shadow-black/5">
            <form onSubmit={isEmailView ? handleEmailAuth : handlePhoneAuth} className="space-y-4">
              {isSignup && (
                <>
                  {/* Account type */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType("fan")}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 transition-all ${
                          accountType === "fan"
                            ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                            : "border-border/60 bg-background/50 hover:border-border"
                        }`}
                      >
                        <Headphones className={`h-5 w-5 ${accountType === "fan" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="text-left">
                          <p className={`text-xs font-bold ${accountType === "fan" ? "text-primary" : "text-foreground"}`}>Listener</p>
                          <p className="text-[10px] text-muted-foreground">Stream & discover</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("artist")}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 transition-all ${
                          accountType === "artist"
                            ? "border-primary bg-primary/10 shadow-sm shadow-primary/10"
                            : "border-border/60 bg-background/50 hover:border-border"
                        }`}
                      >
                        <Mic2 className={`h-5 w-5 ${accountType === "artist" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="text-left">
                          <p className={`text-xs font-bold ${accountType === "artist" ? "text-primary" : "text-foreground"}`}>Artist</p>
                          <p className="text-[10px] text-muted-foreground">Upload & share</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Display name */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      {accountType === "artist" ? "Artist Name" : "Display Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={accountType === "artist" ? "Your artist name" : "Your name"}
                        required
                        className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm focus:border-primary/50 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email or Phone */}
              {isEmailView ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+211..."
                      required
                      className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-background/60 border-border/60 rounded-xl h-12 text-sm pr-11 focus:border-primary/50 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              {!isSignup && isEmailView && (
                <div className="text-right">
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 h-12 font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          {/* Toggle login/signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => {
                  if (isEmailView) setView(isSignup ? "email-login" : "email-signup");
                  else setView(isSignup ? "phone-login" : "phone-signup");
                }}
                className="ml-1.5 font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          {/* Switch method */}
          <p className="mt-3 text-center">
            <button onClick={() => setView("options")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Use a different sign-in method
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
