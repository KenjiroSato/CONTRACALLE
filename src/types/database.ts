export interface Perfil {
    id: string;
    email: string;
    rol: 'cliente' | 'admin';
    fecha_registro: string;
}

export interface Movimiento {
    id: number;
    titulo: string;
    mensaje_critico: string;
    activa: boolean;
}

export interface Prenda {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    stock: number;
    id_movimiento: number;
}
