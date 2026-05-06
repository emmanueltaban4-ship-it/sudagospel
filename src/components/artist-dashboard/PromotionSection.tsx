import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Share2, Calendar, Sparkles, Copy, ExternalLink } from "lucide-react";
import BoostSongDialog from "@/components/BoostSongDialog";
import ShareKit from "@/components/ShareKit";
import { artistPath } from "@/lib/artist-slug";
import { toast } from "sonner";
import { format } from "date-fns";

const PromotionSection = ({ artist }: { artist: any }) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const profileUrl = `${origin}${artistPath(artist.name)}`;

  const { data: songs = [] } = useQuery({
    queryKey: ["promo-songs", artist.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("songs")
        .select("id, title, cover_url, release_status, scheduled_release_at, is_approved")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const { data: activeBoosts = [] } = useQuery({
    queryKey: ["promo-boosts", artist.id],
    queryFn: async () => {
      const songIds = songs.map((s: any) => s.id);
      if (songIds.length === 0) return [];
      const { data } = await supabase
        .from("song_boosts")
        .select("*, songs(title)")
        .in("song_id", songIds)
        .eq("status", "active");
      return data ?? [];
    },
    enabled: songs.length > 0,
    refetchInterval: 30000,
  });

  const scheduled = songs.filter((s: any) => s.release_status === "scheduled");
  const live = songs.filter((s: any) => s.is_approved && s.release_status === "published");

  return (
    <div className="space-y-4">
      {/* Profile share */}
      <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold">Share your profile</h3>
            <p className="text-xs text-muted-foreground mb-3 truncate">{profileUrl}</p>
            <div className="flex flex-wrap gap-2">
              <ShareKit url={profileUrl} title={artist.name} description={artist.bio || ""} trigger={
                <Button size="sm" className="rounded-xl gap-1.5"><Share2 className="h-4 w-4" /> Share kit</Button>
              } />
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
                onClick={() => { navigator.clipboard.writeText(profileUrl); toast.success("Copied"); }}>
                <Copy className="h-4 w-4" /> Copy link
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-xl gap-1.5">
                <a href={profileUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Preview</a>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Active boosts */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Active boosts</h3>
          <Badge variant="outline">{activeBoosts.length}</Badge>
        </div>
        {activeBoosts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">No active boosts. Boost a song below.</p>
        ) : (
          <div className="space-y-2">
            {activeBoosts.map((b: any) => (
              <div key={b.id} className="p-3 rounded-xl border bg-muted/10 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{b.songs?.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{b.boost_type} · ends {b.ends_at ? format(new Date(b.ends_at), "MMM d") : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pre-save links */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Pre-save links</h3>
          <Badge variant="outline">{scheduled.length}</Badge>
        </div>
        {scheduled.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Schedule a release from the upload page to generate pre-save links.</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map((s: any) => {
              const url = `${origin}/presave/${s.id}`;
              return (
                <div key={s.id} className="p-3 rounded-xl border bg-muted/10 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {s.cover_url && <img src={s.cover_url} className="h-full w-full object-cover" alt=""  loading="lazy" decoding="async" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">Releases {s.scheduled_release_at ? format(new Date(s.scheduled_release_at), "MMM d, yyyy") : "soon"}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1"
                    onClick={() => { navigator.clipboard.writeText(url); toast.success("Pre-save link copied"); }}>
                    <Copy className="h-3.5 w-3.5" /> Link
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Boost a song */}
      <Card className="p-4 md:p-6">
        <h3 className="font-heading font-bold mb-3 flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" /> Boost a song</h3>
        {live.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">Publish a song first to boost it.</p>
        ) : (
          <div className="space-y-2">
            {live.slice(0, 8).map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl border bg-muted/10 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {s.cover_url && <img src={s.cover_url} className="h-full w-full object-cover" alt=""  loading="lazy" decoding="async" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{s.title}</p>
                </div>
                <BoostSongDialog songId={s.id} songTitle={s.title}>
                  <Button size="sm" className="rounded-xl gap-1"><Rocket className="h-3.5 w-3.5" /> Boost</Button>
                </BoostSongDialog>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PromotionSection;
