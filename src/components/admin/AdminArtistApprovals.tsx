import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock, CheckCircle, AlertCircle, User, Music } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AdminArtistApprovals = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { data: artists, isLoading } = useQuery({
    queryKey: ["admin-artist-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, genre, bio, created_at, user_id, status, rejection_reason, reviewed_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const reason = status === "rejected" ? (reasons[id] || null) : null;
      const { error } = await supabase
        .from("artists")
        .update({
          status,
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "approved" ? "Artist approved — they can now upload music." : "Artist rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-artist-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const pending = artists?.filter((a) => a.status === "pending") ?? [];
  const resolved = artists?.filter((a) => a.status !== "pending") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">
          Artist Approvals {pending.length > 0 && <Badge className="ml-2">{pending.length} pending</Badge>}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          New artists cannot upload music until you approve them here.
        </p>
      </div>

      {pending.length === 0 && (
        <div className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-3" />
          <h3 className="font-heading font-bold text-foreground mb-1">No artists awaiting approval</h3>
          <p className="text-sm text-muted-foreground">All caught up.</p>
        </div>
      )}

      {pending.map((a) => (
        <div key={a.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {a.avatar_url ? (
                <img src={a.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground truncate">{a.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {a.genre || "No genre"} · Submitted {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
          </div>

          {a.bio && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{a.bio}</p>
            </div>
          )}

          <Textarea
            placeholder="Reason for rejection (optional, shown to artist)..."
            value={reasons[a.id] || ""}
            onChange={(e) => setReasons((prev) => ({ ...prev, [a.id]: e.target.value }))}
            rows={2}
            className="bg-background text-sm"
          />

          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1"
              onClick={() => review.mutate({ id: a.id, status: "approved" })}
              disabled={review.isPending}
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 flex-1"
              onClick={() => review.mutate({ id: a.id, status: "rejected" })}
              disabled={review.isPending}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </div>
      ))}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-heading text-sm font-bold text-muted-foreground">History</h3>
          {resolved.slice(0, 30).map((a) => (
            <div key={a.id} className="rounded-xl bg-card/50 border border-border/50 p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">{a.name?.[0]}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                {a.rejection_reason && <p className="text-[11px] text-muted-foreground truncate">Reason: {a.rejection_reason}</p>}
              </div>
              <Badge variant={a.status === "approved" ? "default" : "destructive"} className="text-[10px]">
                {a.status === "approved" ? <><CheckCircle className="h-3 w-3 mr-1" /> Approved</> : <><AlertCircle className="h-3 w-3 mr-1" /> Rejected</>}
              </Badge>
              {a.status === "rejected" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => review.mutate({ id: a.id, status: "approved" })}
                >
                  <Music className="h-3 w-3 mr-1" /> Reinstate
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminArtistApprovals;
