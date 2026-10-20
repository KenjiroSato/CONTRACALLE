# CONTRACALLE

Tienda de ropa de estilo crítico y callejero, con una causa social ligada a cada colección.
Entrega: Fase 1 (base de datos, conexión, Login, Home y navegación).

## Stack

- React Native (Expo SDK 57) + TypeScript
- React Navigation: `native-stack` (Login) y `bottom-tabs` (Home, Perfil)
- Supabase (PostgreSQL + Auth)

## Cómo correrlo

1. Instala Node.js LTS.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env` (Windows PowerShell: `Copy-Item .env.example .env`) y completa
   `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` desde Project Settings → API.
   También se admite la clave publicable (`sb_publishable_...`). **No uses ni incluyas una clave
   `service_role` o `sb_secret_...` en la app.**
4. En el SQL Editor del proyecto Supabase, ejecuta `supabase/schema.sql` una sola vez.
5. Crea un usuario en Authentication → Users **después** de ejecutar el SQL; el trigger crea su perfil.
6. Ejecuta `npm run start` y abre la plataforma indicada por Expo. Para web usa `npm run web`.

La URL y clave publicable/anon son necesarias para conectar con Supabase. Si faltan, la app informa
qué variables configurar. `.env` está excluido de Git; no compartas ni publiques sus valores.

## Base de datos

Cinco tablas, todas con RLS activado. Esquema completo en `supabase/schema.sql`.

| Tabla | Para qué sirve |
|---|---|
| `perfiles` | Un perfil por usuario de `auth.users` (se crea con un trigger) |
| `movimientos` | Causas sociales ligadas a las colecciones |
| `prendas` | Catálogo; cada prenda pertenece a un movimiento |
| `pedidos` | Compras de cada perfil |
| `detalles_pedido` | Prendas de cada pedido (relación N:M) |

Políticas: `prendas` y `movimientos` son públicas en lectura. `perfiles` y `pedidos` solo los lee su dueño.
`detalles_pedido` se lee si el pedido padre es del usuario. Todavía no hay políticas de escritura.

## Estructura

```
App.tsx                  Decide Login o Tabs según la sesión
src/
  components/            Boton, CampoTexto, TarjetaPrenda, Mensaje
  context/               AuthContext (sesión de Supabase)
  navigation/            AuthStack, MainTabs y sus tipos
  screens/               LoginScreen, HomeScreen, PerfilScreen
  services/              supabaseClient
  theme/                 Colores, bordes y tipografía
  types/                 Interfaces de las tablas
supabase/schema.sql      Esquema, RLS, trigger y datos de prueba
```

## Limitaciones conocidas (Fase 1)

- La sesión se guarda en AsyncStorage, que no está cifrado. Se conserva esta decisión para evitar
  perder sesiones grandes al migrar a SecureStore, que está pensado para secretos pequeños. Evalúa
  almacenamiento cifrado antes de distribuir la app en producción.
- No hay pantalla de registro: los usuarios se crean desde el panel de Supabase.
- Sin políticas de escritura. En la Fase 2 los pedidos se crearán con una función de Postgres
  (precio y stock calculados en el servidor, no en la app).
- Los tipos de TypeScript están escritos a mano, no generados con la CLI de Supabase.
- `npm audit` reporta vulnerabilidades transitivas del árbol de Expo/Metro. En esta instalación,
  `npm audit fix --force` propone degradar Expo a SDK 44 y React Native a 0.72; no lo ejecutes
  como arreglo automático. Revisa los avisos al actualizar Expo a una versión compatible.
