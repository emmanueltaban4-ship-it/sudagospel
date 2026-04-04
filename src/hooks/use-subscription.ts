import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const TIERS = {
  premium_monthly: {
    price_id: "price_1TIb58FQfq7mqNL4WohUC0FW",
    product_id: "prod_UH9N9fsG8t5v7W",
    name: "Premium",
    interval: "month",
    amount: 4.99,
  },
  premium_annual: {
    price_id: "price_1TIb5VFQfq7mqNL4RbP2yfo9",
    product_id: "prod_UH9OTdL12R91QB",
    name: "Premium Annual",
    interval: "year",
    amount: 49.99,
  },
  artist_pro: {
    price_id: "price_1TIb5mFQfq7mqNL4J2XX9wBV",
    product_id: "prod_UH9OvPCc2QL0X8",
    name: "Artist Pro",
    interval: "month",
    amount: 9.99,
  },
} as const;

export const DONATION_PRICE_ID = "price_1TIb63FQfq7mqNL4373KjfGE";

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: false,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, productId: null, subscriptionEnd: null, loading: false });
      return;
    }
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setState({
        subscribed: data.subscribed,
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const getCurrentTier = () => {
    if (!state.productId) return null;
    return Object.values(TIERS).find(t => t.product_id === state.productId) || null;
  };

  const checkout = async (priceId: string, mode: "subscription" | "payment" = "subscription") => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId, mode },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  const manageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  return {
    ...state,
    currentTier: getCurrentTier(),
    checkout,
    manageSubscription,
    refresh: checkSubscription,
  };
}
