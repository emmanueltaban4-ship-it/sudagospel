import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { artistPath } from "@/lib/artist-slug";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ListMusic, UserCheck, User as UserIcon } from "lucide-react";

const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, account_type, created_at")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: likes = [] } = useQuery({
    queryKey: ["public-profile-likes", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("song_likes")
        .select("song_id, songs(id, title, cover_url, artists(name))")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(24);
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ["public-profile-playlists", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("playlists")
        .select("id, name, cover_url, description")
        .eq("user_id", userId!)
        .eq("is_public", true)
        .order("updated_at", { ascending: false });
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["public-profile-follows", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_follows")
        .select("artist_id, artists(id, name, avatar_url, is_verified)")
        .eq("user_id", userId!)
        .limit(24);
      return data || [];
    },
    enabled: !!userId,
  });

  useDocumentMeta({
    title: profile ? `${profile.display_name || "User"} on Sudagospel` : "User profile",
    description: profile?.bio || `${profile?.display_name || "A listener"} on Sudagospel`,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="px-4 py-6 max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-32 rounded-full -mt-16 ml-6" />
          <Skeleton className="h-6 w-48 mt-4" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="px-4 py-20 text-center max-w-md mx-auto">
          <UserIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h1 className="font-heading text-xl font-bold text-foreground">User not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This profile doesn't exist or has been removed.</p>
          <Link to="/" className="inline-block mt-4 text-sm text-primary hover:underline">Back home</Link>
        </div>
      </Layout>
    );
  }

  const initial = (profile.display_name || "U")[0].toUpperCase();

  return (
    <Layout>
      <div className="pb-32">
        {/* Cinematic header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover scale-125 blur-[80px] opacity-50" loading="lazy" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </div>

          <div className="px-4 pt-10 pb-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden ring-4 ring-primary/30 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.5)] flex-shrink-0 bg-card">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || ""} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-primary-foreground">
                    {initial}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center md:text-left">
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                  {profile.account_type === "artist" ? "Artist" : "Listener"}
                </span>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground mt-1 leading-tight">
                  {profile.display_name || "Sudagospel listener"}
                </h1>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3 justify-center md:justify-start text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{likes.length} likes</span>
                  <span className="inline-flex items-center gap-1"><ListMusic className="h-3.5 w-3.5" />{playlists.length} public playlists</span>
                  <span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />{follows.length} following</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="px-4 max-w-4xl mx-auto mt-2">
          <Tabs defaultValue="likes">
            <TabsList className="bg-card/60 backdrop-blur">
              <TabsTrigger value="likes">Liked songs</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>

            <TabsContent value="likes" className="mt-5">
              {likes.length === 0 ? (
                <EmptyState icon={<Heart />} text="No liked songs yet" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {likes.map((l: any) => l.songs && (
                    <Link key={l.song_id} to={`/song/${l.songs.id}`} className="group block">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-border/40 group-hover:ring-primary/40 transition">
                        {l.songs.cover_url ? (
                          <img src={l.songs.cover_url} alt={l.songs.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/20" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate mt-2 group-hover:text-primary transition-colors">{l.songs.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{l.songs.artists?.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists" className="mt-5">
              {playlists.length === 0 ? (
                <EmptyState icon={<ListMusic />} text="No public playlists yet" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {playlists.map((p: any) => (
                    <Link key={p.id} to={`/playlist/${p.id}`} className="group block">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted ring-1 ring-border/40 group-hover:ring-primary/40 transition">
                        {p.cover_url ? (
                          <img src={p.cover_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
                            <ListMusic className="h-8 w-8 text-primary-foreground/60" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate mt-2 group-hover:text-primary transition-colors">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-5">
              {follows.length === 0 ? (
                <EmptyState icon={<UserCheck />} text="Not following any artists yet" />
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {follows.map((f: any) => f.artists && (
                    <Link key={f.artist_id} to={artistPath(f.artists.name)} className="group flex flex-col items-center text-center">
                      <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden ring-2 ring-border/40 group-hover:ring-primary/50 transition">
                        {f.artists.avatar_url ? (
                          <img src={f.artists.avatar_url} alt={f.artists.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-primary-foreground">
                            {f.artists.name[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate w-full mt-2 group-hover:text-primary transition-colors">{f.artists.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="text-center py-16 rounded-2xl bg-card/40 border border-border/40 text-muted-foreground">
    <div className="h-10 w-10 mx-auto mb-2 opacity-40 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
    <p className="text-sm">{text}</p>
  </div>
);

export default PublicProfilePage;
