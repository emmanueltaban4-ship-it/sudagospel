import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA service-worker registration with iframe + preview guard
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.dev");

if (isInIframe || isPreviewHost) {
  // Never run a service worker in the editor iframe — it would cache stale builds
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => { /* dev mode: plugin not available */ });
}

createRoot(document.getElementById("root")!).render(<App />);
