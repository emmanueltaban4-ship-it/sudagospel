import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MiniPlayer from "@/components/MiniPlayer";
import { useMyPurchases, useMySupporterSubs, useVerifyPurchase, formatCents } from "@/hooks/use-monetization";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Music, Heart } from "lucide-react";
import { downloadFile } from "@/lib/download";
import { artistPath } from "@/lib/artist-slug";
import { toast } from "sonner";

const PurchasesPage = () => {
  const [params, setParams] = useSearchParams();
  const sessionId = params.get("session_id");
  const verify = useVerifyPurchase();
  const { data: purchases = [] } = useMyPurchases();
  const { data: subs = [] } = useMySupporterSubs();

  useDocumentMeta({ title: "My Purchases — SudaGospel", description: "Songs you've bought, tips you've sent, and artists you support." });

  useEffect(() => {
    if (sessionId) {
      verify.mutate(sessionId, {
        onSuccess: (d: any) => {
          if (d?.type === "tip") toast.success("Tip sent — thank you!");
          else if (d?.type === "download") toast.success("Purchase complete — your download is ready.");
          else if (d?.type === "supporter") toast.success("You're now a supporter!");
          params.delete("session_id");
          setParams(params, { replace: true });
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <Layout>
      <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
        <h1 className="font-heading text-2xl font-extrabold mb-1">My Purchases</h1>
        <p className="text-sm text-muted-foreground mb-6">Your bought songs and supporter subscriptions</p>
        <Tabs defaultValue="downloads">
          <TabsList>
            <TabsTrigger value="downloads">Songs ({purchases.length})</TabsTrigger>
            <TabsTrigger value="supporters">Supporting ({subs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="downloads" className="space-y-2 mt-4">
            {purchases.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No purchased songs yet</p>
              </div>
            )}
            {purchases.map((p: any) => (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {p.songs?.cover_url && <img src={p.songs.cover_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/song/${p.song_id}`} className="font-semibold text-sm truncate block hover:text-primary">{p.songs?.title}</Link>
                  <p className="text-xs text-muted-foreground">{p.songs?.artists?.name} • {formatCents(p.amount_cents)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => downloadFile(p.songs.file_url, `${p.songs.title}.mp3`)}>
                  <Download className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="supporters" className="space-y-2 mt-4">
            {subs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Not supporting any artists yet</p>
              </div>
            )}
            {subs.map((s: any) => (
              <Card key={s.id} className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {s.artists?.avatar_url && <img src={s.artists.avatar_url} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={artistPath(s.artists)} className="font-semibold text-sm truncate block hover:text-primary">{s.artists?.name}</Link>
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 inline mr-1" />{formatCents(s.amount_cents)}/mo • {s.status}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default PurchasesPage;
