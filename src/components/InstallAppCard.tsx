import { useEffect, useState } from "react";
import { Download, Smartphone, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
};

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const InstallAppCard = () => {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") setInstalled(true);
      setPrompt(null);
      return;
    }
    // No native prompt available — show iOS instructions or generic guide
    setShowIosHelp(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 hover:from-primary/15 transition-all text-left group"
      >
        <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
            Install SSDGUNA App
            <Smartphone className="h-3.5 w-3.5 text-primary" />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add to your home screen for offline listening
          </p>
        </div>
      </button>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install SSDGUNA</DialogTitle>
            <DialogDescription>
              {isIOS()
                ? "Add SSDGUNA to your iPhone home screen in two steps."
                : "Use your browser menu to install SSDGUNA on your device."}
            </DialogDescription>
          </DialogHeader>
          {isIOS() ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Share className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">1. Tap the Share button</p>
                  <p className="text-xs text-muted-foreground">Located at the bottom of Safari.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">2. Add to Home Screen</p>
                  <p className="text-xs text-muted-foreground">Scroll and select "Add to Home Screen", then tap Add.</p>
                </div>
              </li>
            </ol>
          ) : (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Open your browser menu (⋮) and choose <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home screen"</strong>.</p>
              <p className="text-xs">If you don't see the option, your browser may not support installing web apps. Try Chrome, Edge, or Safari.</p>
            </div>
          )}
          <Button onClick={() => setShowIosHelp(false)} className="w-full">Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppCard;
