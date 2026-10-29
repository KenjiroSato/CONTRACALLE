import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colores, borde, espacio, texto } from '../theme';
import type { Prenda } from '../types/database';

interface Props {
    prenda: Prenda;
    esAdmin: boolean;
    cantidadEnCarrito: number;
    onAgregar: (prenda: Prenda) => void;
    onEditar: (prenda: Prenda) => void;
    onEliminar: (prenda: Prenda) => void;
}

export default function TarjetaPrenda({
    prenda,
    esAdmin,
    cantidadEnCarrito,
    onAgregar,
    onEditar,
    onEliminar,
}: Props) {
    const agotado = prenda.stock === 0;
    const limiteAlcanzado = cantidadEnCarrito >= prenda.stock;

    return (
        <View style={[styles.tarjeta, agotado && styles.tarjetaAgotada]}>
            <View style={styles.contenedorImagen}>
                <View style={styles.imagenPlaceholder}>
                    <Text style={styles.textoImagen}>S/N FOTO</Text>
                    <Text style={styles.stockTexto}>DISPONIBLES: {prenda.stock}</Text>
                </View>

                {agotado ? (
                    <View style={styles.badgeAgotado}>
                        <Text style={styles.textoBadge}>AGOTADO</Text>
                    </View>
                ) : cantidadEnCarrito > 0 ? (
                    <View style={styles.badgeEnCarrito}>
                        <Text style={styles.textoBadgeCarrito}>EN CARRITO: {cantidadEnCarrito}</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={1}>{prenda.nombre}</Text>
                <Text style={styles.descripcion} numberOfLines={2}>
                    {prenda.descripcion ?? 'Sin descripción'}
                </Text>

                <Text style={styles.precio}>
                    ${Number(prenda.precio).toLocaleString('es-CO')}
                </Text>

                {/* Acción disponible para comprar */}
                <TouchableOpacity
                    style={[
                        styles.botonAgregar,
                        (agotado || limiteAlcanzado) && styles.botonAgregarDeshabilitado,
                    ]}
                    onPress={() => onAgregar(prenda)}
                    disabled={agotado || limiteAlcanzado}
                >
                    <Text style={styles.textoBotonAgregar}>
                        {agotado
                            ? 'SIN STOCK'
                            : limiteAlcanzado
                            ? 'MÁX. EN CARRITO'
                            : '+ AGREGAR AL CARRITO'}
                    </Text>
                </TouchableOpacity>

                {/* Controles exclusivos del rol ADMIN */}
                {esAdmin ? (
                    <View style={styles.accionesAdmin}>
                        <TouchableOpacity
                            style={styles.botonEditar}
                            onPress={() => onEditar(prenda)}
                        >
                            <Text style={styles.textoBotonEditar}>EDITAR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.botonBorrar}
                            onPress={() => onEliminar(prenda)}
                        >
                            <Text style={styles.textoBotonBorrar}>X</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tarjeta: {
        flex: 1,
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        marginBottom: espacio.m,
        marginHorizontal: espacio.xs,
    },
    tarjetaAgotada: {
        opacity: 0.75,
        borderColor: colores.gris,
    },
    contenedorImagen: {
        height: 120,
        backgroundColor: '#2A2A2A',
        position: 'relative',
    },
    imagenPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoImagen: {
        color: colores.gris,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    stockTexto: {
        color: colores.hueso,
        fontSize: 11,
        fontWeight: '700',
        marginTop: espacio.xs,
    },
    badgeAgotado: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colores.rojoFondo,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    textoBadge: {
        color: colores.hueso,
        fontSize: 10,
        fontWeight: '900',
    },
    badgeEnCarrito: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colores.hueso,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },
    textoBadgeCarrito: {
        color: colores.asfalto,
        fontSize: 10,
        fontWeight: '900',
    },
    info: {
        padding: espacio.s,
    },
    nombre: {
        ...texto.subtitulo,
        fontSize: 15,
        marginBottom: espacio.xs,
    },
    descripcion: {
        ...texto.cuerpo,
        color: colores.gris,
        fontSize: 12,
        marginBottom: espacio.s,
        minHeight: 32,
    },
    precio: {
        color: colores.rojoTexto,
        fontSize: 16,
        fontWeight: '900',
        marginBottom: espacio.s,
    },
    botonAgregar: {
        backgroundColor: colores.rojoFondo,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colores.hueso,
    },
    botonAgregarDeshabilitado: {
        backgroundColor: colores.asfalto,
        borderColor: colores.gris,
    },
    textoBotonAgregar: {
        color: colores.hueso,
        fontSize: 11,
        fontWeight: '900',
    },
    accionesAdmin: {
        flexDirection: 'row',
        gap: espacio.xs,
        marginTop: espacio.s,
    },
    botonEditar: {
        flex: 1,
        backgroundColor: colores.hueso,
        paddingVertical: 6,
        alignItems: 'center',
    },
    textoBotonEditar: {
        color: colores.asfalto,
        fontSize: 11,
        fontWeight: '900',
    },
    botonBorrar: {
        backgroundColor: colores.rojoFondo,
        paddingHorizontal: 10,
        paddingVertical: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBotonBorrar: {
        color: colores.hueso,
        fontSize: 11,
        fontWeight: '900',
    },
});