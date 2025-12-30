import { Inbox } from 'lucide-react';
import { ModuleConfig } from '@/types/modules';
import { lazy } from 'react';

const AIInboxComponent = lazy(() => import('./index'));

export const config: Omit<ModuleConfig, 'component'> & {
  component: typeof AIInboxComponent;
} = {
  id: 'ai-inbox',
  name: 'AI Inbox',
  description:
    'Inbox personnalisée avec analyse IA pour contenus tech (YouTube, Substack, articles)',
  icon: Inbox,
  route: '/ai-inbox',
  enabled: true,
  component: AIInboxComponent,
  category: 'ai',
  tags: ['ai', 'inbox', 'curation', 'gemini', 'analysis'],
};
