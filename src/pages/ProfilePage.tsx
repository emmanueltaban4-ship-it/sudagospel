import { useNavigate, Link } from "react-router-dom";
import { artistPath } from "@/lib/artist-slug";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { useMyFollowedArtists } from "@/hooks/use-follows";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogIn, UserPlus, Music, Heart, Download, Upload, LogOut, Shield,
  Users, ListMusic, Mic2, Edit3, Save, X, Camera, Crown, ChevronRight,
  Headphones, Settings, Disc3, Play, TrendingUp, Clock, CheckCircle, BadgeCheck,
  Eye, Trash2, Pencil, Youtube, Rocket, Video, Plus
} from "lucide-react";
import BoostSongDialog from "@/components/BoostSongDialog";
import { useState, useRef } from "react";
import { toast } from "sonner";

/* ─── Album Selector for Song Edit ─── */
const AlbumSelectorForEdit = ({ artistId, value, onChange }: { artistId: string; value: string; onChange: (v: string) => void }) => {
  const { data: albums } = useQuery({
    queryKey: ["artist-albums-select", artistId],
    queryFn: async () => {
      const { data, error } = await supabase.from("albums").select("id, title").eq("artist_id", artistId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });
  if (!albums || albums.length === 0) return null;
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger className="bg-background"><SelectValue placeholder="Single (no album)" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Single (no album)</SelectItem>
        {albums.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
      </SelectContent>
    </Select>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Artist profile editing
  const [editingArtist, setEditingArtist] = useState(false);
  const [editArtistName, setEditArtistName] = useState("");
  const [editArtistBio, setEditArtistBio] = useState("");
  const [editArtistGenre, setEditArtistGenre] = useState("");
  const [editArtistYoutube, setEditArtistYoutube] = useState("");

  // Song editing
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editSongTitle, setEditSongTitle] = useState("");
  const [editSongDescription, setEditSongDescription] = useState("");
  const [editSongGenre, setEditSongGenre] = useState("");
  const [editSongLyrics, setEditSongLyrics] = useState("");
  const [editSongAlbumId, setEditSongAlbumId] = useState("");

  // Album form
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDesc, setAlbumDesc] = useState("");
  const [albumGenre, setAlbumGenre] = useState("");
  const [albumType, setAlbumType] = useState("album");
  const [albumReleaseDate, setAlbumReleaseDate] = useState("");
  const [albumCoverFile, setAlbumCoverFile] = useState<File | null>(null);
  const albumCoverInputRef = useRef<HTMLInputElement>(null);

  // Video form
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoType, setVideoType] = useState("music_video");
  const [videoThumbnail, setVideoThumbnail] = useState("");
  const [verificationReason, setVerificationReason] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myLikes = 0 } = useQuery({
    queryKey: ["my-likes", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("song_likes").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: myPlaylists = 0 } = useQuery({
    queryKey: ["my-playlists-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("playlists").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: followedArtists } = useMyFollowedArtists();

  const { data: myArtist } = useQuery({
    queryKey: ["my-artist-full", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: artistSongs } = useQuery({
    queryKey: ["artist-dashboard-songs", myArtist?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").eq("artist_id", myArtist!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["artist-followers", myArtist?.id],
    queryFn: async () => {
      const { count } = await supabase.from("artist_follows").select("*", { count: "exact", head: true }).eq("artist_id", myArtist!.id);
      return count ?? 0;
    },
    enabled: !!myArtist,
  });

  const { data: artistAlbums } = useQuery({
    queryKey: ["artist-albums", myArtist?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("albums").select("*, songs(count)").eq("artist_id", myArtist!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist,
  });

  const { data: artistVideos } = useQuery({
    queryKey: ["artist-videos", myArtist?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("artist_id", myArtist!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist,
  });

  const { data: verificationRequest } = useQuery({
    queryKey: ["verification-request", myArtist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("artist_id", myArtist!.id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!myArtist && !!user,
  });

  const submitVerification = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("verification_requests").insert({
        artist_id: myArtist!.id,
        user_id: user!.id,
        reason: verificationReason,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-request"] });
      setVerificationReason("");
      toast.success("Verification request submitted!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mutations
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ display_name: editName, bio: editBio }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile"] }); setEditing(false); toast.success("Profile updated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateArtistProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("artists").update({ name: editArtistName, bio: editArtistBio, genre: editArtistGenre, youtube_channel_url: editArtistYoutube || null }).eq("id", myArtist!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-artist-full"] }); setEditingArtist(false); toast.success("Artist profile updated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSong = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("songs").update({
        title: editSongTitle, description: editSongDescription || null, genre: editSongGenre || null,
        lyrics: editSongLyrics || null, album_id: editSongAlbumId && editSongAlbumId !== "none" ? editSongAlbumId : null,
      }).eq("id", editingSongId!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["artist-dashboard-songs"] }); setEditingSongId(null); toast.success("Song updated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSong = useMutation({
    mutationFn: async (songId: string) => { const { error } = await supabase.from("songs").delete().eq("id", songId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["artist-dashboard-songs"] }); toast.success("Song deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const createAlbum = useMutation({
    mutationFn: async () => {
      let coverUrl: string | null = null;
      if (albumCoverFile) {
        const ext = albumCoverFile.name.split(".").pop();
        const path = `albums/${myArtist!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("covers").upload(path, albumCoverFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
        coverUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("albums").insert({
        artist_id: myArtist!.id, title: albumTitle, description: albumDesc || null,
        genre: albumGenre || null, album_type: albumType,
        release_date: albumReleaseDate || null, cover_url: coverUrl,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-albums"] });
      setShowAlbumForm(false); setAlbumTitle(""); setAlbumDesc(""); setAlbumGenre("");
      setAlbumType("album"); setAlbumReleaseDate(""); setAlbumCoverFile(null);
      toast.success("Album created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("albums").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["artist-albums"] }); toast.success("Album deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const resetVideoForm = () => {
    setVideoTitle(""); setVideoUrl(""); setVideoDesc(""); setVideoType("music_video"); setVideoThumbnail(""); setEditingVideoId(null); setShowVideoForm(false);
  };

  const saveVideo = useMutation({
    mutationFn: async () => {
      if (editingVideoId) {
        const { error } = await supabase.from("videos").update({ title: videoTitle, video_url: videoUrl, description: videoDesc || null, video_type: videoType, thumbnail_url: videoThumbnail || null }).eq("id", editingVideoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos").insert({ title: videoTitle, video_url: videoUrl, description: videoDesc || null, video_type: videoType, thumbnail_url: videoThumbnail || null, artist_id: myArtist!.id, uploaded_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["artist-videos"] }); resetVideoForm(); toast.success(editingVideoId ? "Video updated!" : "Video added!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("videos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["artist-videos"] }); toast.success("Video deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const startEditingVideo = (video: any) => {
    setEditingVideoId(video.id); setVideoTitle(video.title); setVideoUrl(video.video_url);
    setVideoDesc(video.description || ""); setVideoType(video.video_type); setVideoThumbnail(video.thumbnail_url || "");
    setShowVideoForm(true);
  };

  const handleAvatarUpload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Avatar updated!");
  };

  const startEditing = () => { setEditName(profile?.display_name || ""); setEditBio(profile?.bio || ""); setEditing(true); };
  const startEditingArtist = () => {
    if (!myArtist) return;
    setEditArtistName(myArtist.name); setEditArtistBio(myArtist.bio || "");
    setEditArtistGenre(myArtist.genre || ""); setEditArtistYoutube(myArtist.youtube_channel_url || "");
    setEditingArtist(true);
  };
  const startEditingSong = (song: any) => {
    setEditingSongId(song.id); setEditSongTitle(song.title); setEditSongDescription(song.description || "");
    setEditSongGenre(song.genre || ""); setEditSongLyrics(song.lyrics || ""); setEditSongAlbumId(song.album_id || "");
  };

  // === UNAUTHENTICATED VIEW ===
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150" />
              <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Headphones className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-foreground mb-2">Join Sudagospel</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-[260px] mx-auto">Sign in to save favorites, follow artists, create playlists, and more.</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/auth")} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-12 font-bold shadow-lg shadow-primary/20"><LogIn className="h-4 w-4" /> Sign In</Button>
              <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2 rounded-xl h-12 font-semibold border-border/60"><UserPlus className="h-4 w-4" /> Create Account</Button>
            </div>
          </div>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const isArtist = !!myArtist;
  const displayName = profile?.display_name || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const totalPlays = artistSongs?.reduce((sum, s) => sum + (s.play_count || 0), 0) || 0;
  const totalDownloads = artistSongs?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0;
  const approvedSongs = artistSongs?.filter((s) => s.is_approved) || [];
  const pendingSongs = artistSongs?.filter((s) => !s.is_approved) || [];

  const renderSongRow = (song: any, options?: { showStatus?: boolean }) => {
    if (editingSongId === song.id) {
      return (
        <div key={song.id} className="p-4 rounded-lg bg-card border border-border space-y-3">
          <Input value={editSongTitle} onChange={(e) => setEditSongTitle(e.target.value)} placeholder="Song title" className="bg-background" />
          <Textarea value={editSongDescription} onChange={(e) => setEditSongDescription(e.target.value)} placeholder="Description" rows={2} className="bg-background" />
          <Input value={editSongGenre} onChange={(e) => setEditSongGenre(e.target.value)} placeholder="Genre" className="bg-background" />
          <Textarea value={editSongLyrics} onChange={(e) => setEditSongLyrics(e.target.value)} placeholder="Lyrics" rows={4} className="bg-background" />
          {myArtist && <AlbumSelectorForEdit artistId={myArtist.id} value={editSongAlbumId} onChange={setEditSongAlbumId} />}
          <div className="flex gap-2">
            <Button onClick={() => updateSong.mutate()} size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground"><Save className="h-3.5 w-3.5" /> Save</Button>
            <Button onClick={() => setEditingSongId(null)} size="sm" variant="ghost" className="gap-1.5 rounded-full"><X className="h-3.5 w-3.5" /> Cancel</Button>
          </div>
        </div>
      );
    }
    return (
      <div key={song.id} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors ${options?.showStatus ? "bg-yellow-500/5 border border-yellow-500/20" : ""}`}>
        <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
          {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-muted flex items-center justify-center"><Music className="h-4 w-4 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/song/${song.id}`} className="text-sm font-medium text-foreground truncate block hover:underline">{song.title}</Link>
          <p className="text-[11px] text-muted-foreground">{options?.showStatus ? "Awaiting review" : `${(song.play_count || 0).toLocaleString()} plays · ${(song.download_count || 0).toLocaleString()} downloads`}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <BoostSongDialog songId={song.id} songTitle={song.title}>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Boost song"><Rocket className="h-3.5 w-3.5" /></button>
          </BoostSongDialog>
          <button onClick={() => startEditingSong(song)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => { if (confirm("Delete this song permanently?")) deleteSong.mutate(song.id); }} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="pb-28">
        {/* === HERO HEADER === */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          </div>
          <div className="relative px-4 lg:px-8 pt-8 pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-background shadow-2xl">
                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-heading text-2xl font-extrabold">{initials}</div>
                    )}
                  </div>
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-card shadow-lg transition-colors">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  {editing ? (
                    <div className="space-y-2.5">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display name" className="bg-card/80 border-border/60 rounded-xl h-10 text-sm font-semibold" />
                      <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." rows={2} className="bg-card/80 border-border/60 rounded-xl text-sm resize-none" />
                      <div className="flex gap-2">
                        <Button onClick={() => updateProfile.mutate()} size="sm" className="gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs h-8"><Save className="h-3 w-3" /> Save</Button>
                        <Button onClick={() => setEditing(false)} size="sm" variant="ghost" className="gap-1.5 rounded-lg text-xs h-8"><X className="h-3 w-3" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="font-heading text-xl font-extrabold text-foreground truncate">{displayName}</h1>
                        <button onClick={startEditing} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"><Edit3 className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email || user.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {isArtist ? <><Mic2 className="h-3 w-3" /> Artist</> : <><Headphones className="h-3 w-3" /> Fan</>}
                        </span>
                        {isArtist && myArtist?.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                      </div>
                      {profile?.bio && <p className="text-sm text-muted-foreground mt-2.5 line-clamp-2">{profile.bio}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === STATS === */}
        <div className="px-4 lg:px-8 -mt-1">
          <div className="max-w-2xl mx-auto">
            <div className={`grid gap-2 ${isArtist ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-4"}`}>
              {isArtist ? (
                <>
                  {[
                    { label: "Songs", value: artistSongs?.length ?? 0, icon: Music },
                    { label: "Plays", value: totalPlays, icon: Play },
                    { label: "Downloads", value: totalDownloads, icon: Download },
                    { label: "Followers", value: followerCount, icon: Users },
                    { label: "Likes", value: myLikes, icon: Heart },
                    { label: "Playlists", value: myPlaylists, icon: ListMusic },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 text-center hover:bg-card/80 transition-colors">
                      <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                      <p className="font-heading text-lg font-extrabold text-foreground leading-none">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: "Likes", value: myLikes, icon: Heart },
                    { label: "Playlists", value: myPlaylists, icon: ListMusic },
                    { label: "Following", value: followedArtists?.length ?? 0, icon: Users },
                    { label: "Uploads", value: 0, icon: Upload },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 text-center hover:bg-card/80 transition-colors">
                      <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                      <p className="font-heading text-lg font-extrabold text-foreground leading-none">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="px-4 lg:px-8 mt-6">
          <div className="max-w-2xl mx-auto">
            {isArtist ? (
              /* ─── ARTIST TABS ─── */
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1 h-auto flex-wrap">
                  <TabsTrigger value="overview" className="rounded-lg text-xs data-[state=active]:bg-background">Overview</TabsTrigger>
                  <TabsTrigger value="songs" className="rounded-lg text-xs data-[state=active]:bg-background">Songs {pendingSongs.length > 0 && `(${pendingSongs.length} pending)`}</TabsTrigger>
                  <TabsTrigger value="albums" className="rounded-lg text-xs data-[state=active]:bg-background">Albums</TabsTrigger>
                  <TabsTrigger value="videos" className="rounded-lg text-xs data-[state=active]:bg-background">Videos</TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-lg text-xs data-[state=active]:bg-background">Settings</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-4">
                  {/* Artist card */}
                  <div className="rounded-xl bg-card border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2"><Mic2 className="h-4 w-4 text-primary" /> Artist Profile</h3>
                      <Link to={artistPath(myArtist!.name)} className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="h-3 w-3" /> Public page</Link>
                    </div>
                    <p className="text-sm text-muted-foreground">{myArtist!.genre || "No genre"} · {myArtist!.bio ? myArtist!.bio.slice(0, 100) + "..." : "No bio set"}</p>
                  </div>

                  {/* Pending songs */}
                  {pendingSongs.length > 0 && (
                    <div>
                      <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /> Pending ({pendingSongs.length})</h3>
                      <div className="space-y-1">{pendingSongs.map((s) => renderSongRow(s, { showStatus: true }))}</div>
                    </div>
                  )}

                  {/* Top songs */}
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top Songs</h3>
                    {approvedSongs.length > 0 ? (
                      <div className="rounded-xl border border-border overflow-hidden">
                        {[...approvedSongs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 5).map((song, i) => (
                          <Link key={song.id} to={`/song/${song.id}`} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${i < 4 ? "border-b border-border" : ""}`}>
                            <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                            <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                              {song.cover_url ? <img src={song.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Music className="h-4 w-4 text-muted-foreground" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                              <p className="text-[11px] text-muted-foreground">{(song.play_count || 0).toLocaleString()} plays</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground text-center py-4">No songs yet.</p>}
                  </div>

                  <Button onClick={() => navigate("/upload")} className="w-full rounded-xl gap-2 bg-primary text-primary-foreground h-12 font-bold"><Upload className="h-4 w-4" /> Upload New Song</Button>
                </TabsContent>

                {/* Songs Tab */}
                <TabsContent value="songs" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-sm font-bold text-foreground">All Songs ({artistSongs?.length || 0})</h3>
                    <Button onClick={() => navigate("/upload")} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs"><Upload className="h-3 w-3" /> Upload</Button>
                  </div>
                  {pendingSongs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Pending Approval</p>
                      {pendingSongs.map((s) => renderSongRow(s, { showStatus: true }))}
                    </div>
                  )}
                  <div className="space-y-1">
                    {approvedSongs.length > 0 && <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Approved</p>}
                    {approvedSongs.map((s) => renderSongRow(s))}
                  </div>
                  {(!artistSongs || artistSongs.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No songs yet. Upload your first!</p>}
                </TabsContent>

                {/* Albums Tab */}
                <TabsContent value="albums" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-sm font-bold text-foreground">Albums ({artistAlbums?.length || 0})</h3>
                    <Button onClick={() => setShowAlbumForm(!showAlbumForm)} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs">
                      {showAlbumForm ? <><X className="h-3 w-3" /> Cancel</> : <><Disc3 className="h-3 w-3" /> New Album</>}
                    </Button>
                  </div>

                  {showAlbumForm && (
                    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                      <Input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="Album title" className="bg-background" />
                      <Textarea value={albumDesc} onChange={(e) => setAlbumDesc(e.target.value)} placeholder="Description" rows={2} className="bg-background" />
                      <Input value={albumGenre} onChange={(e) => setAlbumGenre(e.target.value)} placeholder="Genre" className="bg-background" />
                      <Select value={albumType} onValueChange={setAlbumType}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="album">Album</SelectItem>
                          <SelectItem value="ep">EP</SelectItem>
                          <SelectItem value="single">Single</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="date" value={albumReleaseDate} onChange={(e) => setAlbumReleaseDate(e.target.value)} className="bg-background" placeholder="Release date" />
                      <div>
                        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-background p-3 text-center hover:border-primary transition-colors">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{albumCoverFile ? albumCoverFile.name : "Upload cover art"}</span>
                          <input ref={albumCoverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setAlbumCoverFile(e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <Button onClick={() => createAlbum.mutate()} size="sm" className="rounded-full bg-primary text-primary-foreground gap-1.5" disabled={!albumTitle.trim()}><Save className="h-3.5 w-3.5" /> Create</Button>
                    </div>
                  )}

                  {artistAlbums && artistAlbums.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {artistAlbums.map((album: any) => (
                        <Link key={album.id} to={`/album/${album.id}`} className="rounded-lg bg-card border border-border p-3 group relative hover:border-primary/30 transition-colors">
                          <div className="aspect-square rounded-md bg-muted mb-2 overflow-hidden flex items-center justify-center">
                            {album.cover_url ? <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover" /> : <Disc3 className="h-8 w-8 text-muted-foreground/30" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground truncate">{album.title}</p>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{(album as any).album_type || "album"}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{(album.songs as any)?.[0]?.count || 0} songs · {album.genre || "Gospel"}</p>
                          <button onClick={(e) => { e.preventDefault(); if (confirm("Delete this album?")) deleteAlbum.mutate(album.id); }} className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                        </Link>
                      ))}
                    </div>
                  ) : !showAlbumForm ? <p className="text-sm text-muted-foreground text-center py-4">No albums yet.</p> : null}
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-sm font-bold text-foreground">Videos ({artistVideos?.length || 0})</h3>
                    <Button onClick={() => { resetVideoForm(); setShowVideoForm(!showVideoForm); }} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs">
                      {showVideoForm ? <><X className="h-3 w-3" /> Cancel</> : <><Plus className="h-3 w-3" /> Add Video</>}
                    </Button>
                  </div>

                  {showVideoForm && (
                    <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                      <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" className="bg-background" />
                      <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube or video URL" className="bg-background" />
                      <Textarea value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} placeholder="Description" rows={2} className="bg-background" />
                      <Input value={videoThumbnail} onChange={(e) => setVideoThumbnail(e.target.value)} placeholder="Thumbnail URL (optional)" className="bg-background" />
                      <Select value={videoType} onValueChange={setVideoType}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="music_video">Music Video</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="spotlight">Spotlight</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => saveVideo.mutate()} size="sm" className="rounded-full bg-primary text-primary-foreground gap-1.5" disabled={!videoTitle.trim() || !videoUrl.trim()}>
                        <Save className="h-3.5 w-3.5" /> {editingVideoId ? "Update" : "Add"}
                      </Button>
                    </div>
                  )}

                  {artistVideos && artistVideos.length > 0 ? (
                    <div className="space-y-1">
                      {artistVideos.map((video) => (
                        <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors">
                          <div className="h-10 w-16 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                            {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">{video.video_type.replace("_", " ")} · {video.view_count.toLocaleString()} views · {video.is_published ? "Published" : "Draft"}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => startEditingVideo(video)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if (confirm("Delete this video?")) deleteVideo.mutate(video.id); }} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !showVideoForm ? <p className="text-sm text-muted-foreground text-center py-8">No videos yet. Share your music videos and interviews!</p> : null}
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6 mt-4">
                  {/* Artist profile edit */}
                  <div className="rounded-xl bg-card border border-border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-sm font-bold text-foreground">Artist Profile</h3>
                      {!editingArtist && <button onClick={startEditingArtist} className="text-primary text-xs hover:underline">Edit</button>}
                    </div>
                    {editingArtist ? (
                      <div className="space-y-3">
                        <Input value={editArtistName} onChange={(e) => setEditArtistName(e.target.value)} placeholder="Artist name" className="bg-background" />
                        <Input value={editArtistGenre} onChange={(e) => setEditArtistGenre(e.target.value)} placeholder="Genre" className="bg-background" />
                        <Textarea value={editArtistBio} onChange={(e) => setEditArtistBio(e.target.value)} placeholder="Bio" rows={3} className="bg-background" />
                        <div className="relative">
                          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                          <Input value={editArtistYoutube} onChange={(e) => setEditArtistYoutube(e.target.value)} placeholder="YouTube channel URL" className="bg-background pl-10" />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => updateArtistProfile.mutate()} size="sm" className="gap-1.5 rounded-full"><Save className="h-3.5 w-3.5" /> Save</Button>
                          <Button onClick={() => setEditingArtist(false)} size="sm" variant="ghost" className="gap-1.5 rounded-full"><X className="h-3.5 w-3.5" /> Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Name:</strong> {myArtist!.name}</p>
                        <p><strong>Genre:</strong> {myArtist!.genre || "Not set"}</p>
                        <p><strong>Bio:</strong> {myArtist!.bio || "Not set"}</p>
                        {myArtist!.youtube_channel_url && <p><strong>YouTube:</strong> {myArtist!.youtube_channel_url}</p>}
                      </div>
                    )}
                  </div>

                  {/* Quick links */}
                  <div className="space-y-1.5">
                    {isAdmin && <NavItem icon={<Shield className="h-5 w-5" />} label="Admin Dashboard" sublabel="Manage users, songs & settings" onClick={() => navigate("/admin")} accent />}
                    <NavItem icon={<ListMusic className="h-5 w-5" />} label="My Playlists" badge={myPlaylists > 0 ? String(myPlaylists) : undefined} onClick={() => navigate("/playlists")} />
                    <NavItem icon={<Crown className="h-5 w-5" />} label="Premium" sublabel="Unlock all features" onClick={() => navigate("/subscription")} />
                  </div>

                  {/* Following */}
                  {followedArtists && followedArtists.length > 0 && (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Following</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                        {followedArtists.map((artist: any) => (
                          <Link key={artist.id} to={artistPath(artist.name)} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px] group">
                            <div className="h-14 w-14 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/50 transition-all shadow-md">
                              {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" /> : (
                                <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">{artist.name?.[0]}</div>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">{artist.name}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}

                  <button onClick={signOut} className="w-full flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 hover:bg-destructive/10 transition-colors group">
                    <LogOut className="h-5 w-5 text-destructive/70 group-hover:text-destructive transition-colors" />
                    <span className="text-sm font-semibold text-destructive/70 group-hover:text-destructive transition-colors">Sign Out</span>
                  </button>
                </TabsContent>
              </Tabs>
            ) : (
              /* ─── FAN VIEW ─── */
              <div className="space-y-1.5">
                {isAdmin && <NavItem icon={<Shield className="h-5 w-5" />} label="Admin Dashboard" sublabel="Manage users, songs & settings" onClick={() => navigate("/admin")} accent />}
                <div className="pt-2 pb-1"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Library</p></div>
                <NavItem icon={<Upload className="h-5 w-5" />} label="Upload Music" onClick={() => navigate("/upload")} />
                <NavItem icon={<ListMusic className="h-5 w-5" />} label="My Playlists" badge={myPlaylists > 0 ? String(myPlaylists) : undefined} onClick={() => navigate("/playlists")} />
                <NavItem icon={<Crown className="h-5 w-5" />} label="Premium" sublabel="Unlock all features" onClick={() => navigate("/subscription")} />

                {followedArtists && followedArtists.length > 0 && (
                  <>
                    <div className="pt-4 pb-1"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Following</p></div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                      {followedArtists.map((artist: any) => (
                        <Link key={artist.id} to={artistPath(artist.name)} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px] group">
                          <div className="h-14 w-14 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/50 transition-all shadow-md">
                            {artist.avatar_url ? <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" /> : (
                              <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">{artist.name?.[0]}</div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">{artist.name}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <button onClick={signOut} className="w-full flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 hover:bg-destructive/10 transition-colors group">
                    <LogOut className="h-5 w-5 text-destructive/70 group-hover:text-destructive transition-colors" />
                    <span className="text-sm font-semibold text-destructive/70 group-hover:text-destructive transition-colors">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

// Reusable nav item
const NavItem = ({ icon, label, sublabel, badge, onClick, accent }: { icon: React.ReactNode; label: string; sublabel?: string; badge?: string; onClick: () => void; accent?: boolean }) => (
  <button onClick={onClick} className={`flex w-full items-center gap-3.5 rounded-xl p-3.5 transition-all group ${accent ? "border border-primary/20 bg-primary/5 hover:bg-primary/10" : "bg-card/60 border border-border/40 hover:bg-card hover:border-border/80"}`}>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${accent ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"}`}>{icon}</div>
    <div className="flex-1 text-left min-w-0">
      <p className={`text-sm font-semibold truncate ${accent ? "text-primary" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground truncate">{sublabel}</p>}
    </div>
    {badge && <span className="text-[11px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">{badge}</span>}
    <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-colors ${accent ? "text-primary/40" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`} />
  </button>
);

export default ProfilePage;
