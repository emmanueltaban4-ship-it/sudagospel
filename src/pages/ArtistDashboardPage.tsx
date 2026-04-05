import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Music, Upload, TrendingUp, Download, Heart, Users,
  Play, BarChart3, Edit3, Save, X, Eye, Clock, CheckCircle, Youtube
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ArtistDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");

  // Get artist profile linked to current user
  const { data: artist, isLoading } = useQuery({
    queryKey: ["my-artist-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Artist's songs
  const { data: songs } = useQuery({
    queryKey: ["artist-dashboard-songs", artist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("artist_id", artist!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artist,
  });

  // Follower count
  const { data: followerCount = 0 } = useQuery({
    queryKey: ["artist-followers", artist?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("artist_follows")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artist!.id);
      return count ?? 0;
    },
    enabled: !!artist,
  });

  // Update artist profile
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("artists")
        .update({ name: editName, bio: editBio, genre: editGenre, youtube_channel_url: editYoutubeUrl || null })
        .eq("id", artist!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-artist-profile"] });
      setEditingProfile(false);
      toast.success("Profile updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Music className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Sign in to access your artist dashboard</p>
          <Button onClick={() => navigate("/auth")} className="rounded-full bg-primary text-primary-foreground">Sign In</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4 text-center">
          <Music className="h-16 w-16 text-muted-foreground/20" />
          <h2 className="font-heading text-xl font-bold text-foreground">No Artist Profile</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don't have an artist profile yet. Upload a song to create one, or create one from the upload page.
          </p>
          <Button onClick={() => navigate("/upload")} className="rounded-full bg-primary text-primary-foreground gap-2">
            <Upload className="h-4 w-4" /> Upload Your First Song
          </Button>
        </div>
      </Layout>
    );
  }

  const totalPlays = songs?.reduce((sum, s) => sum + (s.play_count || 0), 0) || 0;
  const totalDownloads = songs?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0;
  const approvedSongs = songs?.filter((s) => s.is_approved) || [];
  const pendingSongs = songs?.filter((s) => !s.is_approved) || [];
  const topSongs = [...(songs || [])].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5);

  const startEditing = () => {
    setEditName(artist.name);
    setEditBio(artist.bio || "");
    setEditGenre(artist.genre || "");
    setEditingProfile(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">Artist Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your music and track performance</p>
          </div>
          <Button onClick={() => navigate("/upload")} className="rounded-full bg-primary text-primary-foreground gap-2">
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl bg-card border border-border p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {artist.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {editingProfile ? (
                <div className="space-y-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Artist name" className="bg-background" />
                  <Input value={editGenre} onChange={(e) => setEditGenre(e.target.value)} placeholder="Genre" className="bg-background" />
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" rows={3} className="bg-background" />
                  <div className="flex gap-2">
                    <Button onClick={() => updateProfile.mutate()} size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground">
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button onClick={() => setEditingProfile(false)} size="sm" variant="ghost" className="gap-1.5 rounded-full">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg font-bold text-foreground">{artist.name}</h2>
                    {artist.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                    <button onClick={startEditing} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">{artist.genre || "No genre set"}</p>
                  {artist.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>}
                  <Link to={`/artist/${artist.id}`} className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> View public profile
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Plays", value: totalPlays.toLocaleString(), icon: Play, color: "text-primary" },
            { label: "Downloads", value: totalDownloads.toLocaleString(), icon: Download, color: "text-secondary" },
            { label: "Followers", value: followerCount.toLocaleString(), icon: Users, color: "text-primary" },
            { label: "Songs", value: songs?.length || 0, icon: Music, color: "text-secondary" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Pending Songs */}
        {pendingSongs.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" /> Pending Approval ({pendingSongs.length})
            </h3>
            <div className="space-y-1">
              {pendingSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    <p className="text-[11px] text-yellow-600 dark:text-yellow-400">Awaiting review</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Songs */}
        <div className="mb-6">
          <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Top Songs
          </h3>
          {topSongs.length > 0 ? (
            <div className="rounded-xl border border-border overflow-hidden">
              {topSongs.map((song, i) => (
                <Link
                  key={song.id}
                  to={`/song/${song.id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${
                    i < topSongs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center tabular-nums">{i + 1}</span>
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                    <p className="text-[11px] text-muted-foreground">{song.genre || "Gospel"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {(song.play_count || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1 hidden sm:flex"><Download className="h-3 w-3" /> {(song.download_count || 0).toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No songs yet. Upload your first song!
            </div>
          )}
        </div>

        {/* All Songs */}
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Music className="h-4 w-4 text-secondary" /> All Songs ({approvedSongs.length})
          </h3>
          <div className="space-y-1">
            {approvedSongs.map((song) => (
              <Link
                key={song.id}
                to={`/song/${song.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors"
              >
                <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  {song.cover_url ? (
                    <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(song.play_count || 0).toLocaleString()} plays · {(song.download_count || 0).toLocaleString()} downloads
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ArtistDashboardPage;
