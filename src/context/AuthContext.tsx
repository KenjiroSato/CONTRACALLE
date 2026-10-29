import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import type { Perfil } from '../types/database';

interface ResultadoRegistro {
    error: string | null;
    mensajeConfirmacion: string | null;
}

interface AuthContextType {
    session: Session | null;
    perfil: Perfil | null;
    esAdmin: boolean;
    cargando: boolean;
    errorInicial: string | null;
    login: (correo: string, contrasena: string) => Promise<string | null>;
    registro: (correo: string, contrasena: string) => Promise<ResultadoRegistro>;
    logout: () => Promise<string | null>;
    recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [cargandoSesion, setCargandoSesion] = useState(true);
    const [cargandoPerfil, setCargandoPerfil] = useState(false);
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
                if (__DEV__) console.warn('Error recuperando sesión:', err);
                if (activo) {
                    setSession(null);
                    setErrorInicial('No pudimos recuperar tu sesión.');
                }
            })
            .finally(() => {
                if (activo) setCargandoSesion(false);
            });

        return () => {
            activo = false;
            suscripcion.subscription.unsubscribe();
        };
    }, []);

    const cargarPerfilUsuario = useCallback(async (userId: string) => {
        setCargandoPerfil(true);
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                if (__DEV__) console.warn('Error cargando perfil:', error);
                setPerfil(null);
                return;
            }
            setPerfil((data as Perfil | null) ?? null);
        } catch (err) {
            if (__DEV__) console.warn('Excepción cargando perfil:', err);
            setPerfil(null);
        } finally {
            setCargandoPerfil(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            void cargarPerfilUsuario(session.user.id);
        } else {
            setPerfil(null);
        }
    }, [session?.user?.id, cargarPerfilUsuario]);

    async function recargarPerfil() {
        if (session?.user?.id) {
            await cargarPerfilUsuario(session.user.id);
        }
    }

    async function login(correo: string, contrasena: string): Promise<string | null> {
        setErrorInicial(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: correo.trim(),
                password: contrasena,
            });

            if (error) {
                if (__DEV__) console.warn('Supabase Auth Error:', error);
                const msg = error.message.toLowerCase();

                if (msg.includes('fetch') || msg.includes('network')) {
                    return 'Error de red. Verifica tu conexión a internet.';
                }
                if (error.status === 400 && (msg.includes('invalid') || msg.includes('credentials'))) {
                    return 'Correo o contraseña incorrectos.';
                }
                if (error.status === 400 && msg.includes('email not confirmed')) {
                    return 'Debes confirmar tu correo electrónico antes de entrar.';
                }
                if (error.status === 429) {
                    return 'Demasiados intentos. Espera unos minutos.';
                }
                return 'No se pudo iniciar sesión. Verifica tus datos.';
            }
            return null;
        } catch (err) {
            if (__DEV__) console.warn('Catch login:', err);
            return 'Fallo de conexión. Revisa tu internet.';
        }
    }

    async function registro(correo: string, contrasena: string): Promise<ResultadoRegistro> {
        setErrorInicial(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: correo.trim(),
                password: contrasena,
            });

            if (error) {
                if (__DEV__) console.warn('Supabase SignUp Error:', error);
                const msg = error.message.toLowerCase();

                if (msg.includes('already registered') || msg.includes('already exists')) {
                    return { error: 'Este correo ya está registrado.', mensajeConfirmacion: null };
                }
                if (msg.includes('signups not allowed') || msg.includes('signup is disabled')) {
                    return { error: 'El registro está deshabilitado en el panel de Supabase.', mensajeConfirmacion: null };
                }
                if (error.status === 429) {
                    return { error: 'Demasiados intentos. Intenta más tarde.', mensajeConfirmacion: null };
                }
                return { error: 'No se pudo crear la cuenta. Verifica el correo ingresado.', mensajeConfirmacion: null };
            }

            if (data.user && !data.session) {
                return {
                    error: null,
                    mensajeConfirmacion: 'Cuenta creada con éxito. Revisa tu correo para confirmarla e iniciar sesión.',
                };
            }

            return { error: null, mensajeConfirmacion: null };
        } catch (err) {
            if (__DEV__) console.warn('Catch registro:', err);
            return { error: 'Fallo de red al intentar registrarte.', mensajeConfirmacion: null };
        }
    }

    async function logout(): Promise<string | null> {
        try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            return error ? 'No se pudo cerrar sesión. Inténtalo de nuevo.' : null;
        } catch (err) {
            if (__DEV__) console.warn('Catch logout:', err);
            return 'No se pudo conectar para cerrar sesión.';
        }
    }

    const cargando = cargandoSesion || (Boolean(session) && cargandoPerfil && !perfil);
    const esAdmin = perfil?.rol === 'admin';

    return (
        <AuthContext.Provider
            value={{
                session,
                perfil,
                esAdmin,
                cargando,
                errorInicial,
                login,
                registro,
                logout,
                recargarPerfil,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
}