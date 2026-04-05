import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  DollarSign, Megaphone, Crown, Download, Code2, Save, AlertCircle,
} from "lucide-react";

// Helper to read/write site_settings
const useSetting = (key: string) => {
  return useQuery({
    queryKey: ["site-setting", key],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return data?.value || "";
    },
  });
};

const AdminMonetization = () => {
  const queryClient = useQueryClient();

  // Settings
  const { data: adsenseId } = useSetting("adsense_publisher_id");
  const { data: adsenseEnabled } = useSetting("adsense_enabled");
  const { data: downloadPrice } = useSetting("download_price");
  const { data: downloadPriceEnabled } = useSetting("download_price_enabled");
  const { data: subMonthlyPrice } = useSetting("subscription_monthly_price");
  const { data: subYearlyPrice } = useSetting("subscription_yearly_price");
  const { data: subEnabled } = useSetting("subscription_enabled");

  // Local form state
  const [formState, setFormState] = useState<Record<string, string>>({});

  const getVal = (key: string, dbVal: string | undefined) =>
    formState[key] !== undefined ? formState[key] : (dbVal || "");

  const setVal = (key: string, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      for (const s of settings) {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", s.key)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("site_settings")
            .update({ value: s.value })
            .eq("key", s.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("site_settings")
            .insert({ key: s.key, value: s.value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-setting"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const handleSaveAdsense = () => {
    saveMutation.mutate([
      { key: "adsense_publisher_id", value: getVal("adsense_publisher_id", adsenseId) },
      { key: "adsense_enabled", value: getVal("adsense_enabled", adsenseEnabled) },
    ]);
  };

  const handleSaveDownload = () => {
    saveMutation.mutate([
      { key: "download_price", value: getVal("download_price", downloadPrice) },
      { key: "download_price_enabled", value: getVal("download_price_enabled", downloadPriceEnabled) },
    ]);
  };

  const handleSaveSubscription = () => {
    saveMutation.mutate([
      { key: "subscription_monthly_price", value: getVal("subscription_monthly_price", subMonthlyPrice) },
      { key: "subscription_yearly_price", value: getVal("subscription_yearly_price", subYearlyPrice) },
      { key: "subscription_enabled", value: getVal("subscription_enabled", subEnabled) },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">Monetization</h2>
      </div>

      <Tabs defaultValue="adsense" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="adsense" className="gap-1.5 text-xs">
            <Code2 className="h-3.5 w-3.5" /> AdSense
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1.5 text-xs">
            <Crown className="h-3.5 w-3.5" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="downloads" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Downloads
          </TabsTrigger>
        </TabsList>

        {/* Google AdSense */}
        <TabsContent value="adsense">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google AdSense</CardTitle>
              <CardDescription>
                Add your Google AdSense publisher ID to display ads on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="adsense-toggle">Enable AdSense ads</Label>
                <Switch
                  id="adsense-toggle"
                  checked={getVal("adsense_enabled", adsenseEnabled) === "true"}
                  onCheckedChange={(v) => setVal("adsense_enabled", v ? "true" : "false")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adsense-id">Publisher ID</Label>
                <Input
                  id="adsense-id"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={getVal("adsense_publisher_id", adsenseId)}
                  onChange={(e) => setVal("adsense_publisher_id", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find your publisher ID in your{" "}
                  <a href="https://www.google.com/adsense" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Google AdSense dashboard
                  </a>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  AdSense ads will appear in banner positions across the site. Make sure your site complies with AdSense policies before enabling.
                </p>
              </div>
              <Button onClick={handleSaveAdsense} disabled={saveMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Save AdSense Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tiers */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Premium Subscriptions</CardTitle>
              <CardDescription>
                Configure subscription pricing for premium features (powered by Stripe)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sub-toggle">Enable premium subscriptions</Label>
                <Switch
                  id="sub-toggle"
                  checked={getVal("subscription_enabled", subEnabled) === "true"}
                  onCheckedChange={(v) => setVal("subscription_enabled", v ? "true" : "false")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-price">Monthly Price (USD)</Label>
                  <Input
                    id="monthly-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="4.99"
                    value={getVal("subscription_monthly_price", subMonthlyPrice)}
                    onChange={(e) => setVal("subscription_monthly_price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearly-price">Yearly Price (USD)</Label>
                  <Input
                    id="yearly-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="39.99"
                    value={getVal("subscription_yearly_price", subYearlyPrice)}
                    onChange={(e) => setVal("subscription_yearly_price", e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Premium features include ad-free listening, unlimited downloads, and early access to new releases. Payments are processed via Stripe.
                </p>
              </div>
              <Button onClick={handleSaveSubscription} disabled={saveMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Save Subscription Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Download Pricing */}
        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Download Pricing</CardTitle>
              <CardDescription>
                Set a price per song download for non-premium users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dl-toggle">Enable paid downloads</Label>
                <Switch
                  id="dl-toggle"
                  checked={getVal("download_price_enabled", downloadPriceEnabled) === "true"}
                  onCheckedChange={(v) => setVal("download_price_enabled", v ? "true" : "false")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dl-price">Price per download (USD)</Label>
                <Input
                  id="dl-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.99"
                  value={getVal("download_price", downloadPrice)}
                  onChange={(e) => setVal("download_price", e.target.value)}
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  When enabled, free users will be prompted to pay before downloading. Premium subscribers always get free downloads.
                </p>
              </div>
              <Button onClick={handleSaveDownload} disabled={saveMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> Save Download Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMonetization;
