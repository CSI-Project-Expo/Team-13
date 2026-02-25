import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);   // { id, name, email, role, reward_points }
    const [role, setRole] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('access_token'));
    const [loading, setLoading] = useState(true);

    // ── Clear everything ─────────────────────────────────────────────────────
    const clearSession = useCallback(() => {
        localStorage.removeItem('access_token');
        setUser(null);
        setRole(null);
        setToken(null);
    }, []);

    // ── Fetch /users/me and hydrate context ──────────────────────────────────
    const fetchMe = useCallback(async (accessToken) => {
        const activeToken = accessToken || token || localStorage.getItem('access_token');
        if (!activeToken) return null;

        try {
            localStorage.setItem('access_token', activeToken);
            setToken(activeToken);
            const me = await api.get('/api/v1/users/me');
            setUser(me);
            setRole(me.role);
            return me;
        } catch {
            clearSession();
            return null;
        }
    }, [token, clearSession]);

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        clearSession();
    }, [clearSession]);

    // ── On mount: restore session if token exists ────────────────────────────
    useEffect(() => {
        const restore = async () => {
            const storedToken = localStorage.getItem('access_token');
            if (storedToken) {
                await fetchMe(storedToken);
            }
            setLoading(false);
        };
        restore();
    }, [fetchMe]);

    // ── Listen for 401 events fired by api.js ────────────────────────────────
    useEffect(() => {
        const handle401 = () => {
            clearSession();
        };
        window.addEventListener('auth:unauthorized', handle401);
        return () => window.removeEventListener('auth:unauthorized', handle401);
    }, [clearSession]);

    // ── Listen for Supabase session changes ──────────────────────────────────
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.access_token) {
                    await fetchMe(session.access_token);
                } else if (event === 'SIGNED_OUT') {
                    clearSession();
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [fetchMe, clearSession]);

    const value = { user, role, token, loading, fetchMe, clearSession, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
