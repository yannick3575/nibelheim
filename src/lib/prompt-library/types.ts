// ============================================
// TYPES & CONSTANTS (Safe for client import)
// ============================================

export type PromptCategory = 'coding' | 'writing' | 'analysis' | 'creative' | 'other';

export const PROMPT_CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'creative', label: 'Creative' },
  { value: 'other', label: 'Other' },
];

export const CATEGORY_COLORS: Record<PromptCategory, string> = {
  coding: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  writing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  analysis: 'bg-green-500/10 text-green-500 border-green-500/20',
  creative: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  other: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export type PromptStatus = 'draft' | 'published' | 'archived';

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  is_favorite: boolean;
  source_url?: string;
  is_automated: boolean;
  status: PromptStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptInput {
  title: string;
  content: string;
  category: PromptCategory;
  tags?: string[];
  is_favorite?: boolean;
  source_url?: string;
  is_automated?: boolean;
  status?: PromptStatus;
}

export interface UpdatePromptInput {
  title?: string;
  content?: string;
  category?: PromptCategory;
  tags?: string[];
  is_favorite?: boolean;
  source_url?: string;
  is_automated?: boolean;
  status?: PromptStatus;
}

export interface PromptFilters {
  category?: PromptCategory;
  tags?: string[];
  favorites?: boolean;
  search?: string;
  status?: PromptStatus | 'all';
}

// ============================================
// DISCOVERY SOURCE TYPES
// ============================================

export type DiscoverySourceType = 'github_raw' | 'github_api' | 'web' | 'rss';

export type DiscoverySourceCategory =
  | 'general'
  | 'coding'
  | 'writing'
  | 'creative'
  | 'analysis'
  | 'system_prompts'
  | 'other';

export interface DiscoverySource {
  id: string;
  name: string;
  description: string | null;
  url: string;
  source_type: DiscoverySourceType;
  category: DiscoverySourceCategory;
  is_enabled: boolean;
  priority: number;
  last_fetched_at: string | null;
  last_error: string | null;
  fetch_count: number;
  prompts_extracted: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscoverySourceInput {
  name: string;
  description?: string;
  url: string;
  source_type?: DiscoverySourceType;
  category?: DiscoverySourceCategory;
  is_enabled?: boolean;
  priority?: number;
}

export interface UpdateDiscoverySourceInput {
  name?: string;
  description?: string;
  url?: string;
  source_type?: DiscoverySourceType;
  category?: DiscoverySourceCategory;
  is_enabled?: boolean;
  priority?: number;
}

export const DISCOVERY_SOURCE_CATEGORIES: { value: DiscoverySourceCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'coding', label: 'Coding' },
  { value: 'writing', label: 'Writing' },
  { value: 'creative', label: 'Creative' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'system_prompts', label: 'System Prompts' },
  { value: 'other', label: 'Other' },
];

// ============================================
// VARIABLE UTILITIES (Client-safe)
// ============================================

/**
 * Extract variables from prompt content ({{variable}} pattern)
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(regex);
  const variables = Array.from(matches, (m) => m[1]);
  return Array.from(new Set(variables)); // Deduplicate
}

/**
 * Replace variables in content with provided values
 * Uses split/join to avoid regex special character issues with $
 */
export function fillVariables(content: string, values: Record<string, string>): string {
  let result = content;
  Object.entries(values).forEach(([key, value]) => {
    // Using split/join instead of replace to avoid $ special char issues
    result = result.split(`{{${key}}}`).join(value);
  });
  return result;
}
