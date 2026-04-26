import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Link2, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  type: "song" | "artist";
  id: string;
}

interface OgData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

const parseOg = (html: string): OgData => {
  const get = (prop: string) => {
    const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
    const m = html.match(re);
    return m?.[1];
  };
  return {
    title: get("og:title"),
    description: get("og:description"),
    image: get("og:image"),
    url: get("og:url"),
    siteName: get("og:site_name"),
  };
};

const TestLinkPreview = ({ type, id }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OgData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?type=${type}&id=${id}`;

  const run = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(shareUrl, { headers: { Accept: "text/html" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const parsed = parseOg(html);
      if (!parsed.title && !parsed.image) throw new Error("No OG tags found in response");
      setData(parsed);
    } catch (e: any) {
      setError(e.message || "Failed to fetch preview");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share URL copied");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !data) run(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9">
          <Link2 className="h-3.5 w-3.5" /> Test preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Link preview test
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Fetching what crawlers see…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 py-6">
            <XCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-semibold">Failed</p>
            <p className="text-xs text-muted-foreground text-center">{error}</p>
            <Button size="sm" variant="outline" onClick={run} className="rounded-xl mt-2">Retry</Button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-success text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Open Graph tags detected
            </div>

            {/* Preview card mock */}
            <div className="rounded-xl overflow-hidden border bg-card">
              {data.image ? (
                <img src={data.image} alt="OG" className="w-full aspect-[1.91/1] object-cover bg-muted" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-full aspect-[1.91/1] bg-muted flex items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
              <div className="p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{data.siteName || "sudagospel"}</p>
                <p className="text-sm font-bold leading-tight line-clamp-2">{data.title || <span className="text-destructive">Missing title</span>}</p>
                {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}
              </div>
            </div>

            {/* Tag list */}
            <div className="space-y-1.5 text-[11px]">
              <Row k="og:title" v={data.title} />
              <Row k="og:description" v={data.description} />
              <Row k="og:image" v={data.image} mono />
              <Row k="og:url" v={data.url} mono />
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={copyUrl} className="rounded-xl flex-1 gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copy URL
              </Button>
              <Button size="sm" asChild className="rounded-xl flex-1 gap-1.5">
                <a href={`https://www.opengraph.xyz/url/${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> External check
                </a>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Crawlers (Facebook, WhatsApp, Twitter) see this when the link is shared.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ k, v, mono }: { k: string; v?: string; mono?: boolean }) => (
  <div className="flex gap-2">
    <span className="text-muted-foreground font-semibold w-24 flex-shrink-0">{k}</span>
    <span className={`flex-1 break-all ${mono ? "font-mono" : ""} ${v ? "" : "text-destructive italic"}`}>{v || "missing"}</span>
  </div>
);

export default TestLinkPreview;
