import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabsParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import PerfilScreen from '../screens/PerfilScreen';
import { colores, borde } from '../theme';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colores.rojo,
                tabBarInactiveTintColor: colores.gris,
                tabBarIconStyle: { display: 'none' },
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                },
                tabBarStyle: {
                    backgroundColor: colores.asfalto,
                    borderTopWidth: borde.grosor,
                    borderTopColor: colores.hueso,
                },
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
    );
}
