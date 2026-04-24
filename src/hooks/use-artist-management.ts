import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const REFETCH = 30000;

/* ============ SOCIAL LINKS ============ */
export const useSocialLinks = (artistId?: string) =>
  useQuery({
    queryKey: ["social-links", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_social_links")
        .select("*")
        .eq("artist_id", artistId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
    refetchInterval: REFETCH,
  });

export const useSaveSocialLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id?: string; artist_id: string; platform: string; url: string; position?: number }) => {
      if (p.id) {
        const { error } = await supabase.from("artist_social_links").update({ platform: p.platform, url: p.url }).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artist_social_links").insert({
          artist_id: p.artist_id, platform: p.platform, url: p.url, position: p.position ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["social-links", v.artist_id] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteSocialLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artist_social_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-links"] });
      toast.success("Removed");
    },
  });
};

/* ============ COLLABORATORS ============ */
export const useCollaborators = (artistId?: string) =>
  useQuery({
    queryKey: ["collaborators", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_collaborators")
        .select("*, songs(id, title, cover_url)")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
    refetchInterval: REFETCH,
  });

export const useMyIncomingInvites = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-collab-invites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_collaborators")
        .select("*, artists(id, name, avatar_url), songs(id, title, cover_url)")
        .eq("collaborator_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: REFETCH,
  });
};

export const useInviteCollaborator = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: {
      artist_id: string; collaborator_email: string; collaborator_name?: string;
      song_id?: string; role?: string; split_percent?: number; notes?: string;
    }) => {
      let collaborator_user_id: string | null = null;
      const { data: prof } = await supabase
        .from("profiles").select("user_id").ilike("display_name", p.collaborator_name || "").maybeSingle();
      if (prof) collaborator_user_id = prof.user_id;

      const { error } = await supabase.from("artist_collaborators").insert({
        artist_id: p.artist_id,
        collaborator_email: p.collaborator_email,
        collaborator_name: p.collaborator_name,
        collaborator_user_id,
        song_id: p.song_id || null,
        role: p.role || "featured",
        split_percent: p.split_percent ?? 0,
        notes: p.notes,
        invited_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["collaborators", v.artist_id] });
      toast.success("Collaborator invited");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateCollaborator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; status?: string; split_percent?: number; role?: string }) => {
      const { error } = await supabase.from("artist_collaborators")
        .update({ status: p.status, split_percent: p.split_percent, role: p.role })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collaborators"] });
      qc.invalidateQueries({ queryKey: ["my-collab-invites"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteCollaborator = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artist_collaborators").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collaborators"] });
      toast.success("Removed");
    },
  });
};

/* ============ OWNERSHIP CLAIMS ============ */
export const useMyOwnershipClaims = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-ownership-claims", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ownership_claims")
        .select("*, songs(id, title, cover_url, artists(name))")
        .eq("claimant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: REFETCH,
  });
};

export const useFileOwnershipClaim = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: {
      song_id: string; claimant_name: string; claimant_email: string;
      claim_type: string; description: string; evidence_url?: string;
    }) => {
      const { error } = await supabase.from("ownership_claims").insert({
        ...p, claimant_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-ownership-claims"] });
      toast.success("Claim filed — admins will review");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/* ============ EXTERNAL LINKS (merch / tour / etc) ============ */
export const useArtistLinks = (artistId?: string) =>
  useQuery({
    queryKey: ["artist-links", artistId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("artist_links")
        .select("*")
        .eq("artist_id", artistId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!artistId,
    refetchInterval: REFETCH,
  });

export const useSaveArtistLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id?: string; artist_id: string; label: string; url: string;
      link_type?: string; icon?: string; position?: number;
    }) => {
      if (p.id) {
        const { error } = await (supabase as any).from("artist_links").update({
          label: p.label, url: p.url, link_type: p.link_type, icon: p.icon,
        }).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("artist_links").insert({
          artist_id: p.artist_id, label: p.label, url: p.url,
          link_type: p.link_type || "custom", icon: p.icon, position: p.position ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["artist-links", v.artist_id] });
      toast.success("Link saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteArtistLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("artist_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artist-links"] });
      toast.success("Removed");
    },
  });
};

/* ============ TOP TRACKS (pinned ordered list) ============ */
export const useTopTracks = (artistId?: string) =>
  useQuery({
    queryKey: ["artist-top-tracks", artistId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("artist_top_tracks")
        .select("*, songs(id, title, cover_url, file_url, play_count, duration_seconds)")
        .eq("artist_id", artistId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!artistId,
    refetchInterval: REFETCH,
  });

export const useReplaceTopTracks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { artist_id: string; song_ids: string[] }) => {
      // delete existing
      const { error: delErr } = await (supabase as any)
        .from("artist_top_tracks").delete().eq("artist_id", p.artist_id);
      if (delErr) throw delErr;
      if (p.song_ids.length === 0) return;
      const rows = p.song_ids.slice(0, 5).map((song_id, i) => ({
        artist_id: p.artist_id, song_id, position: i,
      }));
      const { error } = await (supabase as any).from("artist_top_tracks").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["artist-top-tracks", v.artist_id] });
      toast.success("Top tracks updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/* ============ PROFILE THEME (accent color, banner, pin) ============ */
export const useUpdateArtistTheme = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      artist_id: string;
      accent_color?: string;
      banner_position?: string;
      pinned_song_id?: string | null;
    }) => {
      const update: any = {};
      if (p.accent_color !== undefined) update.accent_color = p.accent_color;
      if (p.banner_position !== undefined) update.banner_position = p.banner_position;
      if (p.pinned_song_id !== undefined) update.pinned_song_id = p.pinned_song_id;
      const { error } = await (supabase as any).from("artists").update(update).eq("id", p.artist_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-artist"] });
      qc.invalidateQueries({ queryKey: ["artist"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/* ============ BULK SONG ACTIONS ============ */
export const useBulkSongAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      song_ids: string[];
      action: "delete" | "unpublish" | "publish" | "move_to_album";
      album_id?: string | null;
    }) => {
      if (p.song_ids.length === 0) return;
      if (p.action === "delete") {
        const { error } = await supabase.from("songs").delete().in("id", p.song_ids);
        if (error) throw error;
      } else if (p.action === "unpublish") {
        const { error } = await supabase.from("songs").update({ release_status: "draft" }).in("id", p.song_ids);
        if (error) throw error;
      } else if (p.action === "publish") {
        const { error } = await supabase.from("songs").update({ release_status: "published" }).in("id", p.song_ids);
        if (error) throw error;
      } else if (p.action === "move_to_album") {
        const { error } = await supabase.from("songs").update({ album_id: p.album_id }).in("id", p.song_ids);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["studio-songs"] });
      qc.invalidateQueries({ queryKey: ["studio-songs-full"] });
      qc.invalidateQueries({ queryKey: ["artist-songs"] });
      const labels: Record<string, string> = {
        delete: "deleted", unpublish: "unpublished", publish: "published", move_to_album: "moved",
      };
      toast.success(`${v.song_ids.length} track(s) ${labels[v.action]}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
