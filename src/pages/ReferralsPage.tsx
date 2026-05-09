import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Users, Coins } from "lucide-react";
import { toast } from "sonner";

function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const ReferralsPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: ref, isLoading } = useQuery({
    queryKey: ["my-referral", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: attributions } = useQuery({
    queryKey: ["my-referral-attributions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("referral_attributions").select("*").eq("referrer_user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      let code = genCode();
      const { error } = await supabase.from("referrals").insert({ user_id: user!.id, code });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-referral"] }),
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isLoading && user && !ref) create.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, ref, user]);

  const link = ref ? `${window.location.origin}/auth?ref=${ref.code}` : "";
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (!user) return <p className="text-sm text-muted-foreground">Sign in to get your referral link.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Refer friends, earn credits</h2>
        <p className="text-sm text-muted-foreground">Share your link. When someone signs up, you get credit toward purchases.</p>
      </div>

      {ref && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Your code</p>
          <p className="font-heading text-2xl font-bold tracking-widest text-primary">{ref.code}</p>
          <div className="flex gap-2 mt-3">
            <Input readOnly value={link} className="text-xs" />
            <Button onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{ref?.signups_count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Sign-ups</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Coins className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">${((ref?.credit_cents ?? 0) / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Credits</p>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-2">Recent sign-ups</h3>
        {!attributions?.length ? <p className="text-sm text-muted-foreground">No referrals yet — share your link!</p> : (
          <div className="space-y-2">
            {attributions.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                <span>New sign-up via <span className="font-mono text-primary">{a.code}</span></span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralsPage;
