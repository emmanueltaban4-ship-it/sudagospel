import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Music, Heart, Download, Settings, Upload, LogOut, Shield } from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: mySongs } = useQuery({
    queryKey: ["my-songs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("uploaded_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myLikes } = useQuery({
    queryKey: ["my-likes", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("song_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="container py-6 max-w-lg mx-auto">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Your Profile
          </h1>
          <div className="rounded-2xl bg-card border border-border p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <LogIn className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">
              Welcome to Sudagospel
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to save your favorite songs, follow artists, and download music.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/auth")} className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
              <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2 rounded-full border-border text-foreground hover:bg-muted">
                <UserPlus className="h-4 w-4" /> Create Account
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-lg mx-auto">
        {/* Profile header */}
        <div className="rounded-2xl bg-card border border-border p-6 text-center mb-6">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground font-heading text-2xl font-bold">
            {profile?.display_name?.[0]?.toUpperCase() || "U"}
          </div>
          <h2 className="font-heading font-bold text-lg text-foreground">
            {profile?.display_name || "User"}
          </h2>
          <p className="text-sm text-muted-foreground">{user.email || user.phone}</p>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/upload")}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors"
          >
            <Upload className="h-5 w-5 text-primary" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Upload Song</span>
          </button>
          {[
            { icon: Music, label: "My Uploads", count: `${mySongs?.length ?? 0} songs` },
            { icon: Heart, label: "Liked Songs", count: `${myLikes ?? 0} songs` },
            { icon: Download, label: "Downloads", count: "" },
            { icon: Settings, label: "Settings", count: "" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">
                {item.label}
              </span>
              {item.count && (
                <span className="text-xs text-muted-foreground">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          className="w-full mt-6 gap-2 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
