import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colores, borde, espacio, texto } from '../theme';
import type { Prenda } from '../types/database';

interface Props {
    prenda: Prenda;
}

export default function TarjetaPrenda({ prenda }: Props) {
    const agotado = prenda.stock === 0;

    return (
        <TouchableOpacity 
            style={[styles.tarjeta, agotado && styles.tarjetaAgotada]} 
            activeOpacity={0.8}
            disabled={agotado}
        >
            {/* Espacio para la imagen que viene de Que Ropero */}
            <View style={styles.contenedorImagen}>
                {/* Por ahora un placeholder visual, luego conectaremos Supabase Storage */}
                <View style={styles.imagenPlaceholder}>
                    <Text style={styles.textoImagen}>FOTO</Text>
                </View>
                {agotado && (
                    <View style={styles.badgeAgotado}>
                        <Text style={styles.textoBadge}>AGOTADO</Text>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={1}>{prenda.nombre}</Text>
                <Text style={styles.descripcion} numberOfLines={2}>
                    {prenda.descripcion ?? 'Sin descripción'}
                </Text>
                
                <View style={styles.filaInferior}>
                    <Text style={styles.precio}>
                        ${prenda.precio.toLocaleString('es-CO')}
                    </Text>
                    {/* Botón de acción rápida típico de e-commerce web */}
                    {!agotado && (
                        <TouchableOpacity style={styles.botonMini}>
                            <Text style={styles.textoBotonMini}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
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
        overflow: 'hidden',
    },
    tarjetaAgotada: {
        opacity: 0.6,
        borderColor: colores.gris,
    },
    contenedorImagen: {
        height: 180,
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
    badgeAgotado: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: colores.rojoFondo,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    textoBadge: {
        color: colores.hueso,
        fontSize: 10,
        fontWeight: '900',
    },
    info: {
        padding: espacio.m,
    },
    nombre: {
        ...texto.subtitulo,
        fontSize: 16,
        marginBottom: espacio.xs,
    },
    descripcion: {
        ...texto.cuerpo,
        color: colores.gris,
        fontSize: 13,
        marginBottom: espacio.m,
        minHeight: 36, // Mantiene la alineación de la grilla
    },
    filaInferior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    precio: {
        color: colores.rojoTexto,
        fontSize: 18,
        fontWeight: '900',
    },
    botonMini: {
        backgroundColor: colores.hueso,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textoBotonMini: {
        color: colores.asfalto,
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 22,
    }
});