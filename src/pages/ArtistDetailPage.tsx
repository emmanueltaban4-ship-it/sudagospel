import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/hooks/use-player";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import SongCard from "@/components/SongCard";
import { ArrowLeft, Music, CheckCircle } from "lucide-react";

const ArtistDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: songs } = useQuery({
    queryKey: ["artist-songs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*, artists(name, avatar_url)")
        .eq("artist_id", id!)
        .eq("is_approved", true)
        .order("play_count", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const queue = songs?.map((s) => ({
    id: s.id,
    title: s.title,
    artist: (s.artists as any)?.name || "Unknown",
    fileUrl: s.file_url,
    coverUrl: s.cover_url || undefined,
  })) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Artist not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Artist header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-primary/20 mb-4">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-brand flex items-center justify-center text-4xl font-heading font-bold text-primary-foreground">
                {artist.name[0]}
              </div>
            )}
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            {artist.name}
            {artist.is_verified && <CheckCircle className="h-5 w-5 text-primary" />}
          </h1>
          {artist.genre && (
            <span className="mt-1 inline-block rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary">
              {artist.genre}
            </span>
          )}
          {artist.bio && (
            <p className="mt-3 text-sm text-muted-foreground text-center max-w-md">{artist.bio}</p>
          )}
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <Music className="h-4 w-4 text-primary" />
            <span className="text-sm">{songs?.length || 0} songs</span>
          </div>
        </div>

        {/* Songs */}
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Songs</h2>
        <div className="grid grid-cols-2 gap-3">
          {songs?.map((song) => (
            <SongCard
              key={song.id}
              id={song.id}
              title={song.title}
              artist={(song.artists as any)?.name || "Unknown"}
              coverUrl={song.cover_url || ""}
              plays={String(song.play_count || 0)}
              fileUrl={song.file_url}
              queue={queue}
            />
          ))}
        </div>

        {(!songs || songs.length === 0) && (
          <p className="text-center text-sm text-muted-foreground py-8">No songs yet</p>
        )}
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDetailPage;
