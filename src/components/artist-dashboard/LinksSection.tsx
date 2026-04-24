import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag, Calendar, Heart, Globe, Link as LinkIcon,
  Plus, Trash2, ExternalLink,
} from "lucide-react";
import { useArtistLinks, useSaveArtistLink, useDeleteArtistLink } from "@/hooks/use-artist-management";

const LINK_TYPES = [
  { value: "merch", label: "Merch", icon: ShoppingBag },
  { value: "tour", label: "Tour / Event", icon: Calendar },
  { value: "donate", label: "Donate", icon: Heart },
  { value: "website", label: "Website", icon: Globe },
  { value: "custom", label: "Custom", icon: LinkIcon },
];

const typeIcon = (t: string) => LINK_TYPES.find((x) => x.value === t)?.icon ?? LinkIcon;

const LinksSection = ({ artist }: { artist: any }) => {
  const { data: links = [] } = useArtistLinks(artist.id);
  const save = useSaveArtistLink();
  const del = useDeleteArtistLink();

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("merch");

  return (
    <div className="space-y-4">
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
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-xl h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="rounded-xl h-9" />
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-1 w-full md:w-auto"
            disabled={!url || !label}
            onClick={() => {
              save.mutate(
                { artist_id: artist.id, label, url, link_type: type, position: links.length },
                { onSuccess: () => { setLabel(""); setUrl(""); } }
              );
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Add link
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LinksSection;
