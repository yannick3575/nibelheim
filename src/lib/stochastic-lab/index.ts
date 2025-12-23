// ============================================
// STOCHASTIC LAB - SERVICE LAYER
// Server-side CRUD operations for conversations
// Uses module_data table with JSONB content
// ============================================

import { createClient } from '@/lib/supabase/server';
import type {
  Conversation,
  CreateConversationInput,
  UpdateConversationInput,
  ChatMessage,
  StochasticLabContent,
} from './types';

// Re-export types and client-safe utilities
export * from './types';
export * from './distributions';
export * from './simulations';

const MODULE_ID = 'stochastic-lab';
const DATA_TYPE = 'conversation';

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all conversations for the current user
 */
export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('module_data')
    .select('*')
    .eq('module_id', MODULE_ID)
    .eq('data_type', DATA_TYPE)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return (data || []).map(row => mapRowToConversation(row));
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(id: string): Promise<Conversation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('module_data')
    .select('*')
    .eq('id', id)
    .eq('module_id', MODULE_ID)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return mapRowToConversation(data);
}

/**
 * Create a new conversation
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<Conversation | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const content: StochasticLabContent = {
    version: '1.0',
    type: 'conversation',
    title: input.title || 'Nouvelle conversation',
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'system',
        content: 'Bienvenue dans Stochastic Lab ! Décrivez une simulation probabiliste et je vous aiderai à la concevoir et l\'exécuter. Exemples : "Estime π avec Monte-Carlo", "Simule une marche aléatoire", "Modélise une chaîne de Markov pour la météo".',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const { data, error } = await supabase
    .from('module_data')
    .insert({
      user_id: user.id,
      module_id: MODULE_ID,
      data_type: DATA_TYPE,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return mapRowToConversation(data);
}

/**
 * Update a conversation (messages or title)
 */
export async function updateConversation(
  id: string,
  updates: UpdateConversationInput
): Promise<Conversation | null> {
  const supabase = await createClient();

  // First, get the current conversation
  const { data: current, error: fetchError } = await supabase
    .from('module_data')
    .select('content')
    .eq('id', id)
    .eq('module_id', MODULE_ID)
    .single();

  if (fetchError || !current) {
    console.error('Error fetching conversation for update:', fetchError);
    return null;
  }

  const currentContent = current.content as StochasticLabContent;

  // Merge updates
  const newContent: StochasticLabContent = {
    ...currentContent,
    title: updates.title ?? currentContent.title,
    messages: updates.messages ?? currentContent.messages,
  };

  const { data, error } = await supabase
    .from('module_data')
    .update({ content: newContent })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating conversation:', error);
    return null;
  }

  return mapRowToConversation(data);
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('module_data')
    .delete()
    .eq('id', id)
    .eq('module_id', MODULE_ID);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: ChatMessage
): Promise<Conversation | null> {
  const conversation = await getConversation(conversationId);
  if (!conversation) return null;

  const updatedMessages = [...conversation.messages, message];
  return updateConversation(conversationId, { messages: updatedMessages });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ModuleDataRow {
  id: string;
  user_id: string;
  module_id: string;
  data_type: string;
  content: StochasticLabContent;
  created_at: string;
  updated_at: string;
}

function mapRowToConversation(row: ModuleDataRow): Conversation {
  const content = row.content;
  return {
    id: row.id,
    user_id: row.user_id,
    title: content.title,
    messages: content.messages || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
