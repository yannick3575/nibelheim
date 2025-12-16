import { Rss } from 'lucide-react';
import { ModuleConfig } from '@/types/modules';
import { lazy } from 'react';

const TechWatchComponent = lazy(() => import('./index'));

export const config: Omit<ModuleConfig, 'component'> & { component: typeof TechWatchComponent } = {
    id: 'tech-watch',
    name: 'Tech Watch',
    description: 'Veille technologique avec agent IA, résumés automatiques et mémoire sémantique',
    icon: Rss,
    route: '/tech-watch',
    enabled: true,
    component: TechWatchComponent,
    category: 'ai',
    tags: ['ai', 'rss', 'summarization', 'embeddings'],
};
