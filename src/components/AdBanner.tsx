import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { useSubscription, TIERS } from "@/hooks/use-subscription";

interface AdBannerProps {
  position: string;
  className?: string;
}

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  position: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

const AdBanner = ({ position, className = "" }: AdBannerProps) => {
  const impressionLogged = useRef(false);
  const { subscribed } = useSubscription();

  const { data: ad } = useQuery({
    queryKey: ["ads", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Ad | null;
    },
    staleTime: 60_000,
    enabled: !subscribed,
  });

  const impressionMutation = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc("increment_ad_impression" as any, { ad_id: adId });
    },
  });

  const clickMutation = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc("increment_ad_click" as any, { ad_id: adId });
    },
  });

  useEffect(() => {
    if (ad && !impressionLogged.current) {
      impressionLogged.current = true;
      impressionMutation.mutate(ad.id);
    }
  }, [ad?.id]);

  // Hide ads for premium subscribers
  if (subscribed) return null;
  if (!ad || !ad.image_url) return null;

  const handleClick = () => {
    clickMutation.mutate(ad.id);
    if (ad.link_url) {
      window.open(ad.link_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <button
        onClick={handleClick}
        className="w-full block rounded-lg overflow-hidden bg-muted/30 hover:opacity-95 transition-opacity"
      >
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </button>
      <span className="absolute top-1.5 right-1.5 text-[9px] bg-background/70 text-muted-foreground px-1.5 py-0.5 rounded backdrop-blur-sm">
        Ad
      </span>
    </div>
  );
};

export default AdBanner;
