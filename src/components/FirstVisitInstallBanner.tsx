import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STORAGE_KEY = "sudagospel_install_cta_seen";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true);

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const FirstVisitInstallBanner = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<any>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Show after a short delay so it doesn't fight the splash
    const t = setTimeout(() => setOpen(true), 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
      dismiss();
      return;
    }
    if (isIOS()) {
      setOpen(false);
      setShowIosHelp(true);
      localStorage.setItem(STORAGE_KEY, "1");
      return;
    }
    dismiss();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
        <DialogContent className="max-w-sm rounded-2xl">
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-1 rounded-md"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <DialogHeader className="text-center items-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-2 shadow-lg shadow-primary/30">
              <Download className="h-8 w-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl font-extrabold">Install Suda Gospel</DialogTitle>
            <DialogDescription className="text-sm">
              Get the app on your home screen for faster access, offline listening, and a full-screen experience.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 my-2">
            {[
              { icon: Smartphone, label: "Native feel" },
              { icon: Download, label: "Offline mode" },
              { icon: Share, label: "Quick access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/40">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={dismiss}>Not now</Button>
            <Button className="flex-1" onClick={install}>Install</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription>Install Suda Gospel on your iPhone in two steps.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Share className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">1. Tap the Share button</p>
                <p className="text-xs text-muted-foreground">In the Safari toolbar.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">2. Add to Home Screen</p>
                <p className="text-xs text-muted-foreground">Then tap Add to confirm.</p>
              </div>
            </li>
          </ol>
          <Button onClick={() => setShowIosHelp(false)} className="w-full">Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FirstVisitInstallBanner;
