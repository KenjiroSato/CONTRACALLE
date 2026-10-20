import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';
import { colores } from './src/theme';

const tema = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: colores.asfalto, card: colores.asfalto, primary: colores.rojo },
};

// Decide qué navegador mostrar según la sesión de Supabase.
function Raiz() {
    const { session, cargando } = useAuth();

    // Espera a conocer la sesión para no mostrar el Login un instante a quien ya había entrado.
    if (cargando) {
        return (
            <View style={{ flex: 1, backgroundColor: colores.asfalto, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colores.rojo} />
            </View>
        );
    }

    return (
        <NavigationContainer theme={tema}>
            {session ? <MainTabs /> : <AuthStack />}A
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <AuthProvider>
                <Raiz />
            </AuthProvider>
        </SafeAreaProvider>
    );
}
