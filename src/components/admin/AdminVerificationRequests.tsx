import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

const AdminVerificationRequests = () => {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-verification-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*, artists(name, avatar_url, genre)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleRequest = useMutation({
    mutationFn: async ({ id, status, artistId, userId }: { id: string; status: string; artistId: string; userId: string }) => {
      const notes = adminNotes[id] || null;
      const { error } = await supabase
        .from("verification_requests")
        .update({ status, admin_notes: notes } as any)
        .eq("id", id);
      if (error) throw error;

      if (status === "approved") {
        const { error: artistErr } = await supabase
          .from("artists")
          .update({ is_verified: true })
          .eq("id", artistId);
        if (artistErr) throw artistErr;
      }

      // Send notification to the artist
      await supabase.from("notifications").insert({
        user_id: userId,
        title: status === "approved" ? "🎉 You're Verified!" : "Verification Update",
        message: status === "approved"
          ? "Congratulations! Your artist verification request has been approved. You now have a verified badge."
          : `Your verification request has been reviewed.${notes ? ` Note: ${notes}` : ""}`,
        type: status === "approved" ? "success" : "warning",
        link: "/profile",
      } as any);
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "approved" ? "Artist verified!" : "Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-verification-requests"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const pending = requests?.filter((r: any) => r.status === "pending") || [];
  const resolved = requests?.filter((r: any) => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-foreground">
        Verification Requests {pending.length > 0 && <Badge className="ml-2">{pending.length} pending</Badge>}
      </h2>

      {pending.length === 0 && (
        <div className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-secondary mx-auto mb-3" />
          <h3 className="font-heading font-bold text-foreground mb-1">No pending requests</h3>
          <p className="text-sm text-muted-foreground">All verification requests have been handled.</p>
        </div>
      )}

      {pending.map((req: any) => {
        const artist = req.artists;
        return (
          <div key={req.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {artist?.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-foreground">{artist?.name || "Unknown"}</h3>
                <p className="text-xs text-muted-foreground">{artist?.genre || "No genre"} · Requested {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            </div>

            {req.reason && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Reason:</p>
                <p className="text-sm text-foreground">{req.reason}</p>
              </div>
            )}

            <Textarea
              placeholder="Admin notes (optional)..."
              value={adminNotes[req.id] || ""}
              onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
              rows={2}
              className="bg-background text-sm"
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1"
                onClick={() => handleRequest.mutate({ id: req.id, status: "approved", artistId: req.artist_id, userId: req.user_id })}
                disabled={handleRequest.isPending}
              >
                <Check className="h-3.5 w-3.5" /> Approve & Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 flex-1"
                onClick={() => handleRequest.mutate({ id: req.id, status: "rejected", artistId: req.artist_id, userId: req.user_id })}
                disabled={handleRequest.isPending}
              >
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          </div>
        );
      })}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-bold text-muted-foreground">History</h3>
          {resolved.slice(0, 20).map((req: any) => {
            const artist = req.artists;
            return (
              <div key={req.id} className="rounded-xl bg-card/50 border border-border/50 p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {artist?.avatar_url ? (
                    <img src={artist.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">{artist?.name?.[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{artist?.name}</p>
                  {req.admin_notes && <p className="text-[11px] text-muted-foreground truncate">{req.admin_notes}</p>}
                </div>
                <Badge variant={req.status === "approved" ? "default" : "destructive"} className="text-[10px]">
                  {req.status === "approved" ? <><CheckCircle className="h-3 w-3 mr-1" /> Verified</> : <><AlertCircle className="h-3 w-3 mr-1" /> Rejected</>}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminVerificationRequests;
