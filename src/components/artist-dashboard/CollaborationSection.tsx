import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Plus, Mail, Percent, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useCollaborators, useInviteCollaborator, useUpdateCollaborator,
  useDeleteCollaborator, useMyIncomingInvites,
} from "@/hooks/use-artist-management";

const STATUS = {
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  accepted: { label: "Accepted", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  declined: { label: "Declined", icon: XCircle, cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
};

const CollaborationSection = ({ artist }: { artist: any }) => {
  const { data: collaborators = [] } = useCollaborators(artist.id);
  const { data: incoming = [] } = useMyIncomingInvites();
  const update = useUpdateCollaborator();
  const del = useDeleteCollaborator();

  const totalSplit = collaborators
    .filter((c: any) => c.status === "accepted")
    .reduce((s: number, c: any) => s + Number(c.split_percent || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-heading text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Collaborators</h3>
            <p className="text-xs text-muted-foreground">Invite featured artists, producers, songwriters and define revenue splits</p>
          </div>
          <InviteDialog artistId={artist.id} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="px-3 py-2 rounded-xl bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total accepted split</p>
            <p className="font-heading text-lg font-bold">{totalSplit.toFixed(1)}%</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Your share</p>
            <p className="font-heading text-lg font-bold">{Math.max(0, 100 - totalSplit).toFixed(1)}%</p>
          </div>
        </div>

        <Tabs defaultValue="outgoing">
          <TabsList className="rounded-xl">
            <TabsTrigger value="outgoing" className="rounded-lg">Outgoing ({collaborators.length})</TabsTrigger>
            <TabsTrigger value="incoming" className="rounded-lg">Incoming ({incoming.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="outgoing" className="space-y-2 mt-4">
            {collaborators.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No collaborators yet. Invite your first.</p>}
            {collaborators.map((c: any) => {
              const S = STATUS[c.status as keyof typeof STATUS] ?? STATUS.pending;
              return (
                <div key={c.id} className="p-3 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{c.collaborator_name || c.collaborator_email}</p>
                      <Badge className={`${S.cls} border-0 text-[10px] gap-1`}><S.icon className="h-3 w-3" /> {S.label}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{c.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.collaborator_email} {c.songs ? `· on "${c.songs.title}"` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm font-bold">
                      <Percent className="h-3 w-3" /> {Number(c.split_percent).toFixed(1)}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => del.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="incoming" className="space-y-2 mt-4">
            {incoming.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">No incoming invites.</p>}
            {incoming.map((c: any) => {
              const S = STATUS[c.status as keyof typeof STATUS] ?? STATUS.pending;
              return (
                <div key={c.id} className="p-3 rounded-xl border bg-muted/10 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">From: {c.artists?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.songs ? `On "${c.songs.title}" · ` : ""}{c.role} · {Number(c.split_percent).toFixed(1)}% split
                    </p>
                    <Badge className={`${S.cls} border-0 text-[10px] gap-1 mt-1`}><S.icon className="h-3 w-3" /> {S.label}</Badge>
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => update.mutate({ id: c.id, status: "declined" })}>Decline</Button>
                      <Button size="sm" className="rounded-xl" onClick={() => update.mutate({ id: c.id, status: "accepted" })}>Accept</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

const InviteDialog = ({ artistId }: { artistId: string }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("featured");
  const [split, setSplit] = useState(10);
  const [songId, setSongId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const invite = useInviteCollaborator();

  const { data: songs = [] } = useQuery({
    queryKey: ["my-songs-collab", artistId],
    queryFn: async () => {
      const { data } = await supabase.from("songs").select("id, title").eq("artist_id", artistId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl gap-1.5"><Plus className="h-4 w-4" /> Invite</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle>Invite collaborator</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collab@example.com" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-sm">
                <option value="featured">Featured</option>
                <option value="producer">Producer</option>
                <option value="songwriter">Songwriter</option>
                <option value="vocalist">Vocalist</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Split %</Label>
              <Input type="number" min={0} max={100} step={0.1} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Song (optional)</Label>
            <select value={songId} onChange={(e) => setSongId(e.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-sm">
              <option value="">— Whole catalog —</option>
              {songs.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-xl resize-none" />
          </div>
          <Button
            className="w-full rounded-xl gap-1.5"
            disabled={!email || invite.isPending}
            onClick={() => {
              invite.mutate({
                artist_id: artistId, collaborator_email: email, collaborator_name: name,
                song_id: songId || undefined, role, split_percent: split, notes,
              }, { onSuccess: () => { setOpen(false); setEmail(""); setName(""); setNotes(""); } });
            }}
          >
            <Mail className="h-4 w-4" /> Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationSection;
