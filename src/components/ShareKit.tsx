import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Code2, Share2, Link as LinkIcon, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ShareKitProps {
  url: string;
  title: string;
  description?: string;
  trigger: React.ReactNode;
}

const ShareKit = ({ url, title, description, trigger }: ShareKitProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const embed = `<iframe src="${url}" width="100%" height="160" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:16px"></iframe>`;
  const promoText = `🎵 ${title}\n\n${description || ""}\n\n${url}`;
  const shortPromo = `Listen now → ${url}`;

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const socialLinks = [
    { name: "WhatsApp", url: `https://wa.me/?text=${encodeURIComponent(promoText)}`, color: "bg-[#25D366]" },
    { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, color: "bg-[#1877F2]" },
    { name: "X / Twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, color: "bg-foreground/90" },
    { name: "Telegram", url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, color: "bg-[#0088cc]" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading"><Share2 className="h-5 w-5 text-primary" />Share Kit</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="link" className="text-xs"><LinkIcon className="h-3.5 w-3.5 mr-1" />Link</TabsTrigger>
            <TabsTrigger value="social" className="text-xs"><Share2 className="h-3.5 w-3.5 mr-1" />Social</TabsTrigger>
            <TabsTrigger value="text" className="text-xs"><MessageSquare className="h-3.5 w-3.5 mr-1" />Text</TabsTrigger>
            <TabsTrigger value="embed" className="text-xs"><Code2 className="h-3.5 w-3.5 mr-1" />Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-3 mt-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Direct link</p>
              <div className="flex gap-2">
                <Input readOnly value={url} className="text-xs bg-muted/40" />
                <Button onClick={() => copy(url, "link")} size="icon" variant="outline" className="rounded-xl flex-shrink-0">
                  {copied === "link" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Short promo</p>
              <div className="flex gap-2">
                <Input readOnly value={shortPromo} className="text-xs bg-muted/40" />
                <Button onClick={() => copy(shortPromo, "short")} size="icon" variant="outline" className="rounded-xl flex-shrink-0">
                  {copied === "short" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-2 mt-4">
            <p className="text-xs text-muted-foreground mb-2">Share to your favorite platform with one tap</p>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${s.color} text-white px-4 py-3 rounded-xl text-sm font-bold text-center transition hover:opacity-90 active:scale-95`}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">Copy this text into a post, email, or message</p>
            <Textarea readOnly value={promoText} className="min-h-[140px] text-sm bg-muted/40 font-mono" />
            <Button onClick={() => copy(promoText, "text")} className="w-full rounded-xl gap-1.5">
              {copied === "text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "text" ? "Copied!" : "Copy promo text"}
            </Button>
          </TabsContent>

          <TabsContent value="embed" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">Paste this on a website or blog</p>
            <Textarea readOnly value={embed} className="min-h-[100px] text-xs bg-muted/40 font-mono" />
            <Button onClick={() => copy(embed, "embed")} className="w-full rounded-xl gap-1.5">
              {copied === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "embed" ? "Copied!" : "Copy embed code"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareKit;
