ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso para usuarios autenticados"
ON public.proveedores;

CREATE POLICY proveedores_consultar
ON public.proveedores
FOR SELECT
TO authenticated
USING (public.mi_rol() IN ('administrador', 'empleado'));

CREATE POLICY proveedores_insertar
ON public.proveedores
FOR INSERT
TO authenticated
WITH CHECK (public.mi_rol() IN ('administrador', 'empleado'));

CREATE POLICY proveedores_actualizar
ON public.proveedores
FOR UPDATE
TO authenticated
USING (public.mi_rol() IN ('administrador', 'empleado'))
WITH CHECK (public.mi_rol() IN ('administrador', 'empleado'));

REVOKE ALL ON TABLE public.proveedores
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.proveedores
TO authenticated;

GRANT INSERT (
    razon_social,
    nombre_comercial,
    rfc,
    contacto,
    telefono,
    correo,
    direccion,
    ciudad,
    estado,
    codigo_postal,
    sitio_web,
    condiciones_pago,
    tiempo_entrega,
    observaciones,
    updated_at
)
ON public.proveedores TO authenticated;

GRANT UPDATE (
    razon_social,
    nombre_comercial,
    rfc,
    contacto,
    telefono,
    correo,
    direccion,
    ciudad,
    estado,
    codigo_postal,
    sitio_web,
    condiciones_pago,
    tiempo_entrega,
    observaciones,
    updated_at
)
ON public.proveedores TO authenticated;

CREATE OR REPLACE FUNCTION public.desactivar_proveedor(
    p_proveedor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT public.es_administrador() THEN
        RAISE EXCEPTION 'Solo un administrador puede desactivar proveedores.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.proveedores
    SET
        estatus = FALSE,
        updated_at = NOW()
    WHERE id = p_proveedor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró el proveedor solicitado.'
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.desactivar_proveedor(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.desactivar_proveedor(UUID)
TO authenticated;
