import { Play, SkipForward, SkipBack } from "lucide-react";

const MiniPlayer = () => {
  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-4 py-2">
      <div className="container flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-gradient-brand flex-shrink-0 flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">
          ♪
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">Hallelujah Praise</p>
          <p className="text-xs text-muted-foreground truncate">Grace Worship Band</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="h-4 w-4" />
          </button>
          <button className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors">
            <Play className="h-4 w-4" fill="currentColor" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        <div className="hidden md:block flex-1">
          <div className="h-1 rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;
