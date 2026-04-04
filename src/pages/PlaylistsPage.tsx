import { useState } from "react";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { usePlaylists, useDeletePlaylist, useCreatePlaylist } from "@/hooks/use-playlists";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link } from "react-router-dom";
import { ListMusic, Plus, Trash2, Music, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PlaylistsPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!loading && !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center pb-24">
          <Lock className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Sign in to create playlists</h2>
          <p className="text-muted-foreground text-sm mb-6">Save your favorite songs in custom playlists</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <MiniPlayer />
      </Layout>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const playlist = await createPlaylist.mutateAsync({ name: newName.trim() });
    setNewName("");
    setShowCreate(false);
    if (playlist) navigate(`/playlist/${playlist.id}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-24">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gospel-dark via-background to-gospel-dark">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]" />
          </div>
          <div className="relative container py-8 md:py-12">
            <div className="flex items-center gap-2 mb-2">
              <ListMusic className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Your Library</span>
            </div>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-foreground mb-2">Playlists</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md">
              Create and manage your custom playlists
            </p>
          </div>
        </div>

        <div className="container py-6">
          {/* Create button */}
          {showCreate ? (
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Playlist name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={!newName.trim() || createPlaylist.isPending}>Create</Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setNewName(""); }}>Cancel</Button>
            </div>
          ) : (
            <Button onClick={() => setShowCreate(true)} className="mb-6">
              <Plus className="h-4 w-4 mr-2" /> New Playlist
            </Button>
          )}

          {/* Playlists grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-xl bg-muted mb-2" />
                  <div className="h-4 w-3/4 bg-muted rounded mb-1" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : !playlists || playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ListMusic className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="font-heading text-lg font-bold mb-1">No playlists yet</h3>
              <p className="text-muted-foreground text-sm">Create your first playlist to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {playlists.map((pl) => (
                <div key={pl.id} className="group relative">
                  <Link to={`/playlist/${pl.id}`} className="block">
                    <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gradient-to-br from-primary/60 to-primary/20 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      {pl.cover_url ? (
                        <img src={pl.cover_url} alt={pl.name} className="h-full w-full object-cover" />
                      ) : (
                        <Music className="h-12 w-12 text-primary-foreground/70" />
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-sm truncate group-hover:text-primary transition-colors">
                      {pl.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {(pl as any).playlist_songs?.[0]?.count || 0} songs
                    </p>
                  </Link>
                  <button
                    onClick={() => setDeleteId(pl.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deletePlaylist.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MiniPlayer />
    </Layout>
  );
};

export default PlaylistsPage;
