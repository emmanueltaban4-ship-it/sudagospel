-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles: admins can read all, admins can manage
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view ALL songs (including unapproved)
DROP POLICY IF EXISTS "Approved songs viewable by everyone" ON public.songs;
CREATE POLICY "Songs viewable by everyone or admin"
  ON public.songs FOR SELECT
  USING (is_approved = true OR auth.uid() = uploaded_by OR public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any song (for approval)
CREATE POLICY "Admins can update any song"
  ON public.songs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any song
CREATE POLICY "Admins can delete any song"
  ON public.songs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any comment (moderation)
CREATE POLICY "Admins can delete any comment"
  ON public.song_comments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all downloads
CREATE POLICY "Admins can view all downloads"
  ON public.song_downloads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
-- (already public, but ensure admin sees everything)

-- Allow admins to delete artists
CREATE POLICY "Admins can delete artists"
  ON public.artists FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any artist
CREATE POLICY "Admins can update any artist"
  ON public.artists FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));