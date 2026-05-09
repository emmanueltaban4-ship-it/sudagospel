
-- 1) Guard get_artist_balance against unauthorized callers
CREATE OR REPLACE FUNCTION public.get_artist_balance(_artist_id uuid)
RETURNS TABLE(total_earned_cents bigint, total_paid_cents bigint, balance_cents bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.artists WHERE id = _artist_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(amount_cents) FROM public.artist_earnings WHERE artist_id = _artist_id), 0)::BIGINT,
    COALESCE((SELECT SUM(amount_cents) FROM public.artist_payouts  WHERE artist_id = _artist_id), 0)::BIGINT,
    COALESCE((SELECT SUM(amount_cents) FROM public.artist_earnings WHERE artist_id = _artist_id), 0)::BIGINT
    - COALESCE((SELECT SUM(amount_cents) FROM public.artist_payouts WHERE artist_id = _artist_id), 0)::BIGINT;
END;
$function$;

-- 2) Restrict email-assets bucket upload policy to admins only
DROP POLICY IF EXISTS "Admins can upload email assets" ON storage.objects;
CREATE POLICY "Admins can upload email assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets'
  AND public.has_role(auth.uid(), 'admin')
);

-- Also add admin update/delete policies so admins can manage the bucket
DROP POLICY IF EXISTS "Admins can update email assets" ON storage.objects;
CREATE POLICY "Admins can update email assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete email assets" ON storage.objects;
CREATE POLICY "Admins can delete email assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets' AND public.has_role(auth.uid(), 'admin'));

-- 3) Fix mutable search_path on email queue helper functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END;
$function$;
