'use client';

import { useState } from 'react';
import { User, Rss, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileForm } from '@/components/settings/profile-form';
import { TechWatchSettings } from '@/components/settings/tech-watch-settings';

type Tab = 'profile' | 'tech-watch';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profil', icon: <User className="h-4 w-4" /> },
    { id: 'tech-watch', label: 'Tech Watch', icon: <Rss className="h-4 w-4" /> },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    return (
        <div className="space-y-6">
            {/* Header with Aurora accent */}
            <div className="relative">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-aurora-violet/20 to-aurora-magenta/20 text-aurora-violet border border-aurora-violet/20">
                        <Settings className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                        <p className="text-muted-foreground">
                            Gérez votre profil et vos préférences
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs with Aurora styling */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-white/[0.05] w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-primary/20 to-aurora-violet/20 text-primary shadow-sm border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-2xl">
                {activeTab === 'profile' && <ProfileForm />}
                {activeTab === 'tech-watch' && <TechWatchSettings />}
            </div>
        </div>
    );
}
