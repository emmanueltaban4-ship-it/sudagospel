import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import { Youtube, ExternalLink, CheckCircle, Play, Mic2, Video, Star, Film, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";

type TabKey = "all" | "music_video" | "interview" | "spotlight" | "live_performance";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Film className="h-4 w-4" /> },
  { key: "music_video", label: "Music Videos", icon: <Video className="h-4 w-4" /> },
  { key: "interview", label: "Interviews", icon: <Mic2 className="h-4 w-4" /> },
  { key: "spotlight", label: "Spotlight", icon: <Star className="h-4 w-4" /> },
  { key: "live_performance", label: "Live", icon: <Play className="h-4 w-4" /> },
];

const VideosPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useDocumentMeta({
    title: "Videos - Sudagospel",
    description: "Watch music videos, interviews, and gospel spotlights from South Sudan's top artists.",
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, artists(id, name, avatar_url, is_verified)")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: youtubeArtists } = useQuery({
    queryKey: ["artists-with-youtube"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, genre, is_verified, youtube_channel_url")
        .not("youtube_channel_url", "is", null)
        .order("name");
      if (error) throw error;
      return data?.filter((a) => a.youtube_channel_url?.trim()) || [];
    },
  });

  const filteredVideos = videos?.filter(
    (v) => activeTab === "all" || v.video_type === activeTab
  ) || [];

  const featuredVideo = videos?.find((v) => v.is_featured);

  const getChannelUrl = (url: string) =>
    url.startsWith("http") ? url : `https://www.youtube.com/${url.startsWith("@") ? url : `@${url}`}`;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 pb-28">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Play className="h-5 w-5 text-primary-foreground ml-0.5" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">Videos</h1>
              <p className="text-sm text-muted-foreground">Music videos, interviews & spotlights</p>
            </div>
          </div>
        </div>

        {/* Featured Video */}
        {featuredVideo && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary" fill="hsl(var(--primary))" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Featured</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="md:col-span-3">
                <VideoPlayer videoUrl={featuredVideo.video_url} thumbnailUrl={featuredVideo.thumbnail_url || undefined} title={featuredVideo.title} inline />
              </div>
              <div className="md:col-span-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">
                  {featuredVideo.video_type.replace("_", " ")}
                </span>
                <h2 className="font-heading text-xl md:text-2xl font-extrabold text-foreground mb-2">
                  {featuredVideo.title}
                </h2>
                {featuredVideo.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                    {featuredVideo.description}
                  </p>
                )}
                {(featuredVideo.artists as any) && (
                  <Link
                    to={artistPath((featuredVideo.artists as any).name)}
                    className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted">
                      {(featuredVideo.artists as any).avatar_url ? (
                        <img src={(featuredVideo.artists as any).avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {(featuredVideo.artists as any).name[0]}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">{(featuredVideo.artists as any).name}</span>
                    {(featuredVideo.artists as any).is_verified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 border-b border-border/40 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
                activeTab === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video rounded-xl bg-muted mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded mb-1" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map((video) => {
              const artist = video.artists as any;
              return (
                <div key={video.id} className="group">
                  <VideoPlayer videoUrl={video.video_url} thumbnailUrl={video.thumbnail_url || undefined} title={video.title} />
                  <div className="mt-2.5 flex gap-2.5">
                    {artist && (
                      <Link to={artistPath(artist.name)} className="flex-shrink-0">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-muted">
                          {artist.avatar_url ? (
                            <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {artist.name[0]}
                            </div>
                          )}
                        </div>
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {video.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {artist && (
                          <Link to={artistPath(artist.name)} className="text-xs text-muted-foreground hover:text-primary transition-colors truncate">
                            {artist.name}
                          </Link>
                        )}
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <span className="text-[10px] text-muted-foreground/50 capitalize">{video.video_type.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <Video className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <h2 className="font-heading text-lg font-bold text-foreground mb-1">No videos in this category</h2>
            <p className="text-sm text-muted-foreground">Check back soon for new content!</p>
          </div>
        )}

        {/* YouTube Artist Channels */}
        {youtubeArtists && youtubeArtists.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-lg font-black text-foreground mb-4 flex items-center gap-2">
              <Youtube className="h-5 w-5 text-destructive" />
              Artist Channels
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {youtubeArtists.map((artist) => (
                <a
                  key={artist.id}
                  href={getChannelUrl(artist.youtube_channel_url!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-destructive/30 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {artist.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-destructive transition-colors">{artist.name}</p>
                    <p className="text-[10px] text-muted-foreground">{artist.genre || "Gospel"}</p>
                  </div>
                  <Youtube className="h-4 w-4 text-destructive/60 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default VideosPage;
