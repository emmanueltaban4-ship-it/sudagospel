import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const AdminFeaturedContent = () => {
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState("song");
  const [contentId, setContentId] = useState("");

  const { data: featured, isLoading } = useQuery({
    queryKey: ["admin-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_content")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;

      // Enrich with content details
      const enriched = await Promise.all(data.map(async (f) => {
        let title = f.content_id;
        if (f.content_type === "song") {
          const { data: s } = await supabase.from("songs").select("title").eq("id", f.content_id).maybeSingle();
          title = s?.title || f.content_id;
        } else if (f.content_type === "artist") {
          const { data: a } = await supabase.from("artists").select("name").eq("id", f.content_id).maybeSingle();
          title = a?.name || f.content_id;
        } else if (f.content_type === "album") {
          const { data: a } = await supabase.from("albums").select("title").eq("id", f.content_id).maybeSingle();
          title = a?.title || f.content_id;
        }
        return { ...f, title };
      }));
      return enriched;
    },
  });

  const addFeatured = useMutation({
    mutationFn: async () => {
      const maxPos = featured?.reduce((m, f) => Math.max(m, f.position), 0) || 0;
      const { error } = await supabase.from("featured_content").insert({
        content_type: contentType,
        content_id: contentId,
        position: maxPos + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured"] });
      setContentId("");
      toast.success("Featured content added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeFeatured = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("featured_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured"] });
      toast.success("Removed");
    },
  });

  const moveItem = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!featured) return;
      const idx = featured.findIndex((f) => f.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= featured.length) return;

      await supabase.from("featured_content").update({ position: featured[swapIdx].position }).eq("id", featured[idx].id);
      await supabase.from("featured_content").update({ position: featured[idx].position }).eq("id", featured[swapIdx].id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-featured"] }),
  });

  if (isLoading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">Featured Content</h2>
        <p className="text-sm text-muted-foreground">Manage what appears in hero sections and featured areas.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="song">Song</SelectItem>
            <SelectItem value="artist">Artist</SelectItem>
            <SelectItem value="album">Album</SelectItem>
          </SelectContent>
        </Select>
        <Input value={contentId} onChange={(e) => setContentId(e.target.value)} placeholder="Content ID (UUID)" className="max-w-xs" />
        <Button onClick={() => addFeatured.mutate()} size="sm" className="gap-1.5" disabled={!contentId.trim()}><Plus className="h-4 w-4" /> Add</Button>
      </div>

      <div className="space-y-2">
        {featured?.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <span className="text-sm font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
            <Star className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{item.content_type}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => moveItem.mutate({ id: item.id, direction: "up" })} disabled={idx === 0} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveItem.mutate({ id: item.id, direction: "down" })} disabled={idx === (featured?.length || 0) - 1} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeFeatured.mutate(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {(!featured || featured.length === 0) && (
          <div className="text-center py-8">
            <Star className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No featured content. Add songs, artists, or albums above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeaturedContent;
