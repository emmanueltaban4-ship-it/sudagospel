import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mic2, Calendar, BookOpen, Sparkles, Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type SubTab = "sermons" | "events" | "devotionals" | "moods";

const TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: "sermons", label: "Sermons", icon: Mic2 },
  { id: "events", label: "Events", icon: Calendar },
  { id: "devotionals", label: "Devotionals", icon: BookOpen },
  { id: "moods", label: "Moods", icon: Sparkles },
];

const AdminGospelContent = () => {
  const [tab, setTab] = useState<SubTab>("sermons");
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "sermons" && <SermonsCrud />}
      {tab === "events" && <EventsCrud />}
      {tab === "devotionals" && <DevotionalsCrud />}
      {tab === "moods" && <MoodsCrud />}
    </div>
  );
};

// ---------- SERMONS ----------
const SermonsCrud = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sermons"],
    queryFn: async () => {
      const { data } = await supabase.from("sermons").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { ...form, uploaded_by: user!.id };
      const { error } = editing
        ? await supabase.from("sermons").update(payload).eq("id", editing.id)
        : await supabase.from("sermons").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sermons"] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sermons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sermons"] }); toast.success("Deleted"); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold">Sermons & Podcasts</h3>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New</Button>
      </div>
      {open && (
        <SermonForm initial={editing} onCancel={() => { setOpen(false); setEditing(null); }} onSave={save.mutate} saving={save.isPending} />
      )}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="space-y-2">
          {data?.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground truncate">{s.preacher || "—"} · {s.scripture_ref || ""}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {!data?.length && <p className="text-sm text-muted-foreground">No sermons yet.</p>}
        </div>
      )}
    </div>
  );
};

const SermonForm = ({ initial, onCancel, onSave, saving }: any) => {
  const [f, setF] = useState({
    title: initial?.title ?? "", preacher: initial?.preacher ?? "", series: initial?.series ?? "",
    scripture_ref: initial?.scripture_ref ?? "", description: initial?.description ?? "",
    audio_url: initial?.audio_url ?? "", cover_url: initial?.cover_url ?? "",
    duration_seconds: initial?.duration_seconds ?? null, is_published: initial?.is_published ?? true,
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between"><h4 className="font-medium text-sm">{initial ? "Edit" : "New"} sermon</h4><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></div>
      <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Preacher" value={f.preacher} onChange={(e) => setF({ ...f, preacher: e.target.value })} />
        <Input placeholder="Series (optional)" value={f.series} onChange={(e) => setF({ ...f, series: e.target.value })} />
      </div>
      <Input placeholder="Scripture ref (e.g. John 3:16)" value={f.scripture_ref} onChange={(e) => setF({ ...f, scripture_ref: e.target.value })} />
      <Textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} />
      <Input placeholder="Audio URL (mp3)" value={f.audio_url} onChange={(e) => setF({ ...f, audio_url: e.target.value })} />
      <Input placeholder="Cover image URL" value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} />
      <div className="flex items-center gap-2"><Switch checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} /><span className="text-sm">Published</span></div>
      <Button onClick={() => onSave(f)} disabled={saving || !f.title || !f.audio_url}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
};

// ---------- EVENTS ----------
const EventsCrud = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { ...form, created_by: user!.id };
      const { error } = editing
        ? await supabase.from("events").update(payload).eq("id", editing.id)
        : await supabase.from("events").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("Deleted"); },
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold">Events & Concerts</h3>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New</Button>
      </div>
      {open && <EventForm initial={editing} onCancel={() => { setOpen(false); setEditing(null); }} onSave={save.mutate} saving={save.isPending} />}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="space-y-2">
          {data?.map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground truncate">{format(new Date(e.starts_at), "PPP p")} · {e.city || e.location || "—"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {!data?.length && <p className="text-sm text-muted-foreground">No events yet.</p>}
        </div>
      )}
    </div>
  );
};
const EventForm = ({ initial, onCancel, onSave, saving }: any) => {
  const [f, setF] = useState({
    title: initial?.title ?? "", description: initial?.description ?? "", location: initial?.location ?? "",
    city: initial?.city ?? "", country: initial?.country ?? "",
    starts_at: initial?.starts_at?.slice(0, 16) ?? "", ends_at: initial?.ends_at?.slice(0, 16) ?? "",
    cover_url: initial?.cover_url ?? "", ticket_url: initial?.ticket_url ?? "", price_text: initial?.price_text ?? "",
    is_published: initial?.is_published ?? true,
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between"><h4 className="font-medium text-sm">{initial ? "Edit" : "New"} event</h4><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></div>
      <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
        <Input type="datetime-local" value={f.ends_at} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
      </div>
      <Input placeholder="Venue / Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <Input placeholder="Country" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
      </div>
      <Input placeholder="Cover image URL" value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} />
      <Input placeholder="Ticket URL" value={f.ticket_url} onChange={(e) => setF({ ...f, ticket_url: e.target.value })} />
      <Input placeholder="Price text (Free, $10, etc.)" value={f.price_text} onChange={(e) => setF({ ...f, price_text: e.target.value })} />
      <div className="flex items-center gap-2"><Switch checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} /><span className="text-sm">Published</span></div>
      <Button onClick={() => onSave({ ...f, ends_at: f.ends_at || null })} disabled={saving || !f.title || !f.starts_at}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
};

