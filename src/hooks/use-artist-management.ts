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
      // try resolve to user id
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
