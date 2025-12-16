import { LucideIcon } from 'lucide-react';
import { ComponentType, LazyExoticComponent } from 'react';

export interface ModuleConfig {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    route: string;
    enabled: boolean;
    component: LazyExoticComponent<ComponentType>;
    category?: 'ai' | 'ml' | 'automation' | 'other';
    tags?: string[];
}

export interface ModuleRegistry {
    modules: ModuleConfig[];
    getModule: (id: string) => ModuleConfig | undefined;
    getEnabledModules: () => ModuleConfig[];
    getModulesByCategory: (category: ModuleConfig['category']) => ModuleConfig[];
}
