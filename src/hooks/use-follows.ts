import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const useFollowArtist = (artistId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFollowing = false } = useQuery({
    queryKey: ["follow-status", artistId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_follows")
        .select("id")
        .eq("artist_id", artistId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!artistId,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", artistId],
    queryFn: async () => {
      const { count } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId);
      return count ?? 0;
    },
    enabled: !!artistId,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      if (isFollowing) {
        const { error } = await supabase
          .from("artist_follows")
          .delete()
          .eq("artist_id", artistId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artist_follows")
          .insert({ artist_id: artistId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", artistId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", artistId] });
      toast.success(isFollowing ? "Unfollowed" : "Following!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { isFollowing, followerCount, toggleFollow: toggleFollow.mutate };
};

export const useMyFollowedArtists = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-followed-artists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_follows")
        .select("artist_id, artists(id, name, avatar_url, genre, is_verified)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.map((f) => f.artists).filter(Boolean) || [];
    },
    enabled: !!user,
  });
};
