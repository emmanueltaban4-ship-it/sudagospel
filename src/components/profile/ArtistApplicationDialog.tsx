import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic2, Sparkles, Camera, Loader2, Youtube, Music as MusicIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Stage name is required").max(60),
  genre: z.string().trim().min(2, "Pick a genre").max(40),
  bio: z.string().trim().min(20, "Tell us a bit more (20+ chars)").max(800),
  youtube: z.string().trim().max(200).optional().or(z.literal("")),
});

interface Props { children: React.ReactNode; onSubmitted?: () => void }

const ArtistApplicationDialog = ({ children, onSubmitted }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("Gospel");
  const [bio, setBio] = useState("");
  const [youtube, setYoutube] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ name, genre, bio, youtube });
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
      }
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `artist-applications/${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      const { error } = await supabase.from("artists").insert({
        user_id: user!.id,
        name: name.trim(),
        genre: genre.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        youtube_channel_url: youtube.trim() || null,
        status: "pending",
      } as any);
      if (error) throw error;
      // Reflect on profile
      await supabase.from("profiles").update({ account_type: "artist" }).eq("user_id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-artist-full"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Application submitted! An admin will review shortly.");
      setOpen(false);
      onSubmitted?.();
    },
    onError: (e: any) => toast.error(e.message || "Could not submit application"),
  });

  const handleFile = (f: File) => {
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Mic2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-heading text-xl">Become an Artist</DialogTitle>
          <DialogDescription className="text-center">
            Tell us about your ministry. An admin will review your application — you'll be notified once approved and can start uploading music.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-20 w-20 rounded-full overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <span className="text-[11px] text-muted-foreground">Profile photo (optional)</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="artist-name" className="text-xs font-semibold">Stage / Artist name *</Label>
            <Input id="artist-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Akon Lual" maxLength={60} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="artist-genre" className="text-xs font-semibold">Primary genre *</Label>
            <Input id="artist-genre" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Gospel, Worship, Praise..." maxLength={40} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="artist-bio" className="text-xs font-semibold">Bio *</Label>
            <Textarea id="artist-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your music ministry, where you're based, and what you sing about..." rows={4} maxLength={800} />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/800</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="artist-yt" className="text-xs font-semibold flex items-center gap-1.5">
              <Youtube className="h-3 w-3 text-destructive" /> YouTube channel (optional)
            </Label>
            <Input id="artist-yt" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/@yourchannel" />
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2.5">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">What happens next:</strong> Admins review applications within a few days. Once approved, you can upload songs, edit your public artist page, accept tips, and more.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submit.isPending}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="gap-1.5">
            {submit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MusicIcon className="h-3.5 w-3.5" />}
            Submit application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistApplicationDialog;
