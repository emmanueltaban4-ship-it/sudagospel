import { Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsSupporter, useSubscribeSupporter, formatCents } from "@/hooks/use-monetization";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  artistId: string;
  artistName: string;
  priceCents: number;
  className?: string;
}

const BecomeSupporterButton = ({ artistId, artistName, priceCents, className }: Props) => {
  const { data: isSupporter, isLoading } = useIsSupporter(artistId);
  const sub = useSubscribeSupporter();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return null;

  if (isSupporter) {
    return (
      <Button size="sm" variant="secondary" disabled className={className}>
        <Check className="h-4 w-4 mr-1.5" /> Supporter
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={className}
      onClick={() => {
        if (!user) { toast.error("Please sign in to subscribe"); navigate("/auth"); return; }
        sub.mutate(artistId);
      }}
      disabled={sub.isPending}
    >
      {sub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <><Sparkles className="h-4 w-4 mr-1.5" /> Support {formatCents(priceCents)}/mo</>
      )}
    </Button>
  );
};

export default BecomeSupporterButton;
