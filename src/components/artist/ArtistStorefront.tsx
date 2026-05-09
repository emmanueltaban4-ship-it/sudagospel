import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props { artistId: string; }

const ArtistStorefront = ({ artistId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["store-products", artistId],
    queryFn: async () => {
      const { data } = await supabase.from("store_products").select("*").eq("artist_id", artistId).eq("is_active", true).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const checkout = async () => {
    if (!user) { navigate("/auth"); return; }
    const items = Object.entries(cart).filter(([, q]) => q > 0).map(([product_id, quantity]) => ({ product_id, quantity }));
    if (!items.length) { toast.error("Cart empty"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-store-checkout", { body: { items } });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    } finally { setBusy(false); }
  };

  const total = (products ?? []).reduce((s, p) => s + (cart[p.id] ?? 0) * p.price_cents, 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (isLoading) return <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>;
  if (!products?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mb-3" />
      <p className="text-muted-foreground">No items in store yet.</p>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-24">
        {products.map((p: any) => {
          const q = cart[p.id] ?? 0;
          return (
            <div key={p.id} className="rounded-lg border border-border bg-card p-3">
              <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                {p.image_url ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/40" /></div>}
              </div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.kind}</p>
              <p className="font-medium text-sm truncate">{p.title}</p>
              <p className="text-sm font-bold text-primary mt-1">${(p.price_cents / 100).toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                {q > 0 ? (
                  <>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setCart({ ...cart, [p.id]: Math.max(0, q - 1) })}>−</Button>
                    <span className="text-sm font-medium flex-1 text-center">{q}</span>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setCart({ ...cart, [p.id]: q + 1 })}>+</Button>
                  </>
                ) : (
                  <Button size="sm" className="w-full h-7 text-xs" onClick={() => setCart({ ...cart, [p.id]: 1 })}>Add</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 rounded-full bg-primary text-primary-foreground shadow-2xl px-4 py-3 flex items-center gap-3">
          <ShoppingBag className="h-4 w-4" />
          <span className="text-sm font-semibold">{itemCount} item{itemCount > 1 ? "s" : ""} · ${(total / 100).toFixed(2)}</span>
          <Button size="sm" variant="secondary" disabled={busy} onClick={checkout}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Checkout"}</Button>
        </div>
      )}
    </div>
  );
};

export default ArtistStorefront;
