import { ArrowRight, Play, Pause, Music, TrendingUp, Clock, Headphones, Youtube, Mic2, HandMetal, Users2, BookOpen, Trophy, Sparkles, Disc3, Flame, Heart, Star, ChevronRight, Radio, Video, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import MiniPlayer from "@/components/MiniPlayer";
import AdBanner from "@/components/AdBanner";
import { usePlayer, Track } from "@/hooks/use-player";
import { useMemo } from "react";
import { SongCardSkeleton, ArtistCardSkeleton, SectionSkeleton } from "@/components/Skeletons";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { play, currentTrack, isPlaying, togglePlay, recentlyPlayed } = usePlayer();
  const { data: siteSettings } = useSiteSettings();
  const { user } = useAuth();

  const { data: trendingSongs } = useQuery({
    queryKey: ["trending-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("play_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentSongs } = useQuery({
    queryKey: ["recent-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: topArtists } = useQuery({
    queryKey: ["top-artists-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*, songs(count)")
        .eq("is_verified", true)
        .order("name")
        .limit(12);
      if (error) throw error;
      return data;
    },
  });

  const { data: weeklyTopSongs } = useQuery({
    queryKey: ["weekly-top-songs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekly_top_songs", { lim: 10 });
      if (error) throw error;
      return data;
    },
  });

  const { data: albums } = useQuery({
    queryKey: ["albums-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*, artists(id, name, avatar_url), songs(count)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: youtubeArtists } = useQuery({
    queryKey: ["youtube-artists-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, youtube_channel_url")
        .eq("is_verified", true)
        .not("youtube_channel_url", "is", null)
        .limit(8);
      if (error) throw error;
      return data?.filter((a) => a.youtube_channel_url?.trim()) || [];
    },
  });

  const { data: spotlightVideos } = useQuery({
    queryKey: ["spotlight-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, artists(id, name, avatar_url, is_verified)")
        .eq("is_published", true)
        .in("video_type", ["spotlight", "interview"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: featuredMinisters } = useQuery({
    queryKey: ["featured-ministers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, is_verified, genre, bio")
        .eq("is_verified", true)
        .order("name")
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: recommendedSongs } = useQuery({
    queryKey: ["recommended-songs", user?.id],
    queryFn: async () => {
      const { data: likedSongs } = await supabase
        .from("song_likes")
        .select("song_id")
        .eq("user_id", user!.id)
        .limit(50);
      if (!likedSongs?.length) {
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url)")
          .eq("is_approved", true)
          .order("play_count", { ascending: false })
          .limit(10);
        return data || [];
      }
      const likedIds = likedSongs.map((l) => l.song_id);
      const { data: likedDetails } = await supabase
        .from("songs")
        .select("genre")
        .in("id", likedIds);
      const genres = [...new Set((likedDetails || []).map((s) => s.genre).filter(Boolean))];
      if (genres.length === 0) {
        const { data } = await supabase
          .from("songs")
          .select("*, artists(id, name, avatar_url)")
          .eq("is_approved", true)
          .not("id", "in", `(${likedIds.join(",")})`)
          .order("play_count", { ascending: false })
          .limit(10);
        return data || [];
      }
      const { data } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .in("genre", genres)
        .not("id", "in", `(${likedIds.join(",")})`)
        .order("play_count", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  // "Because you listened to…" — pick a recently played artist and find similar songs
  const becauseArtist = useMemo(() => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) return null;
    return recentlyPlayed[0];
  }, [recentlyPlayed]);

  const { data: becauseYouListened } = useQuery({
    queryKey: ["because-you-listened", becauseArtist?.artist],
    queryFn: async () => {
      // Find artist by name, then get other songs by same artist or same genre
      const { data: artistMatch } = await supabase
        .from("artists")
        .select("id, name, genre")
        .ilike("name", becauseArtist!.artist)
        .limit(1);
      
      if (!artistMatch?.length) return [];
      const artist = artistMatch[0];
      
      // Get songs from same artist (excluding the trigger song)
      const { data: artistSongs } = await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .eq("artist_id", artist.id)
        .neq("id", becauseArtist!.id)
        .order("play_count", { ascending: false })
        .limit(5);

      // Also get songs from same genre by other artists
      const genreSongs = artist.genre ? await supabase
        .from("songs")
        .select("*, artists(id, name, avatar_url)")
        .eq("is_approved", true)
        .eq("genre", artist.genre)
        .neq("artist_id", artist.id)
        .order("play_count", { ascending: false })
        .limit(5)
        .then(r => r.data || []) : [];

      const combined = [...(artistSongs || []), ...genreSongs];
      // Deduplicate
      const seen = new Set<string>();
      return combined.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; }).slice(0, 10);
    },
    enabled: !!becauseArtist,
  });

  const playSong = (song: any) => {
    const artistName = (song.artists as any)?.name || "Unknown";
    const track: Track = {
      id: song.id,
      title: song.title,
      artist: artistName,
      fileUrl: song.file_url,
      coverUrl: song.cover_url || undefined,
    };
    if (currentTrack?.id === song.id) togglePlay();
    else play(track);
  };

  return (
    <Layout>
      <HeroSection />

      {/* Quick Genre Pills */}
      <section className="px-4 lg:px-6 py-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Worship", icon: Mic2 },
            { label: "Praise", icon: HandMetal },
            { label: "Choir", icon: Users2 },
            { label: "Afrobeat", icon: Flame },
            { label: "Reggae", icon: Heart },
            { label: "Catholic", icon: Star },
          ].map((cat) => (
            <Link
              key={cat.label}
              to={`/music?genre=${cat.label}`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted hover:border-primary/30 transition-all active:scale-95"
            >
              <cat.icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Ad */}
      <div className="px-4 lg:px-6 py-1">
        <AdBanner position="homepage_top" />
      </div>

      {/* Trending Songs */}
      {trendingSongs && trendingSongs.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Trending in South Sudan" icon={<TrendingUp className="h-5 w-5 text-primary" />} linkTo="/music" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {trendingSongs.map((song, idx) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} rank={idx + 1} showRank />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Because you listened to… */}
      {becauseYouListened && becauseYouListened.length > 0 && becauseArtist && (
        <section className="py-6">
          <div className="flex items-center justify-between mb-4 px-4 lg:px-6">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-secondary" />
              <div>
                <h2 className="font-heading text-lg md:text-xl font-black text-foreground tracking-tight">
                  Because you listened to
                </h2>
                <p className="text-xs text-primary font-semibold">{becauseArtist.artist}</p>
              </div>
            </div>
            <Link to="/music" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Show all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {becauseYouListened.map((song: any) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended */}
      {recommendedSongs && recommendedSongs.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Made for You" icon={<Sparkles className="h-5 w-5 text-secondary" />} linkTo="/music" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recommendedSongs.map((song: any) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Weekly Top 10 */}
      {weeklyTopSongs && weeklyTopSongs.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Top 10 This Week" icon={<Trophy className="h-5 w-5 text-primary" />} linkTo="/most-listened" />
          <div className="px-4 lg:px-6">
            <div className="surface-card p-0">
              {weeklyTopSongs.map((song: any, idx: number) => {
                const isCurrent = currentTrack?.id === song.song_id;
                return (
                  <div
                    key={song.song_id}
                    className={`flex items-center gap-3 px-4 py-3 group hover:bg-primary/5 transition-all cursor-pointer ${
                      isCurrent ? "bg-primary/8" : ""
                    } ${idx < weeklyTopSongs.length - 1 ? "border-b border-border/30" : ""}`}
                    onClick={() => {
                      const track: Track = {
                        id: song.song_id,
                        title: song.title,
                        artist: song.artist_name,
                        fileUrl: song.file_url,
                        coverUrl: song.cover_url || undefined,
                      };
                      if (currentTrack?.id === song.song_id) togglePlay();
                      else play(track);
                    }}
                  >
                    <span className={`text-base font-heading font-black w-7 text-center tabular-nums ${
                      idx === 0 ? "text-primary" : idx === 1 ? "text-primary/70" : idx === 2 ? "text-primary/50" : "text-muted-foreground/30"
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="relative h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                      {song.cover_url ? (
                        <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-gradient-to-br from-primary/10 to-secondary/10">
                          {song.title[0]}
                        </div>
                      )}
                      <div className="play-overlay rounded-lg">
                        {isCurrent && isPlaying ? (
                          <Pause className="h-4 w-4 text-white" />
                        ) : (
                          <Play className="h-4 w-4 text-white" fill="white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? "text-primary" : "text-foreground"}`}>
                        {song.title}
                      </p>
                      <Link
                        to={artistPath(song.artist_name)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
                      >
                        {song.artist_name}
                      </Link>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums hidden sm:block">
                      {Number(song.total_score)} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Popular Artists */}
      {topArtists && topArtists.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Popular Artists" linkTo="/artists" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 pb-1">
              {topArtists.map((artist) => (
                <Link key={artist.id} to={artistPath(artist.name)} className="flex-shrink-0 group">
                  <div className="w-28 md:w-36 flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-primary/40 transition-all duration-300 shadow-xl group-hover:shadow-primary/20">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-secondary/30 to-primary/15 flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
                            {artist.name[0]}
                          </div>
                        )}
                      </div>
                      {artist.is_verified && (
                        <div className="absolute -bottom-1 right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background shadow-sm">
                          <Star className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-foreground truncate w-full group-hover:text-primary transition-colors">{artist.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(artist.songs as any)?.[0]?.count || 0} songs</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Albums */}
      {albums && albums.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Albums" icon={<Disc3 className="h-5 w-5 text-secondary" />} linkTo="/music" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {albums.map((album) => {
                const artist = album.artists as any;
                return (
                  <Link key={album.id} to={`/album/${album.id}`} className="flex-shrink-0 w-40 md:w-48 group">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-muted shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                          <Disc3 className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Floating play button on hover */}
                      <div className="absolute bottom-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40">
                          <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-foreground">
                        {(album.songs as any)?.[0]?.count || 0} songs
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {album.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {artist?.name || "Unknown"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SUDA GOSPEL SPOTLIGHT ═══ */}
      {((spotlightVideos && spotlightVideos.length > 0) || (featuredMinisters && featuredMinisters.length > 0)) && (
        <section className="py-8">
          <div className="px-4 lg:px-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Award className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-heading text-xl md:text-2xl font-black text-foreground tracking-tight">
                    Suda Gospel Spotlight
                  </h2>
                  <p className="text-xs text-muted-foreground">Interviews & featured gospel ministers</p>
                </div>
              </div>
              <Link to="/videos" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Spotlight Videos */}
          {spotlightVideos && spotlightVideos.length > 0 && (
            <div className="px-4 lg:px-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {spotlightVideos.slice(0, 3).map((video: any) => {
                  const artist = video.artists as any;
                  const ytId = video.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)?.[1];
                  const thumb = video.thumbnail_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined);
                  return (
                    <Link key={video.id} to="/videos" className="group">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted shadow-md mb-2.5">
                        {thumb ? (
                          <img src={thumb} alt={video.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                            <Video className="h-10 w-10 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          {video.video_type === "interview" ? "Interview" : "Spotlight"}
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40">
                            <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <p className="text-sm font-bold text-white truncate drop-shadow-lg">{video.title}</p>
                          {artist && <p className="text-xs text-white/70">{artist.name}</p>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Gospel Ministers */}
          {featuredMinisters && featuredMinisters.length > 0 && (
            <div className="px-4 lg:px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Featured Gospel Ministers</h3>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-1">
                  {featuredMinisters.map((minister) => (
                    <Link key={minister.id} to={artistPath(minister.name)} className="flex-shrink-0 group">
                      <div className="w-28 md:w-36 flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-xl">
                            {minister.avatar_url ? (
                              <img src={minister.avatar_url} alt={minister.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground">
                                {minister.name[0]}
                              </div>
                            )}
                          </div>
                          {minister.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                              <Star className="h-3 w-3 text-primary-foreground" fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-foreground truncate w-full group-hover:text-primary transition-colors">{minister.name}</p>
                          <p className="text-[10px] text-muted-foreground">{minister.genre || "Gospel Minister"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* YouTube Videos */}
      {youtubeArtists && youtubeArtists.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Watch Videos" icon={<Youtube className="h-5 w-5 text-red-500" />} linkTo="/videos" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {youtubeArtists.map((artist) => {
                const channelUrl = artist.youtube_channel_url!;
                const fullUrl = channelUrl.startsWith("http")
                  ? channelUrl
                  : `https://www.youtube.com/${channelUrl.startsWith("@") ? channelUrl : `@${channelUrl}`}`;
                return (
                  <a
                    key={artist.id}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-52 md:w-64 group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-2.5 bg-muted shadow-md border border-border/30 group-hover:border-red-500/30 transition-all">
                      <div className="h-full w-full bg-gradient-to-br from-red-500/10 to-red-900/20 flex flex-col items-center justify-center gap-2">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-red-500/30" loading="lazy" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {artist.name[0]}
                          </div>
                        )}
                        <Youtube className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="play-overlay">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                          <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-red-500 transition-colors">
                      {artist.name}
                    </p>
                    <p className="text-xs text-muted-foreground">YouTube Channel</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mid Ad */}
      <div className="px-4 lg:px-6 py-2">
        <AdBanner position="homepage_mid" />
      </div>

      {/* Fresh Releases */}
      {recentSongs && recentSongs.length > 0 && (
        <section className="py-6">
          <SectionHeader title="Fresh Releases" icon={<Clock className="h-5 w-5 text-secondary" />} linkTo="/new-songs" />
          <div className="px-4 lg:px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-1">
              {recentSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={playSong} currentTrack={currentTrack} isPlaying={isPlaying} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upload CTA */}
      <section className="px-4 lg:px-6 py-8">
        <div className="relative rounded-2xl overflow-hidden border border-border/30 p-8 md:p-14 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/8 via-card to-primary/8" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-[60px]" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-gold mb-5 shadow-xl shadow-primary/20">
              <Headphones className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-black text-foreground mb-3 tracking-tight">
              Share Your Music with the World
            </h3>
            <p className="text-sm text-muted-foreground mb-7 max-w-md mx-auto leading-relaxed">
              Upload your gospel music for free and reach fans across South Sudan and beyond.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground font-bold text-sm rounded-full px-8 py-3.5 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50"
            >
              Start Uploading <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MiniPlayer />
    </Layout>
  );
};

/* ─── Sub-components ─── */

const SectionHeader = ({ title, icon, linkTo }: { title: string; icon?: React.ReactNode; linkTo: string }) => (
  <div className="flex items-center justify-between mb-4 px-4 lg:px-6">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="font-heading text-lg md:text-xl font-black text-foreground tracking-tight">
        {title}
      </h2>
    </div>
    <Link to={linkTo} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
      Show all <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

const SongCard = ({ song, onPlay, currentTrack, isPlaying, rank, showRank }: any) => {
  const artist = song.artists as any;
  const artistName = artist?.name || "Unknown";
  const isCurrent = currentTrack?.id === song.id;

  return (
    <div className="flex-shrink-0 w-36 md:w-44 group cursor-pointer">
      <div
        className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-muted shadow-lg transition-all duration-300"
        onClick={() => onPlay(song)}
      >
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Floating play button — Spotify style */}
        <div className="absolute bottom-2 right-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40">
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 text-primary-foreground" />
            ) : (
              <Play className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>
        {/* Rank badge */}
        {showRank && rank && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[11px] font-black text-white">{rank}</span>
          </div>
        )}
        {/* Now playing indicator */}
        {isCurrent && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-md">
            <span className="flex gap-[1px]">
              <span className="w-[2px] h-1.5 bg-primary-foreground rounded-full animate-eq-bar" />
              <span className="w-[2px] h-2 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:150ms]" />
              <span className="w-[2px] h-1 bg-primary-foreground rounded-full animate-eq-bar [animation-delay:300ms]" />
            </span>
            {isPlaying ? "Playing" : "Paused"}
          </div>
        )}
      </div>
      <Link to={`/song/${song.id}`} className="text-sm font-semibold text-foreground truncate block group-hover:text-primary transition-colors">
        {song.title}
      </Link>
      <Link to={artistPath(artist?.name || '')} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block mt-0.5">
        {artistName}
      </Link>
    </div>
  );
};

export default Index;