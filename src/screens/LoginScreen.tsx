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
    onIrRegistro?: () => void;
}

export default function LoginScreen({ onIrRegistro }: Props) {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    const { login, errorInicial } = useAuth();
    const refContrasena = useRef<TextInput>(null);
    const logueando = useRef(false);

    async function handleLogin() {
        if (logueando.current) return;

        const correoLimpio = correo.trim();

        if (!correoLimpio || !contrasena) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        if (!REGEX_CORREO.test(correoLimpio)) {
            setError('Ingresa un formato de correo electrónico válido (ejemplo@dominio.com).');
            return;
        }

        if (contrasena.length < LONGITUD_MINIMA_CLAVE) {
            setError(`La contraseña debe tener al menos ${LONGITUD_MINIMA_CLAVE} caracteres.`);
            return;
        }

        logueando.current = true;
        setError(null);
        setEnviando(true);

        const mensaje = await login(correoLimpio, contrasena);

        if (mensaje) {
            setError(mensaje);
            setEnviando(false);
            logueando.current = false;
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
                    <Text style={styles.lema}>La ropa también es protesta.</Text>

                    <View style={styles.formulario}>
                        <Text style={styles.invitacion}>Iniciar sesión</Text>
                        {errorInicial ? <Mensaje titulo="Atención" detalle={errorInicial} error /> : null}
                        {error ? <Mensaje titulo="Validación de acceso" detalle={error} error /> : null}

                        <CampoTexto
                            placeholder="Correo electrónico"
                            value={correo}
                            onChangeText={setCorreo}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            textContentType="emailAddress"
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
                            autoComplete="password"
                            textContentType="password"
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                        <Boton titulo="Entrar" onPress={handleLogin} cargando={enviando} />

                        {onIrRegistro ? (
                            <View style={styles.bloqueSecundario}>
                                <Boton
                                    titulo="Crear cuenta nueva"
                                    variante="secundario"
                                    onPress={onIrRegistro}
                                />
                            </View>
                        ) : null}
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
    formulario: {},
    invitacion: { ...texto.subtitulo, marginBottom: espacio.m },
    bloqueSecundario: { marginTop: espacio.m },
});