import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type TrendingPeriod = "day" | "week" | "month";

export const useTrendingSongs = (period: TrendingPeriod = "week", genre?: string | null) => {
  return useQuery({
    queryKey: ["trending-songs", period, genre],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_songs", {
        period,
        genre_filter: genre ?? null,
        lim: 50,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useDailyMix = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily-mix", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc("get_daily_mix", { _user_id: user.id, lim: 30 });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000,
  });
};

export const useArtistRadio = (artistId?: string) => {
  return useQuery({
    queryKey: ["artist-radio", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      const { data, error } = await supabase.rpc("get_artist_radio", { _artist_id: artistId, lim: 30 });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!artistId,
  });
};

export const useForYouFeed = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["for-you-feed", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc("get_for_you_feed", { _user_id: user.id, lim: 40 });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
