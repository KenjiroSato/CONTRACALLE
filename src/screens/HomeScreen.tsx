import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabaseClient';
import { colores, borde, espacio, texto } from '../theme';
import type { Movimiento, Prenda } from '../types/database';
import TarjetaPrenda from '../components/TarjetaPrenda';
import Mensaje from '../components/Mensaje';

function CausaActiva({ movimiento }: { movimiento: Movimiento | null }) {
    if (!movimiento) {
        return <Mensaje titulo="Sin causa activa" detalle="Pronto anunciaremos la próxima colección." />;
    }
    return (
        <View style={styles.causa}>
            <Text style={texto.notaRoja}>Causa de esta colección</Text>
            <Text style={styles.causaTitulo}>{movimiento.titulo}</Text>
            <Text style={styles.causaCuerpo}>{movimiento.mensaje_critico}</Text>
        </View>
    );
}

export default function HomeScreen() {
    const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
    const [prendas, setPrendas] = useState<Prenda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        try {
            const resMov = await supabase
                .from('movimientos')
                .select('*')
                .eq('activa', true)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (resMov.error) {
                if (__DEV__) console.warn("DB Error (Campaña):", resMov.error);
                setError('No pudimos verificar la campaña. Verifica tu conexión o permisos.');
                setPrendas([]);
                return;
            }

            setMovimiento(resMov.data as Movimiento | null);
            
            if (!resMov.data) {
                setPrendas([]);
                setError(null);
                return;
            }

            const resPrendas = await supabase
                .from('prendas')
                .select('*')
                .eq('id_movimiento', resMov.data.id)
                .order('id');

            if (resPrendas.error) {
                if (__DEV__) console.warn("DB Error (Prendas):", resPrendas.error);
                setError('No pudimos cargar el catálogo. Verifica tu conexión o permisos.');
                setPrendas([]);
                return;
            }
            
            setError(null);
            setPrendas((resPrendas.data ?? []) as Prenda[]);
        } catch (err) {
            if (__DEV__) console.warn("Catch cargar Home:", err);
            setError('Fallo de red al intentar cargar el catálogo.');
            setPrendas([]);
        }
    }, []);

    useEffect(() => {
        void cargar().finally(() => setCargando(false));
    }, [cargar]);

    async function refrescar() {
        setRefrescando(true);
        try {
            await cargar();
        } finally {
            setRefrescando(false);
        }
    }

    if (cargando) {
        return (
            <View style={[styles.fondo, styles.centro]}>
                <ActivityIndicator size="large" color={colores.rojoAcento} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.fondo} edges={['top']}>
            <FlatList
                data={prendas}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => <TarjetaPrenda prenda={item} />}
                numColumns={2}
                columnWrapperStyle={styles.filaGrilla}
                contentContainerStyle={styles.lista}
                refreshing={refrescando}
                onRefresh={refrescar}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.marca}>CONTRACALLE</Text>
                        {error ? <Mensaje titulo="Algo falló" detalle={error} error /> : <CausaActiva movimiento={movimiento} />}
                        <Text style={styles.seccion}>Prendas</Text>
                    </View>
                }
                ListEmptyComponent={
                    error ? null : <Mensaje titulo="Aún no hay prendas" />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    centro: { justifyContent: 'center', alignItems: 'center' },
    lista: { padding: espacio.m },
    filaGrilla: { justifyContent: 'space-between' },
    marca: { ...texto.titulo, color: colores.hueso, marginBottom: espacio.m },
    causa: {
        backgroundColor: colores.rojoFondo,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.m,
        marginBottom: espacio.l,
    },
    causaTitulo: { ...texto.titulo, fontSize: 26, marginVertical: espacio.s, color: colores.hueso },
    causaCuerpo: { color: colores.hueso, fontSize: 15, fontWeight: '600' },
    seccion: { ...texto.subtitulo, marginBottom: espacio.m },
});