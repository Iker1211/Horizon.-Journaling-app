-- ==============================================================================
-- 2027 PLATFORM — SUPABASE POSTGRESQL SCHEMA CON SEGURIDAD RLS ESTRICTA
-- Grandes Temas como Wrappers para Blog Entries y Milestones
-- ==============================================================================

-- 1. Tabla de Grandes Temas (Wrappers)
CREATE TABLE IF NOT EXISTS public.big_themes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT NOT NULL,
  icon TEXT DEFAULT 'Target',
  target_goals_2027 TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'alta',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabla de Entradas de Bitácora / Blog
-- El campo theme_id es la Foreign Key que conecta cada entrada a su Gran Tema (Wrapper)
CREATE TABLE IF NOT EXISTS public.blog_entries (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  content TEXT NOT NULL,
  theme_id TEXT NOT NULL REFERENCES public.big_themes(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  milestone_achieved TEXT,
  read_time_minutes INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla de Hitos y Checkpoints hacia 2027
CREATE TABLE IF NOT EXISTS public.milestones_2027 (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  target_date TEXT NOT NULL,
  theme_id TEXT REFERENCES public.big_themes(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Cada usuario únicamente puede leer, crear, modificar y eliminar sus propios datos
-- ==============================================================================

ALTER TABLE public.big_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones_2027 ENABLE ROW LEVEL SECURITY;

-- Políticas para big_themes
CREATE POLICY "Users can manage their own themes"
  ON public.big_themes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para blog_entries
CREATE POLICY "Users can manage their own blog entries"
  ON public.blog_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para milestones_2027
CREATE POLICY "Users can manage their own milestones"
  ON public.milestones_2027
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_big_themes_user ON public.big_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_entries_user ON public.blog_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_entries_theme ON public.blog_entries(theme_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user ON public.milestones_2027(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_theme ON public.milestones_2027(theme_id);
