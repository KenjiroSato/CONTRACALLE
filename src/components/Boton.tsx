import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colores, borde } from '../theme';

interface BotonProps {
    titulo: string;
    onPress: () => void;
    variante?: 'primario' | 'secundario';
    cargando?: boolean;
}

export default function Boton({ titulo, onPress, variante = 'primario', cargando = false }: BotonProps) {
    const primario = variante === 'primario';

    return (
        <TouchableOpacity
            style={[styles.boton, primario ? styles.primario : styles.secundario]}
            onPress={onPress}
            disabled={cargando}
            activeOpacity={0.7}
        >
            {cargando ? (
                <ActivityIndicator color={primario ? colores.hueso : colores.rojo} />
            ) : (
                <Text style={[styles.texto, { color: primario ? colores.hueso : colores.rojo }]}>{titulo}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    boton: {
        borderWidth: borde.grosor,
        borderColor: colores.rojo,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    primario: { backgroundColor: colores.rojo },
    secundario: { backgroundColor: 'transparent' },
    texto: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});
