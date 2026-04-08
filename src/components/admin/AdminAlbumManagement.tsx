import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Disc3, Search, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";

const AdminAlbumManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");

  const { data: albums, isLoading } = useQuery({
    queryKey: ["admin-all-albums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("albums")
        .select("*, artists(name), songs(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateAlbum = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("albums").update({ title: editTitle, genre: editGenre || null }).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-albums"] });
      setEditingId(null);
      toast.success("Album updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-albums"] });
      toast.success("Album deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = albums?.filter((a: any) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.artists?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">Album Management</h2>
        <p className="text-sm text-muted-foreground">{albums?.length || 0} albums total</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search albums..." className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((album: any) => (
          <div key={album.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
              {album.cover_url ? <img src={album.cover_url} alt="" className="h-full w-full object-cover" /> : <Disc3 className="h-5 w-5 text-muted-foreground" />}
            </div>
            {editingId === album.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-8 text-sm" />
                <Input value={editGenre} onChange={(e) => setEditGenre(e.target.value)} placeholder="Genre" className="h-8 text-sm max-w-[120px]" />
                <button onClick={() => updateAlbum.mutate()} className="text-primary"><Save className="h-4 w-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground">{album.artists?.name} · {(album.songs as any)?.[0]?.count || 0} songs · {album.genre || "N/A"}</p>
                </div>
                <button onClick={() => { setEditingId(album.id); setEditTitle(album.title); setEditGenre(album.genre || ""); }} className="p-2 text-muted-foreground hover:text-foreground"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm("Delete this album?")) deleteAlbum.mutate(album.id); }} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No albums found.</p>}
      </div>
    </div>
  );
};

export default AdminAlbumManagement;
