import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const formatCents = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

export const useArtistBalance = (artistId?: string) =>
  useQuery({
    queryKey: ["artist-balance", artistId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_artist_balance", { _artist_id: artistId! });
      if (error) throw error;
      return data?.[0] ?? { total_earned_cents: 0, total_paid_cents: 0, balance_cents: 0 };
    },
    enabled: !!artistId,
  });

export const useArtistEarnings = (artistId?: string) =>
  useQuery({
    queryKey: ["artist-earnings", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_earnings")
        .select("*, songs(title)")
        .eq("artist_id", artistId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

export const useArtistPayouts = (artistId?: string) =>
  useQuery({
    queryKey: ["artist-payouts", artistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_payouts")
        .select("*")
        .eq("artist_id", artistId!)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

export const useIsSongPurchased = (songId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["song-purchased", songId, user?.id],
    queryFn: async () => {
      if (!user || !songId) return false;
      const { data, error } = await supabase.rpc("is_song_purchased", { _song_id: songId, _user_id: user.id });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!songId,
  });
};

export const useIsSupporter = (artistId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-supporter", artistId, user?.id],
    queryFn: async () => {
      if (!user || !artistId) return false;
      const { data, error } = await supabase.rpc("is_active_supporter", { _artist_id: artistId, _user_id: user.id });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!artistId,
  });
};

export const useTipArtist = () =>
  useMutation({
    mutationFn: async ({ artist_id, amount_cents }: { artist_id: string; amount_cents: number }) => {
      const { data, error } = await supabase.functions.invoke("tip-artist", { body: { artist_id, amount_cents } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e: Error) => toast.error(e.message || "Could not start checkout"),
  });

export const usePurchaseSong = () =>
  useMutation({
    mutationFn: async (song_id: string) => {
      const { data, error } = await supabase.functions.invoke("purchase-song", { body: { song_id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e: Error) => toast.error(e.message || "Could not start checkout"),
  });

export const useSubscribeSupporter = () =>
  useMutation({
    mutationFn: async (artist_id: string) => {
      const { data, error } = await supabase.functions.invoke("subscribe-supporter", { body: { artist_id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e: Error) => toast.error(e.message || "Could not start checkout"),
  });

export const useVerifyPurchase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (session_id: string) => {
      const { data, error } = await supabase.functions.invoke("verify-purchase", { body: { session_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["song-purchased"] });
      qc.invalidateQueries({ queryKey: ["is-supporter"] });
      qc.invalidateQueries({ queryKey: ["my-purchases"] });
      qc.invalidateQueries({ queryKey: ["my-supporter-subs"] });
    },
  });
};

export const useMyPurchases = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-purchases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paid_downloads")
        .select("*, songs(id, title, cover_url, file_url, artists(name, id))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useMySupporterSubs = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-supporter-subs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supporter_subscriptions")
        .select("*, artists(id, name, avatar_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAdminArtistBalances = () =>
  useQuery({
    queryKey: ["admin-artist-balances"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_artists_with_balance");
      if (error) throw error;
      return data ?? [];
    },
  });

export const useRecordPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { artist_id: string; amount_cents: number; payout_method?: string; reference?: string; notes?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("artist_payouts").insert({ ...p, paid_by: u.user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-artist-balances"] });
      qc.invalidateQueries({ queryKey: ["artist-payouts"] });
      qc.invalidateQueries({ queryKey: ["artist-balance"] });
      toast.success("Payout recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
