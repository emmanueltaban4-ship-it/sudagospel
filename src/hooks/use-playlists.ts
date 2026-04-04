import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const usePlaylists = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("playlists")
        .select("*, playlist_songs(count)")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const usePlaylistSongs = (playlistId: string) => {
  return useQuery({
    queryKey: ["playlist-songs", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("*, songs(*, artists(name, avatar_url))")
        .eq("playlist_id", playlistId)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { data, error } = await supabase
        .from("playlists")
        .insert({ name, description, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist created!");
    },
    onError: () => toast.error("Failed to create playlist"),
  });
};

export const useAddToPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      // Get current max position
      const { data: existing } = await supabase
        .from("playlist_songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;
      const { error } = await supabase
        .from("playlist_songs")
        .insert({ playlist_id: playlistId, song_id: songId, position: nextPos });
      if (error) {
        if (error.code === "23505") throw new Error("Song already in playlist");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-songs"] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Added to playlist!");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add song"),
  });
};

export const useRemoveFromPlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("song_id", songId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-songs"] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Removed from playlist");
    },
    onError: () => toast.error("Failed to remove song"),
  });
};

export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist deleted");
    },
    onError: () => toast.error("Failed to delete playlist"),
  });
};
