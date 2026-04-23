import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, FileWarning, Plus, BadgeCheck, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMyOwnershipClaims, useFileOwnershipClaim } from "@/hooks/use-artist-management";

const STATUS = {
  pending: { label: "Under review", icon: Clock, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  approved: { label: "Approved", icon: BadgeCheck, cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  rejected: { label: "Rejected", icon: AlertCircle, cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
  resolved: { label: "Resolved", icon: BadgeCheck, cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
};

const RightsSection = ({ artist }: { artist: any }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: claims = [] } = useMyOwnershipClaims();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("verification_requests").insert({
        artist_id: artist.id, user_id: user!.id, reason: "Requested via Artist Dashboard",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification request submitted");
      qc.invalidateQueries({ queryKey: ["my-verification", artist.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: existingReq } = useQuery({
    queryKey: ["my-verification", artist.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("*").eq("artist_id", artist.id).order("created_at", { ascending: false }).maybeSingle();
      return data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      {/* Verification */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold">Verification status</h3>
            {artist.is_verified ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Your artist profile is verified
              </p>
            ) : existingReq ? (
              <p className="text-xs text-muted-foreground mt-1">
                Status: <span className="font-semibold capitalize">{existingReq.status}</span> · submitted {format(new Date(existingReq.created_at), "MMM d, yyyy")}
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Get the verified badge to build trust with fans.</p>
                <Button size="sm" className="rounded-xl gap-1.5" onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}>
                  <BadgeCheck className="h-4 w-4" /> Request verification
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Ownership claims */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Ownership & rights</h3>
            <p className="text-xs text-muted-foreground">File a claim if a song uses your work without permission</p>
          </div>
          <ClaimDialog />
        </div>

        <div className="space-y-2">
          {claims.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No claims filed.</p>
          )}
          {claims.map((c: any) => {
            const S = STATUS[c.status as keyof typeof STATUS] ?? STATUS.pending;
            return (
              <div key={c.id} className="p-3 rounded-xl border bg-muted/10">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold truncate">{c.songs?.title || "Song"}</p>
                  <Badge className={`${S.cls} border-0 text-[10px] gap-1`}><S.icon className="h-3 w-3" /> {S.label}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{c.claim_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                {c.admin_notes && <p className="text-xs mt-1 p-2 rounded bg-muted/30">Admin: {c.admin_notes}</p>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* DMCA links */}
      <Card className="p-4 md:p-6">
        <h3 className="font-heading font-bold mb-2 flex items-center gap-2"><FileWarning className="h-4 w-4 text-primary" /> Legal resources</h3>
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-start rounded-xl gap-2">
            <Link to="/dmca"><FileWarning className="h-4 w-4" /> DMCA policy <ExternalLink className="h-3 w-3 ml-auto" /></Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start rounded-xl gap-2">
            <Link to="/copyright"><ShieldCheck className="h-4 w-4" /> Copyright info <ExternalLink className="h-3 w-3 ml-auto" /></Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start rounded-xl gap-2">
            <Link to="/terms-of-service"><FileWarning className="h-4 w-4" /> Terms of service <ExternalLink className="h-3 w-3 ml-auto" /></Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

const ClaimDialog = () => {
  const [open, setOpen] = useState(false);
  const [songId, setSongId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("ownership");
  const [desc, setDesc] = useState("");
  const [evidence, setEvidence] = useState("");
  const file = useFileOwnershipClaim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl gap-1.5"><Plus className="h-4 w-4" /> File claim</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>File an ownership claim</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Song ID</Label>
            <Input value={songId} onChange={(e) => setSongId(e.target.value)} placeholder="Paste song UUID" className="rounded-xl" />
            <p className="text-[10px] text-muted-foreground">Find on the song page URL: /song/&lt;id&gt;</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Your name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Claim type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-sm">
              <option value="ownership">Ownership claim</option>
              <option value="dmca">DMCA takedown</option>
              <option value="trademark">Trademark</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="rounded-xl resize-none" placeholder="Explain your claim..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Evidence URL (optional)</Label>
            <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Link to original work, registration, etc." className="rounded-xl" />
          </div>
          <Button
            className="w-full rounded-xl"
            disabled={!songId || !name || !email || !desc || file.isPending}
            onClick={() => {
              file.mutate({
                song_id: songId, claimant_name: name, claimant_email: email,
                claim_type: type, description: desc, evidence_url: evidence || undefined,
              }, { onSuccess: () => { setOpen(false); setSongId(""); setDesc(""); setEvidence(""); } });
            }}
          >
            Submit claim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RightsSection;
