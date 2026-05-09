import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Plus, Trash2, Pencil, X, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

const KINDS = [
  { value: "album", label: "Album" },
  { value: "ep", label: "EP" },
  { value: "merch", label: "Merch" },
  { value: "digital", label: "Digital" },
];

const StoreSection = ({ artist }: { artist: any }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-store-products", artist.id],
    queryFn: async () => {
      const { data } = await supabase.from("store_products").select("*").eq("artist_id", artist.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-store-orders", artist.id],
    queryFn: async () => {
      const { data } = await supabase.from("store_orders").select("*, store_order_items(*)").eq("artist_id", artist.id).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { ...form, artist_id: artist.id };
      const { error } = editing
        ? await supabase.from("store_products").update(payload).eq("id", editing.id)
        : await supabase.from("store_products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-store-products"] }); setOpen(false); setEditing(null); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-store-products"] }); toast.success("Deleted"); },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, tracking_url }: any) => {
      const { error } = await supabase.from("store_orders").update({ status, tracking_url }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-store-orders"] }); toast.success("Updated"); },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-heading text-xl font-bold flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Store</h2>
            <p className="text-sm text-muted-foreground">Sell albums, EPs, merch and digital downloads. Platform takes a small fee.</p>
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add product</Button>
        </div>

        {open && <ProductForm initial={editing} onCancel={() => { setOpen(false); setEditing(null); }} onSave={save.mutate} saving={save.isPending} />}

        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : !products?.length ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No products yet. Add your first item above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p: any) => (
              <div key={p.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                <div className="h-16 w-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground/40 m-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p.kind}</span>{!p.is_active && <span className="text-[10px] text-muted-foreground">Hidden</span>}</div>
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-sm text-primary font-bold">${(p.price_cents / 100).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-heading font-bold mb-3">Recent orders</h3>
        {!orders?.length ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">${(o.total_cents / 100).toFixed(2)} · {o.store_order_items?.length ?? 0} items</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.buyer_email || "Guest"}</p>
                    {o.shipping_name && <p className="text-xs text-muted-foreground">Ship to: {o.shipping_name}</p>}
                  </div>
                  <select
                    className="text-xs bg-muted rounded px-2 py-1"
                    value={o.status}
                    onChange={(e) => updateOrderStatus.mutate({ id: o.id, status: e.target.value, tracking_url: o.tracking_url })}
                  >
                    <option value="paid">Paid</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductForm = ({ initial, onCancel, onSave, saving }: any) => {
  const [f, setF] = useState({
    kind: initial?.kind ?? "merch",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    price_cents: initial?.price_cents ?? 1000,
    currency: initial?.currency ?? "usd",
    is_physical: initial?.is_physical ?? false,
    inventory: initial?.inventory ?? null,
    download_url: initial?.download_url ?? "",
    is_active: initial?.is_active ?? true,
  });
  return (
    <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between"><h4 className="font-medium text-sm">{initial ? "Edit" : "New"} product</h4><Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button></div>
      <div>
        <Label className="text-xs">Kind</Label>
        <select className="w-full bg-muted rounded px-2 py-2 text-sm" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value, is_physical: e.target.value === "merch" })}>
          {KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>
      <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} />
      <Input placeholder="Image URL" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Price (USD)</Label><Input type="number" step="0.01" value={(f.price_cents / 100).toFixed(2)} onChange={(e) => setF({ ...f, price_cents: Math.round(parseFloat(e.target.value || "0") * 100) })} /></div>
        <div><Label className="text-xs">Inventory (blank = ∞)</Label><Input type="number" value={f.inventory ?? ""} onChange={(e) => setF({ ...f, inventory: e.target.value === "" ? null : parseInt(e.target.value) })} /></div>
      </div>
      <div className="flex items-center gap-2"><Switch checked={f.is_physical} onCheckedChange={(v) => setF({ ...f, is_physical: v })} /><span className="text-sm">Physical (ships)</span></div>
      {(f.kind === "digital" || f.kind === "album" || f.kind === "ep") && (
        <Input placeholder="Download/file URL (delivered after purchase)" value={f.download_url} onChange={(e) => setF({ ...f, download_url: e.target.value })} />
      )}
      <div className="flex items-center gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active (visible in store)</span></div>
      <Button onClick={() => onSave(f)} disabled={saving || !f.title || f.price_cents < 0}>{saving ? "Saving..." : "Save"}</Button>
    </div>
  );
};

export default StoreSection;
