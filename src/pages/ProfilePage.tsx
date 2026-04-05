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
import {
  LogIn, UserPlus, Music, Heart, Download, Upload, LogOut, Shield,
  Users, ListMusic, Mic2, Edit3, Save, X, Camera, Crown, ChevronRight,
  Headphones, Settings, Disc3
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

  // === UNAUTHENTICATED VIEW ===
  if (!user) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center">
            {/* Decorative background */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150" />
              <div className="relative mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Headphones className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-foreground mb-2">Join Sudagospel</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-[260px] mx-auto">
              Sign in to save favorites, follow artists, create playlists, and more.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/auth")}
                className="gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-12 font-bold shadow-lg shadow-primary/20"
              >
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                className="gap-2 rounded-xl h-12 font-semibold border-border/60"
              >
                <UserPlus className="h-4 w-4" /> Create Account
              </Button>
            </div>
          </div>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const accountType = (profile as any)?.account_type || "fan";
  const displayName = profile?.display_name || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Layout>
      <div className="pb-28">
        {/* === HERO HEADER === */}
        <div className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative px-4 lg:px-8 pt-8 pb-6">
            <div className="max-w-lg mx-auto">
              {/* Avatar + Info */}
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-background shadow-2xl">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-heading text-2xl font-extrabold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-card shadow-lg transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-1">
                  {editing ? (
                    <div className="space-y-2.5">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Display name"
                        className="bg-card/80 border-border/60 rounded-xl h-10 text-sm font-semibold"
                      />
                      <Textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={2}
                        className="bg-card/80 border-border/60 rounded-xl text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => updateProfile.mutate()} size="sm" className="gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs h-8">
                          <Save className="h-3 w-3" /> Save
                        </Button>
                        <Button onClick={() => setEditing(false)} size="sm" variant="ghost" className="gap-1.5 rounded-lg text-xs h-8">
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="font-heading text-xl font-extrabold text-foreground truncate">{displayName}</h1>
                        <button onClick={startEditing} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email || user.phone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {accountType === "artist" ? <><Mic2 className="h-3 w-3" /> Artist</> : <><Headphones className="h-3 w-3" /> Fan</>}
                        </span>
                      </div>
                      {profile?.bio && (
                        <p className="text-sm text-muted-foreground mt-2.5 line-clamp-2">{profile.bio}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === STATS === */}
        <div className="px-4 lg:px-8 -mt-1">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Uploads", value: mySongs?.length ?? 0, icon: Upload },
                { label: "Likes", value: myLikes, icon: Heart },
                { label: "Playlists", value: myPlaylists, icon: ListMusic },
                { label: "Following", value: followedArtists?.length ?? 0, icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 p-3 text-center hover:bg-card/80 transition-colors">
                  <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                  <p className="font-heading text-lg font-extrabold text-foreground leading-none">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === QUICK ACTIONS === */}
        <div className="px-4 lg:px-8 mt-6">
          <div className="max-w-lg mx-auto space-y-1.5">
            {/* Special links */}
            {myArtist && (
              <NavItem
                icon={<Mic2 className="h-5 w-5" />}
                label="Artist Studio"
                sublabel="Manage your music & analytics"
                onClick={() => navigate("/artist-dashboard")}
                accent
              />
            )}
            {isAdmin && (
              <NavItem
                icon={<Shield className="h-5 w-5" />}
                label="Admin Dashboard"
                sublabel="Manage users, songs & settings"
                onClick={() => navigate("/admin")}
                accent
              />
            )}

            {/* Divider */}
            <div className="pt-2 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Library</p>
            </div>

            <NavItem
              icon={<Upload className="h-5 w-5" />}
              label="Upload Music"
              onClick={() => navigate("/upload")}
            />
            <NavItem
              icon={<ListMusic className="h-5 w-5" />}
              label="My Playlists"
              badge={myPlaylists > 0 ? String(myPlaylists) : undefined}
              onClick={() => navigate("/playlists")}
            />
            <NavItem
              icon={<Crown className="h-5 w-5" />}
              label="Premium"
              sublabel="Unlock all features"
              onClick={() => navigate("/subscription")}
            />

            {/* Following section */}
            {followedArtists && followedArtists.length > 0 && (
              <>
                <div className="pt-4 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Following</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                  {followedArtists.map((artist: any) => (
                    <Link
                      key={artist.id}
                      to={`/artist/${artist.id}`}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[68px] group"
                    >
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/50 transition-all shadow-md">
                        {artist.avatar_url ? (
                          <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">
                            {artist.name?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">{artist.name}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Sign out */}
            <div className="pt-4">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 hover:bg-destructive/10 transition-colors group"
              >
                <LogOut className="h-5 w-5 text-destructive/70 group-hover:text-destructive transition-colors" />
                <span className="text-sm font-semibold text-destructive/70 group-hover:text-destructive transition-colors">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

// Reusable nav item
const NavItem = ({
  icon,
  label,
  sublabel,
  badge,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: string;
  onClick: () => void;
  accent?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3.5 rounded-xl p-3.5 transition-all group ${
      accent
        ? "border border-primary/20 bg-primary/5 hover:bg-primary/10"
        : "bg-card/60 border border-border/40 hover:bg-card hover:border-border/80"
    }`}
  >
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
      accent ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
    }`}>
      {icon}
    </div>
    <div className="flex-1 text-left min-w-0">
      <p className={`text-sm font-semibold truncate ${accent ? "text-primary" : "text-foreground"}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-muted-foreground truncate">{sublabel}</p>}
    </div>
    {badge && (
      <span className="text-[11px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-full">{badge}</span>
    )}
    <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-colors ${accent ? "text-primary/40" : "text-muted-foreground/30 group-hover:text-muted-foreground"}`} />
  </button>
);

export default ProfilePage;
