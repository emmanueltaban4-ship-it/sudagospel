import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Save, Upload, Loader2, Settings2, Palette, Search, Share2,
  Mail, ToggleLeft, AlertTriangle, FileText, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/use-site-settings";

/* All editable keys with metadata */
type FieldType = "text" | "textarea" | "url" | "email" | "image" | "color" | "boolean" | "number";

type Field = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  maxLength?: number;
};

type Section = { id: string; label: string; icon: any; description: string; fields: Field[] };

const SECTIONS: Section[] = [
  {
    id: "branding",
    label: "Branding",
    icon: Palette,
    description: "App identity — name, logo, colors and homepage copy.",
    fields: [
      { key: "site_name", label: "Site name", type: "text", placeholder: "SSDGUNA", maxLength: 60 },
      { key: "tagline", label: "Tagline", type: "text", placeholder: "South Sudan's premier gospel music platform", maxLength: 160 },
      { key: "logo_url", label: "Logo", type: "image" },
      { key: "favicon_url", label: "Favicon", type: "image", help: "Square 64×64 or 128×128 recommended." },
      { key: "og_image_url", label: "Default share image (Open Graph)", type: "image", help: "Used when links to your site are shared. 1200×630 recommended." },
      { key: "primary_color", label: "Primary color", type: "color", help: "Hex value, e.g. #DC2626." },
      { key: "secondary_color", label: "Secondary color", type: "color" },
      { key: "hero_quote", label: "Homepage quote", type: "textarea", placeholder: "Inspirational quote shown on the homepage hero." },
      { key: "footer_text", label: "Footer text", type: "text", placeholder: "© 2026 SSDGUNA" },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    icon: Search,
    description: "Search engine and social preview metadata.",
    fields: [
      { key: "seo_title", label: "Default page title", type: "text", maxLength: 70, help: "Under 60 characters works best." },
      { key: "seo_description", label: "Meta description", type: "textarea", maxLength: 200, help: "Under 160 characters works best." },
      { key: "seo_keywords", label: "Keywords", type: "text", placeholder: "gospel, south sudan, worship" },
      { key: "canonical_url", label: "Canonical URL", type: "url", placeholder: "https://ssdguna.net" },
      { key: "google_site_verification", label: "Google site verification token", type: "text" },
      { key: "google_analytics_id", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { key: "robots_index", label: "Allow search engine indexing", type: "boolean", help: "Turn off to ask search engines not to index the site." },
    ],
  },
  {
    id: "social",
    label: "Social & contact",
    icon: Share2,
    description: "Public social profiles and how users reach you.",
    fields: [
      { key: "contact_email", label: "Contact email", type: "email" },
      { key: "support_email", label: "Support email", type: "email" },
      { key: "contact_phone", label: "Contact phone", type: "text" },
      { key: "facebook_url", label: "Facebook", type: "url" },
      { key: "instagram_url", label: "Instagram", type: "url" },
      { key: "twitter_url", label: "X / Twitter", type: "url" },
      { key: "youtube_url", label: "YouTube", type: "url" },
      { key: "tiktok_url", label: "TikTok", type: "url" },
      { key: "whatsapp_url", label: "WhatsApp", type: "url" },
    ],
  },
  {
    id: "features",
    label: "Features",
    icon: ToggleLeft,
    description: "Toggle platform-wide features and limits.",
    fields: [
      { key: "feature_signups_enabled", label: "Allow new signups", type: "boolean" },
      { key: "feature_artist_applications_enabled", label: "Accept artist applications", type: "boolean" },
      { key: "feature_uploads_enabled", label: "Allow song uploads", type: "boolean" },
      { key: "feature_comments_enabled", label: "Allow comments", type: "boolean" },
      { key: "feature_downloads_enabled", label: "Allow downloads", type: "boolean" },
      { key: "feature_paid_downloads_enabled", label: "Allow paid downloads", type: "boolean" },
      { key: "feature_tip_jar_enabled", label: "Allow artist tip jar", type: "boolean" },
      { key: "feature_supporter_subs_enabled", label: "Allow supporter subscriptions", type: "boolean" },
      { key: "feature_polls_enabled", label: "Show polls on homepage", type: "boolean" },
      { key: "feature_blog_enabled", label: "Show blog / articles", type: "boolean" },
      { key: "max_upload_mb", label: "Max upload size (MB)", type: "number", placeholder: "50" },
      { key: "default_song_price_cents", label: "Default paid download price (cents)", type: "number", placeholder: "99" },
    ],
  },
  {
    id: "ads",
    label: "Ads & promo",
    icon: ImageIcon,
    description: "Control ad slots and homepage promotional behaviour.",
    fields: [
      { key: "ads_enabled", label: "Show ads across the app", type: "boolean" },
      { key: "ads_homepage_banner_enabled", label: "Homepage banner ad", type: "boolean" },
      { key: "ads_player_banner_enabled", label: "Mini player banner ad", type: "boolean" },
      { key: "promo_announcement", label: "Top announcement bar text", type: "text", maxLength: 160, help: "Leave blank to hide." },
      { key: "promo_announcement_link", label: "Announcement link URL", type: "url" },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: AlertTriangle,
    description: "Take the app offline or limit access during work.",
    fields: [
      { key: "maintenance_mode", label: "Maintenance mode", type: "boolean", help: "Hides the app for non-admins and shows the maintenance message." },
      { key: "maintenance_message", label: "Maintenance message", type: "textarea", placeholder: "We'll be back shortly!" },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    icon: FileText,
    description: "Terms, privacy and copyright information shown in the footer.",
    fields: [
      { key: "terms_url", label: "Terms of service URL", type: "url" },
      { key: "privacy_url", label: "Privacy policy URL", type: "url" },
      { key: "copyright_url", label: "Copyright / DMCA URL", type: "url" },
      { key: "legal_notice", label: "Legal notice", type: "textarea" },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);
const BOOL_KEYS = new Set(ALL_FIELDS.filter((f) => f.type === "boolean").map((f) => f.key));
const TRUE_DEFAULTS = new Set([
  "robots_index",
  "feature_signups_enabled",
  "feature_artist_applications_enabled",
  "feature_uploads_enabled",
  "feature_comments_enabled",
  "feature_downloads_enabled",
  "feature_paid_downloads_enabled",
  "feature_tip_jar_enabled",
  "feature_supporter_subs_enabled",
  "feature_polls_enabled",
  "feature_blog_enabled",
  "ads_enabled",
  "ads_homepage_banner_enabled",
]);

const isBoolTrue = (v: string | undefined, key: string) =>
  v === undefined || v === "" ? TRUE_DEFAULTS.has(key) : v === "true";

const AdminSiteSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();

  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    ALL_FIELDS.forEach((f) => {
      const v = settings?.[f.key];
      if (f.type === "boolean") {
        map[f.key] = String(isBoolTrue(v, f.key));
      } else {
        map[f.key] = v ?? "";
      }
    });
    return map;
  }, [settings]);

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(initial);
    setDirty(false);
  }, [initial]);

  const setField = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
      // Upsert one-by-one (small set) for clearer errors
      for (const row of rows) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", row.key)
          .maybeSingle();
        if (existing) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: row.value, updated_at: new Date().toISOString() })
            .eq("key", row.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_settings")
            .insert({ key: row.key, value: row.value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Settings saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (err: any) => toast.error(err.message ?? "Could not save settings"),
  });

  const handleSave = () => {
    // Light validation
    for (const f of ALL_FIELDS) {
      const v = (form[f.key] ?? "").trim();
      if (!v) continue;
      if (f.type === "url" && !/^https?:\/\//i.test(v)) {
        toast.error(`${f.label} must start with http:// or https://`);
        return;
      }
      if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        toast.error(`${f.label} is not a valid email`);
        return;
      }
      if (f.type === "color" && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
        toast.error(`${f.label} must be a hex color like #DC2626`);
        return;
      }
      if (f.type === "number" && Number.isNaN(Number(v))) {
        toast.error(`${f.label} must be a number`);
        return;
      }
      if (f.maxLength && v.length > f.maxLength) {
        toast.error(`${f.label} must be ${f.maxLength} characters or fewer`);
        return;
      }
    }
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> App Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Full control over branding, SEO, features, and legal content for the entire app.
          </p>
        </div>
        <Button
          className="gap-2 rounded-full"
          onClick={handleSave}
          disabled={saveMutation.isPending || !dirty}
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveMutation.isPending ? "Saving..." : dirty ? "Save changes" : "Saved"}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 p-1">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="gap-1.5 text-xs">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((s) => (
          <TabsContent key={s.id} value={s.id} className="space-y-4">
            <Card className="p-4 md:p-6">
              <div className="mb-4">
                <h3 className="font-heading text-base font-bold flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" /> {s.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
                {s.fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={form[f.key] ?? ""}
                    onChange={(v) => setField(f.key, v)}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Sticky save bar on mobile */}
      {dirty && (
        <div className="fixed bottom-20 inset-x-0 px-3 z-30 md:hidden">
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full rounded-full gap-2 shadow-lg shadow-primary/30">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </div>
      )}
    </div>
  );
};

