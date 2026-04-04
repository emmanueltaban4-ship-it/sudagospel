import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const useLikeSong = (songId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isLiked = false } = useQuery({
    queryKey: ["is-liked", songId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("song_likes")
        .select("id")
        .eq("song_id", songId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!songId,
  });

  const { data: likeCount = 0 } = useQuery({
    queryKey: ["like-count", songId],
    queryFn: async () => {
      const { count } = await supabase
        .from("song_likes")
        .select("*", { count: "exact", head: true })
        .eq("song_id", songId);
      return count ?? 0;
    },
    enabled: !!songId,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Sign in to like songs");
        throw new Error("Not authenticated");
      }
      if (isLiked) {
        const { error } = await supabase
          .from("song_likes")
          .delete()
          .eq("song_id", songId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("song_likes")
          .insert({ song_id: songId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-liked", songId] });
      queryClient.invalidateQueries({ queryKey: ["like-count", songId] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
    },
  });

  return { isLiked, likeCount, toggleLike: toggleLike.mutate };
};

export const usePostComment = (songId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        toast.error("Sign in to comment");
        throw new Error("Not authenticated");
      }
      const { error } = await supabase
        .from("song_comments")
        .insert({ song_id: songId, user_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song-comments", songId] });
      toast.success("Comment posted!");
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, songId }: { commentId: string; songId: string }) => {
      const { error } = await supabase
        .from("song_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return songId;
    },
    onSuccess: (songId) => {
      queryClient.invalidateQueries({ queryKey: ["song-comments", songId] });
    },
  });
};
