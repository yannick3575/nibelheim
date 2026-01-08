'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from './components/chat-interface';
import { ConversationSidebar } from './components/conversation-sidebar';
import type { Conversation, ChatMessage } from '@/lib/stochastic-lab/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StochasticLabModule() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/stochastic-lab/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);

      // Auto-select first conversation if none selected
      setSelectedConversationId((current) => {
        if (data.length > 0 && !current) {
          return data[0].id;
        }
        return current;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleCreateConversation = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/stochastic-lab/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nouvelle conversation' }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const newConversation = await response.json();
      setConversations((prev) => [newConversation, ...prev]);
      setSelectedConversationId(newConversation.id);
      toast.success('Conversation créée');
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/stochastic-lab/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');

      setConversations((prev) => prev.filter((c) => c.id !== id));

      // Select another conversation if the deleted one was selected
      if (selectedConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setSelectedConversationId(remaining.length > 0 ? remaining[0].id : null);
      }

      toast.success('Conversation supprimée');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleConversationUpdate = useCallback(
    async (messages: ChatMessage[]) => {
      if (!selectedConversationId) return;

      // Optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, messages, updated_at: new Date().toISOString() }
            : c
        )
      );

      // Generate title from first user message if it's a new conversation
      const firstUserMessage = messages.find((m) => m.role === 'user');
      const currentConversation = conversations.find((c) => c.id === selectedConversationId);
      const shouldUpdateTitle =
        firstUserMessage &&
        currentConversation?.title === 'Nouvelle conversation';

      const newTitle = shouldUpdateTitle
        ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : undefined;

      if (newTitle) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId ? { ...c, title: newTitle } : c
          )
        );
      }

      // Persist to database (debounced would be better, but keeping it simple)
      try {
        await fetch(`/api/stochastic-lab/conversations/${selectedConversationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            ...(newTitle && { title: newTitle }),
          }),
        });
      } catch (error) {
        console.error('Error saving conversation:', error);
        // Don't show toast for save errors to avoid spam
      }
    },
    [selectedConversationId, conversations]
  );

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-violet/20 to-aurora-magenta/20 text-aurora-violet border border-aurora-violet/20">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stochastic Lab</h1>
            <p className="text-muted-foreground">
              Simulations probabilistes avec IA
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar */}
        <div
          className={cn(
            'w-72 shrink-0 glass-vision rounded-xl border neon-border overflow-hidden transition-all',
            !isSidebarOpen && 'hidden md:block'
          )}
        >
          <ConversationSidebar
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            onCreate={handleCreateConversation}
            onDelete={handleDeleteConversation}
            isLoading={isLoading}
            isCreating={isCreating}
          />
        </div>

        {/* Chat Interface */}
        <div className="flex-1 glass-vision rounded-xl border neon-border-violet overflow-hidden min-w-0">
          <ChatInterface
            conversation={selectedConversation || null}
            onConversationUpdate={handleConversationUpdate}
          />
        </div>
      </div>
    </div>
  );
}
