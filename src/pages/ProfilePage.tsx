import { useNavigate } from "react-router-dom";
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
import {
  LogIn, UserPlus, Music, Heart, Download, Upload, LogOut, Shield,
  Users, ListMusic, Mic2, Edit3, Save, X, Camera, Crown
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: mySongs } = useQuery({
    queryKey: ["my-songs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*").eq("uploaded_by", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myLikes = 0 } = useQuery({
    queryKey: ["my-likes", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase.from("song_likes").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: myPlaylists = 0 } = useQuery({
    queryKey: ["my-playlists-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase.from("playlists").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: followedArtists } = useMyFollowedArtists();

  const { data: myArtist } = useQuery({
    queryKey: ["my-artist", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("artists").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ display_name: editName, bio: editBio }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
      toast.success("Profile updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

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

  const startEditing = () => {
    setEditName(profile?.display_name || "");
    setEditBio(profile?.bio || "");
    setEditing(true);
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <div className="max-w-sm w-full text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">Welcome to Sudagospel</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to save favorites, follow artists, and download music.</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/auth")} className="gap-2 rounded-full bg-primary text-primary-foreground"><LogIn className="h-4 w-4" /> Sign In</Button>
              <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2 rounded-full"><UserPlus className="h-4 w-4" /> Create Account</Button>
            </div>
          </div>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const accountType = (profile as any)?.account_type || "fan";

  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* Profile header */}
        <div className="rounded-xl bg-card border border-border p-6 text-center mb-6 relative">
          {!editing && (
            <button onClick={startEditing} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <Edit3 className="h-4 w-4" />
            </button>
          )}

          {/* Avatar */}
          <div className="relative mx-auto mb-3 w-20 h-20">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary mx-auto">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary-foreground font-heading text-2xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md border-2 border-background"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
          </div>

          {editing ? (
            <div className="space-y-3 mt-4">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display name" className="text-center bg-background" />
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself..." rows={2} className="bg-background" />
              <div className="flex gap-2 justify-center">
                <Button onClick={() => updateProfile.mutate()} size="sm" className="gap-1.5 rounded-full bg-primary text-primary-foreground"><Save className="h-3.5 w-3.5" /> Save</Button>
                <Button onClick={() => setEditing(false)} size="sm" variant="ghost" className="gap-1.5 rounded-full"><X className="h-3.5 w-3.5" /> Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-lg text-foreground">{profile?.display_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {accountType === "artist" ? "Artist" : "Fan"}
              </span>
              {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="font-heading text-lg font-bold text-foreground">{mySongs?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uploads</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="font-heading text-lg font-bold text-foreground">{myLikes}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Likes</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="font-heading text-lg font-bold text-foreground">{myPlaylists}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Playlists</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-1.5">
          {myArtist && (
            <button onClick={() => navigate("/artist-dashboard")} className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3.5 hover:bg-primary/10 transition-colors">
              <Mic2 className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm font-semibold text-primary">Artist Dashboard</span>
            </button>
          )}
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3.5 hover:bg-primary/10 transition-colors">
              <Shield className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm font-semibold text-primary">Admin Dashboard</span>
            </button>
          )}

          <button onClick={() => navigate("/upload")} className="flex w-full items-center gap-3 rounded-lg bg-card border border-border p-3.5 hover:bg-muted transition-colors">
            <Upload className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Upload Music</span>
          </button>

          <button onClick={() => navigate("/playlists")} className="flex w-full items-center gap-3 rounded-lg bg-card border border-border p-3.5 hover:bg-muted transition-colors">
            <ListMusic className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">My Playlists</span>
            <span className="text-xs text-muted-foreground">{myPlaylists}</span>
          </button>

          <button onClick={() => navigate("/subscription")} className="flex w-full items-center gap-3 rounded-lg bg-card border border-border p-3.5 hover:bg-muted transition-colors">
            <Crown className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Premium</span>
          </button>
        </div>

        {/* Following */}
        {followedArtists && followedArtists.length > 0 && (
          <div className="mt-6">
            <h3 className="font-heading text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Following ({followedArtists.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {followedArtists.map((artist: any) => (
                <button
                  key={artist.id}
                  onClick={() => navigate(`/artist/${artist.id}`)}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16"
                >
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-muted">
                    {artist.avatar_url ? (
                      <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {artist.name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{artist.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={signOut} variant="outline" className="w-full mt-6 gap-2 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default ProfilePage;
