'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './message-bubble';
import { planSimulation } from '../actions/agent';
import { useSimulationWorker } from '@/lib/stochastic-lab/useSimulationWorker';
import type { ChatMessage, Conversation, SimulationConfig } from '@/lib/stochastic-lab/types';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onConversationUpdate: (messages: ChatMessage[]) => void;
}

export function ChatInterface({
  conversation,
  onConversationUpdate,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [runningSimulationId, setRunningSimulationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Web Worker for simulations (keeps UI responsive)
  const { runSimulation, state: workerState } = useSimulationWorker();

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !conversation) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic update - add user message
    const updatedMessages = [...messages, userMessage];
    onConversationUpdate(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Call Gemini agent
      const response = await planSimulation(userMessage.content, messages);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.explanation,
        timestamp: new Date().toISOString(),
        simulation: response.simulation
          ? {
              config: response.simulation,
              status: 'pending',
            }
          : undefined,
      };

      onConversationUpdate([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date().toISOString(),
      };

      onConversationUpdate([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, conversation, messages, onConversationUpdate]);

  const handleRunSimulation = useCallback(
    async (messageId: string, config: SimulationConfig) => {
      if (runningSimulationId) return;

      setRunningSimulationId(messageId);

      // Update message status to running
      const updatedMessages = messages.map((msg) =>
        msg.id === messageId && msg.simulation
          ? { ...msg, simulation: { ...msg.simulation, status: 'running' as const } }
          : msg
      );
      onConversationUpdate(updatedMessages);

      try {
        // Execute simulation in Web Worker (non-blocking)
        const result = await runSimulation(config);

        // Update message with result
        const finalMessages = messages.map((msg) =>
          msg.id === messageId && msg.simulation
            ? {
                ...msg,
                simulation: {
                  ...msg.simulation,
                  status: 'completed' as const,
                  result,
                },
              }
            : msg
        );
        onConversationUpdate(finalMessages);
      } catch (error) {
        console.error('Simulation error:', error);

        // Update message with error
        const errorMessages = messages.map((msg) =>
          msg.id === messageId && msg.simulation
            ? {
                ...msg,
                simulation: {
                  ...msg.simulation,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Erreur inconnue',
                },
              }
            : msg
        );
        onConversationUpdate(errorMessages);
      } finally {
        setRunningSimulationId(null);
      }
    },
    [messages, runningSimulationId, onConversationUpdate, runSimulation]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Sélectionnez ou créez une conversation pour commencer</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onRunSimulation={
              message.simulation?.status === 'pending'
                ? handleRunSimulation
                : undefined
            }
            isSimulationRunning={runningSimulationId === message.id}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>L&apos;agent réfléchit...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez votre simulation... (ex: Estime π avec 100000 points)"
            className="flex-1 min-h-[44px] max-h-[150px] resize-none bg-background/50"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-aurora-violet to-aurora-magenta hover:from-aurora-violet/90 hover:to-aurora-magenta/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Appuyez sur Entrée pour envoyer, Shift+Entrée pour un saut de ligne
        </p>
      </div>
    </div>
  );
}
