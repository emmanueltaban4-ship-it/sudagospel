import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  reviewed: "bg-green-500/10 text-green-600 border-green-500/20",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [notesId, setNotesId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const update: any = { status };
      if (admin_notes !== undefined) update.admin_notes = admin_notes;
      const { error } = await supabase.from("reports").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setNotesId(null);
      toast.success("Report updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const pending = reports?.filter((r) => r.status === "pending") || [];
  const resolved = reports?.filter((r) => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">Reports & Flagging</h2>
        <p className="text-sm text-muted-foreground">{pending.length} pending reports</p>
      </div>

      {pending.length === 0 && resolved.length === 0 && (
        <div className="text-center py-12">
          <Flag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Pending ({pending.length})</h3>
          {pending.map((r) => (
            <ReportCard key={r.id} report={r} onAction={(status) => updateStatus.mutate({ id: r.id, status })} onNotes={() => { setNotesId(r.id); setNotes(r.admin_notes || ""); }} />
          ))}
        </div>
      )}

      {notesId && (
        <div className="p-4 rounded-lg bg-card border border-border space-y-3">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Admin notes..." rows={3} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateStatus.mutate({ id: notesId, status: "reviewed", admin_notes: notes })}>Save & Mark Reviewed</Button>
            <Button size="sm" variant="ghost" onClick={() => setNotesId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground">Resolved ({resolved.length})</h3>
          {resolved.slice(0, 20).map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReportCard = ({ report, onAction, onNotes }: { report: any; onAction?: (status: string) => void; onNotes?: () => void }) => (
  <div className="p-3 rounded-lg bg-card border border-border flex items-start gap-3">
    <Flag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[report.status] || statusColors.pending}`}>{report.status}</span>
        <span className="text-[10px] text-muted-foreground">{report.content_type} · {new Date(report.created_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-foreground">{report.reason}</p>
      {report.admin_notes && <p className="text-xs text-muted-foreground mt-1 italic">{report.admin_notes}</p>}
    </div>
    {onAction && (
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onAction("reviewed")} className="p-1.5 text-green-600 hover:bg-green-500/10 rounded" title="Mark reviewed"><CheckCircle className="h-4 w-4" /></button>
        <button onClick={() => onAction("dismissed")} className="p-1.5 text-muted-foreground hover:bg-muted rounded" title="Dismiss"><XCircle className="h-4 w-4" /></button>
        {onNotes && <button onClick={onNotes} className="p-1.5 text-primary hover:bg-primary/10 rounded text-xs font-bold">Notes</button>}
      </div>
    )}
  </div>
);

export default AdminReports;
