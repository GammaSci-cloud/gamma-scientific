CREATE TABLE IF NOT EXISTS public.perfiles (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'empleado')),
    creado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.mi_rol()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.rol
    FROM public.perfiles AS p
    WHERE p.usuario_id = (SELECT auth.uid())
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.es_administrador()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (SELECT p.rol = 'administrador'
         FROM public.perfiles AS p
         WHERE p.usuario_id = (SELECT auth.uid())
         LIMIT 1),
        FALSE
    );
$$;

REVOKE ALL ON FUNCTION public.mi_rol() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.es_administrador() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mi_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.es_administrador() TO authenticated;

REVOKE ALL ON TABLE public.perfiles FROM anon, authenticated;
GRANT SELECT ON TABLE public.perfiles TO authenticated;

DROP POLICY IF EXISTS perfiles_consultar ON public.perfiles;

CREATE POLICY perfiles_consultar
ON public.perfiles
FOR SELECT
TO authenticated
USING (
    usuario_id = (SELECT auth.uid())
    OR (SELECT public.es_administrador())
);

INSERT INTO public.perfiles (usuario_id, rol)
SELECT id, 'administrador'
FROM auth.users
WHERE id = '3d20f7c4-94bd-49fe-9b8b-65b0b0d182ca'
ON CONFLICT (usuario_id) DO NOTHING;
