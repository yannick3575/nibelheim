/**
 * AI Inbox Types
 *
 * Type definitions for the AI Inbox module - a manual content capture
 * and AI analysis system with personalized recommendations.
 */

// =============================================================================
// Enums / Literal Types
// =============================================================================

/** Origin of the content item */
export type SourceType = 'youtube' | 'substack' | 'manual' | 'other';

/** Content category for organization */
export type Category = 'tools' | 'prompts' | 'tutorials' | 'news' | 'inspiration';

/** Read/archive status of an item */
export type Status = 'unread' | 'read' | 'archived';

/** User skill level for personalized analysis */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

// =============================================================================
// AI Analysis Types
// =============================================================================

/**
 * Gemini-generated analysis of a content item
 */
export interface AIAnalysis {
  /** 2-3 sentence summary of the content */
  summary: string;
  /** How actionable is this content? (1-5, 5 = highly actionable) */
  actionability: number;
  /** Technical complexity level (1-5, 5 = very complex) */
  complexity: number;
  /** Suggested project ideas based on the content */
  project_ideas: string[];
  /** How this relates to the user's current stack/projects */
  relevance_to_profile: string;
  /** AI-suggested category based on content analysis */
  suggested_category: Category;
  /** AI-suggested tags for organization */
  suggested_tags: string[];
}

// =============================================================================
// Item Types
// =============================================================================

/**
 * A content item in the AI Inbox
 */
export interface Item {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  source_type: SourceType;
  category: Category;
  status: Status;
  raw_content: string | null;
  ai_analysis: AIAnalysis | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for ai_inbox_items (matches Supabase schema)
 */
export interface ItemRow {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  source_type: string;
  category: string;
  status: string;
  raw_content: string | null;
  ai_analysis: AIAnalysis | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Settings Types
// =============================================================================

/**
 * User profile for personalized AI analysis
 */
export interface UserProfile {
  /** Technologies the user currently works with */
  current_stack: string[];
  /** Active projects the user is working on */
  current_projects: string[];
  /** User's self-assessed skill level */
  skill_level: SkillLevel;
  /** Topics and areas of interest */
  interests: string[];
}

/**
 * User settings for AI Inbox
 */
export interface Settings {
  id: string;
  user_id: string;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for ai_inbox_settings (matches Supabase schema)
 */
export interface SettingsRow {
  id: string;
  user_id: string;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// API Input Types
// =============================================================================

/**
 * Payload for creating a new inbox item
 */
export interface CreateItemInput {
  title: string;
  url?: string;
  source_type?: SourceType;
  category?: Category;
  raw_content?: string;
  tags?: string[];
}

/**
 * Payload for updating an existing inbox item
 */
export interface UpdateItemInput {
  title?: string;
  category?: Category;
  status?: Status;
  is_favorite?: boolean;
  tags?: string[];
  ai_analysis?: AIAnalysis;
  raw_content?: string;
}

/**
 * Payload for updating user settings
 */
export interface UpdateSettingsInput {
  profile: UserProfile;
}

// =============================================================================
// API Filter Types
// =============================================================================

/**
 * Query parameters for filtering inbox items
 */
export interface ItemFilters {
  status?: Status;
  category?: Category;
  source_type?: SourceType;
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Standard success response
 */
export interface SuccessResponse {
  success: true;
}

/**
 * Response from the analyze endpoint
 */
export interface AnalyzeResponse {
  success: true;
  analysis: AIAnalysis;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Type guard to check if a value is a valid SourceType
 */
export function isSourceType(value: unknown): value is SourceType {
  return (
    typeof value === 'string' &&
    ['youtube', 'substack', 'manual', 'other'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid Category
 */
export function isCategory(value: unknown): value is Category {
  return (
    typeof value === 'string' &&
    ['tools', 'prompts', 'tutorials', 'news', 'inspiration'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid Status
 */
export function isStatus(value: unknown): value is Status {
  return (
    typeof value === 'string' && ['unread', 'read', 'archived'].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid SkillLevel
 */
export function isSkillLevel(value: unknown): value is SkillLevel {
  return (
    typeof value === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(value)
  );
}

/**
 * Constants for UI display
 */
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  youtube: 'YouTube',
  substack: 'Substack',
  manual: 'Manual',
  other: 'Other',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  tools: 'Tools',
  prompts: 'Prompts',
  tutorials: 'Tutorials',
  news: 'News',
  inspiration: 'Inspiration',
};

export const STATUS_LABELS: Record<Status, string> = {
  unread: 'Unread',
  read: 'Read',
  archived: 'Archived',
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
