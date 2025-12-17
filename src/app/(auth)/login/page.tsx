'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'magic-link'>('login');
    const router = useRouter();

    // Lazy initialize Supabase client to avoid build-time errors
    const getSupabase = () => createClient();

    // Use configured site URL for redirects, fallback to current origin
    const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await getSupabase().auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success('Connexion réussie !');
            router.push('/');
            router.refresh();
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await getSupabase().auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${getSiteUrl()}/auth/callback`,
                },
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success('Lien magique envoyé ! Vérifiez votre boîte mail.');
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            toast.error('Email et mot de passe requis');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await getSupabase().auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${getSiteUrl()}/auth/callback`,
                },
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
        } catch (error) {
            toast.error('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Aurora background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
                    style={{
                        background: 'radial-gradient(circle, oklch(0.75 0.18 195 / 40%) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                        animation: 'aurora-float 20s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-25"
                    style={{
                        background: 'radial-gradient(circle, oklch(0.65 0.25 300 / 40%) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                        animation: 'aurora-float 25s ease-in-out infinite reverse',
                    }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15"
                    style={{
                        background: 'radial-gradient(circle, oklch(0.70 0.25 330 / 30%) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        animation: 'aurora-float 15s ease-in-out infinite',
                    }}
                />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(oklch(1 0 0 / 50%) 1px, transparent 1px),
                        linear-gradient(90deg, oklch(1 0 0 / 50%) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />

            <Card className="w-full max-w-md relative z-10 border-white/10 shadow-2xl shadow-black/20">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 aurora-glow rounded-xl" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-aurora-violet text-primary-foreground shadow-lg shadow-primary/30">
                                <FlaskConical className="h-7 w-7" />
                            </div>
                        </div>
                    </div>
                    <CardTitle className="text-2xl aurora-text font-bold">Nibelheim</CardTitle>
                    <CardDescription>
                        Connectez-vous à votre laboratoire d&apos;expérimentation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mode === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="email@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-aurora-violet hover:from-primary/90 hover:to-aurora-violet/90 transition-all duration-300" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                Se connecter
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                                onClick={handleSignUp}
                                disabled={isLoading}
                            >
                                Créer un compte
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="email@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-aurora-violet hover:from-primary/90 hover:to-aurora-violet/90 transition-all duration-300" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Envoyer un lien magique
                            </Button>
                        </form>
                    )}

                    <div className="relative my-4">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                            ou
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setMode(mode === 'login' ? 'magic-link' : 'login')}
                    >
                        {mode === 'login' ? (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Utiliser un lien magique
                            </>
                        ) : (
                            <>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Utiliser email / mot de passe
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
