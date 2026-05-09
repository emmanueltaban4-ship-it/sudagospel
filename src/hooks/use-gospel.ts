import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const STALE = 60_000;

/* ============ SERMONS ============ */
export const useSermons = (limit = 50) =>
  useQuery({
    queryKey: ["sermons", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*, artists(id, name, avatar_url, is_verified)")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: STALE,
  });

/* ============ EVENTS ============ */
export const useUpcomingEvents = (limit = 50) =>
  useQuery({
    queryKey: ["events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_published", true)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: STALE,
  });

/* ============ MOODS ============ */
export const useMoods = () =>
  useQuery({
    queryKey: ["moods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moods")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });

export const useMoodSongs = (moodId?: string) =>
  useQuery({
    queryKey: ["mood-songs", moodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_songs")
        .select("position, songs(*, artists(id, name, avatar_url, is_verified))")
        .eq("mood_id", moodId!)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((r: any) => r.songs).filter(Boolean);
    },
    enabled: !!moodId,
  });

/* ============ DEVOTIONALS ============ */
export const useTodayDevotional = () =>
  useQuery({
    queryKey: ["devotional-today"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .eq("is_published", true)
        .lte("publish_date", today)
        .order("publish_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60_000,
  });

/* ============ PRAYER WALL ============ */
export const usePrayerRequests = (limit = 50) =>
  useQuery({
    queryKey: ["prayer-requests", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select("*, profiles!prayer_requests_user_id_fkey(display_name, avatar_url)")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        // fallback if FK relation name not auto-detected
        const r = await supabase
          .from("prayer_requests")
          .select("*")
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .limit(limit);
        return r.data ?? [];
      }
      return data ?? [];
    },
    staleTime: 30_000,
  });

export const useMyPrayerReactions = (requestIds: string[]) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["prayer-reactions-mine", user?.id, requestIds.join(",")],
    queryFn: async () => {
      if (!user || requestIds.length === 0) return new Set<string>();
      const { data } = await supabase
        .from("prayer_reactions")
        .select("request_id")
        .eq("user_id", user.id)
        .in("request_id", requestIds);
      return new Set((data ?? []).map((r: any) => r.request_id));
    },
    enabled: !!user && requestIds.length > 0,
  });
};

export const useTogglePrayer = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ requestId, has }: { requestId: string; has: boolean }) => {
      if (!user) throw new Error("Sign in to pray for someone");
      if (has) {
        const { error } = await supabase
          .from("prayer_reactions")
          .delete()
          .eq("request_id", requestId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("prayer_reactions")
          .insert({ request_id: requestId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-requests"] });
      qc.invalidateQueries({ queryKey: ["prayer-reactions-mine"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update"),
  });
};

export const useCreatePrayerRequest = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ content, isAnonymous }: { content: string; isAnonymous: boolean }) => {
      if (!user) throw new Error("Sign in to share a prayer request");
      const trimmed = content.trim();
      if (trimmed.length < 5) throw new Error("Please write a few more words");
      if (trimmed.length > 1000) throw new Error("Prayer is too long (max 1000 chars)");
      const { error } = await supabase
        .from("prayer_requests")
        .insert({ user_id: user.id, content: trimmed, is_anonymous: isAnonymous });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-requests"] });
      toast.success("Prayer shared 🙏");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not share"),
  });
};
