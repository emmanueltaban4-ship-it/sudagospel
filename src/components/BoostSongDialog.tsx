import { useState } from "react";
import { Rocket, Flame, Search, Home, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BoostSongDialogProps {
  songId: string;
  songTitle: string;
  children: React.ReactNode;
}

const boostOptions = [
  {
    type: "homepage",
    label: "Homepage Feature",
    description: "Your song appears in the featured section on the homepage for 7 days",
    icon: Home,
  },
  {
    type: "trending",
    label: "Trending Boost",
    description: "Boost your song's ranking in the Trending section for 7 days",
    icon: Flame,
  },
  {
    type: "search",
    label: "Search Priority",
    description: "Your song appears at the top of relevant search results for 7 days",
    icon: Search,
  },
];

const BoostSongDialog = ({ songId, songTitle, children }: BoostSongDialogProps) => {
  const [selectedType, setSelectedType] = useState("homepage");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleBoost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("boost-song", {
        body: { songId, boostType: selectedType },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        setOpen(false);
      }
    } catch {
      toast.error("Failed to start boost checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Boost Song
          </DialogTitle>
          <DialogDescription>
            Promote "{songTitle}" to reach more listeners — $4.99 for 7 days
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {boostOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setSelectedType(opt.type)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                selectedType === opt.type
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedType === opt.type ? "bg-primary/10" : "bg-muted"}`}>
                <opt.icon className={`h-4 w-4 ${selectedType === opt.type ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={handleBoost} disabled={loading} className="w-full mt-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
          Boost for $4.99
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BoostSongDialog;
