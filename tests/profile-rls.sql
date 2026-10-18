\set ON_ERROR_STOP on

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) <> 2 THEN
    RAISE EXCEPTION 'Profile trigger did not create one profile per user';
  END IF;
END;
$$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

UPDATE public.profiles
SET display_name = 'Cuenta uno', bio = 'Privado', cycle_start_date = DATE '2026-10-17', avatar_character = 'penguin'
WHERE id = '11111111-1111-4111-8111-111111111111';

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) <> 1 THEN
    RAISE EXCEPTION 'A user can read another profile';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '22222222-2222-4222-8222-222222222222') THEN
    RAISE EXCEPTION 'Cross-user profile read was allowed';
  END IF;
END;
$$;

UPDATE public.profiles SET display_name = 'Ataque' WHERE id = '22222222-2222-4222-8222-222222222222';
UPDATE public.profiles SET avatar_character = 'bear' WHERE id = '22222222-2222-4222-8222-222222222222';
DO $$
BEGIN
  IF FOUND THEN
    RAISE EXCEPTION 'Cross-user profile update was allowed';
  END IF;
  IF (SELECT avatar_character FROM public.profiles WHERE id = '11111111-1111-4111-8111-111111111111') <> 'penguin' THEN
    RAISE EXCEPTION 'The owner character choice was not saved';
  END IF;
  BEGIN
    UPDATE public.profiles SET avatar_character = 'not-an-animal' WHERE id = '11111111-1111-4111-8111-111111111111';
    RAISE EXCEPTION 'An invalid character was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;

INSERT INTO storage.objects (bucket_id, name, owner_id)
VALUES ('avatars', '11111111-1111-4111-8111-111111111111/avatar.webp', '11111111-1111-4111-8111-111111111111');

DO $$
BEGIN
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner_id)
    VALUES ('avatars', '22222222-2222-4222-8222-222222222222/avatar.webp', '11111111-1111-4111-8111-111111111111');
    RAISE EXCEPTION 'Cross-user avatar insert was allowed';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE name = '11111111-1111-4111-8111-111111111111/avatar.webp') THEN
    RAISE EXCEPTION 'Cross-user avatar read was allowed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '11111111-1111-4111-8111-111111111111') THEN
    RAISE EXCEPTION 'A second user can read the first user character';
  END IF;
END;
$$;

RESET ROLE;

DO $$
BEGIN
  IF (SELECT display_name FROM public.profiles WHERE id = '22222222-2222-4222-8222-222222222222') = 'Ataque' THEN
    RAISE EXCEPTION 'Cross-user profile update was allowed';
  END IF;
  IF (SELECT avatar_character FROM public.profiles WHERE id = '22222222-2222-4222-8222-222222222222') IS NOT NULL THEN
    RAISE EXCEPTION 'Cross-user character update was allowed';
  END IF;
END;
$$;
