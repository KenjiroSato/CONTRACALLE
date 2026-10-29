import { useState } from 'react';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';

export default function AuthStack() {
    const [vista, setVista] = useState<'login' | 'registro'>('login');

    if (vista === 'registro') {
        return <RegistroScreen onIrLogin={() => setVista('login')} />;
    }

    return <LoginScreen onIrRegistro={() => setVista('registro')} />;
}