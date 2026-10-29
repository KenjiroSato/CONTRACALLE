import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colores, borde, espacio, texto } from '../theme';
import type { EstadoPedido, PedidoVista } from '../types/database';
import Boton from '../components/Boton';
import Mensaje from '../components/Mensaje';

const ESTADOS_ADMIN: EstadoPedido[] = ['pendiente', 'pagado', 'enviado'];

export default function CarritoScreen() {
    const { esAdmin } = useAuth();
    const {
        items,
        totalUnidades,
        precioTotal,
        cambiarCantidad,
        quitarPrenda,
        vaciarCarrito,
    } = useCart();

    const [pedidos, setPedidos] = useState<PedidoVista[]>([]);
    const [cargandoPedidos, setCargandoPedidos] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [procesandoCompra, setProcesandoCompra] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);

    const cargarPedidos = useCallback(async () => {
        try {
            const { data, error: errDb } = await supabase
                .from('pedidos')
                .select(`
                    id,
                    id_perfil,
                    total,
                    estado,
                    fecha_creacion,
                    perfiles ( email ),
                    detalles_pedido (
                        id,
                        id_prenda,
                        cantidad,
                        precio_unitario,
                        prendas ( nombre )
                    )
                `)
                .order('fecha_creacion', { ascending: false });

            if (errDb) throw errDb;

            const mapeados: PedidoVista[] = (data ?? []).map((fila: any) => {
                const relPerfil = Array.isArray(fila.perfiles) ? fila.perfiles[0] : fila.perfiles;
                const detallesRaw = Array.isArray(fila.detalles_pedido) ? fila.detalles_pedido : [];

                return {
                    id: String(fila.id),
                    id_perfil: String(fila.id_perfil),
                    email_cliente: relPerfil?.email ?? null,
                    total: Number(fila.total),
                    estado: fila.estado as EstadoPedido,
                    fecha_creacion: String(fila.fecha_creacion),
                    detalles: detallesRaw.map((d: any) => {
                        const relPrenda = Array.isArray(d.prendas) ? d.prendas[0] : d.prendas;
                        return {
                            id: Number(d.id),
                            id_prenda: Number(d.id_prenda),
                            cantidad: Number(d.cantidad),
                            precio_unitario: Number(d.precio_unitario),
                            nombre_prenda: relPrenda?.nombre ?? `Prenda #${d.id_prenda}`,
                        };
                    }),
                };
            });

            setPedidos(mapeados);
        } catch (err) {
            if (__DEV__) console.warn('Error cargando pedidos:', err);
            setError('No pudimos cargar el historial de pedidos.');
        } finally {
            setCargandoPedidos(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void cargarPedidos();
        }, [cargarPedidos])
    );

    async function refrescar() {
        setRefrescando(true);
        await cargarPedidos();
        setRefrescando(false);
    }

    function ajustarCantidad(idPrenda: number, delta: number) {
        setError(null);
        const msg = cambiarCantidad(idPrenda, delta);
        if (msg) setError(msg);
    }

    async function confirmarPedido() {
        if (items.length === 0 || procesandoCompra) return;
        setProcesandoCompra(true);
        setError(null);
        setExito(null);

        try {
            const payload = items.map((i) => ({
                id_prenda: i.prenda.id,
                cantidad: i.cantidad,
            }));

            const { error: errRpc } = await supabase.rpc('crear_pedido', {
                p_items: payload,
            });

            if (errRpc) throw errRpc;

            vaciarCarrito();
            setExito('¡Pedido confirmado! El stock fue actualizado.');
            await cargarPedidos();
        } catch (err: any) {
            if (__DEV__) console.warn('Error confirmando pedido:', err);
            setError(err?.message ?? 'No se pudo procesar tu pedido.');
        } finally {
            setProcesandoCompra(false);
        }
    }

    async function cancelarPedido(idPedido: string) {
        setError(null);
        setExito(null);
        try {
            const { error: errRpc } = await supabase.rpc('cancelar_pedido', {
                p_id_pedido: idPedido,
            });
            if (errRpc) throw errRpc;
            setExito('Pedido cancelado y unidades devueltas al stock.');
            await cargarPedidos();
        } catch (err: any) {
            if (__DEV__) console.warn('Error cancelando pedido:', err);
            setError(err?.message ?? 'No se pudo cancelar el pedido.');
        }
    }

    async function cambiarEstadoAdmin(idPedido: string, nuevoEstado: EstadoPedido) {
        if (!esAdmin) return;
        setError(null);
        setExito(null);
        try {
            const { error: errUpdate } = await supabase
                .from('pedidos')
                .update({ estado: nuevoEstado })
                .eq('id', idPedido);

            if (errUpdate) throw errUpdate;
            setExito(`Estado actualizado a ${nuevoEstado.toUpperCase()}.`);
            await cargarPedidos();
        } catch (err) {
            if (__DEV__) console.warn('Error cambiando estado:', err);
            setError('No se pudo actualizar el estado del pedido.');
        }
    }

    async function eliminarPedidoCancelado(idPedido: string) {
        setError(null);
        setExito(null);
        try {
            const { error: errDel } = await supabase
                .from('pedidos')
                .delete()
                .eq('id', idPedido);

            if (errDel) throw errDel;
            setExito('Registro de pedido eliminado.');
            await cargarPedidos();
        } catch (err) {
            if (__DEV__) console.warn('Error eliminando pedido:', err);
            setError('No se pudo eliminar el pedido.');
        }
    }

    return (
        <SafeAreaView style={styles.fondo} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.contenedor}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.rojoAcento} />}
            >
                <Text style={styles.tituloPantalla}>CARRITO DE COMPRAS</Text>

                {error ? <Mensaje titulo="Atención" detalle={error} error /> : null}
                {exito ? <Mensaje titulo="Operación exitosa" detalle={exito} /> : null}

                {/* SECCIÓN 1: CARRITO ACTUAL Y PRECIO TOTAL */}
                {items.length === 0 ? (
                    <Mensaje
                        titulo="Tu carrito está vacío"
                        detalle="Agrega prendas disponibles desde el catálogo en Home."
                    />
                ) : (
                    <View style={styles.bloqueCarrito}>
                        {items.map((item) => {
                            const subtotal = Number(item.prenda.precio) * item.cantidad;
                            return (
                                <View key={item.prenda.id} style={styles.filaItem}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.nombreItem}>{item.prenda.nombre}</Text>
                                        <Text style={texto.nota}>
                                            ${Number(item.prenda.precio).toLocaleString('es-CO')} c/u
                                        </Text>
                                        <Text style={styles.subtotalItem}>
                                            Subtotal: ${subtotal.toLocaleString('es-CO')}
                                        </Text>
                                    </View>

                                    <View style={styles.controlesCantidad}>
                                        <TouchableOpacity
                                            style={styles.botonCantidad}
                                            onPress={() => ajustarCantidad(item.prenda.id, -1)}
                                        >
                                            <Text style={styles.textoBotonCantidad}>-</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.numeroCantidad}>{item.cantidad}</Text>

                                        <TouchableOpacity
                                            style={styles.botonCantidad}
                                            onPress={() => ajustarCantidad(item.prenda.id, 1)}
                                        >
                                            <Text style={styles.textoBotonCantidad}>+</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.botonQuitar}
                                            onPress={() => quitarPrenda(item.prenda.id)}
                                        >
                                            <Text style={styles.textoQuitar}>X</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}

                        <View style={styles.resumenTotal}>
                            <View style={styles.filaResumen}>
                                <Text style={texto.cuerpo}>Prendas seleccionadas:</Text>
                                <Text style={texto.subtitulo}>{totalUnidades}</Text>
                            </View>
                            <View style={styles.filaResumen}>
                                <Text style={texto.subtitulo}>PRECIO TOTAL:</Text>
                                <Text style={styles.precioTotalGrande}>
                                    ${precioTotal.toLocaleString('es-CO')}
                                </Text>
                            </View>

                            <Boton
                                titulo="Confirmar Pedido"
                                onPress={confirmarPedido}
                                cargando={procesandoCompra}
                            />
                            <View style={{ height: espacio.s }} />
                            <Boton
                                titulo="Vaciar Carrito"
                                variante="secundario"
                                onPress={vaciarCarrito}
                            />
                        </View>
                    </View>
                )}

                {/* SECCIÓN 2: PEDIDOS (PROPIOS PARA CLIENTE / GLOBALES PARA ADMIN) */}
                <Text style={styles.tituloSeccion}>
                    {esAdmin ? 'GESTIÓN GLOBAL DE PEDIDOS (ADMIN)' : 'MIS PEDIDOS REALIZADOS'}
                </Text>

                {cargandoPedidos ? (
                    <ActivityIndicator size="large" color={colores.rojoAcento} style={{ marginTop: espacio.m }} />
                ) : pedidos.length === 0 ? (
                    <Mensaje titulo="Sin pedidos registrados" detalle="Aún no se han generado compras." />
                ) : (
                    pedidos.map((pedido) => (
                        <View key={pedido.id} style={styles.tarjetaPedido}>
                            <View style={styles.cabeceraPedido}>
                                <View>
                                    <Text style={texto.nota}>
                                        {new Date(pedido.fecha_creacion).toLocaleDateString('es-CO')}
                                    </Text>
                                    {esAdmin && pedido.email_cliente ? (
                                        <Text style={styles.clienteEmail}>{pedido.email_cliente}</Text>
                                    ) : null}
                                </View>
                                <View style={styles.badgeEstado}>
                                    <Text style={styles.textoEstado}>{pedido.estado.toUpperCase()}</Text>
                                </View>
                            </View>

                            {pedido.detalles.map((det) => (
                                <Text key={det.id} style={styles.lineaDetalle}>
                                    • {det.cantidad}x {det.nombre_prenda} ($
                                    {det.precio_unitario.toLocaleString('es-CO')})
                                </Text>
                            ))}

                            <Text style={styles.totalPedido}>
                                Total pagado: ${pedido.total.toLocaleString('es-CO')}
                            </Text>

                            {/* Acciones para Cliente: Solo cancelar si está pendiente */}
                            {!esAdmin && pedido.estado === 'pendiente' ? (
                                <TouchableOpacity
                                    style={styles.botonCancelarPedido}
                                    onPress={() => cancelarPedido(pedido.id)}
                                >
                                    <Text style={styles.textoAccionBlanco}>CANCELAR PEDIDO</Text>
                                </TouchableOpacity>
                            ) : null}

                            {/* Acciones para Admin: Cambiar estados o eliminar cancelados */}
                            {esAdmin ? (
                                <View style={styles.panelAdminPedido}>
                                    <View style={styles.filaBotonesEstado}>
                                        {ESTADOS_ADMIN.map((est) => (
                                            <TouchableOpacity
                                                key={est}
                                                style={[
                                                    styles.chipEstadoAdmin,
                                                    pedido.estado === est && styles.chipEstadoActivo,
                                                ]}
                                                onPress={() => cambiarEstadoAdmin(pedido.id, est)}
                                                disabled={pedido.estado === 'cancelado'}
                                            >
                                                <Text
                                                    style={[
                                                        styles.textoChipAdmin,
                                                        pedido.estado === est && styles.textoChipAdminActivo,
                                                    ]}
                                                >
                                                    {est.toUpperCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.filaAccionesPeligro}>
                                        {pedido.estado !== 'cancelado' ? (
                                            <TouchableOpacity
                                                style={styles.botonCancelarPedido}
                                                onPress={() => cancelarPedido(pedido.id)}
                                            >
                                                <Text style={styles.textoAccionBlanco}>ANULAR Y DEVOLVER STOCK</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.botonCancelarPedido}
                                                onPress={() => eliminarPedidoCancelado(pedido.id)}
                                            >
                                                <Text style={styles.textoAccionBlanco}>ELIMINAR REGISTRO</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    contenedor: { padding: espacio.m, paddingBottom: espacio.xl },
    tituloPantalla: { ...texto.titulo, fontSize: 26, marginBottom: espacio.m },
    tituloSeccion: { ...texto.subtitulo, marginTop: espacio.l, marginBottom: espacio.m },
    bloqueCarrito: { marginBottom: espacio.m },
    filaItem: {
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.m,
        marginBottom: espacio.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: { flex: 1, marginRight: espacio.s },
    nombreItem: { ...texto.subtitulo, fontSize: 15, marginBottom: 4 },
    subtotalItem: { color: colores.rojoTexto, fontWeight: '800', fontSize: 14, marginTop: 4 },
    controlesCantidad: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
    botonCantidad: {
        backgroundColor: colores.hueso,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBotonCantidad: { color: colores.asfalto, fontWeight: '900', fontSize: 18 },
    numeroCantidad: { color: colores.hueso, fontWeight: '900', minWidth: 24, textAlign: 'center' },
    botonQuitar: {
        backgroundColor: colores.rojoFondo,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: espacio.xs,
    },
    textoQuitar: { color: colores.hueso, fontWeight: '900', fontSize: 13 },
    resumenTotal: {
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.rojoAcento,
        padding: espacio.m,
        marginTop: espacio.s,
    },
    filaResumen: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: espacio.m,
    },
    precioTotalGrande: { color: colores.rojoTexto, fontSize: 24, fontWeight: '900' },
    tarjetaPedido: {
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.gris,
        padding: espacio.m,
        marginBottom: espacio.m,
    },
    cabeceraPedido: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: espacio.s,
    },
    clienteEmail: { color: colores.hueso, fontSize: 13, fontWeight: '700', marginTop: 2 },
    badgeEstado: {
        backgroundColor: colores.hueso,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    textoEstado: { color: colores.asfalto, fontSize: 11, fontWeight: '900' },
    lineaDetalle: { ...texto.cuerpo, fontSize: 13, marginBottom: 4 },
    totalPedido: {
        color: colores.rojoTexto,
        fontWeight: '900',
        fontSize: 16,
        marginTop: espacio.s,
    },
    panelAdminPedido: { marginTop: espacio.m },
    filaBotonesEstado: { flexDirection: 'row', gap: espacio.xs, marginBottom: espacio.s },
    chipEstadoAdmin: {
        flex: 1,
        borderWidth: 2,
        borderColor: colores.gris,
        paddingVertical: 6,
        alignItems: 'center',
    },
    chipEstadoActivo: {
        backgroundColor: colores.hueso,
        borderColor: colores.hueso,
    },
    textoChipAdmin: { color: colores.hueso, fontSize: 10, fontWeight: '800' },
    textoChipAdminActivo: { color: colores.asfalto },
    filaAccionesPeligro: { marginTop: espacio.xs },
    botonCancelarPedido: {
        backgroundColor: colores.rojoFondo,
        paddingVertical: 8,
        alignItems: 'center',
        marginTop: espacio.s,
    },
    textoAccionBlanco: { color: colores.hueso, fontSize: 11, fontWeight: '900' },
});