import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { usePlaylists } from "@/hooks/use-playlists";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer, Track } from "@/hooks/use-player";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { getDownloads } from "@/pages/DownloadsPage";
import { ListMusic, Download, Plus, Music, ChevronRight, Heart, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabKey = "playlists" | "liked" | "recent" | "downloads";

const LibraryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: playlists } = usePlaylists();
  const { play, recentlyPlayed } = usePlayer();
  const [tab, setTab] = useState<TabKey>("playlists");
  const downloads = getDownloads();

  // Liked songs
  const { data: likedSongs } = useQuery({
    queryKey: ["liked-songs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("song_likes")
        .select("song_id, songs(id, title, file_url, cover_url, artists(name))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data?.map((l: any) => l.songs).filter(Boolean) || [];
    },
    enabled: !!user,
  });

  useDocumentMeta({
    title: "Library - SudaGospel",
    description: "Your playlists, liked songs, and downloads on SudaGospel.",
  });

  const tabs: { key: TabKey; label: string; icon: any; count: number }[] = [
    { key: "playlists", label: "Playlists", icon: ListMusic, count: playlists?.length || 0 },
    { key: "liked", label: "Liked", icon: Heart, count: likedSongs?.length || 0 },
    { key: "recent", label: "Recent", icon: Clock, count: recentlyPlayed.length },
    { key: "downloads", label: "Downloads", icon: Download, count: downloads.length },
  ];

  const handlePlayLiked = () => {
    if (!likedSongs?.length) return;
    const queue: Track[] = likedSongs.map((s: any) => ({
      id: s.id, title: s.title, artist: s.artists?.name || "Unknown",
      fileUrl: s.file_url, coverUrl: s.cover_url || undefined,
    }));
    play(queue[0], queue);
  };

  return (
    <Layout>
      <div className="px-4 lg:px-8 py-6 pb-28">
        <h1 className="font-heading text-2xl font-extrabold text-foreground mb-6">Your Library</h1>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap active:scale-95 ${
                tab === t.key
                  ? "bg-primary text-primary-foreground glow-gold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count > 0 && <span className="text-xs opacity-70">{t.count}</span>}
            </button>
          ))}
        </div>

        {!user && tab !== "downloads" ? (
          <div className="text-center py-16">
            <Music className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Sign in to access your library</p>
            <Link to="/auth"><Button>Sign In</Button></Link>
          </div>
        ) : (
          <>
            {/* PLAYLISTS */}
            {tab === "playlists" && (
              <div className="space-y-2 animate-fade-in">
                <Link
                  to="/playlists"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/10 hover:border-primary/30 transition-all group"
                >
                  <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Create New Playlist</p>
                    <p className="text-xs text-muted-foreground">Organize your favorite songs</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {playlists?.map(playlist => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="group rounded-xl bg-card/60 border border-border/50 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        {playlist.cover_url ? (
                          <img src={playlist.cover_url} alt={playlist.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" / loading="lazy" decoding="async">
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                            <Music className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg glow-gold">
                            <Play className="h-4 w-4 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {playlist.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Playlist</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* LIKED SONGS */}
            {tab === "liked" && (
              <div className="animate-fade-in">
                {likedSongs && likedSongs.length > 0 && (
                  <div className="flex items-center gap-3 mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/10">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">Liked Songs</p>
                      <p className="text-xs text-muted-foreground">{likedSongs.length} songs</p>
                    </div>
                    <button
                      onClick={handlePlayLiked}
                      className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center glow-gold hover:scale-105 active:scale-95 transition-all"
                    >
                      <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                    </button>
                  </div>
                )}

                <div className="space-y-0.5">
                  {likedSongs?.map((song: any) => (
                    <Link
                      key={song.id}
                      to={`/song/${song.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors group"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                            <Music className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artists?.name || "Unknown"}</p>
                      </div>
                      <Heart className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
                    </Link>
                  ))}
                </div>

                {(!likedSongs || likedSongs.length === 0) && (
                  <div className="text-center py-16">
                    <Heart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Songs you like will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* RECENTLY PLAYED */}
            {tab === "recent" && (
              <div className="animate-fade-in">
                {recentlyPlayed.length > 0 ? (
                  <div className="space-y-0.5">
                    {recentlyPlayed.map((song: any) => (
                      <div
                        key={song.id}
                        onClick={() => play(song)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors group cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                              <Music className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Clock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Songs you play will appear here</p>
                  </div>
                )}
              </div>
            )}

            {/* DOWNLOADS */}
            {tab === "downloads" && (
              <div className="animate-fade-in">
                {downloads.length === 0 ? (
                  <div className="text-center py-16">
                    <Download className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No downloads yet</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {downloads.slice(0, 20).map(song => (
                      <Link
                        key={song.id}
                        to={`/song/${song.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-card/80 transition-colors group"
                      >
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 shadow-sm">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt={song.title} className="h-full w-full object-cover" / loading="lazy" decoding="async">
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/20">
                              <Music className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                        </div>
                        <Download className="h-4 w-4 text-primary flex-shrink-0" />
                      </Link>
                    ))}
                    <Link to="/downloads" className="block text-center text-sm text-primary font-semibold py-3 hover:underline">
                      View all downloads
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default LibraryPage;
