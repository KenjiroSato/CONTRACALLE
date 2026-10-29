import { View, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colores, borde, espacio, texto } from '../theme';
import Boton from '../components/Boton';
import Mensaje from '../components/Mensaje';

export default function PerfilScreen() {
    const { session, perfil, esAdmin, logout } = useAuth();
    const [cerrando, setCerrando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogout() {
        setCerrando(true);
        setError(null);
        const msg = await logout();
        if (msg) {
            setError(msg);
            setCerrando(false);
        }
    }

    return (
        <SafeAreaView style={styles.fondo} edges={['top']}>
            <View style={styles.contenedor}>
                <Text style={styles.titulo}>MI PERFIL</Text>

                {error ? <Mensaje titulo="Error" detalle={error} error /> : null}

                <View style={styles.tarjeta}>
                    <Text style={texto.nota}>CORREO ELECTRÓNICO</Text>
                    <Text style={styles.valor}>{perfil?.email ?? session?.user.email ?? 'Sin correo'}</Text>

                    <Text style={[texto.nota, { marginTop: espacio.m }]}>ROL ASIGNADO</Text>
                    <View style={[styles.badgeRol, esAdmin && styles.badgeAdmin]}>
                        <Text style={[styles.textoRol, esAdmin && styles.textoRolAdmin]}>
                            {esAdmin ? 'ADMINISTRADOR' : 'CLIENTE'}
                        </Text>
                    </View>

                    <Text style={[texto.nota, { marginTop: espacio.m }]}>PERMISOS ACTIVOS</Text>
                    <Text style={styles.permisos}>
                        {esAdmin
                            ? 'Gestión total del catálogo (Crear, Editar, Eliminar prendas) y control global de estados de pedidos.'
                            : 'Exploración de catálogo, uso del carrito de compras y seguimiento/cancelación de pedidos propios.'}
                    </Text>
                </View>

                <Boton
                    titulo="Cerrar Sesión"
                    variante="secundario"
                    onPress={handleLogout}
                    cargando={cerrando}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    contenedor: { flex: 1, padding: espacio.m },
    titulo: { ...texto.titulo, fontSize: 26, marginBottom: espacio.l },
    tarjeta: {
        backgroundColor: colores.asfaltoClaro,
        borderWidth: borde.grosor,
        borderColor: colores.hueso,
        padding: espacio.l,
        marginBottom: espacio.l,
    },
    valor: { ...texto.subtitulo, fontSize: 16, marginTop: espacio.xs },
    badgeRol: {
        alignSelf: 'flex-start',
        backgroundColor: colores.hueso,
        paddingHorizontal: espacio.m,
        paddingVertical: espacio.xs,
        marginTop: espacio.xs,
    },
    badgeAdmin: {
        backgroundColor: colores.rojoFondo,
    },
    textoRol: {
        color: colores.asfalto,
        fontWeight: '900',
        fontSize: 13,
    },
    textoRolAdmin: {
        color: colores.hueso,
    },
    permisos: {
        ...texto.cuerpo,
        color: colores.gris,
        marginTop: espacio.xs,
        lineHeight: 20,
    },
});