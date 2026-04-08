import { toast } from "sonner";

/**
 * Download a file with the correct filename.
 * For same-origin URLs, uses fetch+blob. For cross-origin, falls back to
 * opening the file in a new tab (browser will use Content-Disposition or URL).
 */
export const downloadFile = async (url: string, filename: string) => {
  toast.info("Preparing download...");
  try {
    const response = await fetch(url);
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
    // Fallback: open in new tab for cross-origin files
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  }
};
