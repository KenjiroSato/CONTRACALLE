import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { colores, borde, espacio, texto } from '../theme';
import type { Perfil } from '../types/database';
import Boton from '../components/Boton';
import Mensaje from '../components/Mensaje';

export default function PerfilScreen() {
    const { session, logout } = useAuth();
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saliendo, setSaliendo] = useState(false);

    useEffect(() => {
        if (!session?.user.id) return;

        let activo = true;
        void (async () => {
            setCargando(true);
            try {
                const { data, error: errorConsulta } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (!activo) return;
                
                if (errorConsulta) {
                    setError('Error de red al cargar el perfil.');
                    return;
                }
                setError(null);
                setPerfil(data as Perfil | null);
            } catch {
                if (activo) setError('No se pudo conectar para cargar tu perfil.');
            } finally {
                if (activo) setCargando(false);
            }
        })();

        return () => { activo = false; };
    }, [session?.user.id]); // Solo se ejecuta si cambia el ID, no el token entero.

    async function handleLogout() {
        setSaliendo(true);
        const mensaje = await logout();
        if (mensaje) {
            setError(mensaje);
            setSaliendo(false);
        }
    }

    return (
        <SafeAreaView style={styles.fondo} edges={['top']}>
            <View style={styles.contenido}>
                <Text style={texto.titulo}>Perfil</Text>
                {error ? <Mensaje titulo="Algo falló" detalle={error} error /> : null}

                {cargando ? (
                    <View style={{ padding: espacio.l, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={colores.rojo} />
                    </View>
                ) : !perfil && !error ? (
                    <Mensaje titulo="Perfil inexistente" detalle="Tu usuario no tiene un perfil asociado en la base de datos." error />
                ) : perfil ? (
                    <View style={styles.caja}>
                        <Text style={texto.nota}>Correo</Text>
                        <Text style={styles.valor}>{session?.user.email ?? '—'}</Text>
                        <Text style={[texto.nota, { marginTop: espacio.m }]}>Rol</Text>
                        <Text style={styles.valor}>{perfil.rol}</Text>
                    </View>
                ) : null}

                <Boton titulo="Cerrar sesión" onPress={handleLogout} variante="secundario" cargando={saliendo} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    contenido: { flex: 1, padding: espacio.l },
    caja: {
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.m,
        marginVertical: espacio.l,
    },
    valor: { ...texto.subtitulo, marginTop: espacio.xs },
});