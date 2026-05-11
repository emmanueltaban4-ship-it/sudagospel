import { toast } from "sonner";
import { resolvePlayableUrl } from "@/lib/signed-media";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Download a file with the correct filename.
 * - Private music bucket: resolves to a short-lived signed URL first.
 * - Legacy sudagospel.net links: routed through the download-proxy.
 * - Same-origin: direct fetch.
 */
export const downloadFile = async (url: string, filename: string) => {
  toast.info("Preparing download...");
  try {
    const resolved = await resolvePlayableUrl(url);
    const isCrossOrigin = new URL(resolved).origin !== window.location.origin;
    const isAlreadyProxied = resolved.includes("/functions/v1/");
    const fetchUrl = isCrossOrigin && !isAlreadyProxied
      ? `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(resolved)}&filename=${encodeURIComponent(filename)}`
      : resolved;

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success("Downloaded!");
  } catch {
    // Final fallback: open original in new tab
    window.open(url, "_blank");
    toast.info("Download opened in new tab");
  }
};
