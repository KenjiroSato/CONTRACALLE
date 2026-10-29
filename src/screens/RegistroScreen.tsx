import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TextInput } from 'react-native';
import { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colores, espacio, texto } from '../theme';
import CampoTexto from '../components/CampoTexto';
import Boton from '../components/Boton';
import Mensaje from '../components/Mensaje';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LONGITUD_MINIMA_CLAVE = 6;

interface Props {
    onIrLogin: () => void;
}

export default function RegistroScreen({ onIrLogin }: Props) {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const { registro } = useAuth();
    const refContrasena = useRef<TextInput>(null);
    const refConfirmacion = useRef<TextInput>(null);
    const registrando = useRef(false);

    async function handleRegistro() {
        if (registrando.current) return;

        const correoLimpio = correo.trim();

        if (!correoLimpio || !contrasena || !confirmacion) {
            setError('Completa todos los campos para registrarte.');
            return;
        }

        if (!REGEX_CORREO.test(correoLimpio)) {
            setError('Ingresa un correo electrónico válido (ejemplo@dominio.com).');
            return;
        }

        if (contrasena.length < LONGITUD_MINIMA_CLAVE) {
            setError(`La contraseña debe tener mínimo ${LONGITUD_MINIMA_CLAVE} caracteres.`);
            return;
        }

        if (contrasena !== confirmacion) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        registrando.current = true;
        setError(null);
        setExito(null);
        setEnviando(true);

        const resultado = await registro(correoLimpio, contrasena);

        if (resultado.error) {
            setError(resultado.error);
            setEnviando(false);
            registrando.current = false;
            return;
        }

        if (resultado.mensajeConfirmacion) {
            setExito(resultado.mensajeConfirmacion);
            setCorreo('');
            setContrasena('');
            setConfirmacion('');
            setEnviando(false);
            registrando.current = false;
        }
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
                    <Text style={styles.marca}>CONTRACALLE</Text>
                    <Text style={styles.lema}>Registro de nuevos clientes.</Text>

                    <View>
                        <Text style={styles.invitacion}>Crear cuenta</Text>
                        {error ? <Mensaje titulo="No pudimos registrarte" detalle={error} error /> : null}
                        {exito ? <Mensaje titulo="Registro completado" detalle={exito} /> : null}

                        <CampoTexto
                            placeholder="Correo electrónico"
                            value={correo}
                            onChangeText={setCorreo}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            returnKeyType="next"
                            onSubmitEditing={() => refContrasena.current?.focus()}
                        />
                        <CampoTexto
                            ref={refContrasena}
                            placeholder="Contraseña (mín. 6 caracteres)"
                            value={contrasena}
                            onChangeText={setContrasena}
                            secureTextEntry
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={() => refConfirmacion.current?.focus()}
                        />
                        <CampoTexto
                            ref={refConfirmacion}
                            placeholder="Confirmar contraseña"
                            value={confirmacion}
                            onChangeText={setConfirmacion}
                            secureTextEntry
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={handleRegistro}
                        />

                        <Boton titulo="Registrarme" onPress={handleRegistro} cargando={enviando} />

                        <View style={styles.bloqueSecundario}>
                            <Boton
                                titulo="Ya tengo cuenta (Volver)"
                                variante="secundario"
                                onPress={onIrLogin}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: { flex: 1, backgroundColor: colores.asfalto },
    contenido: { flexGrow: 1, justifyContent: 'center', padding: espacio.l },
    marca: { ...texto.titulo, fontSize: 40, color: colores.hueso },
    lema: { ...texto.cuerpo, marginTop: espacio.s, marginBottom: espacio.xl },
    invitacion: { ...texto.subtitulo, marginBottom: espacio.m },
    bloqueSecundario: { marginTop: espacio.m },
});