/* ============ field input ============ */
const FieldInput = ({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) => {
  const labelEl = (
    <label className="text-xs font-semibold text-muted-foreground mb-1 block">
      {field.label}
    </label>
  );
  const help = field.help ? <p className="text-[10px] text-muted-foreground mt-1">{field.help}</p> : null;

  if (field.type === "boolean") {
    const checked = value === "true";
    return (
      <div className={field.type === "boolean" ? "md:col-span-2" : ""}>
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl border bg-muted/20">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{field.label}</p>
            {field.help && <p className="text-[11px] text-muted-foreground mt-0.5">{field.help}</p>}
          </div>
          <Switch checked={checked} onCheckedChange={(c) => onChange(String(c))} />
        </div>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2">
        {labelEl}
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} maxLength={field.maxLength} />
        {help}
      </div>
    );
  }

  if (field.type === "image") {
    return <ImageField field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "color") {
    return (
      <div>
        {labelEl}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-12 rounded-lg border bg-background cursor-pointer"
            aria-label={`${field.label} color picker`}
          />
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#DC2626" className="font-mono" maxLength={9} />
        </div>
        {help}
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <Input
        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        inputMode={field.type === "number" ? "numeric" : undefined}
      />
      {help}
    </div>
  );
};

const ImageField = ({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setUploading(false); return; }
    const ext = file.name.split(".").pop();
    const fileName = `${user.id}/${field.key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(fileName, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success(`${field.label} uploaded`);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="md:col-span-2">
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt={field.label} className="h-14 w-14 rounded-lg object-contain bg-muted p-1" loading="lazy" decoding="async" />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1 rounded-full text-xs"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={() => onChange("")}>
                Remove
              </Button>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
          {field.help && <p className="text-[10px] text-muted-foreground">{field.help}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminSiteSettings;
