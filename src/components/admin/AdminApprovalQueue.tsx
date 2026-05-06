import { usePendingSongs } from "@/hooks/use-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Play, Clock, User, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { usePlayer } from "@/hooks/use-player";

const AdminApprovalQueue = () => {
  const { data: songs, isLoading } = usePendingSongs();
  const queryClient = useQueryClient();
  const { play } = usePlayer();

  const approveMutation = useMutation({
    mutationFn: async ({ songId, approved }: { songId: string; approved: boolean }) => {
      if (approved) {
        const { error } = await supabase
          .from("songs")
          .update({ is_approved: true })
          .eq("id", songId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("songs").delete().eq("id", songId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? "Song approved!" : "Song rejected and removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-songs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading queue...</div>;
  }

  if (!songs || songs.length === 0) {
    return (
      <div className="py-12 text-center">
        <Check className="h-12 w-12 text-secondary mx-auto mb-3" />
        <h3 className="font-heading font-bold text-foreground mb-1">All caught up!</h3>
        <p className="text-sm text-muted-foreground">No songs pending approval.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">
        Approval Queue ({songs.length})
      </h2>
      <div className="space-y-3">
        {songs.map((song) => {
          const artistName = (song.artists as any)?.name || "Unknown";
          const uploaderName = "User";

          return (
            <div
              key={song.id}
              className="rounded-xl bg-card border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                {/* Cover */}
                <div className="h-16 w-16 rounded-lg bg-gradient-brand flex-shrink-0 flex items-center justify-center text-xl font-heading font-bold text-primary-foreground overflow-hidden">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                  ) : (
                    song.title[0]
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground truncate">{song.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" /> {artistName}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {uploaderName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}
                    {song.genre && (
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        {song.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs rounded-full"
                  onClick={() =>
                    play({
                      id: song.id,
                      title: song.title,
                      artist: artistName,
                      fileUrl: song.file_url,
                      coverUrl: song.cover_url || undefined,
                    })
                  }
                >
                  <Play className="h-3 w-3" /> Preview
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex-1"
                  onClick={() => approveMutation.mutate({ songId: song.id, approved: true })}
                  disabled={approveMutation.isPending}
                >
                  <Check className="h-3 w-3" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 flex-1"
                  onClick={() => approveMutation.mutate({ songId: song.id, approved: false })}
                  disabled={approveMutation.isPending}
                >
                  <X className="h-3 w-3" /> Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminApprovalQueue;
