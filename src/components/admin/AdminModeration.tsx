import { useAllComments } from "@/hooks/use-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const AdminModeration = () => {
  const { data: comments, isLoading } = useAllComments();
  const queryClient = useQueryClient();

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("song_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment removed");
      queryClient.invalidateQueries({ queryKey: ["admin-all-comments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading comments...</div>;
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-heading font-bold text-foreground mb-1">No comments</h3>
        <p className="text-sm text-muted-foreground">Comments will appear here for moderation.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">
        Recent Comments ({comments.length})
      </h2>
      <div className="space-y-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    {(comment.profiles as any)?.display_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    on "{(comment.songs as any)?.title || "Unknown"}"
                  </span>
                </div>
                <p className="text-sm text-foreground mb-1">{comment.content}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
                onClick={() => deleteComment.mutate(comment.id)}
                disabled={deleteComment.isPending}
              >
                <Trash2 className="h-3 w-3" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminModeration;
