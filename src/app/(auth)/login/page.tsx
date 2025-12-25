'use client';

import { useState, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { loginAction, magicLinkAction, signUpAction, type AuthState } from './actions';

const initialState: AuthState = { error: null, success: null };

export default function LoginPage() {
    const [mode, setMode] = useState<'login' | 'magic-link'>('login');
    const router = useRouter();

    // React 19: useActionState for form state management
    const [loginState, loginFormAction, isLoginPending] = useActionState(loginAction, initialState);
    const [magicLinkState, magicLinkFormAction, isMagicLinkPending] = useActionState(magicLinkAction, initialState);
    const [signUpState, signUpFormAction, isSignUpPending] = useActionState(signUpAction, initialState);

    // Handle state changes with effects
    useEffect(() => {
        if (loginState.error) {
            toast.error(loginState.error);
        } else if (loginState.success === 'login') {
            toast.success('Connexion réussie !');
            router.push('/');
            router.refresh();
        }
    }, [loginState, router]);

    useEffect(() => {
        if (magicLinkState.error) {
            toast.error(magicLinkState.error);
        } else if (magicLinkState.success === 'magic-link') {
            toast.success('Lien magique envoyé ! Vérifiez votre boîte mail.');
        }
    }, [magicLinkState]);

    useEffect(() => {
        if (signUpState.error) {
            toast.error(signUpState.error);
        } else if (signUpState.success === 'signup') {
            toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
        }
    }, [signUpState]);

    const isLoading = isLoginPending || isMagicLinkPending || isSignUpPending;

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
                        <form action={loginFormAction} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="email@exemple.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Mot de passe"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-aurora-violet hover:from-primary/90 hover:to-aurora-violet/90 transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isLoginPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                )}
                                Se connecter
                            </Button>
                            <Button
                                type="submit"
                                formAction={signUpFormAction}
                                variant="outline"
                                className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isSignUpPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Créer un compte
                            </Button>
                        </form>
                    ) : (
                        <form action={magicLinkFormAction} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="email@exemple.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-aurora-violet hover:from-primary/90 hover:to-aurora-violet/90 transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isMagicLinkPending ? (
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
                        disabled={isLoading}
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
