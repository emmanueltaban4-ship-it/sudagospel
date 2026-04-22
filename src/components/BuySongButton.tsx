import { Download, Loader2, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsSongPurchased, usePurchaseSong, formatCents } from "@/hooks/use-monetization";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { downloadFile } from "@/lib/download";
import { toast } from "sonner";

interface Props {
  songId: string;
  songTitle: string;
  fileUrl: string;
  priceCents: number;
  size?: "sm" | "default";
}

const BuySongButton = ({ songId, songTitle, fileUrl, priceCents, size = "sm" }: Props) => {
  const { data: purchased, isLoading } = useIsSongPurchased(songId);
  const purchase = usePurchaseSong();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <Button size={size} variant="outline" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>;

  if (purchased) {
    return (
      <Button size={size} variant="outline" onClick={() => downloadFile(fileUrl, `${songTitle}.mp3`)}>
        <Download className="h-4 w-4 mr-1.5" /> Download
      </Button>
    );
  }

  return (
    <Button
      size={size}
      onClick={() => {
        if (!user) { toast.error("Please sign in to purchase"); navigate("/auth"); return; }
        purchase.mutate(songId);
      }}
      disabled={purchase.isPending}
    >
      {purchase.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <><ShoppingCart className="h-4 w-4 mr-1.5" /> Buy {formatCents(priceCents)}</>
      )}
    </Button>
  );
};

export default BuySongButton;
