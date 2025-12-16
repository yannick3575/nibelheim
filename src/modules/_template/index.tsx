'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Module Template
 * 
 * Copy this entire folder to create a new module:
 * 1. Duplicate _template folder with your module name
 * 2. Update config.ts with your module's metadata
 * 3. Build your module UI in index.tsx
 * 4. Register in src/modules/registry.ts
 */
export default function TemplateModule() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Module Template</h1>
                <p className="text-muted-foreground">
                    Template de base pour créer de nouveaux modules
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                    <CardDescription>Comment créer un nouveau module</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Dupliquez le dossier <code className="text-foreground">_template</code></li>
                        <li>Renommez avec le nom de votre module (ex: <code className="text-foreground">my-module</code>)</li>
                        <li>Mettez à jour <code className="text-foreground">config.ts</code> avec les métadonnées</li>
                        <li>Construisez votre UI dans <code className="text-foreground">index.tsx</code></li>
                        <li>Enregistrez dans <code className="text-foreground">src/modules/registry.ts</code></li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
