import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPlus, Plus, Music } from "lucide-react";
import { usePlaylists, useCreatePlaylist, useAddToPlaylist } from "@/hooks/use-playlists";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AddToPlaylistDialogProps {
  songId: string;
  trigger?: React.ReactNode;
}

const AddToPlaylistDialog = ({ songId, trigger }: AddToPlaylistDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: playlists, isLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addToPlaylist = useAddToPlaylist();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !user) {
      toast.error("Please log in to create playlists");
      navigate("/auth");
      return;
    }
    setOpen(isOpen);
    if (!isOpen) {
      setShowCreate(false);
      setNewName("");
    }
  };

  const handleAdd = async (playlistId: string) => {
    await addToPlaylist.mutateAsync({ playlistId, songId });
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const playlist = await createPlaylist.mutateAsync({ name: newName.trim() });
    if (playlist) {
      await addToPlaylist.mutateAsync({ playlistId: playlist.id, songId });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="rounded-full p-1 text-muted-foreground hover:text-primary transition-colors">
            <ListPlus className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add to Playlist</DialogTitle>
        </DialogHeader>

        {showCreate ? (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || createPlaylist.isPending} className="flex-1">
                Create & Add
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading font-semibold text-sm">Create New Playlist</span>
            </button>

            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : playlists && playlists.length > 0 ? (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  disabled={addToPlaylist.isPending}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-card transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center flex-shrink-0">
                    <Music className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-sm truncate">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(pl as any).playlist_songs?.[0]?.count || 0} songs
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="py-4 text-center text-muted-foreground text-sm">No playlists yet</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
