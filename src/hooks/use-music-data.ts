import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSongs = (approvedOnly = true) => {
  return useQuery({
    queryKey: ["songs", approvedOnly],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .order("created_at", { ascending: false });

      if (approvedOnly) {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useArtists = () => {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*, songs(count)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useSongLikes = (songId: string) => {
  return useQuery({
    queryKey: ["song-likes", songId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("song_likes")
        .select("*", { count: "exact", head: true })
        .eq("song_id", songId);
      if (error) throw error;
      return count ?? 0;
    },
  });
};

export const useSongComments = (songId: string) => {
  return useQuery({
    queryKey: ["song-comments", songId],
    queryFn: async () => {
      const { data: comments, error: commentsError } = await supabase
        .from("song_comments")
        .select("*")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;
      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map((comment) => comment.user_id).filter(Boolean))];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      const profilesByUserId = new Map(
        (profiles ?? []).map((profile) => [profile.user_id, profile])
      );

      return comments.map((comment) => ({
        ...comment,
        profiles: profilesByUserId.get(comment.user_id) ?? null,
      }));
    },
    enabled: !!songId,
  });
};
