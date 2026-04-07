import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useMusicUpload = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadSong = async ({
    title,
    description,
    genre,
    artistId,
    musicFile,
    coverFile,
    albumId,
  }: {
    title: string;
    description?: string;
    genre?: string;
    artistId: string;
    musicFile: File;
    coverFile?: File;
    albumId?: string;
  }) => {
    if (!user) {
      toast.error("You must be signed in to upload.");
      return null;
    }

    setUploading(true);
    try {
      // Upload music file
      const musicPath = `${user.id}/${Date.now()}-${musicFile.name}`;
      const { error: musicError } = await supabase.storage
        .from("music")
        .upload(musicPath, musicFile);
      if (musicError) throw musicError;

      const { data: musicUrlData } = supabase.storage
        .from("music")
        .getPublicUrl(musicPath);

      // Upload cover if provided
      let coverUrl: string | undefined;
      if (coverFile) {
        const coverPath = `${user.id}/${Date.now()}-${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile);
        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from("covers")
          .getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      // Insert song record
      const { data, error } = await supabase.from("songs").insert({
        title,
        description: description || null,
        genre: genre || null,
        artist_id: artistId,
        uploaded_by: user.id,
        file_url: musicUrlData.publicUrl,
        cover_url: coverUrl || null,
      }).select().single();

      if (error) throw error;

      toast.success("Song uploaded! It will be available after approval.");
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      return data;
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadSong, uploading };
};
