import { BookText } from 'lucide-react';
import { ModuleConfig } from '@/types/modules';
import { lazy } from 'react';

const PromptLibraryComponent = lazy(() => import('./index'));

export const config: Omit<ModuleConfig, 'component'> & {
  component: typeof PromptLibraryComponent;
} = {
  id: 'prompt-library',
  name: 'Prompt Library',
  description: 'Bibliothèque de prompts réutilisables avec variables et catégorisation',
  icon: BookText,
  route: '/prompt-library',
  enabled: true,
  component: PromptLibraryComponent,
  category: 'ai',
  tags: ['prompts', 'templates', 'productivity'],
};
