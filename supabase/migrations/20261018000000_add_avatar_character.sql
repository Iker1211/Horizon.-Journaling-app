-- Additive: existing uploaded photos and owner-only profile policies are preserved.
ALTER TABLE public.profiles ADD COLUMN avatar_character TEXT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_character_allowed
  CHECK (avatar_character IS NULL OR avatar_character IN ('otter', 'yak', 'pterodactyl', 'bear', 'penguin'));
GRANT UPDATE (avatar_character) ON TABLE public.profiles TO authenticated;

-- Rollback (deploy the preceding frontend first):
-- ALTER TABLE public.profiles DROP COLUMN avatar_character;
