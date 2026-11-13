
-- =====================================================
-- GAMMA SCIENTIFIC
-- RESPALDO DE ESTRUCTURA INICIAL DE BASE DE DATOS
-- =====================================================

-- 1. TABLA CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social TEXT NOT NULL,
    rfc VARCHAR(13),
    contacto TEXT,
    telefono VARCHAR(30),
    correo TEXT,
    direccion_fiscal TEXT,
    ciudad TEXT,
    estado TEXT,
    codigo_postal VARCHAR(10),
    estatus BOOLEAN NOT NULL DEFAULT TRUE,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;


-- 2. TABLA PRODUCTOS
CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    categoria TEXT,
    unidad VARCHAR(30) DEFAULT 'Pieza',
    precio_costo NUMERIC(14,2) DEFAULT 0,
    porcentaje_utilidad NUMERIC(7,4) DEFAULT 0,
    precio_venta NUMERIC(14,2) DEFAULT 0,
    tasa_iva NUMERIC(7,4) DEFAULT 0.1600,
    proveedor TEXT,
    tiempo_entrega TEXT,
    estatus BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;


-- 3. TABLA PROVEEDORES
CREATE TABLE public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,
    rfc VARCHAR(13),
    contacto TEXT,
    telefono VARCHAR(30),
    correo TEXT,
    direccion TEXT,
    ciudad TEXT,
    estado TEXT,
    codigo_postal VARCHAR(10),
    sitio_web TEXT,
    condiciones_pago TEXT,
    tiempo_entrega TEXT,
    estatus BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Relación productos-proveedores
ALTER TABLE public.productos
ADD COLUMN proveedor_id UUID
REFERENCES public.proveedores(id)
ON DELETE SET NULL;


-- 4. TABLA COTIZACIONES
CREATE TABLE public.cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(30) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    moneda VARCHAR(3) NOT NULL DEFAULT 'MXN'
        CHECK (moneda IN ('MXN', 'USD', 'EUR')),
    vigencia_dias INTEGER DEFAULT 30,
    condiciones_pago TEXT,
    tiempo_entrega TEXT,
    estatus VARCHAR(20) NOT NULL DEFAULT 'Borrador'
        CHECK (estatus IN (
            'Borrador', 'Enviada', 'Aceptada',
            'Rechazada', 'Vencida', 'Cancelada'
        )),
    subtotal_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_partidas NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_general_porcentaje NUMERIC(7,4) NOT NULL DEFAULT 0,
    descuento_general_importe NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    version_actual INTEGER NOT NULL DEFAULT 1,
    creado_por UUID,
    actualizado_por UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. DETALLE DE COTIZACIONES
CREATE TABLE public.cotizacion_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL
        REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
    numero_partida INTEGER NOT NULL,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    clave_producto TEXT,
    descripcion TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    unidad TEXT,
    cantidad NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_porcentaje NUMERIC(7,4) NOT NULL DEFAULT 0,
    descuento_importe NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuento_general_asignado NUMERIC(14,2) NOT NULL DEFAULT 0,
    base_gravable NUMERIC(14,2) NOT NULL DEFAULT 0,
    tasa_iva NUMERIC(7,4) NOT NULL DEFAULT 0.1600,
    importe_iva NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_partida NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cotizacion_id, numero_partida),
    CHECK (descuento_porcentaje BETWEEN 0 AND 1),
    CHECK (tasa_iva BETWEEN 0 AND 1)
);


-- 6. HISTORIAL DE VERSIONES
CREATE TABLE public.cotizacion_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotizacion_id UUID NOT NULL
        REFERENCES public.cotizaciones(id),
    numero_version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    motivo_cambio TEXT,
    creado_por UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cotizacion_id, numero_version)
);


-- SEGURIDAD RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizacion_versiones ENABLE ROW LEVEL SECURITY;


-- 7. CONTROL DE FOLIOS ANUALES
CREATE TABLE public.folios (
    tipo VARCHAR(20) NOT NULL,
    anio INTEGER NOT NULL,
    ultimo_numero BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tipo, anio),
    CHECK (ultimo_numero >= 0)
);

ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;


-- 8. FUNCION PARA GENERAR FOLIOS AUTOMATICOS
CREATE OR REPLACE FUNCTION public.siguiente_folio_cotizacion(
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_numero BIGINT;
BEGIN
    INSERT INTO public.folios (tipo, anio, ultimo_numero)
    VALUES ('COT', p_anio, 1)
    ON CONFLICT (tipo, anio)
    DO UPDATE SET
        ultimo_numero = public.folios.ultimo_numero + 1,
        updated_at = NOW()
    RETURNING ultimo_numero INTO v_numero;

    RETURN 'COT-' || p_anio || '-' ||
           LPAD(v_numero::TEXT, 5, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.siguiente_folio_cotizacion(INTEGER)
FROM PUBLIC, anon, authenticated;


-- FIN DEL RESPALDO INICIAL
