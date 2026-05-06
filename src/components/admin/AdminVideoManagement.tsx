import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Video, Youtube } from "lucide-react";

type VideoType = "music_video" | "interview" | "spotlight";

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: "music_video", label: "Music Video" },
  { value: "interview", label: "Interview" },
  { value: "spotlight", label: "Spotlight" },
];

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const getYouTubeThumbnail = (videoId: string) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

const AdminVideoManagement = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    video_url: "",
    description: "",
    thumbnail_url: "",
    video_type: "music_video" as VideoType,
    artist_id: "",
    is_featured: false,
    is_published: true,
  });

  const videoId = useMemo(() => extractYouTubeId(form.video_url), [form.video_url]);

  const handleUrlChange = (url: string) => {
    setForm((f) => {
      const id = extractYouTubeId(url);
      return {
        ...f,
        video_url: url,
        thumbnail_url: id && (!f.thumbnail_url || f.thumbnail_url.includes("img.youtube.com"))
          ? getYouTubeThumbnail(id)
          : f.thumbnail_url,
      };
    });
  };

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos", filter],
    queryFn: async () => {
      let q = supabase.from("videos").select("*, artists(name)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("video_type", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["admin-artists-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        video_url: form.video_url,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        video_type: form.video_type,
        artist_id: form.artist_id || null,
        is_featured: form.is_featured,
        is_published: form.is_published,
      };
      if (editingId) {
        const { error } = await supabase.from("videos").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("videos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success(editingId ? "Video updated" : "Video added");
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      toast.success("Video deleted");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase.from("videos").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-videos"] }),
  });

  const resetForm = () => {
    setForm({ title: "", video_url: "", description: "", thumbnail_url: "", video_type: "music_video", artist_id: "", is_featured: false, is_published: true });
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (v: any) => {
    setForm({
      title: v.title,
      video_url: v.video_url,
      description: v.description || "",
      thumbnail_url: v.thumbnail_url || "",
      video_type: v.video_type,
      artist_id: v.artist_id || "",
      is_featured: v.is_featured,
      is_published: v.is_published,
    });
    setEditingId(v.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Video Management</h2>
          <span className="text-xs text-muted-foreground">({videos?.length ?? 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {VIDEO_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Video</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Video" : "Add Video"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Title *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Video title" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1.5">
                    <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube URL *
                  </Label>
                  <Input
                    value={form.video_url}
                    onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  />
                  {form.video_url && !videoId && (
                    <p className="text-[11px] text-destructive mt-1">Could not detect a YouTube video ID from this URL</p>
                  )}
                </div>

                {/* YouTube Preview */}
                {videoId && (
                  <div className="rounded-xl overflow-hidden border border-border bg-muted">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube Preview"
                      />
                    </div>
                    <div className="px-3 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Youtube className="h-3 w-3 text-red-500" />
                      Video ID: {videoId}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Thumbnail URL</Label>
                  <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="Auto-filled from YouTube" />
                  {form.thumbnail_url && (
                    <img src={form.thumbnail_url} alt="Thumbnail preview" className="mt-2 rounded-lg h-20 object-cover border border-border" / loading="lazy" decoding="async">
                  )}
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={form.video_type} onValueChange={v => setForm(f => ({ ...f, video_type: v as VideoType }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VIDEO_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Artist</Label>
                    <Select value={form.artist_id} onValueChange={v => setForm(f => ({ ...f, artist_id: v }))}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {artists?.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                    Published
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                    Featured
                  </label>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.video_url || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? "Saving..." : editingId ? "Update Video" : "Add Video"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : !videos?.length ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No videos found</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => {
                const ytId = extractYouTubeId(v.video_url);
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      {ytId ? (
                        <a href={`https://youtube.com/watch?v=${ytId}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={v.thumbnail_url || getYouTubeThumbnail(ytId)}
                            alt={v.title}
                            className="w-24 h-14 rounded-md object-cover border border-border hover:ring-2 hover:ring-primary/40 transition-all"
                          / loading="lazy" decoding="async">
                        </a>
                      ) : (
                        <div className="w-24 h-14 rounded-md bg-muted flex items-center justify-center">
                          <Video className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{v.title}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {v.video_type.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(v as any).artists?.name || "—"}</TableCell>
                    <TableCell className="text-center text-sm"><Eye className="h-3 w-3 inline mr-1" />{v.view_count}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={v.is_published} onCheckedChange={val => toggleMutation.mutate({ id: v.id, field: "is_published", value: val })} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={v.is_featured} onCheckedChange={val => toggleMutation.mutate({ id: v.id, field: "is_featured", value: val })} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Delete this video?")) deleteMutation.mutate(v.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminVideoManagement;
