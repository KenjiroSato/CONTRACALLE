import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    session: Session | null;
    cargando: boolean;
    errorInicial: string | null;
    login: (correo: string, contrasena: string) => Promise<string | null>;
    logout: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [cargando, setCargando] = useState(true);
    const [errorInicial, setErrorInicial] = useState<string | null>(null);

    useEffect(() => {
        let activo = true;
        const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
            setSession(nuevaSesion);
        });

        void supabase.auth.getSession()
            .then(({ data, error }) => {
                if (error) throw error;
                if (activo) setSession(data.session);
            })
            .catch((err) => {
                if (__DEV__) console.warn("Error recuperando sesión:", err);
                if (activo) {
                    setSession(null);
                    setErrorInicial('No pudimos recuperar tu sesión.');
                }
            })
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => {
            activo = false;
            suscripcion.subscription.unsubscribe();
        };
    }, []);

    async function login(correo: string, contrasena: string): Promise<string | null> {
        setErrorInicial(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena });
            
            if (error) {
                if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
                    return 'Falla de red. Verifica tu conexión.';
                }
                if (error.status === 400) {
                    return 'Correo o contraseña incorrectos.';
                }
                if (__DEV__) console.warn("Error Auth Supabase:", error);
                return 'No se pudo iniciar sesión. Verifica tus datos.';
            }
            return null;
        } catch (err) {
            if (__DEV__) console.warn("Catch login:", err);
            return 'Fallo crítico. Revisa tu internet.';
        }
    }

    async function logout(): Promise<string | null> {
        try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            return error ? 'No se pudo cerrar sesión. Inténtalo de nuevo.' : null;
        } catch (err) {
            if (__DEV__) console.warn("Catch logout:", err);
            return 'No se pudo conectar para cerrar sesión.';
        }
    }

    return <AuthContext.Provider value={{ session, cargando, errorInicial, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
}