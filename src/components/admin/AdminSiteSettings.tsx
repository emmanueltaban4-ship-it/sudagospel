import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/use-site-settings";

const AdminSiteSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    site_name: "",
    tagline: "",
    logo_url: "",
    footer_text: "",
    hero_quote: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        site_name: settings.site_name || "",
        tagline: settings.tagline || "",
        logo_url: settings.logo_url || "",
        footer_text: settings.footer_text || "",
        hero_quote: settings.hero_quote || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      for (const [key, value] of Object.entries(updates)) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) {
          // If row doesn't exist, insert
          const { error: insertError } = await supabase
            .from("site_settings")
            .insert({ key, value });
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      toast.success("Settings saved!");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setUploading(false); return; }
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(fileName, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setForm({ ...form, logo_url: urlData.publicUrl });
    setUploading(false);
    toast.success("Logo uploaded");
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Settings2 className="h-5 w-5" /> Site Settings
      </h2>

      <div className="space-y-5 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Site Name</label>
          <Input
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            placeholder="Sudagospel"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tagline</label>
          <Input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="South Sudan's Premier Gospel Music Platform"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Logo</label>
          <div className="flex items-center gap-3">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-muted p-1" / loading="lazy" decoding="async">
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                No logo
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1 rounded-full text-xs"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload Logo
            </Button>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Homepage Quote</label>
          <Textarea
            value={form.hero_quote}
            onChange={(e) => setForm({ ...form, hero_quote: e.target.value })}
            placeholder="Inspirational quote..."
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Footer Text</label>
          <Input
            value={form.footer_text}
            onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
            placeholder="© 2026 ..."
          />
        </div>

        <Button
          className="gap-2 rounded-full"
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
