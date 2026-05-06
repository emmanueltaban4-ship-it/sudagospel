import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Vote, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AdminPolls = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [optionLabels, setOptionLabels] = useState<string[]>(["", ""]);

  const { data: polls, isLoading } = useQuery({
    queryKey: ["admin-polls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allOptions } = useQuery({
    queryKey: ["admin-poll-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_options")
        .select("*, artists(name, avatar_url)");
      if (error) throw error;
      return data;
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["all-artists-for-polls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("id, name, avatar_url").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createPoll = useMutation({
    mutationFn: async () => {
      const labels = optionLabels.filter((l) => l.trim());
      if (!title.trim() || labels.length < 2) throw new Error("Title and at least 2 options required");

      const { data: poll, error } = await supabase
        .from("polls")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          ends_at: endsAt || null,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      const options = labels.map((label) => {
        const matchedArtist = artists?.find((a: any) => a.name.toLowerCase() === label.toLowerCase());
        return {
          poll_id: poll.id,
          label: label.trim(),
          artist_id: matchedArtist?.id || null,
        };
      });

      const { error: optErr } = await supabase.from("poll_options").insert(options as any);
      if (optErr) throw optErr;
    },
    onSuccess: () => {
      toast.success("Poll created!");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setEndsAt("");
      setOptionLabels(["", ""]);
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
      queryClient.invalidateQueries({ queryKey: ["admin-poll-options"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("polls").update({ is_active: active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-polls"] }),
    onError: (err: any) => toast.error(err.message),
  });

  const deletePoll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("polls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Poll deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-polls"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
          <Vote className="h-5 w-5 text-primary" /> Polls
        </h2>
        <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> New Poll
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <Input placeholder="Poll title (e.g. Best Artist of the Month)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          <p className="text-xs text-muted-foreground font-semibold">Options / Nominees:</p>
          {optionLabels.map((label, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Option ${i + 1} (artist name or label)`}
                value={label}
                onChange={(e) => {
                  const updated = [...optionLabels];
                  updated[i] = e.target.value;
                  setOptionLabels(updated);
                }}
              />
              {optionLabels.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => setOptionLabels(optionLabels.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setOptionLabels([...optionLabels, ""])} className="gap-1">
            <Plus className="h-3 w-3" /> Add Option
          </Button>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => createPoll.mutate()} disabled={createPoll.isPending} className="rounded-full">
              Create Poll
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

      {polls?.map((poll: any) => {
        const options = allOptions?.filter((o: any) => o.poll_id === poll.id) || [];
        const totalVotes = options.reduce((s: number, o: any) => s + (o.vote_count || 0), 0);

        return (
          <div key={poll.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{poll.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })} · {totalVotes} votes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={poll.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: poll.id, active: v })} />
                <Button variant="ghost" size="icon" onClick={() => deletePoll.mutate(poll.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              {options.map((opt: any) => {
                const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                return (
                  <div key={opt.id} className="relative rounded-lg bg-muted/50 p-2.5 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />
                    <div className="relative flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {opt.artists?.avatar_url ? (
                          <img src={opt.artists.avatar_url} alt="" className="h-full w-full object-cover" / loading="lazy" decoding="async">
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><User className="h-3 w-3 text-muted-foreground" /></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{opt.label}</span>
                      <span className="text-xs font-bold text-muted-foreground">{pct}% ({opt.vote_count})</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Badge variant={poll.is_active ? "default" : "secondary"} className="text-[10px]">
              {poll.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default AdminPolls;
