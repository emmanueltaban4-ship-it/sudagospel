import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Music } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  title: string;
  artist?: string;
  coverUrl?: string;
  shareUrl: string;
  type?: "song" | "artist" | "article";
  trigger?: React.ReactNode;
}

const socials = [
  {
    name: "WhatsApp",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: "bg-[#25D366] hover:bg-[#20BD5A]",
    getUrl: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    name: "Facebook",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: "bg-[#1877F2] hover:bg-[#166FE5]",
    getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "X",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: "bg-foreground/90 hover:bg-foreground text-background",
    getUrl: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: "bg-[#0088cc] hover:bg-[#007ab8]",
    getUrl: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

const ShareDialog = ({ title, artist, coverUrl, shareUrl, type = "song", trigger }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);

  const shareText = type === "song" && artist
    ? `🎵 Listen to "${title}" by ${artist} on Sudagospel`
    : type === "artist"
    ? `🎤 Check out ${title} on Sudagospel`
    : `📰 ${title} on Sudagospel`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openSocial = (getUrl: (url: string, text: string) => string) => {
    window.open(getUrl(shareUrl, shareText), "_blank", "noopener,noreferrer,width=600,height=400");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
            <Share2 className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-heading text-lg">Share</DialogTitle>
        </DialogHeader>

        {/* Preview card */}
        <div className="mx-6 mb-5 flex items-center gap-3 rounded-xl bg-muted/50 p-3 border border-border/50">
          <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center">
                <Music className="h-6 w-6 text-primary-foreground/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            {artist && <p className="text-xs text-muted-foreground truncate">{artist}</p>}
            <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">sudagospel.lovable.app</p>
          </div>
        </div>

        {/* Social buttons */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {socials.map((s) => (
              <button
                key={s.name}
                onClick={() => openSocial(s.getUrl)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`h-12 w-12 rounded-full ${s.color} flex items-center justify-center text-white transition-transform active:scale-90 group-hover:scale-105`}>
                  <s.icon />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy link */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-muted-foreground truncate outline-none"
            />
            <Button
              size="sm"
              variant={copied ? "default" : "secondary"}
              onClick={handleCopy}
              className="h-8 px-3 text-xs gap-1.5 flex-shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
