import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Music, Image, ArrowLeft, ArrowRight, Plus, Check, Calendar, Disc3, Rocket } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const genres = ["Worship", "Praise", "Afro Gospel", "Traditional", "Contemporary", "Choir", "Other"];
const STEPS = ["Audio", "Artwork", "Details", "Release"];

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Step 1: Audio
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Artwork
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Step 3: Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [artistId, setArtistId] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [showNewArtist, setShowNewArtist] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumType, setNewAlbumType] = useState("album");
  const [newAlbumCover, setNewAlbumCover] = useState<File | null>(null);

  // Step 4: Release
  const [releaseOption, setReleaseOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");

  const { data: artists } = useQuery({
    queryKey: ["my-artists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("id, name, status")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as { id: string; name: string; status: string }[];
    },
    enabled: !!user,
  });

  const approvedArtists = artists?.filter((a) => a.status === "approved") ?? [];
  const pendingArtists = artists?.filter((a) => a.status === "pending") ?? [];
  const rejectedArtists = artists?.filter((a) => a.status === "rejected") ?? [];
  const hasArtists = (artists?.length ?? 0) > 0;
  const hasApproved = approvedArtists.length > 0;

  const { data: albums } = useQuery({
    queryKey: ["my-albums", artistId],
    queryFn: async () => {
      const { data, error } = await supabase.from("albums").select("id, title").eq("artist_id", artistId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!artistId,
  });

  const handleMusicSelect = useCallback((file: File) => {
    setMusicFile(file);
    // Extract duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      setAudioDuration(Math.round(audio.duration));
      URL.revokeObjectURL(audio.src);
    });
  }, []);

  const handleCoverSelect = useCallback((file: File) => {
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleCreateArtist = async () => {
    if (!newArtistName.trim()) return;
    const { data, error } = await supabase.from("artists").insert({ name: newArtistName.trim(), user_id: user!.id, genre }).select().single();
    if (error) { toast.error(error.message); return; }
    setShowNewArtist(false);
    setNewArtistName("");
    toast.success("Artist profile submitted! An admin must approve it before you can upload.");
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    let coverUrl: string | null = null;
    if (newAlbumCover) {
      const ext = newAlbumCover.name.split(".").pop();
      const path = `albums/${artistId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, newAlbumCover);
      if (upErr) { toast.error(upErr.message); return; }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }
    const { data, error } = await supabase.from("albums").insert({ artist_id: artistId, title: newAlbumTitle.trim(), album_type: newAlbumType, cover_url: coverUrl } as any).select().single();
    if (error) { toast.error(error.message); return; }
    setAlbumId(data.id);
    setShowNewAlbum(false);
    setNewAlbumTitle(""); setNewAlbumType("album"); setNewAlbumCover(null);
    toast.success("Album created!");
  };

  const canProceed = () => {
    if (step === 0) return !!musicFile;
    if (step === 1) return true; // artwork is optional
    if (step === 2) return !!title.trim() && !!artistId;
    if (step === 3) return releaseOption === "now" || (!!scheduledDate && !!scheduledTime);
    return false;
  };

  const handleSubmit = async () => {
    if (!musicFile || !user) return;
    setUploading(true);
    try {
      // Upload audio
      const musicPath = `${user.id}/${Date.now()}-${musicFile.name}`;
      const { error: musicErr } = await supabase.storage.from("music").upload(musicPath, musicFile);
      if (musicErr) throw musicErr;
      const { data: musicUrlData } = supabase.storage.from("music").getPublicUrl(musicPath);

      // Upload cover
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}-${coverFile.name}`;
        const { error: coverErr } = await supabase.storage.from("covers").upload(coverPath, coverFile);
        if (coverErr) throw coverErr;
        const { data: coverUrlData } = supabase.storage.from("covers").getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      // Build scheduled release fields
      let scheduledReleaseAt: string | null = null;
      let releaseStatus = "published";
      if (releaseOption === "schedule" && scheduledDate && scheduledTime) {
        scheduledReleaseAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        releaseStatus = "scheduled";
      }

      const { error } = await supabase.from("songs").insert({
        title,
        description: description || null,
        genre: genre || null,
        lyrics: lyrics || null,
        artist_id: artistId,
        uploaded_by: user.id,
        file_url: musicUrlData.publicUrl,
        cover_url: coverUrl,
        album_id: albumId && albumId !== "none" ? albumId : null,
        duration_seconds: audioDuration,
        scheduled_release_at: scheduledReleaseAt,
        release_status: releaseStatus,
      } as any);

      if (error) throw error;

      toast.success(releaseOption === "schedule" ? "Song scheduled for release!" : "Song uploaded! Awaiting approval.");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Sign in to Upload</h1>
          <Button onClick={() => navigate("/auth")} className="rounded-full bg-primary text-primary-foreground">Sign In</Button>
        </div>
      </Layout>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Layout>
      <div className="container max-w-lg py-6 pb-28">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {step > 0 ? "Back" : "Cancel"}
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">
          <Upload className="inline h-6 w-6 mr-2 text-primary" />
          Upload Song
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${i === step ? "text-primary" : i < step ? "text-foreground" : "text-muted-foreground"}`}>
                {i < step ? <Check className="h-3 w-3 inline" /> : null} {label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* STEP 1: Audio */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-lg font-bold">Select Audio File</Label>
                  <p className="text-sm text-muted-foreground mt-1">Upload your song in MP3 or WAV format</p>
                </div>
                <label
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center hover:border-primary hover:bg-primary/5 transition-all"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleMusicSelect(e.dataTransfer.files[0]); }}
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {musicFile ? musicFile.name : "Drop audio file or click to browse"}
                  </span>
                  {musicFile && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(musicFile.size)}</span>
                      {audioDuration && <span>· {formatDuration(audioDuration)}</span>}
                    </div>
                  )}
                  <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleMusicSelect(e.target.files[0]); }} />
                </label>
              </div>
            )}

            {/* STEP 2: Artwork */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-lg font-bold">Cover Artwork</Label>
                  <p className="text-sm text-muted-foreground mt-1">Upload a square image for your song cover (optional)</p>
                </div>
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center hover:border-primary hover:bg-primary/5 transition-all">
                  {coverPreview ? (
                    <div className="h-48 w-48 rounded-xl overflow-hidden shadow-lg">
                      <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover"  loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-xl bg-muted flex items-center justify-center">
                      <Image className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {coverFile ? coverFile.name : "Click to upload cover art"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleCoverSelect(e.target.files[0]); }} />
                </label>
              </div>
            )}

            {/* STEP 3: Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-lg font-bold">Song Details</Label>
                  <p className="text-sm text-muted-foreground mt-1">Add metadata for your song</p>
                </div>

                <div>
                  <Label className="text-foreground">Song Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter song title" required className="mt-1" />
                </div>

                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about this song..." rows={2} className="mt-1" />
                </div>

                <div>
                  <Label className="text-foreground">Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select genre" /></SelectTrigger>
                    <SelectContent>
                      {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-foreground">Lyrics</Label>
                  <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Paste song lyrics..." rows={4} className="mt-1" />
                </div>

                {/* Artist */}
                <div>
                  <Label className="text-foreground">Artist *</Label>
                  {!showNewArtist ? (
                    <div className="flex gap-2 mt-1">
                      <Select value={artistId} onValueChange={setArtistId} disabled={!hasApproved}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={hasApproved ? "Select artist" : "No approved artists yet"} />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedArtists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowNewArtist(true)} className="shrink-0"><Plus className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-1">
                      <Input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} placeholder="Artist name" className="flex-1" />
                      <Button type="button" onClick={handleCreateArtist} size="sm" className="bg-secondary text-secondary-foreground">Submit for Approval</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewArtist(false)}>Cancel</Button>
                    </div>
                  )}

                  {pendingArtists.length > 0 && (
                    <div className="mt-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2.5 text-xs text-yellow-700 dark:text-yellow-400">
                      <strong>Awaiting approval:</strong> {pendingArtists.map((a) => a.name).join(", ")}. You can upload music once an admin approves.
                    </div>
                  )}
                  {rejectedArtists.length > 0 && (
                    <div className="mt-2 rounded-lg bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive">
                      <strong>Rejected:</strong> {rejectedArtists.map((a) => a.name).join(", ")}.
                    </div>
                  )}
                  {!hasArtists && !showNewArtist && (
                    <p className="mt-2 text-xs text-muted-foreground">Click + to submit your first artist profile for admin approval.</p>
                  )}
                </div>

                {/* Album */}
                {artistId && (
                  <div>
                    <Label className="text-foreground">Album (optional)</Label>
                    {!showNewAlbum ? (
                      <Select value={albumId || "none"} onValueChange={(v) => { if (v === "__new__") { setShowNewAlbum(true); setAlbumId(""); } else { setAlbumId(v === "none" ? "" : v); } }}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Single (no album)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Single (no album)</SelectItem>
                          {albums?.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                          <SelectItem value="__new__">+ Create New Album</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 p-3 rounded-lg bg-card border border-border space-y-2">
                        <p className="text-xs font-bold text-foreground">New Album</p>
                        <Input value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} placeholder="Album title" />
                        <Select value={newAlbumType} onValueChange={setNewAlbumType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="album">Album</SelectItem>
                            <SelectItem value="ep">EP</SelectItem>
                            <SelectItem value="single">Single</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" className="bg-secondary text-secondary-foreground" disabled={!newAlbumTitle.trim()} onClick={handleCreateAlbum}>Create</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAlbum(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Release */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <Label className="text-foreground text-lg font-bold">Release Options</Label>
                  <p className="text-sm text-muted-foreground mt-1">Choose when to release your song</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReleaseOption("now")}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${releaseOption === "now" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <Rocket className="h-8 w-8 text-primary" />
                    <span className="text-sm font-bold text-foreground">Publish Now</span>
                    <span className="text-[10px] text-muted-foreground">Available after approval</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReleaseOption("schedule")}
                    className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${releaseOption === "schedule" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  >
                    <Calendar className="h-8 w-8 text-primary" />
                    <span className="text-sm font-bold text-foreground">Schedule</span>
                    <span className="text-[10px] text-muted-foreground">Set a future release date</span>
                  </button>
                </div>

                {releaseOption === "schedule" && (
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <Label className="text-foreground">Release Date & Time</Label>
                    <div className="flex gap-2">
                      <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="flex-1" min={new Date().toISOString().split("T")[0]} />
                      <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-32" />
                    </div>
                    {scheduledDate && (
                      <p className="text-xs text-primary font-medium">
                        Will be released on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {scheduledTime}
                      </p>
                    )}
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Summary</p>
                  <div className="flex items-center gap-3">
                    {coverPreview ? (
                      <img src={coverPreview} alt="" className="h-14 w-14 rounded-lg object-cover"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Music className="h-6 w-6 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{artists?.find(a => a.id === artistId)?.name || "No artist"} · {genre || "No genre"}</p>
                      {audioDuration && <p className="text-[10px] text-muted-foreground">{formatDuration(audioDuration)} · {musicFile?.name}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 font-bold"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={uploading || !canProceed()}
              className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 font-bold"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : releaseOption === "schedule" ? "Schedule Release" : "Upload Song"}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {releaseOption === "schedule" ? "Scheduled songs will be released automatically at the set time." : "Songs will be reviewed before being published publicly."}
        </p>
      </div>
    </Layout>
  );
};

export default UploadPage;
