'use client';

import { memo } from 'react';
import { PromptCard } from './prompt-card';
import { PromptListItem } from './prompt-list-item';
import type { Prompt } from '@/lib/prompt-library/types';

interface PromptListProps {
  prompts: Prompt[];
  viewMode: 'cards' | 'list';
  onDelete: (id: string) => void;
  onUpdate: (prompt: Prompt) => void;
}

export const PromptList = memo(function PromptList({
  prompts,
  viewMode,
  onDelete,
  onUpdate
}: PromptListProps) {
  if (viewMode === 'cards') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <PromptListItem
          key={prompt.id}
          prompt={prompt}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
});
