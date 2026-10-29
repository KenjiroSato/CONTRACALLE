
export type RolUsuario = 'cliente' | 'admin';
export type EstadoPedido = 'pendiente' | 'pagado' | 'enviado' | 'cancelado';

export interface Perfil {
    id: string;
    email: string;
    rol: RolUsuario;
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

export interface DetallePedidoVista {
    id: number;
    id_prenda: number;
    cantidad: number;
    precio_unitario: number;
    nombre_prenda: string;
}

export interface PedidoVista {
    id: string;
    id_perfil: string;
    email_cliente: string | null;
    total: number;
    estado: EstadoPedido;
    fecha_creacion: string;
    detalles: DetallePedidoVista[];
}

export interface ItemCarrito {
    prenda: Prenda;
    cantidad: number;
}