'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createClient } from '../supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithMagicLink: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    const mapSupabaseUser = (u: SupabaseUser | null): User | null => {
        if (!u || !u.email) return null;
        return {
            id: u.id,
            email: u.email,
            displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0],
            avatarUrl: u.user_metadata?.avatar_url,
        };
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(mapSupabaseUser(session?.user ?? null));
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(mapSupabaseUser(session?.user ?? null));
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error signing in:', error);
            setIsLoading(false); // Only stop loading on error, let onAuthStateChange handle success
            throw error;
        }
    }, [supabase]);

    const signInWithMagicLink = useCallback(async (email: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error sending magic link:', error);
            setIsLoading(false);
            throw error;
        }
        // For OTP, we don't necessarily get signed in immediately, so we stop loading
        setIsLoading(false);
    }, [supabase]);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Error signing out:', error);
            setIsLoading(false);
            throw error;
        }
    }, [supabase]);

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signInWithMagicLink, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
