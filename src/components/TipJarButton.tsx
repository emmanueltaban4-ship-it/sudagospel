import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTipArtist } from "@/hooks/use-monetization";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  artistId: string;
  artistName: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

const PRESETS = [200, 500, 1000, 2500];

const TipJarButton = ({ artistId, artistName, variant = "outline", className }: Props) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const tip = useTipArtist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleTip = () => {
    if (!user) {
      toast.error("Please sign in to tip");
      navigate("/auth");
      return;
    }
    const cents = custom ? Math.round(parseFloat(custom) * 100) : amount;
    if (!cents || cents < 100) {
      toast.error("Minimum tip is $1.00");
      return;
    }
    tip.mutate({ artist_id: artistId, amount_cents: cents }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Heart className="h-4 w-4 mr-1.5 fill-current" /> Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tip {artistName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Show your support with a one-time tip.</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((c) => (
              <Button
                key={c}
                variant={amount === c && !custom ? "default" : "outline"}
                size="sm"
                onClick={() => { setAmount(c); setCustom(""); }}
              >
                ${(c / 100).toFixed(0)}
              </Button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Custom amount (USD)</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="5.00"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleTip} disabled={tip.isPending}>
            {tip.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue to Checkout</>}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Powered by Stripe • Opens in a new tab</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipJarButton;
