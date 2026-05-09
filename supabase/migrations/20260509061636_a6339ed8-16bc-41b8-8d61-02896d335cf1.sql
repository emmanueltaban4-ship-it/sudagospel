
-- ============ STORE PRODUCTS ============
CREATE TABLE public.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'merch', -- 'album' | 'ep' | 'merch' | 'digital'
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  is_physical BOOLEAN NOT NULL DEFAULT false,
  inventory INTEGER, -- NULL = unlimited
  variants JSONB DEFAULT '[]'::jsonb, -- [{name, options:[{label,sku,price_cents}]}]
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_url TEXT, -- for digital kinds
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products viewable by all"
  ON public.store_products FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Artist manages products"
  ON public.store_products FOR ALL USING (EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Admin manages products"
  ON public.store_products FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_store_products_upd BEFORE UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORE ORDERS ============
CREATE TABLE public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  buyer_email TEXT,
  artist_id UUID NOT NULL,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | fulfilled | cancelled | refunded
  stripe_session_id TEXT UNIQUE,
  shipping_name TEXT,
  shipping_address JSONB,
  fulfillment_notes TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer views own orders" ON public.store_orders FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Artist views own orders" ON public.store_orders FOR SELECT USING (EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Admin views orders" ON public.store_orders FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Artist updates fulfillment" ON public.store_orders FOR UPDATE USING (EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Admin updates orders" ON public.store_orders FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Service inserts orders" ON public.store_orders FOR INSERT WITH CHECK (auth.role()='service_role');
CREATE TRIGGER trg_store_orders_upd BEFORE UPDATE ON public.store_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  title_snapshot TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  variant_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items follow order visibility" ON public.store_order_items FOR SELECT USING (
  EXISTS(SELECT 1 FROM store_orders o WHERE o.id=order_id AND (
    o.user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM artists a WHERE a.id=o.artist_id AND a.user_id=auth.uid())
  ))
);
CREATE POLICY "Service inserts items" ON public.store_order_items FOR INSERT WITH CHECK (auth.role()='service_role');

-- ============ ARTIST CHAT ============
CREATE TABLE public.artist_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.artist_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX ix_chat_artist_created ON public.artist_chat_messages(artist_id, created_at DESC);
CREATE POLICY "Chat visible to all" ON public.artist_chat_messages FOR SELECT USING (is_hidden=false OR auth.uid()=user_id OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Auth users post chat" ON public.artist_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Owner/artist/admin delete chat" ON public.artist_chat_messages FOR DELETE USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
CREATE POLICY "Artist/admin hide chat" ON public.artist_chat_messages FOR UPDATE USING (public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM artists a WHERE a.id=artist_id AND a.user_id=auth.uid()));
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_chat_messages;
ALTER TABLE public.artist_chat_messages REPLICA IDENTITY FULL;

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  signups_count INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "User creates own referral" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "User updates own referral" ON public.referrals FOR UPDATE USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL,
  credited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referrer sees own attributions" ON public.referral_attributions FOR SELECT USING (auth.uid()=referrer_user_id OR auth.uid()=referred_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Auth user inserts attribution" ON public.referral_attributions FOR INSERT TO authenticated WITH CHECK (auth.uid()=referred_user_id);
CREATE POLICY "Admin updates attributions" ON public.referral_attributions FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- bump signups_count on attribution insert
CREATE OR REPLACE FUNCTION public.bump_referral_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE referrals SET signups_count = signups_count + 1 WHERE user_id = NEW.referrer_user_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_referral_bump AFTER INSERT ON public.referral_attributions
  FOR EACH ROW EXECUTE FUNCTION public.bump_referral_count();

-- ============ PUSH SUBSCRIPTIONS ============
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User sees own push subs" ON public.push_subscriptions FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "User creates own push subs" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "User deletes own push subs" ON public.push_subscriptions FOR DELETE USING (auth.uid()=user_id);
CREATE POLICY "Admin reads push subs" ON public.push_subscriptions FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- ============ SETTINGS DEFAULTS ============
INSERT INTO public.site_settings(key, value) VALUES
  ('platform_fee_percent','15'),
  ('vapid_public_key','')
ON CONFLICT (key) DO NOTHING;
