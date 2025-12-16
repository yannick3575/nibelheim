import { FlaskConical } from 'lucide-react';
import { ModuleConfig } from '@/types/modules';
import { lazy } from 'react';

const TemplateComponent = lazy(() => import('./index'));

export const config: Omit<ModuleConfig, 'component'> & { component: typeof TemplateComponent } = {
    id: 'template',
    name: 'Module Template',
    description: 'Template pour créer de nouveaux modules',
    icon: FlaskConical,
    route: '/template',
    enabled: false, // Disabled by default
    component: TemplateComponent,
    category: 'other',
    tags: ['template', 'dev'],
};
