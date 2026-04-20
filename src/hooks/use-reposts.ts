import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export const useRepost = (songId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: isReposted = false } = useQuery({
    queryKey: ["is-reposted", songId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("song_reposts")
        .select("id")
        .eq("song_id", songId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!songId,
  });

  const { data: repostCount = 0 } = useQuery({
    queryKey: ["repost-count", songId],
    queryFn: async () => {
      const { count } = await supabase
        .from("song_reposts")
        .select("*", { count: "exact", head: true })
        .eq("song_id", songId);
      return count ?? 0;
    },
    enabled: !!songId,
  });

  const toggleRepost = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Sign in to repost");
        throw new Error("auth");
      }
      if (isReposted) {
        const { error } = await supabase
          .from("song_reposts")
          .delete()
          .eq("song_id", songId)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Repost removed");
      } else {
        const { error } = await supabase
          .from("song_reposts")
          .insert({ song_id: songId, user_id: user.id });
        if (error) throw error;
        toast.success("Reposted to your followers");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-reposted", songId] });
      qc.invalidateQueries({ queryKey: ["repost-count", songId] });
      qc.invalidateQueries({ queryKey: ["for-you-feed"] });
    },
  });

  return { isReposted, repostCount, toggleRepost: toggleRepost.mutate, isLoading: toggleRepost.isPending };
};
