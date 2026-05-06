import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Image as ImageIcon, Upload, Trash2, Plus, Save, Palette,
  Instagram, Youtube, Twitter, Music2, Globe, Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useSocialLinks, useSaveSocialLink, useDeleteSocialLink, useUpdateArtistTheme } from "@/hooks/use-artist-management";

const BANNER_POSITIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

const PRESET_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#9333EA", "#EA580C", "#0891B2", "#DB2777", "#CA8A04"];

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "tiktok", label: "TikTok", icon: Music2 },
  { value: "spotify", label: "Spotify", icon: Music2 },
  { value: "website", label: "Website", icon: Globe },
  { value: "other", label: "Other", icon: LinkIcon },
];

const platformIcon = (p: string) => PLATFORMS.find((x) => x.value === p)?.icon ?? LinkIcon;

const BrandingSection = ({ artist }: { artist: any }) => {
  const qc = useQueryClient();
  const [name, setName] = useState(artist.name || "");
  const [bio, setBio] = useState(artist.bio || "");
  const [genre, setGenre] = useState(artist.genre || "");
  const [yt, setYt] = useState(artist.youtube_channel_url || "");
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("artists")
        .update({ name, bio, genre, youtube_channel_url: yt })
        .eq("id", artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-artist"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async (p: { file: File; field: "avatar_url" | "cover_url" }) => {
      const ext = p.file.name.split(".").pop();
      const path = `${artist.id}/${p.field}-${Date.now()}.${ext}`;
      const bucket = p.field === "avatar_url" ? "avatars" : "covers";
      const { error: uerr } = await supabase.storage.from(bucket).upload(path, p.file, { upsert: true });
      if (uerr) throw uerr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const { error } = await supabase.from("artists").update({ [p.field]: pub.publicUrl }).eq("id", artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studio-artist"] });
      toast.success("Image updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Cover + Avatar */}
      <Card className="overflow-hidden">
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10">
          {artist.cover_url && <img src={artist.cover_url} alt="cover" className="h-full w-full object-cover"  loading="lazy" decoding="async" />}
          <button
            onClick={() => coverRef.current?.click()}
            className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 hover:bg-background transition"
          >
            <Upload className="h-3.5 w-3.5" /> Cover
          </button>
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload.mutate({ file: e.target.files[0], field: "cover_url" })} />
        </div>
        <div className="px-4 pb-4 -mt-10 md:-mt-12 flex items-end gap-4">
          <div className="relative">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl ring-4 ring-background bg-muted overflow-hidden">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload.mutate({ file: e.target.files[0], field: "avatar_url" })} />
          </div>
          <div className="pb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Brand assets</p>
            <p className="text-xs text-muted-foreground">Square avatar, wide cover (1500×500 ideal)</p>
          </div>
        </div>
      </Card>

      {/* Profile fields */}
      <Card className="p-4 md:p-6 space-y-4">
        <div>
          <h3 className="font-heading text-lg font-bold">Profile details</h3>
          <p className="text-xs text-muted-foreground">How you appear across Sudagospel</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Artist name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Primary genre</Label>
            <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Gospel, Worship..." className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="rounded-xl resize-none" placeholder="Tell your story..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">YouTube channel URL</Label>
          <Input value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/@..." className="rounded-xl" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl gap-1.5">
          <Save className="h-4 w-4" /> {save.isPending ? "Saving..." : "Save changes"}
        </Button>
      </Card>

      {/* Theme */}
      <ThemeEditor artist={artist} />

      {/* Social links */}
      <SocialLinksEditor artistId={artist.id} />
    </div>
  );
};

const ThemeEditor = ({ artist }: { artist: any }) => {
  const updateTheme = useUpdateArtistTheme();
  const [accent, setAccent] = useState(artist.accent_color || "#DC2626");
  const [position, setPosition] = useState(artist.banner_position || "center");

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-bold flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" /> Profile theme
        </h3>
        <p className="text-xs text-muted-foreground">Personalize how your public profile looks.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Accent color</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              className={`h-8 w-8 rounded-full ring-2 transition ${accent === c ? "ring-foreground scale-110" : "ring-transparent"}`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-8 w-12 rounded-md border bg-background cursor-pointer"
          />
          <span className="text-xs text-muted-foreground font-mono">{accent}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Banner position</Label>
        <div className="flex items-center gap-2">
          {BANNER_POSITIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPosition(p.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                position === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => updateTheme.mutate({ artist_id: artist.id, accent_color: accent, banner_position: position })}
        disabled={updateTheme.isPending}
        className="rounded-xl gap-1.5"
        size="sm"
      >
        <Save className="h-4 w-4" /> Save theme
      </Button>
    </Card>
  );
};

const SocialLinksEditor = ({ artistId }: { artistId: string }) => {
  const { data: links = [] } = useSocialLinks(artistId);
  const save = useSaveSocialLink();
  const del = useDeleteSocialLink();
  const [platform, setPlatform] = useState("instagram");
  const [url, setUrl] = useState("");

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg font-bold">Social links</h3>
        <p className="text-xs text-muted-foreground">Show fans where else to find you</p>
      </div>

      <div className="space-y-2">
        {links.map((l: any) => {
          const Icon = platformIcon(l.platform);
          return (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded-xl border bg-muted/20">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold capitalize">{l.platform}</p>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground truncate block hover:text-primary">{l.url}</a>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(l.id)} className="h-8 w-8">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
        {links.length === 0 && <p className="text-xs text-muted-foreground py-2">No links yet.</p>}
      </div>

      <div className="grid grid-cols-[140px_1fr_auto] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-[10px]">Platform</Label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-sm">
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="rounded-xl h-9" />
        </div>
        <Button
          size="sm"
          className="rounded-xl gap-1 h-9"
          disabled={!url}
          onClick={() => {
            save.mutate({ artist_id: artistId, platform, url, position: links.length }, {
              onSuccess: () => { setUrl(""); },
            });
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
    </Card>
  );
};

export default BrandingSection;
