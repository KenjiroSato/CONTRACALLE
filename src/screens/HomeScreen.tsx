import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colores, borde, espacio, texto } from '../theme';
import type { Movimiento, Prenda } from '../types/database';
import TarjetaPrenda from '../components/TarjetaPrenda';
import Mensaje from '../components/Mensaje';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';

type FiltroStock = 'todas' | 'disponibles' | 'agotadas';

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
    const { esAdmin } = useAuth();
    const { items, agregarPrenda, sincronizarConCatalogo } = useCart();

    const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
    const [prendas, setPrendas] = useState<Prenda[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<FiltroStock>('todas');

    // Estados del Modal CRUD (Exclusivo Admin)
    const [modalVisible, setModalVisible] = useState(false);
    const [prendaEditando, setPrendaEditando] = useState<Prenda | null>(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [errorForm, setErrorForm] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

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
                if (__DEV__) console.warn('DB Error (Campaña):', resMov.error);
                setError('No pudimos cargar el catálogo en este momento.');
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
                .order('id', { ascending: true });

            if (resPrendas.error) {
                if (__DEV__) console.warn('DB Error (Prendas):', resPrendas.error);
                setError('No pudimos cargar las prendas en este momento.');
                setPrendas([]);
                return;
            }

            const lista = (resPrendas.data ?? []) as Prenda[];
            setError(null);
            setPrendas(lista);
            sincronizarConCatalogo(lista);
        } catch (err) {
            if (__DEV__) console.warn('Catch cargar Home:', err);
            setError('Tuvimos un problema al intentar conectar.');
            setPrendas([]);
        }
    }, [sincronizarConCatalogo]);

    useEffect(() => {
        void cargar().finally(() => setCargando(false));
    }, [cargar]);

    // Recarga el stock automáticamente al volver desde la pestaña Carrito
    useFocusEffect(
        useCallback(() => {
            void cargar();
        }, [cargar])
    );

    async function refrescar() {
        setRefrescando(true);
        setMensajeExito(null);
        try {
            await cargar();
        } finally {
            setRefrescando(false);
        }
    }

    const metricas = useMemo(() => {
        const totalModelos = prendas.length;
        const unidadesTotales = prendas.reduce((acc, p) => acc + p.stock, 0);
        const agotadas = prendas.filter((p) => p.stock === 0).length;
        return { totalModelos, unidadesTotales, agotadas };
    }, [prendas]);

    const prendasFiltradas = useMemo(() => {
        if (filtro === 'disponibles') return prendas.filter((p) => p.stock > 0);
        if (filtro === 'agotadas') return prendas.filter((p) => p.stock === 0);
        return prendas;
    }, [prendas, filtro]);

    function manejarAgregarCarrito(prenda: Prenda) {
        setError(null);
        const msgError = agregarPrenda(prenda);
        if (msgError) {
            setError(msgError);
        } else {
            setMensajeExito(`"${prenda.nombre}" agregada al carrito.`);
        }
    }

    function abrirModalCrear() {
        if (!esAdmin) return;
        setPrendaEditando(null);
        setNombre('');
        setDescripcion('');
        setPrecio('');
        setStock('');
        setErrorForm(null);
        setModalVisible(true);
    }

    function abrirModalEditar(prenda: Prenda) {
        if (!esAdmin) return;
        setPrendaEditando(prenda);
        setNombre(prenda.nombre);
        setDescripcion(prenda.descripcion ?? '');
        setPrecio(String(prenda.precio));
        setStock(String(prenda.stock));
        setErrorForm(null);
        setModalVisible(true);
    }

    async function guardarPrenda() {
        if (!esAdmin || !movimiento) return;
        const nombreLimpio = nombre.trim();
        const precioNum = Number(precio);
        const stockNum = Number(stock);

        if (!nombreLimpio) {
            setErrorForm('El nombre de la prenda es obligatorio.');
            return;
        }
        if (isNaN(precioNum) || precioNum < 0) {
            setErrorForm('Ingresa un precio válido mayor o igual a 0.');
            return;
        }
        if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
            setErrorForm('El stock debe ser un número entero mayor o igual a 0.');
            return;
        }

        setGuardando(true);
        setErrorForm(null);

        try {
            if (prendaEditando) {
                const { error: errUpdate } = await supabase
                    .from('prendas')
                    .update({
                        nombre: nombreLimpio,
                        descripcion: descripcion.trim() || null,
                        precio: precioNum,
                        stock: stockNum,
                    })
                    .eq('id', prendaEditando.id);

                if (errUpdate) throw errUpdate;
                setMensajeExito(`Prenda "${nombreLimpio}" actualizada.`);
            } else {
                const { error: errInsert } = await supabase
                    .from('prendas')
                    .insert({
                        nombre: nombreLimpio,
                        descripcion: descripcion.trim() || null,
                        precio: precioNum,
                        stock: stockNum,
                        id_movimiento: movimiento.id,
                    });

                if (errInsert) throw errInsert;
                setMensajeExito(`Prenda "${nombreLimpio}" creada en el catálogo.`);
            }

            setModalVisible(false);
            await cargar();
        } catch (err) {
            if (__DEV__) console.warn('Error guardando prenda:', err);
            setErrorForm('Acción rechazada: solo un administrador puede modificar el catálogo.');
        } finally {
            setGuardando(false);
        }
    }

    async function eliminarPrenda(prenda: Prenda) {
        if (!esAdmin) return;
        setError(null);
        setMensajeExito(null);
        try {
            const { error: errDelete } = await supabase
                .from('prendas')
                .delete()
                .eq('id', prenda.id);

            if (errDelete) {
                if (errDelete.code === '23503') {
                    setError('No se puede eliminar porque tiene pedidos registrados. Edítala y pon su stock en 0.');
                    return;
                }
                throw errDelete;
            }
            setMensajeExito(`Prenda "${prenda.nombre}" eliminada.`);
            await cargar();
        } catch (err) {
            if (__DEV__) console.warn('Error eliminando prenda:', err);
            setError('No se pudo eliminar la prenda seleccionada.');
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
                data={prendasFiltradas}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => {
                    const enCarrito = items.find((i) => i.prenda.id === item.id)?.cantidad ?? 0;
                    return (
                        <TarjetaPrenda
                            prenda={item}
                            esAdmin={esAdmin}
                            cantidadEnCarrito={enCarrito}
                            onAgregar={manejarAgregarCarrito}
                            onEditar={abrirModalEditar}
                            onEliminar={eliminarPrenda}
                        />
                    );
                }}
                numColumns={2}
                columnWrapperStyle={styles.filaGrilla}
                contentContainerStyle={styles.lista}
                refreshing={refrescando}
                onRefresh={refrescar}
                ListHeaderComponent={
                    <View>
                        <View style={styles.cabeceraMarca}>
                            <View>
                                <Text style={styles.marca}>CONTRACALLE</Text>
                                <Text style={styles.etiquetaRol}>
                                    ROL ACTIVO: {esAdmin ? 'ADMINISTRADOR' : 'CLIENTE'}
                                </Text>
                            </View>
                            {esAdmin && movimiento ? (
                                <TouchableOpacity style={styles.botonCrear} onPress={abrirModalCrear}>
                                    <Text style={styles.textoBotonCrear}>+ NUEVA PRENDA</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {error ? <Mensaje titulo="Atención" detalle={error} error /> : null}
                        {mensajeExito ? <Mensaje titulo="Listo" detalle={mensajeExito} /> : null}

                        <CausaActiva movimiento={movimiento} />

                        <View style={styles.panelMetricas}>
                            <View style={styles.cajaMetrica}>
                                <Text style={texto.nota}>MODELOS</Text>
                                <Text style={styles.valorMetrica}>{metricas.totalModelos}</Text>
                            </View>
                            <View style={styles.cajaMetrica}>
                                <Text style={texto.nota}>DISPONIBLES</Text>
                                <Text style={styles.valorMetrica}>{metricas.unidadesTotales}</Text>
                            </View>
                            <View style={styles.cajaMetrica}>
                                <Text style={texto.nota}>AGOTADAS</Text>
                                <Text style={[styles.valorMetrica, { color: colores.rojoTexto }]}>
                                    {metricas.agotadas}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.barraFiltros}>
                            {(['todas', 'disponibles', 'agotadas'] as FiltroStock[]).map((opcion) => (
                                <TouchableOpacity
                                    key={opcion}
                                    style={[styles.chipFiltro, filtro === opcion && styles.chipFiltroActivo]}
                                    onPress={() => setFiltro(opcion)}
                                >
                                    <Text style={[styles.textoChip, filtro === opcion && styles.textoChipActivo]}>
                                        {opcion.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.seccion}>Catálogo ({prendasFiltradas.length})</Text>
                    </View>
                }
                ListEmptyComponent={
                    error ? null : (
                        <Mensaje
                            titulo="No hay prendas en esta vista"
                            detalle="Prueba cambiando el filtro seleccionado."
                        />
                    )
                }
            />

            {esAdmin ? (
                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <ScrollView contentContainerStyle={styles.modalContenido} keyboardShouldPersistTaps="handled">
                            <Text style={texto.subtitulo}>
                                {prendaEditando ? 'Editar Prenda' : 'Nueva Prenda'}
                            </Text>
                            <View style={{ height: espacio.m }} />

                            {errorForm ? <Mensaje titulo="Verifica los datos" detalle={errorForm} error /> : null}

                            <CampoTexto
                                placeholder="Nombre de la prenda"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            <CampoTexto
                                placeholder="Descripción corta"
                                value={descripcion}
                                onChangeText={setDescripcion}
                            />
                            <CampoTexto
                                placeholder="Precio (ej. 85000)"
                                value={precio}
                                onChangeText={setPrecio}
                                keyboardType="numeric"
                            />
                            <CampoTexto
                                placeholder="Stock disponible (ej. 15)"
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                            />

                            <Boton
                                titulo={prendaEditando ? 'Guardar Cambios' : 'Crear Prenda'}
                                onPress={guardarPrenda}
                                cargando={guardando}
                            />
                            <View style={{ height: espacio.s }} />
                            <Boton
                                titulo="Cancelar"
                                variante="secundario"
                                onPress={() => setModalVisible(false)}
                            />
                        </ScrollView>
                    </View>
                </Modal>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    centro: { justifyContent: 'center', alignItems: 'center' },
    lista: { padding: espacio.m },
    filaGrilla: { justifyContent: 'space-between' },
    cabeceraMarca: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: espacio.m,
    },
    marca: { ...texto.titulo, color: colores.hueso, fontSize: 26 },
    etiquetaRol: { ...texto.nota, color: colores.rojoTexto, marginTop: 2 },
    botonCrear: {
        backgroundColor: colores.hueso,
        paddingHorizontal: espacio.m,
        paddingVertical: espacio.s,
    },
    textoBotonCrear: {
        color: colores.asfalto,
        fontWeight: '900',
        fontSize: 12,
    },
    causa: {
        backgroundColor: colores.rojoFondo,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.m,
        marginBottom: espacio.m,
    },
    causaTitulo: { ...texto.titulo, fontSize: 24, marginVertical: espacio.s, color: colores.hueso },
    causaCuerpo: { color: colores.hueso, fontSize: 14, fontWeight: '600' },
    panelMetricas: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: espacio.m,
        gap: espacio.s,
    },
    cajaMetrica: {
        flex: 1,
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.gris,
        padding: espacio.s,
        alignItems: 'center',
    },
    valorMetrica: {
        ...texto.subtitulo,
        fontSize: 22,
        marginTop: espacio.xs,
    },
    barraFiltros: {
        flexDirection: 'row',
        gap: espacio.s,
        marginBottom: espacio.m,
    },
    chipFiltro: {
        flex: 1,
        borderWidth: 2,
        borderColor: colores.gris,
        paddingVertical: espacio.s,
        alignItems: 'center',
    },
    chipFiltroActivo: {
        borderColor: colores.hueso,
        backgroundColor: colores.hueso,
    },
    textoChip: {
        color: colores.hueso,
        fontSize: 11,
        fontWeight: '800',
    },
    textoChipActivo: {
        color: colores.asfalto,
    },
    seccion: { ...texto.subtitulo, marginBottom: espacio.m },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: espacio.l,
    },
    modalContenido: {
        backgroundColor: colores.asfalto,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.l,
    },
});