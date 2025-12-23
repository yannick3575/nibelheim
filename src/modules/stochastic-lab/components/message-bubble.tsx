'use client';

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { User, Bot, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/stochastic-lab/types';
import { SimulationResult } from './simulation-result';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MessageBubbleProps {
  message: ChatMessage;
  onRunSimulation?: () => void;
  isSimulationRunning?: boolean;
}

// Parse content for LaTeX and render appropriately
function renderContent(content: string) {
  // Split by block math ($$...$$) and inline math ($...$)
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  // First, handle block math
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match;

  const tempParts: { type: 'text' | 'blockmath'; content: string }[] = [];

  while ((match = blockMathRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tempParts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    tempParts.push({ type: 'blockmath', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    tempParts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // Now process each part for inline math
  for (const part of tempParts) {
    if (part.type === 'blockmath') {
      parts.push(
        <div key={keyIndex++} className="my-4 overflow-x-auto">
          <BlockMath math={part.content} />
        </div>
      );
    } else {
      // Handle inline math in text
      const inlineRegex = /\$([^$]+)\$/g;
      let textLastIndex = 0;
      let inlineMatch;
      const textContent = part.content;

      while ((inlineMatch = inlineRegex.exec(textContent)) !== null) {
        if (inlineMatch.index > textLastIndex) {
          parts.push(
            <span key={keyIndex++}>
              {renderTextWithNewlines(textContent.slice(textLastIndex, inlineMatch.index))}
            </span>
          );
        }
        parts.push(
          <InlineMath key={keyIndex++} math={inlineMatch[1].trim()} />
        );
        textLastIndex = inlineMatch.index + inlineMatch[0].length;
      }
      if (textLastIndex < textContent.length) {
        parts.push(
          <span key={keyIndex++}>
            {renderTextWithNewlines(textContent.slice(textLastIndex))}
          </span>
        );
      }
    }
  }

  return parts.length > 0 ? parts : content;
}

function renderTextWithNewlines(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onRunSimulation,
  isSimulationRunning,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const renderedContent = useMemo(
    () => renderContent(message.content),
    [message.content]
  );

  const Icon = isUser ? User : isSystem ? Info : Bot;

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            isSystem
              ? 'bg-muted text-muted-foreground'
              : 'bg-gradient-to-br from-aurora-violet/20 to-aurora-magenta/20 text-aurora-violet'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}

      <Card
        className={cn(
          'max-w-[85%] p-4',
          isUser
            ? 'bg-primary/10 border-primary/30'
            : isSystem
            ? 'bg-muted/50 border-muted'
            : 'glass-vision border-aurora-violet/20'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {renderedContent}
        </div>

        {/* Simulation Result */}
        {message.simulation?.result && (
          <div className="mt-4">
            <SimulationResult result={message.simulation.result} />
          </div>
        )}

        {/* Pending Simulation */}
        {message.simulation && message.simulation.status === 'pending' && onRunSimulation && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onRunSimulation}
              disabled={isSimulationRunning}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-gradient-to-r from-aurora-violet to-aurora-magenta',
                'hover:from-aurora-violet/90 hover:to-aurora-magenta/90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-white'
              )}
            >
              {isSimulationRunning ? 'En cours...' : 'Lancer la simulation'}
            </button>
          </div>
        )}

        {/* Running Simulation */}
        {message.simulation?.status === 'running' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-aurora-violet border-t-transparent rounded-full animate-spin" />
            Simulation en cours...
          </div>
        )}

        {/* Error */}
        {message.simulation?.status === 'error' && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            Erreur : {message.simulation.error || 'Échec de la simulation'}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </Card>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});
