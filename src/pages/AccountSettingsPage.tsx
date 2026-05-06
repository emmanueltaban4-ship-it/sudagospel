import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Mail, Phone, KeyRound, Shield, Link2, Unlink, LogOut } from "lucide-react";
import { lovable } from "@/integrations/lovable";

export default function AccountSettingsPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [identities, setIdentities] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
      setIdentities((user as any).identities ?? []);
    }
  }, [user]);

  const googleIdentity = useMemo(
    () => identities.find((i) => i.provider === "google"),
    [identities]
  );

  const updateEmail = async () => {
    if (!email || email === user?.email) return;
    setBusy("email");
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/account` }
    );
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success("Confirmation sent. Check both inboxes to finish the change.");
  };

  const updatePhone = async () => {
    if (!phone || phone === user?.phone) return;
    setBusy("phone");
    const { error } = await supabase.auth.updateUser({ phone });
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success("Verification code sent via SMS.");
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const linkGoogle = async () => {
    setBusy("link-google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/account`,
      });
      if (result?.error) toast.error("Could not start Google linking.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to link Google.");
    } finally {
      setBusy(null);
    }
  };

  const unlinkGoogle = async () => {
    if (!googleIdentity) return;
    if (identities.length <= 1) {
      toast.error("Add an email or phone sign-in method before unlinking Google.");
      return;
    }
    setBusy("unlink-google");
    const { error } = await (supabase.auth as any).unlinkIdentity(googleIdentity);
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Google disconnected.");
      setIdentities((prev) => prev.filter((i) => i.identity_id !== googleIdentity.identity_id));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      <main className="container max-w-3xl mx-auto px-4 pt-4 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
            <p className="text-sm text-muted-foreground">Manage your sign-in details and connected accounts.</p>
          </div>
        </div>

        {/* Email */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Email address</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <p className="text-xs text-muted-foreground">A confirmation link will be sent to your new email.</p>
          </div>
          <Button onClick={updateEmail} disabled={busy === "email" || email === user.email || !email}>
            {busy === "email" ? "Sending..." : "Update email"}
          </Button>
        </Card>

        {/* Phone */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Phone number</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (with country code)</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+211900000000" />
            <p className="text-xs text-muted-foreground">We'll text a verification code to confirm the change.</p>
          </div>
          <Button onClick={updatePhone} disabled={busy === "phone" || phone === user.phone || !phone}>
            {busy === "phone" ? "Sending..." : "Update phone"}
          </Button>
        </Card>

        {/* Password */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Password</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirm password</Label>
              <Input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button onClick={updatePassword} disabled={busy === "password" || !newPassword}>
            {busy === "password" ? "Updating..." : "Update password"}
          </Button>
        </Card>

        {/* Connected accounts */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Connected accounts</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">G</div>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-xs text-muted-foreground">
                  {googleIdentity ? `Connected${googleIdentity.identity_data?.email ? ` as ${googleIdentity.identity_data.email}` : ""}` : "Not connected"}
                </p>
              </div>
            </div>
            {googleIdentity ? (
              <Button variant="outline" size="sm" onClick={unlinkGoogle} disabled={busy === "unlink-google"}>
                <Unlink className="h-4 w-4 mr-2" />
                {busy === "unlink-google" ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button size="sm" onClick={linkGoogle} disabled={busy === "link-google"}>
                <Link2 className="h-4 w-4 mr-2" />
                {busy === "link-google" ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Keep at least one sign-in method active. You can't disconnect Google if it's your only way to sign in.
          </p>
        </Card>

        {/* Danger / sign out */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold">Sign out</p>
            <p className="text-xs text-muted-foreground">End your session on this device.</p>
          </div>
          <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
