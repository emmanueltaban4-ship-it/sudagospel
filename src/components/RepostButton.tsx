import { Repeat2 } from "lucide-react";
import { useRepost } from "@/hooks/use-reposts";
import { cn } from "@/lib/utils";

interface Props {
  songId: string;
  variant?: "icon" | "full";
  className?: string;
}

const RepostButton = ({ songId, variant = "icon", className }: Props) => {
  const { isReposted, repostCount, toggleRepost, isLoading } = useRepost(songId);

  return (
    <button
      onClick={() => toggleRepost()}
      disabled={isLoading}
      aria-pressed={isReposted}
      className={cn(
        "flex items-center gap-1.5 transition-all active:scale-90 disabled:opacity-50",
        isReposted ? "text-secondary" : "text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label={isReposted ? "Remove repost" : "Repost"}
    >
      <Repeat2 className={cn("h-5 w-5", isReposted && "fill-current")} />
      {variant === "full" && (
        <span className="text-sm font-medium tabular-nums">{repostCount}</span>
      )}
    </button>
  );
};

export default RepostButton;
