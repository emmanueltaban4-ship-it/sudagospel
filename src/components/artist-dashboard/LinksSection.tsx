import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag, Calendar, Heart, Globe, Link as LinkIcon,
  Plus, Trash2, ExternalLink, Music2, Youtube, Instagram,
  Twitter, Facebook, Save, Video,
} from "lucide-react";
import {
  useArtistLinks, useSaveArtistLink, useDeleteArtistLink,
  useSocialLinks, useSaveSocialLink, useDeleteSocialLink,
} from "@/hooks/use-artist-management";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

const LINK_TYPES = [
  { value: "merch", label: "Merch", icon: ShoppingBag },
  { value: "tour", label: "Tour / Event", icon: Calendar },
  { value: "donate", label: "Donate", icon: Heart },
  { value: "website", label: "Website", icon: Globe },
  { value: "custom", label: "Custom", icon: LinkIcon },
];
const typeIcon = (t: string) => LINK_TYPES.find((x) => x.value === t)?.icon ?? LinkIcon;

const SOCIAL_PLATFORMS = [
  { value: "spotify", label: "Spotify", icon: Music2, placeholder: "https://open.spotify.com/artist/..." },
  { value: "apple_music", label: "Apple Music", icon: Music2, placeholder: "https://music.apple.com/..." },
  { value: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@..." },
  { value: "youtube_music", label: "YouTube Music", icon: Youtube, placeholder: "https://music.youtube.com/..." },
  { value: "soundcloud", label: "SoundCloud", icon: Music2, placeholder: "https://soundcloud.com/..." },
  { value: "audiomack", label: "Audiomack", icon: Music2, placeholder: "https://audiomack.com/..." },
  { value: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/..." },
  { value: "tiktok", label: "TikTok", icon: Music2, placeholder: "https://tiktok.com/@..." },
  { value: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "https://x.com/..." },
  { value: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/..." },
];
const platformMeta = (p: string) => SOCIAL_PLATFORMS.find((x) => x.value === p) ?? { label: p, icon: LinkIcon, placeholder: "https://..." };

const urlSchema = z.string().trim().url({ message: "Please enter a valid URL" }).max(500);

const LinksSection = ({ artist }: { artist: any }) => {
  const qc = useQueryClient();

  /* External links */
  const { data: links = [] } = useArtistLinks(artist.id);
  const save = useSaveArtistLink();
  const del = useDeleteArtistLink();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("merch");

  /* Social/streaming */
  const { data: socials = [] } = useSocialLinks(artist.id);
  const saveSocial = useSaveSocialLink();
  const delSocial = useDeleteSocialLink();
  const [sPlatform, setSPlatform] = useState("spotify");
  const [sUrl, setSUrl] = useState("");

  /* YouTube / promo (artists table fields) */
  const [yt, setYt] = useState(artist.youtube_channel_url || "");
  const savePromo = useMutation({
    mutationFn: async () => {
      const trimmed = yt.trim();
      if (trimmed) urlSchema.parse(trimmed);
      const { error } = await supabase
        .from("artists")
        .update({ youtube_channel_url: trimmed || null })
        .eq("id", artist.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promo details saved");
      qc.invalidateQueries({ queryKey: ["studio-artist"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save"),
  });

  const handleAddSocial = () => {
    try {
      urlSchema.parse(sUrl);
    } catch (e: any) {
      toast.error(e?.errors?.[0]?.message ?? "Invalid URL");
      return;
    }
    if (socials.some((s: any) => s.platform === sPlatform)) {
      toast.error("That platform is already added");
      return;
    }
    saveSocial.mutate(
      { artist_id: artist.id, platform: sPlatform, url: sUrl.trim(), position: socials.length },
      { onSuccess: () => setSUrl("") }
    );
  };

  const handleAddLink = () => {
    try {
      urlSchema.parse(url);
    } catch (e: any) {
      toast.error(e?.errors?.[0]?.message ?? "Invalid URL");
      return;
    }
    save.mutate(
      { artist_id: artist.id, label: label.trim(), url: url.trim(), link_type: type, position: links.length },
      { onSuccess: () => { setLabel(""); setUrl(""); } }
    );
  };

  return (
    <div className="space-y-4">
      {/* Social & Streaming */}
      <Card className="p-4 md:p-6">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-bold">Social & streaming</h3>
          <p className="text-xs text-muted-foreground">Connect Spotify, Apple Music, YouTube, Instagram and more — shown as icons on your profile.</p>
        </div>

        <div className="space-y-2 mb-4">
          {socials.map((s: any) => {
            const meta = platformMeta(s.platform);
            const Icon = meta.icon;
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground truncate flex items-center gap-1 hover:text-primary">
                    <span className="truncate">{s.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
                <Button variant="ghost" size="icon" onClick={() => delSocial.mutate(s.id)} className="h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          {socials.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No social or streaming links yet.</p>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add platform</p>
          <div className="grid md:grid-cols-[180px_1fr] gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Platform</Label>
              <select
                value={sPlatform}
                onChange={(e) => setSPlatform(e.target.value)}
                className="h-9 w-full rounded-xl border bg-background px-2 text-sm"
              >
                {SOCIAL_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">URL</Label>
              <Input
                value={sUrl}
                onChange={(e) => setSUrl(e.target.value)}
                placeholder={platformMeta(sPlatform).placeholder}
                className="rounded-xl h-9"
                maxLength={500}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1 w-full md:w-auto"
            disabled={!sUrl || saveSocial.isPending}
            onClick={handleAddSocial}
          >
            <Plus className="h-3.5 w-3.5" /> Add platform
          </Button>
        </div>
      </Card>

      {/* YouTube / promo */}
      <Card className="p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-heading text-lg font-bold">YouTube & promo</h3>
            <p className="text-xs text-muted-foreground">Featured channel powering the video tab on your artist page.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px]">YouTube channel URL or @handle</Label>
            <Input
              value={yt}
              onChange={(e) => setYt(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="rounded-xl h-9"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground">Used to surface your latest videos and a "Watch on YouTube" call to action.</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1 w-full md:w-auto"
            disabled={savePromo.isPending}
            onClick={() => savePromo.mutate()}
          >
            <Save className="h-3.5 w-3.5" /> Save promo details
          </Button>
        </div>
      </Card>

      {/* External links */}
      <Card className="p-4 md:p-6">
        <div className="mb-4">
          <h3 className="font-heading text-lg font-bold">External links</h3>
          <p className="text-xs text-muted-foreground">Merch, tour dates, donate buttons — shown on your public profile.</p>
        </div>

        <div className="space-y-2 mb-4">
          {links.map((l: any) => {
            const Icon = typeIcon(l.link_type);
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{l.label}</p>
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground truncate flex items-center gap-1 hover:text-primary">
                    <span className="truncate">{l.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(l.id)} className="h-8 w-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          {links.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No external links yet.</p>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add link</p>
          <div className="grid md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-sm">
                {LINK_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Label (e.g. "Buy Merch")</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-xl h-9" maxLength={60} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="rounded-xl h-9" maxLength={500} />
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1 w-full md:w-auto"
            disabled={!url || !label || save.isPending}
            onClick={handleAddLink}
          >
            <Plus className="h-3.5 w-3.5" /> Add link
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LinksSection;
