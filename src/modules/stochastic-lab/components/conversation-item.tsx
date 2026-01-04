'use client';

import { memo } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Conversation } from '@/lib/stochastic-lab/types';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (days === 1) {
    return 'Hier';
  } else if (days < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
};

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDeleteClick,
}: ConversationItemProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all group',
        isSelected
          ? 'border-aurora-violet/50 bg-aurora-violet/10'
          : 'hover:border-border/80 hover:bg-muted/50'
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(conversation.updated_at)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Supprimer la conversation"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(conversation.id);
          }}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </Card>
  );
});
