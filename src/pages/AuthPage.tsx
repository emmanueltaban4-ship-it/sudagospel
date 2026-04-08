import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Eye, EyeOff, User, Mic2, Headphones, Music2, BadgeCheck, Play, Upload } from "lucide-react";
import logo from "@/assets/logo.png";
import heroImg from "@/assets/auth-hero.jpg";

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
      if (result.error) { toast.error(result.error.message || "Google sign-in failed"); return; }
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
          email, password,
          options: { data: { display_name: displayName, account_type: accountType }, emailRedirectTo: window.location.origin },
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
          phone, password,
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

  const formContent = () => {
    if (view === "options") {
      return (
        <>
          {/* Logo & branding */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Sudagospel" className="h-12 w-12 rounded-xl shadow-lg" />
              <span className="font-heading text-xl font-extrabold text-foreground">Sudagospel</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Feel the spirit.<br />
              <span className="text-primary">Stream gospel.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              Join South Sudan's biggest gospel music community. Stream, discover & share the music that moves you.
            </p>
          </div>

          {/* Auth buttons */}
          <div className="space-y-3 max-w-sm">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-foreground/20 hover:shadow-lg px-5 py-4 text-sm font-semibold text-foreground transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border/40 shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <span className="flex-1 text-left">Continue with Google</span>
            </button>

            <button
              onClick={() => setView("email-login")}
              className="w-full flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 px-5 py-4 text-sm font-semibold text-foreground transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shadow-sm">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 text-left">Continue with Email</span>
            </button>

            <button
              onClick={() => setView("phone-login")}
              className="w-full flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/5 px-5 py-4 text-sm font-semibold text-foreground transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors shadow-sm">
                <Phone className="h-5 w-5 text-secondary" />
              </div>
              <span className="flex-1 text-left">Continue with Phone</span>
            </button>
          </div>

          {/* Divider & guest */}
          <div className="max-w-sm mt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">or</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <button onClick={() => navigate("/")} className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Continue as Guest →
            </button>
          </div>

          <p className="mt-10 text-[11px] text-muted-foreground/70 leading-relaxed max-w-sm">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-foreground/60 hover:text-primary transition-colors">Terms</Link>{" "}and{" "}
            <Link to="/privacy" className="text-foreground/60 hover:text-primary transition-colors">Privacy Policy</Link>
          </p>
        </>
      );
    }

    // LOGIN / SIGNUP FORM
    return (
      <>
        <button onClick={() => setView("options")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            {isEmailView ? <Mail className="h-5 w-5 text-primary-foreground" /> : <Phone className="h-5 w-5 text-primary-foreground" />}
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground tracking-tight">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isSignup ? "Join the gospel music community" : `Sign in with your ${isEmailView ? "email" : "phone"}`}
          </p>
        </div>

        <div className="max-w-sm">
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 shadow-xl shadow-black/5">
            <form onSubmit={isEmailView ? handleEmailAuth : handlePhoneAuth} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setAccountType("fan")}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 transition-all ${accountType === "fan" ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border/60 bg-background/50 hover:border-border"}`}>
                        <Headphones className={`h-5 w-5 ${accountType === "fan" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="text-left">
                          <p className={`text-xs font-bold ${accountType === "fan" ? "text-primary" : "text-foreground"}`}>Listener</p>
                          <p className="text-[10px] text-muted-foreground">Stream & discover</p>
                        </div>
                      </button>
                      <button type="button" onClick={() => setAccountType("artist")}
                        className={`flex items-center gap-2.5 rounded-xl border-2 p-3.5 transition-all ${accountType === "artist" ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border/60 bg-background/50 hover:border-border"}`}>
                        <Mic2 className={`h-5 w-5 ${accountType === "artist" ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="text-left">
                          <p className={`text-xs font-bold ${accountType === "artist" ? "text-primary" : "text-foreground"}`}>Artist</p>
                          <p className="text-[10px] text-muted-foreground">Upload & share</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      {accountType === "artist" ? "Artist Name" : "Display Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={accountType === "artist" ? "Your artist name" : "Your name"} required
                        className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm" />
                    </div>
                  </div>
                </>
              )}

              {isEmailView ? (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                      className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+211..." required
                      className="pl-11 bg-background/60 border-border/60 rounded-xl h-12 text-sm" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="bg-background/60 border-border/60 rounded-xl h-12 text-sm pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isSignup && isEmailView && (
                <div className="text-right">
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 h-12 font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Please wait...
                  </div>
                ) : isSignup ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => {
                if (isEmailView) setView(isSignup ? "email-login" : "email-signup");
                else setView(isSignup ? "phone-login" : "phone-signup");
              }} className="ml-1.5 font-bold text-primary hover:text-primary/80 transition-colors">
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
          <p className="mt-3 text-center">
            <button onClick={() => setView("options")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Use a different sign-in method
            </button>
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-10 relative overflow-hidden">
        {/* Subtle background accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px]" />

        {/* Back to home */}
        {view === "options" && (
          <div className="absolute top-5 left-5">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        )}

        <div className="relative z-10 w-full max-w-lg">
          {formContent()}
        </div>
      </div>

      {/* Right panel — hero image (hidden on mobile) */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <img
          src={heroImg}
          alt="Feel the music"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

        {/* Floating text on image */}
        <div className="absolute bottom-12 left-10 right-10 z-10">
          <div className="flex items-center gap-2 mb-3">
            <Music2 className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Now Streaming</span>
          </div>
          <h2 className="font-heading text-2xl xl:text-3xl font-extrabold text-white leading-tight">
            South Sudan's #1<br />Gospel Music Platform
          </h2>
          <p className="text-sm text-white/60 mt-2 max-w-xs">
            10,000+ songs from gospel ministers across the nation
          </p>
        </div>

        {/* Stats floating card */}
        <div className="absolute top-10 right-10 z-10">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-heading font-extrabold text-white">1K+</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Artists</p>
              </div>
              <div>
                <p className="text-xl font-heading font-extrabold text-white">10K+</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Songs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
