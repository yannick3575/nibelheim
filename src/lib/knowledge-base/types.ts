// ============================================================
// TYPES & CONSTANTS (Safe for client import)
// ============================================================

export type KBEntryType = 'note' | 'bookmark' | 'snippet';

export type KBCategory = 'general' | 'engineering' | 'research' | 'reference' | 'personal';

export const KB_ENTRY_TYPES: { value: KBEntryType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'bookmark', label: 'Bookmark' },
  { value: 'snippet', label: 'Snippet' },
];

export const KB_CATEGORIES: { value: KBCategory; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'research', label: 'Research' },
  { value: 'reference', label: 'Référence' },
  { value: 'personal', label: 'Personnel' },
];

export const KB_CATEGORY_COLORS: Record<KBCategory, string> = {
  general: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  engineering: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  research: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  reference: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  personal: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const KB_TYPE_COLORS: Record<KBEntryType, string> = {
  note: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  bookmark: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  snippet: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export interface KBEntry {
  id: string;
  user_id: string;
  type: KBEntryType;
  title: string;
  content: string;
  source_url?: string | null;
  source_title?: string | null;
  code_language?: string | null;
  category: KBCategory;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateKBEntryInput {
  type: KBEntryType;
  title: string;
  content: string;
  source_url?: string;
  source_title?: string;
  code_language?: string;
  category?: KBCategory;
  tags?: string[];
  is_favorite?: boolean;
}

export interface UpdateKBEntryInput {
  title?: string;
  content?: string;
  source_url?: string | null;
  source_title?: string | null;
  code_language?: string | null;
  category?: KBCategory;
  tags?: string[];
  is_favorite?: boolean;
}

export interface KBFilters {
  type?: KBEntryType;
  category?: KBCategory;
  tags?: string[];
  favorites?: boolean;
  search?: string;
}
