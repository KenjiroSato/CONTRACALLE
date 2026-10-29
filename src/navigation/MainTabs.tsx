import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import { CartProvider, useCart } from '../context/CartContext';
import HomeScreen from '../screens/HomeScreen';
import CarritoScreen from '../screens/CarritoScreen';
import PerfilScreen from '../screens/PerfilScreen';
import { colores, borde } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function PestanasPrincipales() {
    const { totalUnidades } = useCart();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarIcon: () => null,
                tabBarIconStyle: { display: 'none' },
                tabBarLabelStyle: {
                    fontWeight: '900',
                    fontSize: 12,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                },
                tabBarActiveTintColor: colores.rojoTexto,
                tabBarInactiveTintColor: colores.gris,
                tabBarStyle: {
                    backgroundColor: colores.asfalto,
                    borderTopWidth: borde.grosor,
                    borderTopColor: colores.hueso,
                    height: 56,
                    justifyContent: 'center',
                },
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'HOME' }} />
            <Tab.Screen
                name="Carrito"
                component={CarritoScreen}
                options={{
                    title: totalUnidades > 0 ? `CARRITO (${totalUnidades})` : 'CARRITO',
                }}
            />
            <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'PERFIL' }} />
        </Tab.Navigator>
    );
}

export default function MainTabs() {
    return (
        <CartProvider>
            <PestanasPrincipales />
        </CartProvider>
    );
}