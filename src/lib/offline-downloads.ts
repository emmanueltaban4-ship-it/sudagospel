// Offline download manager with IndexedDB-backed storage.
// Supports pause / resume (HTTP Range), progress, delete, and offline playback.
//
// Public API:
//   manager.enqueue(meta)      -> start downloading (or queue)
//   manager.pause(id) / resume(id) / cancel(id) / remove(id)
//   manager.list()             -> all items (downloading + completed) sorted recent-first
//   manager.getBlobUrl(id)     -> object URL for offline playback (null if not downloaded)
//   manager.subscribe(cb)      -> notified on every state change
//
// Storage:
//   IndexedDB "sudagospel-offline" v1
//     - blobs:    { id, blob }
//     - meta:     { id, title, artist, coverUrl, fileUrl, size, downloadedAt }
//   In-memory queue map holds transient state (status / progress / chunks / abort).

import { resolvePlayableUrl } from "@/lib/signed-media";

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "error";

export interface DownloadMeta {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
  size?: number;
  downloadedAt?: string;
}

export interface DownloadItem extends DownloadMeta {
  status: DownloadStatus;
  loaded: number; // bytes downloaded so far
  total: number; // total bytes (0 if unknown)
  error?: string;
}

const DB_NAME = "sudagospel-offline";
const DB_VERSION = 1;
const STORE_BLOBS = "blobs";
const STORE_META = "meta";
const MAX_CONCURRENT = 2;

// ---------------- IndexedDB helpers ----------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BLOBS)) db.createObjectStore(STORE_BLOBS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(tx.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result as T[]);
    req.onerror = () => rej(tx.error);
  });
}

// ---------------- Manager ----------------

interface ActiveDownload {
  meta: DownloadMeta;
  status: DownloadStatus;
  loaded: number;
  total: number;
  chunks: Uint8Array[]; // accumulated bytes
  abort?: AbortController;
  error?: string;
  supportsRange: boolean;
}

class OfflineDownloadManager {
  private active = new Map<string, ActiveDownload>();
  private completed = new Map<string, DownloadMeta>();
  private blobUrlCache = new Map<string, string>();
  private listeners = new Set<() => void>();
  private booted = false;
  private bootPromise?: Promise<void>;

  private async boot() {
    if (this.booted) return;
    if (!this.bootPromise) {
      this.bootPromise = (async () => {
        try {
          const all = await idbGetAll<DownloadMeta>(STORE_META);
          all.forEach((m) => this.completed.set(m.id, m));
        } catch {
          /* IDB unavailable */
        }
        this.booted = true;
      })();
    }
    await this.bootPromise;
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    // Boot lazily so first-render hooks see hydrated data
    this.boot().then(() => cb());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  list(): DownloadItem[] {
    const items: DownloadItem[] = [];
    this.active.forEach((a) => {
      items.push({
        ...a.meta,
        status: a.status,
        loaded: a.loaded,
        total: a.total,
        error: a.error,
      });
    });
    this.completed.forEach((m) => {
      if (this.active.has(m.id)) return;
      items.push({
        ...m,
        status: "completed",
        loaded: m.size ?? 0,
        total: m.size ?? 0,
      });
    });
    // Recent first; downloads in progress at top
    return items.sort((a, b) => {
      const order = (s: DownloadStatus) =>
        s === "downloading" ? 0 : s === "paused" ? 1 : s === "queued" ? 2 : s === "error" ? 3 : 4;
      const o = order(a.status) - order(b.status);
      if (o !== 0) return o;
      return (b.downloadedAt ?? "").localeCompare(a.downloadedAt ?? "");
    });
  }

  isCompleted(id: string): boolean {
    return this.completed.has(id);
  }

  async getBlobUrl(id: string): Promise<string | null> {
    await this.boot();
    if (!this.completed.has(id)) return null;
    const cached = this.blobUrlCache.get(id);
    if (cached) return cached;
    const row = await idbGet<{ id: string; blob: Blob }>(STORE_BLOBS, id);
    if (!row?.blob) return null;
    const url = URL.createObjectURL(row.blob);
    this.blobUrlCache.set(id, url);
    return url;
  }

  async enqueue(meta: DownloadMeta) {
    await this.boot();
    if (this.completed.has(meta.id)) return;
    if (this.active.has(meta.id)) {
      const a = this.active.get(meta.id)!;
      if (a.status === "paused" || a.status === "error") return this.resume(meta.id);
      return;
    }
    this.active.set(meta.id, {
      meta,
      status: "queued",
      loaded: 0,
      total: 0,
      chunks: [],
      supportsRange: true,
    });
    this.notify();
    this.pump();
  }

  pause(id: string) {
    const a = this.active.get(id);
    if (!a || a.status !== "downloading") return;
    a.status = "paused";
    a.abort?.abort();
    a.abort = undefined;
    this.notify();
    this.pump();
  }

  resume(id: string) {
    const a = this.active.get(id);
    if (!a) return;
    if (a.status !== "paused" && a.status !== "error") return;
    a.status = "queued";
    a.error = undefined;
    this.notify();
    this.pump();
  }

  cancel(id: string) {
    const a = this.active.get(id);
    if (!a) return;
    a.abort?.abort();
    this.active.delete(id);
    this.notify();
    this.pump();
  }

  async remove(id: string) {
    this.cancel(id);
    const url = this.blobUrlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.blobUrlCache.delete(id);
    }
    this.completed.delete(id);
    try {
      await idbDelete(STORE_BLOBS, id);
      await idbDelete(STORE_META, id);
    } catch {
      /* ignore */
    }
    this.notify();
  }

