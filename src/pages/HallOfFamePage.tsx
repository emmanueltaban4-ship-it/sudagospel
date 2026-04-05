import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { artistPath } from "@/lib/artist-slug";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Trophy, Play, Users, TrendingUp, CheckCircle, Crown, Medal } from "lucide-react";

type Tab = "plays" | "followers";

const HallOfFamePage = () => {
  const [tab, setTab] = useState<Tab>("plays");

  useDocumentMeta({
    title: "Hall of Fame",
    description: "Top gospel artists on Sudagospel ranked by plays and followers.",
    keywords: "South Sudan gospel, hall of fame, top artists, gospel music rankings",
  });

  // Top artists by total play count
  const { data: topByPlays, isLoading: loadingPlays } = useQuery({
    queryKey: ["hall-of-fame-plays"],
    queryFn: async () => {
      const { data: artists, error: aErr } = await supabase
        .from("artists")
        .select("id, name, avatar_url, genre, is_verified");
      if (aErr) throw aErr;

      const { data: songs, error: sErr } = await supabase
        .from("songs")
        .select("artist_id, play_count")
        .eq("is_approved", true);
      if (sErr) throw sErr;

      // Aggregate plays per artist
      const playsMap = new Map<string, number>();
      songs?.forEach((s) => {
        playsMap.set(s.artist_id, (playsMap.get(s.artist_id) || 0) + (s.play_count || 0));
      });

      return (artists || [])
        .map((a) => ({ ...a, totalPlays: playsMap.get(a.id) || 0 }))
        .sort((a, b) => b.totalPlays - a.totalPlays)
        .slice(0, 50);
    },
  });

  // Top artists by follower count
  const { data: topByFollowers, isLoading: loadingFollowers } = useQuery({
    queryKey: ["hall-of-fame-followers"],
    queryFn: async () => {
      const { data: artists, error: aErr } = await supabase
        .from("artists")
        .select("id, name, avatar_url, genre, is_verified");
      if (aErr) throw aErr;

      const { data: follows, error: fErr } = await supabase
        .from("artist_follows")
        .select("artist_id");
      if (fErr) throw fErr;

      const followMap = new Map<string, number>();
      follows?.forEach((f) => {
        followMap.set(f.artist_id, (followMap.get(f.artist_id) || 0) + 1);
      });

      return (artists || [])
        .map((a) => ({ ...a, followers: followMap.get(a.id) || 0 }))
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 50);
    },
  });

  const isLoading = tab === "plays" ? loadingPlays : loadingFollowers;
  const data = tab === "plays" ? topByPlays : topByFollowers;

  const getMedalColor = (index: number) => {
    if (index === 0) return "text-yellow-400";
    if (index === 1) return "text-gray-300";
    if (index === 2) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <Layout>
      <div className="container py-6 pb-28">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 mb-4 shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground">
            Hall of Fame
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Celebrating the most popular gospel artists on Sudagospel
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setTab("plays")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              tab === "plays"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Most Played
          </button>
          <button
            onClick={() => setTab("followers")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              tab === "followers"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Users className="h-4 w-4" /> Most Followed
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {data && data.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto mb-10">
                {[1, 0, 2].map((rank) => {
                  const artist = data[rank];
                  if (!artist) return null;
                  const isCenter = rank === 0;
                  return (
                    <Link
                      key={artist.id}
                      to={artistPath(artist.name)}
                      className={`flex flex-col items-center gap-2 group ${isCenter ? "-mt-4" : "mt-4"}`}
                    >
                      <div className="relative">
                        {isCenter && (
                          <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-400 drop-shadow-lg z-10" />
                        )}
                        <div className={`rounded-full overflow-hidden shadow-lg ring-4 ${
                          rank === 0 ? "ring-yellow-400 h-24 w-24 md:h-32 md:w-32" :
                          rank === 1 ? "ring-gray-300 h-20 w-20 md:h-24 md:w-24" :
                          "ring-amber-600 h-20 w-20 md:h-24 md:w-24"
                        }`}>
                          {artist.avatar_url ? (
                            <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                              {artist.name[0]}
                            </div>
                          )}
                        </div>
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                          rank === 0 ? "bg-yellow-400 text-yellow-900" :
                          rank === 1 ? "bg-gray-300 text-gray-700" :
                          "bg-amber-600 text-white"
                        }`}>
                          {rank + 1}
                        </div>
                      </div>
                      <div className="text-center mt-2">
                        <p className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[100px]">
                          {artist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tab === "plays"
                            ? `${(artist as any).totalPlays?.toLocaleString()} plays`
                            : `${(artist as any).followers?.toLocaleString()} followers`}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Full ranking list (starting from #4) */}
            <div className="max-w-2xl mx-auto space-y-0.5">
              {data?.slice(3).map((artist, i) => (
                <Link
                  key={artist.id}
                  to={artistPath(artist.name)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-card transition-colors group"
                >
                  <span className={`w-8 text-center font-heading font-bold text-sm ${getMedalColor(i + 3)}`}>
                    {i + 4}
                  </span>
                  <div className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {artist.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-heading font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {artist.name}
                      </p>
                      {artist.is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{artist.genre || "Gospel"}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    {tab === "plays"
                      ? `${((artist as any).totalPlays || 0).toLocaleString()}`
                      : `${((artist as any).followers || 0).toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {tab === "plays" ? "plays" : "followers"}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default HallOfFamePage;
