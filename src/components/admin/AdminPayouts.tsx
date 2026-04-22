import { useState } from "react";
import { useAdminArtistBalances, useRecordPayout, formatCents } from "@/hooks/use-monetization";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";

const AdminPayouts = () => {
  const { data: artists = [], isLoading } = useAdminArtistBalances();
  const record = useRecordPayout();
  const [openId, setOpenId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (artist_id: string) => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) return;
    record.mutate(
      { artist_id, amount_cents: cents, payout_method: method, reference, notes },
      { onSuccess: () => { setOpenId(null); setAmount(""); setReference(""); setNotes(""); } }
    );
  };

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-bold">Artist Payouts</h2>
        <p className="text-sm text-muted-foreground">Track balances owed and record manual payouts (bank/mobile money)</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Artist</th>
              <th className="p-3 text-right">Earned</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {artists.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No earnings yet</td></tr>
            )}
            {artists.map((a: any) => (
              <tr key={a.artist_id} className="border-t border-border">
                <td className="p-3 font-medium">{a.artist_name}</td>
                <td className="p-3 text-right">{formatCents(Number(a.total_earned_cents))}</td>
                <td className="p-3 text-right text-muted-foreground">{formatCents(Number(a.total_paid_cents))}</td>
                <td className="p-3 text-right font-bold text-primary">{formatCents(Number(a.balance_cents))}</td>
                <td className="p-3 text-right">
                  <Dialog open={openId === a.artist_id} onOpenChange={(o) => setOpenId(o ? a.artist_id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={Number(a.balance_cents) <= 0}>
                        <DollarSign className="h-4 w-4 mr-1" /> Mark Paid
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader><DialogTitle>Record payout to {a.artist_name}</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Amount (USD)</Label>
                          <Input type="number" step="0.01" placeholder={(Number(a.balance_cents) / 100).toFixed(2)} value={amount} onChange={(e) => setAmount(e.target.value)} />
                          <button type="button" className="text-xs text-primary mt-1" onClick={() => setAmount((Number(a.balance_cents) / 100).toFixed(2))}>Use full balance</button>
                        </div>
                        <div>
                          <Label>Method</Label>
                          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="cash">Cash</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label>Reference (tx ID / receipt #)</Label>
                          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                        </div>
                        <Button className="w-full" onClick={() => handleSubmit(a.artist_id)} disabled={record.isPending}>
                          {record.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Payout"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminPayouts;
