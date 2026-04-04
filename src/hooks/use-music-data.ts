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
      const { data, error } = await supabase
        .from("song_comments")
        .select("*, profiles(display_name, avatar_url)")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
