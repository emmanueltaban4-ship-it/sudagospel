import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Youtube, ExternalLink, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";

const VideosPage = () => {
  useDocumentMeta({
    title: "Videos - Sudagospel",
    description: "Watch music videos from South Sudan's top gospel artists on YouTube.",
  });

  const { data: artists, isLoading } = useQuery({
    queryKey: ["artists-with-youtube"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, avatar_url, genre, is_verified, youtube_channel_url")
        .not("youtube_channel_url", "is", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getChannelUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    return `https://www.youtube.com/${url.startsWith("@") ? url : `@${url}`}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 pb-28">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
              <Youtube className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">Videos</h1>
              <p className="text-sm text-muted-foreground">Watch music videos from our artists</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : artists && artists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="rounded-xl bg-card border border-border overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Artist header */}
                <Link
                  to={`/artist/${artist.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-primary-foreground">
                        {artist.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-bold text-foreground truncate">{artist.name}</h3>
                      {artist.is_verified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{artist.genre || "Gospel"}</p>
                  </div>
                </Link>

                {/* YouTube link */}
                <div className="px-4 pb-4">
                  <a
                    href={getChannelUrl(artist.youtube_channel_url!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                  >
                    <Youtube className="h-4 w-4" />
                    Watch on YouTube
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Youtube className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">No Videos Yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Artists can connect their YouTube channels from their dashboard. Check back soon!
            </p>
          </div>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default VideosPage;
