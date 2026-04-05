import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Edit2, Trash2, BadgeCheck, BadgeX, Mic2, Save, ArrowLeft } from "lucide-react";

const useAllArtists = () => {
  return useQuery({
    queryKey: ["admin-all-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

const AdminArtistManagement = () => {
  const { data: artists, isLoading } = useAllArtists();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", bio: "", genre: "", youtube_channel_url: "" });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-all-artists"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["artists"] });
  };

  const updateArtist = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; bio?: string; genre?: string; is_verified?: boolean }) => {
      const { error } = await supabase.from("artists").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artist updated");
      setEditing(null);
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteArtist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Artist deleted");
      invalidateAll();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = artists?.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to artists
        </button>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Edit Artist</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Genre</label>
            <Input value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bio</label>
            <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={4} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">YouTube Channel URL</label>
            <Input value={editForm.youtube_channel_url} onChange={(e) => setEditForm({ ...editForm, youtube_channel_url: e.target.value })} placeholder="@channelname or full URL" />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateArtist.mutate({ id: editing.id, name: editForm.name, genre: editForm.genre, bio: editForm.bio, youtube_channel_url: editForm.youtube_channel_url || null })} disabled={updateArtist.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading artists...</div>;
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4">
        All Artists ({artists?.length || 0})
      </h2>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered?.map((artist) => (
          <div key={artist.id} className="rounded-xl bg-card border border-border p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex-shrink-0 overflow-hidden bg-muted">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Mic2 className="h-4 w-4 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{artist.name}</span>
                  {artist.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {artist.genre || "No genre"} · {artist.bio ? artist.bio.slice(0, 50) + "..." : "No bio"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                  title={artist.is_verified ? "Unverify" : "Verify"}
                  onClick={() => updateArtist.mutate({ id: artist.id, is_verified: !artist.is_verified })}
                >
                  {artist.is_verified ? <BadgeX className="h-3.5 w-3.5 text-primary" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full"
                  onClick={() => { setEditing(artist); setEditForm({ name: artist.name, bio: artist.bio || "", genre: artist.genre || "", youtube_channel_url: artist.youtube_channel_url || "" }); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-8 w-8 p-0 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => { if (confirm("Delete this artist? This will also remove all their songs.")) deleteArtist.mutate(artist.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminArtistManagement;
