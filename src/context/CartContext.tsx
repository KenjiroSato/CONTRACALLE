import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import type { ItemCarrito, Prenda } from '../types/database';
import { useAuth } from './AuthContext';

interface CartContextType {
    items: ItemCarrito[];
    totalUnidades: number;
    precioTotal: number;
    agregarPrenda: (prenda: Prenda) => string | null;
    cambiarCantidad: (idPrenda: number, delta: number) => string | null;
    quitarPrenda: (idPrenda: number) => void;
    vaciarCarrito: () => void;
    sincronizarConCatalogo: (catalogo: Prenda[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth();
    const [items, setItems] = useState<ItemCarrito[]>([]);

    // Limpia el carrito automáticamente si cambia el usuario o se cierra sesión
    useEffect(() => {
        setItems([]);
    }, [session?.user?.id]);

    function agregarPrenda(prenda: Prenda): string | null {
        if (prenda.stock <= 0) {
            return 'Esta prenda está agotada.';
        }

        const existente = items.find((i) => i.prenda.id === prenda.id);
        const cantidadActual = existente ? existente.cantidad : 0;

        if (cantidadActual + 1 > prenda.stock) {
            return `Solo hay ${prenda.stock} unidades disponibles de "${prenda.nombre}".`;
        }

        setItems((prev) => {
            const idx = prev.findIndex((i) => i.prenda.id === prenda.id);
            if (idx >= 0) {
                const copia = [...prev];
                copia[idx] = { prenda, cantidad: copia[idx].cantidad + 1 };
                return copia;
            }
            return [...prev, { prenda, cantidad: 1 }];
        });

        return null;
    }

    function cambiarCantidad(idPrenda: number, delta: number): string | null {
        const item = items.find((i) => i.prenda.id === idPrenda);
        if (!item) return null;

        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > item.prenda.stock) {
            return `Stock máximo alcanzado (${item.prenda.stock} unidades).`;
        }

        if (nuevaCantidad <= 0) {
            quitarPrenda(idPrenda);
            return null;
        }

        setItems((prev) =>
            prev.map((i) => (i.prenda.id === idPrenda ? { ...i, cantidad: nuevaCantidad } : i))
        );
        return null;
    }

    function quitarPrenda(idPrenda: number) {
        setItems((prev) => prev.filter((i) => i.prenda.id !== idPrenda));
    }

    function vaciarCarrito() {
        setItems([]);
    }

    function sincronizarConCatalogo(catalogo: Prenda[]) {
        setItems((prev) =>
            prev
                .map((item) => {
                    const actualizada = catalogo.find((p) => p.id === item.prenda.id);
                    if (!actualizada || actualizada.stock <= 0) return null;
                    return {
                        prenda: actualizada,
                        cantidad: Math.min(item.cantidad, actualizada.stock),
                    };
                })
                .filter((i): i is ItemCarrito => i !== null)
        );
    }

    const totalUnidades = useMemo(
        () => items.reduce((acc, item) => acc + item.cantidad, 0),
        [items]
    );

    const precioTotal = useMemo(
        () => items.reduce((acc, item) => acc + Number(item.prenda.precio) * item.cantidad, 0),
        [items]
    );

    return (
        <CartContext.Provider
            value={{
                items,
                totalUnidades,
                precioTotal,
                agregarPrenda,
                cambiarCantidad,
                quitarPrenda,
                vaciarCarrito,
                sincronizarConCatalogo,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart debe usarse dentro de un CartProvider');
    return context;
}