import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const InstallPWA = () => {
  const [prompt, setPrompt] = useState<any>(null);
  const [hidden, setHidden] = useState(() => localStorage.getItem("pwa_install_dismissed") === "1");

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || hidden) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40 bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Download className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Install SudaGospel</p>
        <p className="text-xs text-muted-foreground">Get the app for offline listening</p>
      </div>
      <Button size="sm" onClick={async () => { await prompt.prompt(); setPrompt(null); }}>Install</Button>
      <button onClick={() => { localStorage.setItem("pwa_install_dismissed", "1"); setHidden(true); }} className="text-muted-foreground p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default InstallPWA;
