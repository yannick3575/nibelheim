'use client';

import { useState } from 'react';
import { User, Rss } from 'lucide-react';
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
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez votre profil et vos préférences
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                            "border-b-2 -mb-px",
                            activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
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