  private pump() {
    const downloading = [...this.active.values()].filter((a) => a.status === "downloading").length;
    if (downloading >= MAX_CONCURRENT) return;
    const next = [...this.active.values()].find((a) => a.status === "queued");
    if (!next) return;
    void this.run(next);
    if (downloading + 1 < MAX_CONCURRENT) this.pump();
  }

  private async run(a: ActiveDownload) {
    a.status = "downloading";
    a.abort = new AbortController();
    this.notify();

    try {
      const url = await resolvePlayableUrl(a.meta.fileUrl);
      const startByte = a.loaded;
      const headers: Record<string, string> = {};
      if (startByte > 0 && a.supportsRange) headers.Range = `bytes=${startByte}-`;

      const res = await fetch(url, { headers, signal: a.abort.signal });
      if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);

      // If we asked for a Range but server returned 200, the server doesn't
      // support range — restart from zero.
      if (startByte > 0 && res.status === 200) {
        a.chunks = [];
        a.loaded = 0;
        a.supportsRange = false;
      }

      // Total size: from Content-Range (resumed) or Content-Length (fresh)
      const cr = res.headers.get("Content-Range");
      const cl = res.headers.get("Content-Length");
      if (cr) {
        const m = cr.match(/\/(\d+)$/);
        if (m) a.total = Number(m[1]);
      } else if (cl) {
        a.total = a.loaded + Number(cl);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const buf = new Uint8Array(await res.arrayBuffer());
        a.chunks.push(buf);
        a.loaded += buf.byteLength;
      } else {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            a.chunks.push(value);
            a.loaded += value.byteLength;
            this.notify();
          }
        }
      }

      const blob = new Blob(a.chunks as BlobPart[], { type: "audio/mpeg" });
      const meta: DownloadMeta = {
        ...a.meta,
        size: blob.size,
        downloadedAt: new Date().toISOString(),
      };
      await idbPut(STORE_BLOBS, { id: a.meta.id, blob });
      await idbPut(STORE_META, meta);

      this.completed.set(a.meta.id, meta);
      this.active.delete(a.meta.id);
      this.notify();
      this.pump();
    } catch (err: any) {
      if (a.status === "paused") {
        // Pause was the cause; keep accumulated chunks and progress for resume
        this.notify();
        this.pump();
        return;
      }
      a.status = "error";
      a.error = err?.message || "Download failed";
      a.abort = undefined;
      this.notify();
      this.pump();
    }
  }
}

export const offlineDownloads = new OfflineDownloadManager();

// ---------------- React hook ----------------

import { useEffect, useState } from "react";

export function useOfflineDownloads() {
  const [items, setItems] = useState<DownloadItem[]>(() => offlineDownloads.list());
  useEffect(() => {
    return offlineDownloads.subscribe(() => setItems(offlineDownloads.list()));
  }, []);
  return items;
}
