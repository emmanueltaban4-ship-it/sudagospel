import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Download a file with the correct filename.
 * Same-origin: fetch+blob. Cross-origin: proxy through edge function.
 */
export const downloadFile = async (url: string, filename: string) => {
  toast.info("Preparing download...");
  try {
    const isCrossOrigin = new URL(url).origin !== window.location.origin;
    const fetchUrl = isCrossOrigin
      ? `${SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`
      : url;

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
    // Final fallback: open directly
    window.open(url, "_blank");
    toast.info("Download opened in new tab");
  }
};
