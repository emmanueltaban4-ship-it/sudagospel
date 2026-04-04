import { Check, Crown, Music, Heart, Zap, Download, Shield, Star, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription, TIERS, DONATION_PRICE_ID } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscribed, currentTier, checkout, manageSubscription, refresh, loading } = useSubscription();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! Your subscription is being activated.");
      refresh();
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Payment was canceled.");
    }
  }, [searchParams, refresh]);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      await checkout(priceId, mode);
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
  };

  const handleManage = async () => {
    try {
      await manageSubscription();
    } catch {
      toast.error("Failed to open subscription management.");
    }
  };

  const plans = [
    {
      key: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Enjoy gospel music with basic features",
      icon: Music,
      features: [
        "Stream approved songs",
        "Create playlists",
        "Browse artists & news",
        "Basic search",
      ],
      cta: "Current Plan",
      disabled: true,
      highlight: false,
    },
    {
      key: "premium_monthly",
      name: "Premium",
      price: "$4.99",
      period: "/month",
      description: "Unlock the full Sudagospel experience",
      icon: Crown,
      features: [
        "Everything in Free",
        "Unlimited downloads",
        "Ad-free experience",
        "Early access to new releases",
        "Exclusive premium content",
        "High quality audio",
      ],
      cta: currentTier?.product_id === TIERS.premium_monthly.product_id ? "Current Plan" : "Get Premium",
      disabled: currentTier?.product_id === TIERS.premium_monthly.product_id,
      highlight: true,
      priceId: TIERS.premium_monthly.price_id,
      annualPrice: "$49.99/year",
      annualPriceId: TIERS.premium_annual.price_id,
    },
    {
      key: "artist_pro",
      name: "Artist Pro",
      price: "$9.99",
      period: "/month",
      description: "Everything artists need to grow",
      icon: Star,
      features: [
        "Everything in Premium",
        "Unlimited song uploads",
        "Verified artist badge",
        "Analytics dashboard",
        "Priority support",
        "Featured placement eligibility",
      ],
      cta: currentTier?.product_id === TIERS.artist_pro.product_id ? "Current Plan" : "Go Pro",
      disabled: currentTier?.product_id === TIERS.artist_pro.product_id,
      highlight: false,
      priceId: TIERS.artist_pro.price_id,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" /> Upgrade Your Experience
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Support South Sudanese gospel music while unlocking premium features
            </p>
          </div>

          {/* Active subscription banner */}
          {subscribed && currentTier && (
            <div className="mb-8 p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    You&apos;re on the {currentTier.name} plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is active
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleManage}>
                Manage Subscription
              </Button>
            </div>
          )}

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan) => (
              <Card
                key={plan.key}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                  plan.highlight
                    ? "border-2 border-primary shadow-primary/10 shadow-lg scale-[1.02]"
                    : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.annualPrice && (
                    <p className="text-center text-sm text-muted-foreground mb-4">
                      or{" "}
                      <button
                        onClick={() => handleCheckout(plan.annualPriceId!)}
                        className="text-primary underline hover:no-underline"
                      >
                        {plan.annualPrice}
                      </button>{" "}
                      (save 17%)
                    </p>
                  )}
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={plan.disabled || loading}
                    onClick={() => plan.priceId && handleCheckout(plan.priceId)}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Donation Section */}
          <div className="max-w-xl mx-auto text-center">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <Heart className="w-10 h-10 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Support the Mission</h2>
              <p className="text-muted-foreground mb-6">
                Make a one-time donation to support South Sudanese gospel artists and the platform
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCheckout(DONATION_PRICE_ID, "payment")}
                disabled={loading}
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Heart className="w-4 h-4 mr-2" />
                Donate $1.00
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;
