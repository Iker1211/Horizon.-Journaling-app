export type ClayColor = 'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'mint' | 'coral';

export interface BigTheme {
  id: string;
  name: string;
  description: string;
  color: ClayColor;
  icon: string;
  targetGoals2027: string[];
  priority: 'alta' | 'media' | 'vital';
  createdAt: string;
  updatedAt: string;
}

export type Wrapper = BigTheme;

export interface BlogEntry {
  id: string;
  title: string;
  content: string;
  summary: string;
  themeId: string; // Foreign key to BigTheme (El wrapper de cualquier cosa que escriba)
  date: string; // YYYY-MM-DD
  tags: string[];
  readTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogDraft {
  title: string;
  themeId: string;
  date: string;
  summary: string;
  content: string;
  tagsInput: string;
  savedAt: string;
}

export type ActiveTab = 'dashboard' | 'calendar' | 'themes' | 'blog' | 'editor' | 'entry' | 'design' | 'wrapper-studio';
