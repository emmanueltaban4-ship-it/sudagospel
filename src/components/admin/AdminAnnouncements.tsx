import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Calendar, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

type Announcement = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  image_url: string | null;
  icon_url: string | null;
  tag: string | null;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  recipients_count: number | null;
  errors_count: number | null;
  created_at: string;
};

const empty = { title: "", body: "", url: "/", image_url: "", icon_url: "", tag: "", scheduled_for: "" };

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const { data: subCount } = useQuery({
    queryKey: ["push-sub-count"],
    queryFn: async () => {
      const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const upsert = useMutation({
    mutationFn: async (sendNow: boolean) => {
      if (!form.title.trim() || !form.body.trim()) throw new Error("Title and body are required");
      const payload: any = {
        title: form.title.trim(),
        body: form.body.trim(),
        url: form.url || "/",
        image_url: form.image_url || null,
        icon_url: form.icon_url || null,
        tag: form.tag || null,
        scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
        status: sendNow ? "sending" : form.scheduled_for ? "scheduled" : "draft",
        created_by: user?.id,
      };
      let id = editingId;
      if (id) {
        const { error } = await supabase.from("announcements").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("announcements").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      if (sendNow) {
        const { error: fnErr } = await supabase.functions.invoke("send-announcement", { body: { id } });
        if (fnErr) throw fnErr;
      }
      return { id, sendNow };
    },
    onSuccess: (r) => {
      toast.success(r.sendNow ? "Announcement sent" : "Saved");
      setForm(empty); setEditingId(null);
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const sendExisting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke("send-announcement", { body: { id } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sent"); qc.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["announcements"] }); },
  });

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      url: a.url || "/",
      image_url: a.image_url || "",
      icon_url: a.icon_url || "",
      tag: a.tag || "",
      scheduled_for: a.scheduled_for ? a.scheduled_for.slice(0, 16) : "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Announcements
        </h2>
        <p className="text-sm text-muted-foreground">
          Send push notifications to all {subCount ?? 0} subscriber{subCount === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            {editingId ? "Edit announcement" : "New announcement"}
          </h3>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} placeholder="New gospel album just dropped" />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={250} rows={3} placeholder="Tap to listen on SudaGospel." />
            <p className="text-xs text-muted-foreground text-right">{form.body.length}/250</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/song/..." />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="release-2024" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Icon URL</Label>
              <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="/icon-192.png" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Schedule for (optional)</Label>
            <Input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} />
            <p className="text-xs text-muted-foreground">Leave empty to send immediately or save as draft.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => upsert.mutate(true)} disabled={upsert.isPending} className="gap-1.5">
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send now
            </Button>
            <Button variant="outline" onClick={() => upsert.mutate(false)} disabled={upsert.isPending}>
              {form.scheduled_for ? "Schedule" : "Save draft"}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</Button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><Eye className="h-4 w-4" /> Preview</h3>
          <div className="rounded-2xl bg-background border border-border p-4 shadow-sm flex gap-3">
            <img src={form.icon_url || "/icon-192.png"} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{form.title || "Title goes here"}</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{form.body || "Message body…"}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">SudaGospel · now</p>
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-2 rounded-lg w-full max-h-40 object-cover" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Real notifications appear in the OS notification center on each user's device.</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        <h3 className="font-semibold">History</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a.id} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{a.title}</p>
                    <StatusPill a={a} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {a.sent_at
                      ? `Sent ${formatDistanceToNow(new Date(a.sent_at), { addSuffix: true })} · ${a.recipients_count ?? 0} delivered${a.errors_count ? ` · ${a.errors_count} errors` : ""}`
                      : a.scheduled_for
                      ? `Scheduled for ${format(new Date(a.scheduled_for), "PPp")}`
                      : `Created ${formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!a.sent_at && (
                    <Button size="sm" variant="outline" onClick={() => sendExisting.mutate(a.id)} disabled={sendExisting.isPending}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Send
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => startEdit(a)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this announcement?")) remove.mutate(a.id); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusPill = ({ a }: { a: Announcement }) => {
  const status = a.sent_at ? "sent" : a.status;
  const map: Record<string, string> = {
    sent: "bg-green-500/15 text-green-600",
    scheduled: "bg-blue-500/15 text-blue-600",
    sending: "bg-yellow-500/15 text-yellow-700",
    draft: "bg-muted text-muted-foreground",
  };
  return <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded ${map[status] || map.draft}`}>{status}</span>;
};

export default AdminAnnouncements;
