'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ProfileData {
    display_name: string;
    avatar_url: string;
}

export function ProfileForm() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileData>({
        display_name: '',
        avatar_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('display_name, avatar_url')
                        .eq('id', user.id)
                        .single();

                    if (profileData) {
                        setProfile({
                            display_name: profileData.display_name || '',
                            avatar_url: profileData.avatar_url || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: profile.display_name,
                    avatar_url: profile.avatar_url
                })
                .eq('id', user.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>
                    Personnalisez les informations affichées sur votre compte
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            L&apos;email ne peut pas être modifié
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="display_name" className="text-sm font-medium">
                            Nom d&apos;affichage
                        </label>
                        <Input
                            id="display_name"
                            type="text"
                            placeholder="Votre nom"
                            value={profile.display_name}
                            onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="avatar_url" className="text-sm font-medium">
                            URL de l&apos;avatar
                        </label>
                        <Input
                            id="avatar_url"
                            type="url"
                            placeholder="https://example.com/avatar.jpg"
                            value={profile.avatar_url}
                            onChange={(e) => setProfile(p => ({ ...p, avatar_url: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lien vers une image pour votre avatar
                        </p>
                    </div>

                    {message && (
                        <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                            {message.text}
                        </p>
                    )}

                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Enregistrer
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
