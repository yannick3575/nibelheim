import { lazy } from 'react';
import { Rss, FlaskConical, BookText, Activity } from 'lucide-react';
import { ModuleConfig, ModuleRegistry } from '@/types/modules';

// Lazy load module components
const TechWatchModule = lazy(() => import('./tech-watch'));
const PromptLibraryModule = lazy(() => import('./prompt-library'));
const StochasticLabModule = lazy(() => import('./stochastic-lab'));
const TemplateModule = lazy(() => import('./_template'));

// Module definitions
const modules: ModuleConfig[] = [
    {
        id: 'tech-watch',
        name: 'Tech Watch',
        description: 'Veille technologique avec agent IA, résumés automatiques et mémoire sémantique',
        icon: Rss,
        route: '/tech-watch',  // This matches [moduleId] dynamic route
        enabled: true,
        component: TechWatchModule,
        category: 'ai',
        tags: ['ai', 'rss', 'summarization', 'embeddings'],
    },
    {
        id: 'prompt-library',
        name: 'Prompt Library',
        description: 'Bibliothèque de prompts réutilisables avec variables et catégorisation',
        icon: BookText,
        route: '/prompt-library',
        enabled: true,
        component: PromptLibraryModule,
        category: 'ai',
        tags: ['prompts', 'templates', 'productivity'],
    },
    {
        id: 'stochastic-lab',
        name: 'Stochastic Lab',
        description: 'Simulations probabilistes avec agent IA : Monte-Carlo, Markov, Marches Aléatoires',
        icon: Activity,
        route: '/stochastic-lab',
        enabled: true,
        component: StochasticLabModule,
        category: 'ai',
        tags: ['ai', 'statistics', 'probability', 'simulation', 'monte-carlo', 'markov'],
    },
    // Template module - disabled by default, for development reference
    {
        id: 'template',
        name: 'Module Template',
        description: 'Template pour créer de nouveaux modules',
        icon: FlaskConical,
        route: '/template',
        enabled: false,
        component: TemplateModule,
        category: 'other',
        tags: ['template', 'dev'],
    },
];

// Registry functions
function getModule(id: string): ModuleConfig | undefined {
    return modules.find((m) => m.id === id);
}

function getEnabledModules(): ModuleConfig[] {
    return modules.filter((m) => m.enabled);
}

function getModulesByCategory(category: ModuleConfig['category']): ModuleConfig[] {
    return modules.filter((m) => m.category === category && m.enabled);
}

// Export the registry
export const moduleRegistry: ModuleRegistry = {
    modules,
    getModule,
    getEnabledModules,
    getModulesByCategory,
};

export { modules };