// ---------- DEVOTIONALS ----------
const DevotionalsCrud = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-devotionals"],
    queryFn: async () => {
      const { data } = await supabase.from("devotionals").select("*").order("publish_date", { ascending: false });
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { ...form, created_by: user!.id };
      const { error } = editing
        ? await supabase.from("devotionals").update(payload).eq("id", editing.id)
        : await supabase.from("devotionals").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-devotionals"] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("devotionals").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-devotionals"] }); toast.success("Deleted"); },
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold">Daily Devotionals</h3>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New</Button>
      </div>
      {open && <DevotionalForm initial={editing} onCancel={() => { setOpen(false); setEditing(null); }} onSave={save.mutate} saving={save.isPending} />}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
        <div className="space-y-2">
          {data?.map((d: any) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground truncate">{d.publish_date} · {d.scripture_ref || "—"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
          {!data?.length && <p className="text-sm text-muted-foreground">No devotionals yet.</p>}
        </div>
      )}
    </div>
  );
};
const DevotionalForm = ({ initial, onCancel, onSave, saving }: any) => {
  const [f, setF] = useState({
    title: initial?.title ?? "", content: initial?.content ?? "",
    scripture_ref: initial?.scripture_ref ?? "", scripture_text: initial?.scripture_text ?? "",
    author: initial?.author ?? "", image_url: initial?.image_url ?? "",
    publish_date: initial?.publish_date ?? new Date().toISOString().slice(0, 10),
    is_published: initial?.is_published ?? true,
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between"><h4 className="font-medium text-sm">{initial ? "Edit" : "New"} devotional</h4><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></div>
      <Input type="date" value={f.publish_date} onChange={(e) => setF({ ...f, publish_date: e.target.value })} />
      <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Input placeholder="Scripture ref (e.g. John 3:16)" value={f.scripture_ref} onChange={(e) => setF({ ...f, scripture_ref: e.target.value })} />
      <Textarea placeholder="Scripture text" value={f.scripture_text} onChange={(e) => setF({ ...f, scripture_text: e.target.value })} rows={2} />
      <Textarea placeholder="Devotional content" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={6} />
      <Input placeholder="Author" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
      <Input placeholder="Image URL" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
      <div className="flex items-center gap-2"><Switch checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} /><span className="text-sm">Published</span></div>
      <Button onClick={() => onSave(f)} disabled={saving || !f.title || !f.content}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
};

// ---------- MOODS ----------
const MoodsCrud = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-moods"],
    queryFn: async () => {
      const { data } = await supabase.from("moods").select("*").order("position");
      return data ?? [];
    },
  });
  const save = useMutation({
    mutationFn: async (form: any) => {
      const { error } = editing
        ? await supabase.from("moods").update(form).eq("id", editing.id)
        : await supabase.from("moods").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-moods"] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("moods").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-moods"] }); toast.success("Deleted"); },
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold">Worship Moods</h3>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />New</Button>
      </div>
      {open && <MoodForm initial={editing} onCancel={() => { setOpen(false); setEditing(null); }} onSave={save.mutate} saving={save.isPending} />}
      <div className="space-y-2">
        {data?.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className="h-8 w-8 rounded" style={{ background: m.color || "#DC2626" }} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{m.slug}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">No moods yet.</p>}
      </div>
    </div>
  );
};
const MoodForm = ({ initial, onCancel, onSave, saving }: any) => {
  const [f, setF] = useState({
    name: initial?.name ?? "", slug: initial?.slug ?? "", description: initial?.description ?? "",
    color: initial?.color ?? "#DC2626", cover_url: initial?.cover_url ?? "",
    position: initial?.position ?? 0, is_active: initial?.is_active ?? true,
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between"><h4 className="font-medium text-sm">{initial ? "Edit" : "New"} mood</h4><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></div>
      <Input placeholder="Name (Worship, Praise, etc.)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input placeholder="slug (worship)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
      <Textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Color</label><Input type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} /></div>
        <div><label className="text-xs text-muted-foreground">Position</label><Input type="number" value={f.position} onChange={(e) => setF({ ...f, position: Number(e.target.value) })} /></div>
      </div>
      <Input placeholder="Cover image URL" value={f.cover_url} onChange={(e) => setF({ ...f, cover_url: e.target.value })} />
      <div className="flex items-center gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active</span></div>
      <Button onClick={() => onSave(f)} disabled={saving || !f.name || !f.slug}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
};

export default AdminGospelContent;
