import { View, Text, StyleSheet } from 'react-native';
import { colores, borde, espacio, texto } from '../theme';

interface MensajeProps {
    titulo: string;
    detalle?: string;
    error?: boolean;
}

// Se usa para estados de error y de lista vacía.
export default function Mensaje({ titulo, detalle, error = false }: MensajeProps) {
    return (
        <View style={[styles.caja, error && styles.cajaError]}>
            <Text style={[texto.subtitulo, error && { color: colores.rojo }]}>{titulo}</Text>
            {detalle ? <Text style={[texto.cuerpo, { marginTop: espacio.s }]}>{detalle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    caja: {
        borderWidth: borde.grosor,
        borderColor: colores.gris,
        borderStyle: 'dashed',
        padding: espacio.m,
        marginBottom: espacio.m,
    },
    cajaError: { borderColor: colores.rojo },
});
