export const colores = {
    asfalto: '#121212',
    asfaltoClaro: '#1E1E1E',
    hueso: '#F2EFE6',
    rojo: '#E10600',
    rojoFondo: '#CC0000', // Para fondos con texto claro (Botón primario, Héroe) -> Pasa 5.12:1
    rojoAcento: '#E10600', // Para bordes y elementos gráficos grandes
    rojoTexto: '#FF4444', // Para texto pequeño sobre fondo oscuro (Tabs, precios, errores) -> Pasa 5.5:1
    gris: '#8A8A8A',
} as const;

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const borde = { grosor: 3, radio: 0 } as const;

export const texto = {
    titulo: { color: colores.hueso, fontSize: 32, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    subtitulo: { color: colores.hueso, fontSize: 18, fontWeight: '800', textTransform: 'uppercase' },
    cuerpo: { color: colores.hueso, fontSize: 15 },
    nota: { color: colores.gris, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    notaRoja: { color: colores.hueso, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.95 },
} as const;