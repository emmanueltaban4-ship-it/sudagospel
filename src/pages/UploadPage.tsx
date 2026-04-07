import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useMusicUpload } from "@/hooks/use-music-upload";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Music, Image, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const genres = ["Worship", "Praise", "Afro Gospel", "Traditional", "Contemporary", "Choir", "Other"];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadSong, uploading } = useMusicUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // New artist fields
  const [showNewArtist, setShowNewArtist] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");

  const { data: artists } = useQuery({
    queryKey: ["my-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Sign in to Upload</h1>
          <Button onClick={() => navigate("/auth")} className="rounded-full bg-primary text-primary-foreground">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  const handleCreateArtist = async () => {
    if (!newArtistName.trim()) return;
    const { data, error } = await supabase
      .from("artists")
      .insert({ name: newArtistName.trim(), user_id: user.id, genre })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setArtistId(data.id);
    setShowNewArtist(false);
    setNewArtistName("");
    toast.success("Artist profile created!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicFile) {
      toast.error("Please select a music file");
      return;
    }
    if (!artistId) {
      toast.error("Please select or create an artist");
      return;
    }

    const result = await uploadSong({
      title,
      description,
      genre,
      artistId,
      musicFile,
      coverFile: coverFile || undefined,
    });

    if (result) {
      navigate("/profile");
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
          <Upload className="inline h-6 w-6 mr-2 text-primary" />
          Upload Song
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-foreground">Song Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-foreground">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this song..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-foreground">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Artist selection */}
          <div>
            <Label className="text-foreground">Artist *</Label>
            {!showNewArtist ? (
              <div className="flex gap-2 mt-1">
                <Select value={artistId} onValueChange={setArtistId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewArtist(true)}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Input
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  placeholder="Artist name"
                  className="flex-1"
                />
                <Button type="button" onClick={handleCreateArtist} size="sm" className="bg-secondary text-secondary-foreground">
                  Create
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewArtist(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Music file */}
          <div>
            <Label className="text-foreground">Music File * (MP3, WAV)</Label>
            <label className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-6 text-center hover:border-primary transition-colors">
              <Music className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {musicFile ? musicFile.name : "Click to select audio file"}
              </span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Cover image */}
          <div>
            <Label className="text-foreground">Cover Image (optional)</Label>
            <label className="mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-4 text-center hover:border-primary transition-colors">
              <Image className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {coverFile ? coverFile.name : "Click to select cover image"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button
            type="submit"
            disabled={uploading}
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Song"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Songs will be reviewed before being published publicly.
          </p>
        </form>
      </div>
    </Layout>
  );
};

export default UploadPage;
