import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  sent: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  pending: <Mail className="h-3.5 w-3.5 text-yellow-500" />,
  dlq: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  suppressed: <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />,
};

const AdminEmailLogs = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-email-logs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("email_send_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: suppressed } = useQuery({
    queryKey: ["admin-suppressed-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppressed_emails").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs?.filter((l) =>
    l.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
    l.template_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <div className="text-center py-8"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter((l) => l.status === "sent").length || 0,
    failed: logs?.filter((l) => ["dlq", "failed"].includes(l.status)).length || 0,
    suppressed: suppressed?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-1">Email Logs</h2>
        <p className="text-sm text-muted-foreground">Monitor email delivery and troubleshoot issues.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Sent", value: stats.sent, color: "text-green-500" },
          { label: "Failed", value: stats.failed, color: "text-destructive" },
          { label: "Suppressed", value: stats.suppressed, color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-card border border-border p-3 text-center">
            <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or template..." className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="dlq">Failed</SelectItem>
            <SelectItem value="suppressed">Suppressed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Template</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Recipient</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="p-3">{statusIcon[log.status] || <Mail className="h-3.5 w-3.5" />}</td>
                  <td className="p-3 text-foreground font-medium">{log.template_name}</td>
                  <td className="p-3 text-muted-foreground">{log.recipient_email}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3 text-destructive text-xs max-w-[200px] truncate">{log.error_message || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No email logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailLogs;
