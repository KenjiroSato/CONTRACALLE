CREATE TABLE perfiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE movimientos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo TEXT NOT NULL CHECK (trim(titulo) <> ''),
    mensaje_critico TEXT NOT NULL CHECK (trim(mensaje_critico) <> ''),
    activa BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX unica_causa_activa ON movimientos (activa) WHERE activa = true;

CREATE TABLE prendas (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    id_movimiento INT NOT NULL REFERENCES movimientos(id)
);
CREATE INDEX idx_prendas_movimiento ON prendas(id_movimiento);

CREATE TABLE pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_perfil UUID NOT NULL REFERENCES perfiles(id),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'enviado', 'cancelado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE INDEX idx_pedidos_perfil ON pedidos(id_perfil);

CREATE TABLE detalles_pedido (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    id_prenda INT NOT NULL REFERENCES prendas(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    UNIQUE(id_pedido, id_prenda)
);
CREATE INDEX idx_detalles_pedido ON detalles_pedido(id_pedido);
CREATE INDEX idx_detalles_prenda ON detalles_pedido(id_prenda);

-- PRIVILEGIOS Y SEGURIDAD
REVOKE ALL ON perfiles, movimientos, prendas, pedidos, detalles_pedido FROM anon, authenticated;
GRANT SELECT ON perfiles, movimientos, prendas, pedidos, detalles_pedido TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver movimientos activos" ON movimientos FOR SELECT TO authenticated USING (activa = true);
CREATE POLICY "ver prendas activas" ON prendas FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM movimientos m WHERE m.id = prendas.id_movimiento AND m.activa = true)
);
CREATE POLICY "perfil propio" ON perfiles FOR SELECT TO authenticated USING (id = (select auth.uid()));
CREATE POLICY "pedidos propios" ON pedidos FOR SELECT TO authenticated USING (id_perfil = (select auth.uid()));
CREATE POLICY "detalles propios" ON detalles_pedido FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM pedidos p WHERE p.id = detalles_pedido.id_pedido AND p.id_perfil = (select auth.uid()))
);

CREATE FUNCTION public.crear_perfil() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.perfiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END; $$;

CREATE TRIGGER al_crear_usuario AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.crear_perfil();