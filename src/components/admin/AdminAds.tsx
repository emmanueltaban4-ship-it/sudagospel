import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Eye, MousePointerClick, Image } from "lucide-react";

const AD_POSITIONS = [
  { value: "homepage_top", label: "Homepage — Top Banner" },
  { value: "homepage_mid", label: "Homepage — Mid Section" },
  { value: "music_page", label: "Music Page" },
  { value: "artist_page", label: "Artist Page" },
  { value: "song_detail", label: "Song Detail Page" },
  { value: "sidebar", label: "Sidebar" },
] as const;

interface Ad {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  position: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  click_count: number;
  impression_count: number;
  created_at: string;
}

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState({
    title: "",
    link_url: "",
    position: "homepage_top",
    is_active: true,
    start_date: "",
    end_date: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });

  const openCreate = () => {
    setEditingAd(null);
    setForm({ title: "", link_url: "", position: "homepage_top", is_active: true, start_date: "", end_date: "" });
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      link_url: ad.link_url || "",
      position: ad.position,
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.slice(0, 10) : "",
      end_date: ad.end_date ? ad.end_date.slice(0, 10) : "",
    });
    setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("ads").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("ads").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let image_url = editingAd?.image_url || null;

      if (imageFile) {
        image_url = await uploadImage(imageFile);
      }

      const payload = {
        title: form.title,
        image_url,
        link_url: form.link_url || null,
        position: form.position,
        is_active: form.is_active,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (editingAd) {
        const { error } = await supabase.from("ads").update(payload).eq("id", editingAd.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      setDialogOpen(false);
      setUploading(false);
      toast.success(editingAd ? "Ad updated!" : "Ad created!");
    },
    onError: (err: any) => {
      setUploading(false);
      toast.error(err.message || "Failed to save ad");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success("Ad deleted");
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ads").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
  });

  const positionLabel = (pos: string) =>
    AD_POSITIONS.find((p) => p.value === pos)?.label || pos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Ad Management</h2>
          <p className="text-sm text-muted-foreground">Manage ad spaces across the platform</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New Ad
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !ads?.length ? (
        <div className="text-center py-16">
          <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No ads yet. Create your first ad.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                ad.is_active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {ad.image_url ? (
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" / loading="lazy" decoding="async">
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ad.title}</p>
                <p className="text-xs text-muted-foreground">{positionLabel(ad.position)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {ad.impression_count.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" /> {ad.click_count.toLocaleString()}
                  </span>
                  {ad.link_url && (
                    <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary flex items-center gap-0.5 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Link
                    </a>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={ad.is_active}
                  onCheckedChange={(checked) => toggleActive.mutate({ id: ad.id, is_active: checked })}
                />
                <Button variant="ghost" size="icon" onClick={() => openEdit(ad)} className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this ad?")) deleteMutation.mutate(ad.id);
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad" : "Create Ad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ad title" />
            </div>

            <div>
              <Label>Ad Image</Label>
              {(editingAd?.image_url && !imageFile) && (
                <img src={editingAd.image_url} alt="" className="w-full h-32 object-cover rounded-md mb-2" / loading="lazy" decoding="async">
              )}
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>

            <div>
              <Label>Link URL (optional)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
            </div>

            <div>
              <Label>Position</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
              <Label>Active</Label>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.title || uploading || saveMutation.isPending}
              className="w-full"
            >
              {uploading ? "Uploading..." : saveMutation.isPending ? "Saving..." : editingAd ? "Update Ad" : "Create Ad"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAds;
