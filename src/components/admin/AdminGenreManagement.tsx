import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, X, Tag } from "lucide-react";
import { toast } from "sonner";

const GENRES_KEY = "app_genres";

const AdminGenreManagement = () => {
  const queryClient = useQueryClient();
  const [newGenre, setNewGenre] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ["admin-genres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", GENRES_KEY)
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return ["Gospel", "Worship", "Praise", "Choir", "Afrobeat", "Reggae", "Catholic Music", "Dancehall"];
      try { return JSON.parse(data.value) as string[]; } catch { return []; }
    },
  });

  const saveGenres = useMutation({
    mutationFn: async (updated: string[]) => {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", GENRES_KEY).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("site_settings").update({ value: JSON.stringify(updated) }).eq("key", GENRES_KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key: GENRES_KEY, value: JSON.stringify(updated) });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      toast.success("Genres updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addGenre = () => {
    if (!newGenre.trim()) return;
    if (genres.includes(newGenre.trim())) { toast.error("Genre already exists"); return; }
    saveGenres.mutate([...genres, newGenre.trim()]);
    setNewGenre("");
  };

  const removeGenre = (idx: number) => {
    saveGenres.mutate(genres.filter((_, i) => i !== idx));
  };

  const saveEdit = () => {
    if (editingIdx === null || !editValue.trim()) return;
    const updated = [...genres];
    updated[editingIdx] = editValue.trim();
    saveGenres.mutate(updated);
    setEditingIdx(null);
  };

  if (isLoading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">Genre Management</h2>
        <p className="text-sm text-muted-foreground">Manage music genres/categories available across the app.</p>
      </div>

      <div className="flex gap-2">
        <Input value={newGenre} onChange={(e) => setNewGenre(e.target.value)} placeholder="Add new genre..." className="max-w-xs" onKeyDown={(e) => e.key === "Enter" && addGenre()} />
        <Button onClick={addGenre} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {genres.map((genre, idx) => (
          <div key={idx} className="flex items-center gap-2 rounded-lg bg-card border border-border p-3">
            {editingIdx === idx ? (
              <>
                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm flex-1" onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
                <button onClick={saveEdit} className="text-primary hover:text-primary/80"><Save className="h-4 w-4" /></button>
                <button onClick={() => setEditingIdx(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground flex-1 truncate">{genre}</span>
                <button onClick={() => { setEditingIdx(idx); setEditValue(genre); }} className="text-muted-foreground hover:text-foreground p-1"><Save className="h-3.5 w-3.5" /></button>
                <button onClick={() => removeGenre(idx)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGenreManagement;
