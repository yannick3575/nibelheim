'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
    const [isLoading, setIsLoading] = useState(false);

    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // TODO: Implement Supabase auth
            // For now, simulate a successful login
            setUser({
                id: 'demo-user',
                email,
                displayName: email.split('@')[0],
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signInWithMagicLink = useCallback(async (email: string) => {
        setIsLoading(true);
        try {
            // TODO: Implement Supabase magic link
            console.log('Magic link sent to:', email);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            // TODO: Implement Supabase signout
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
