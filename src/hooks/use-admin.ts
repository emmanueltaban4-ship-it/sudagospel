import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, songs, pendingSongs, artists, comments, downloads, likes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("songs").select("*", { count: "exact", head: true }),
        supabase.from("songs").select("*", { count: "exact", head: true }).eq("is_approved", false),
        supabase.from("artists").select("*", { count: "exact", head: true }),
        supabase.from("song_comments").select("*", { count: "exact", head: true }),
        supabase.from("song_downloads").select("*", { count: "exact", head: true }),
        supabase.from("song_likes").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalUsers: profiles.count ?? 0,
        totalSongs: songs.count ?? 0,
        pendingSongs: pendingSongs.count ?? 0,
        totalArtists: artists.count ?? 0,
        totalComments: comments.count ?? 0,
        totalDownloads: downloads.count ?? 0,
        totalLikes: likes.count ?? 0,
      };
    },
  });
};

export const usePendingSongs = () => {
  return useQuery({
    queryKey: ["admin-pending-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name)")
        .eq("is_approved", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch roles separately
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      return (profiles || []).map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id),
      }));
    },
  });
};

export const useAllComments = () => {
  return useQuery({
    queryKey: ["admin-all-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_comments")
        .select("*, profiles(display_name), songs(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};
