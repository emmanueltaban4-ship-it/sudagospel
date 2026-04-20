import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  songId: string;
}

const CommentThread = ({ songId }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["song-comments-threaded", songId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_comments")
        .select("id, content, created_at, user_id, parent_id")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      const profMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      return (data ?? []).map((c) => ({ ...c, profile: profMap.get(c.user_id) ?? null })) as CommentRow[];
    },
    enabled: !!songId,
  });

  const post = useMutation({
    mutationFn: async ({ content, parent_id }: { content: string; parent_id?: string | null }) => {
      if (!user) throw new Error("auth");
      const { error } = await supabase
        .from("song_comments")
        .insert({ song_id: songId, user_id: user.id, content, parent_id: parent_id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["song-comments-threaded", songId] });
      qc.invalidateQueries({ queryKey: ["song-comments", songId] });
      setText("");
      setReplyText("");
      setReplyTo(null);
    },
    onError: () => toast.error("Sign in to comment"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("song_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["song-comments-threaded", songId] }),
  });

  const roots = comments.filter((c) => !c.parent_id);
  const childrenByParent = comments.reduce<Record<string, CommentRow[]>>((acc, c) => {
    if (c.parent_id) (acc[c.parent_id] ||= []).push(c);
    return acc;
  }, {});

  const renderItem = (c: CommentRow, isReply = false) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? "ml-10 mt-3" : ""}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={c.profile?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{c.profile?.display_name?.[0] ?? "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{c.profile?.display_name ?? "User"}</span>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 break-words">{c.content}</p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && user && (
            <button
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" /> Reply
            </button>
          )}
          {user?.id === c.user_id && (
            <button onClick={() => del.mutate(c.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
        {replyTo === c.id && (
          <div className="mt-2 flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              className="min-h-[60px] text-sm"
            />
            <Button
              size="sm"
              onClick={() => replyText.trim() && post.mutate({ content: replyText.trim(), parent_id: c.id })}
              disabled={post.isPending}
            >
              Reply
            </Button>
          </div>
        )}
        {(childrenByParent[c.id] ?? []).map((reply) => renderItem(reply, true))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {user && (
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="min-h-[70px]"
          />
          <Button onClick={() => text.trim() && post.mutate({ content: text.trim() })} disabled={post.isPending}>
            Post
          </Button>
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Be the first to comment</p>
      ) : (
        <div className="space-y-5">{roots.map((c) => renderItem(c))}</div>
      )}
    </div>
  );
};

export default CommentThread;
