import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songTitle: string;
  artistName: string;
  coverUrl?: string;
}

const ShareStoryCard = ({ open, onOpenChange, songTitle, artistName, coverUrl }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, "#0a0a0a");
    grad.addColorStop(0.5, "#220a0a");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Brand bar
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(0, 0, 1080, 16);

    const drawTextAndExport = () => {
      // Title
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 84px 'Plus Jakarta Sans', system-ui, sans-serif";
      wrapText(ctx, songTitle, 540, 1380, 920, 96);

      // Artist
      ctx.fillStyle = "#DC2626";
      ctx.font = "600 56px 'DM Sans', system-ui, sans-serif";
      ctx.fillText(artistName, 540, 1560);

      // Footer
      ctx.fillStyle = "#9ca3af";
      ctx.font = "500 36px 'DM Sans', system-ui, sans-serif";
      ctx.fillText("Now playing on SudaGospel", 540, 1820);

      setPreviewUrl(canvas.toDataURL("image/png"));
    };

    if (coverUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const size = 800;
        const x = (1080 - size) / 2;
        const y = 280;
        ctx.save();
        ctx.shadowColor = "rgba(220, 38, 38, 0.5)";
        ctx.shadowBlur = 60;
        roundRect(ctx, x, y, size, size, 32);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
        drawTextAndExport();
      };
      img.onerror = () => drawTextAndExport();
      img.src = coverUrl;
    } else {
      drawTextAndExport();
    }
  }, [open, songTitle, artistName, coverUrl]);

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${songTitle.replace(/[^a-z0-9]/gi, "-")}-story.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Story</DialogTitle>
        </DialogHeader>
        <canvas ref={canvasRef} className="hidden" />
        {previewUrl && (
          <div className="space-y-4">
            <img src={previewUrl} alt="Story preview" className="w-full rounded-xl border border-border" />
            <Button onClick={download} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" /> Download story image
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              1080×1920 — perfect for Instagram, WhatsApp, TikTok stories
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = w + " ";
    } else line = test;
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default ShareStoryCard;
