-- Add monetization columns to artists
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS supporter_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supporter_price_cents INTEGER NOT NULL DEFAULT 299,
  ADD COLUMN IF NOT EXISTS tip_jar_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add paid download columns to songs
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS is_paid_download BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS download_price_cents INTEGER NOT NULL DEFAULT 99;

-- Earnings ledger
CREATE TABLE IF NOT EXISTS public.artist_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('tip','download','supporter')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  payer_user_id UUID,
  stripe_session_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artist_earnings_artist ON public.artist_earnings(artist_id, created_at DESC);
ALTER TABLE public.artist_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own earnings" ON public.artist_earnings FOR SELECT
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_earnings.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Admins view all earnings" ON public.artist_earnings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role inserts earnings" ON public.artist_earnings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Paid downloads (entitlements)
CREATE TABLE IF NOT EXISTS public.paid_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, song_id)
);
CREATE INDEX IF NOT EXISTS idx_paid_downloads_user ON public.paid_downloads(user_id);
ALTER TABLE public.paid_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.paid_downloads FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all purchases" ON public.paid_downloads FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role inserts purchases" ON public.paid_downloads FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Supporter subscriptions
CREATE TABLE IF NOT EXISTS public.supporter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supporter_subs_user ON public.supporter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_supporter_subs_artist ON public.supporter_subscriptions(artist_id);
ALTER TABLE public.supporter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own supporter subs" ON public.supporter_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Artists view own supporters" ON public.supporter_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = supporter_subscriptions.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Admins view all supporter subs" ON public.supporter_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role manages supporter subs" ON public.supporter_subscriptions FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_supporter_subs_updated BEFORE UPDATE ON public.supporter_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Artist payouts
CREATE TABLE IF NOT EXISTS public.artist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payout_method TEXT,
  reference TEXT,
  notes TEXT,
  paid_by UUID,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_artist_payouts_artist ON public.artist_payouts(artist_id, paid_at DESC);
ALTER TABLE public.artist_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists view own payouts" ON public.artist_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM artists WHERE artists.id = artist_payouts.artist_id AND artists.user_id = auth.uid()));
CREATE POLICY "Admins manage payouts" ON public.artist_payouts FOR ALL
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_artist_balance(_artist_id UUID)
RETURNS TABLE(total_earned_cents BIGINT, total_paid_cents BIGINT, balance_cents BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT SUM(amount_cents) FROM artist_earnings WHERE artist_id = _artist_id), 0)::BIGINT,
    COALESCE((SELECT SUM(amount_cents) FROM artist_payouts WHERE artist_id = _artist_id), 0)::BIGINT,
    COALESCE((SELECT SUM(amount_cents) FROM artist_earnings WHERE artist_id = _artist_id), 0)::BIGINT
    - COALESCE((SELECT SUM(amount_cents) FROM artist_payouts WHERE artist_id = _artist_id), 0)::BIGINT;
$$;

CREATE OR REPLACE FUNCTION public.is_song_purchased(_song_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM paid_downloads WHERE song_id = _song_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_active_supporter(_artist_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM supporter_subscriptions
    WHERE artist_id = _artist_id AND user_id = _user_id
      AND status = 'active' AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- Admin balances overview
CREATE OR REPLACE FUNCTION public.admin_artists_with_balance()
RETURNS TABLE(artist_id UUID, artist_name TEXT, avatar_url TEXT, total_earned_cents BIGINT, total_paid_cents BIGINT, balance_cents BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.id, a.name, a.avatar_url,
    COALESCE(e.total, 0)::BIGINT,
    COALESCE(p.total, 0)::BIGINT,
    (COALESCE(e.total, 0) - COALESCE(p.total, 0))::BIGINT
  FROM artists a
  LEFT JOIN (SELECT artist_id, SUM(amount_cents) total FROM artist_earnings GROUP BY artist_id) e ON e.artist_id = a.id
  LEFT JOIN (SELECT artist_id, SUM(amount_cents) total FROM artist_payouts GROUP BY artist_id) p ON p.artist_id = a.id
  WHERE has_role(auth.uid(), 'admin')
  ORDER BY (COALESCE(e.total, 0) - COALESCE(p.total, 0)) DESC;
$$;