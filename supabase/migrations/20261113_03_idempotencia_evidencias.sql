-- SIGUE - Migración 03: idempotencia y evidencias de años escolares.
-- Ejecutar UNA SOLA VEZ, después de la migración 02.
-- No ejecutar de nuevo si existe sigue_operar_anio_interno(text,jsonb).
BEGIN;

-- Comprobaciones previas para impedir una ejecución parcial o duplicada.
DO $$
BEGIN
  IF to_regprocedure('public.sigue_operar_anio(text,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'Primero debe instalarse la migración 02: sigue_operar_anio(text,jsonb)';
  END IF;
  IF to_regprocedure('public.sigue_operar_anio_interno(text,jsonb)') IS NOT NULL THEN
    RAISE EXCEPTION 'La migración 03 parece instalada: existe sigue_operar_anio_interno';
  END IF;
  IF to_regclass('public.operaciones_anuales') IS NOT NULL THEN
    RAISE EXCEPTION 'La tabla operaciones_anuales ya existe: revisar antes de continuar';
  END IF;
END;
$$;

CREATE TABLE public.operaciones_anuales (
  id uuid PRIMARY KEY,
  responsable text NOT NULL REFERENCES public.usuarios(id),
  accion text NOT NULL,
  datos jsonb NOT NULL,
  resultado jsonb NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operaciones_anuales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operaciones_anuales FROM PUBLIC, anon, authenticated;

-- La implementación anterior se mantiene como función interna.
ALTER FUNCTION public.sigue_operar_anio(text,jsonb)
  RENAME TO sigue_operar_anio_interno;
REVOKE ALL ON FUNCTION public.sigue_operar_anio_interno(text,jsonb)
  FROM PUBLIC, anon, authenticated;

-- La nueva interfaz pública evita ejecutar dos veces una misma operación.
CREATE FUNCTION public.sigue_operar_anio(
  p_accion text,
  p_datos jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor text := public.sigue_actor_anios();
  previo public.operaciones_anuales%ROWTYPE;
  resultado jsonb;
  clave uuid;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Identidad institucional requerida';
  END IF;
  IF p_accion IS NULL OR btrim(p_accion) = '' THEN
    RAISE EXCEPTION 'Acción requerida';
  END IF;
  IF p_datos IS NULL OR jsonb_typeof(p_datos) <> 'object' THEN
    RAISE EXCEPTION 'Se requieren datos en formato objeto JSON';
  END IF;
  IF p_datos->>'operacion_id' IS NULL OR btrim(p_datos->>'operacion_id') = '' THEN
    RAISE EXCEPTION 'Se requiere operacion_id para permitir reintentos seguros';
  END IF;

  clave := (p_datos->>'operacion_id')::uuid;
  PERFORM pg_advisory_xact_lock(741113);

  SELECT * INTO previo
  FROM public.operaciones_anuales
  WHERE id = clave;

  IF previo.id IS NOT NULL THEN
    IF previo.responsable <> actor
       OR previo.accion <> p_accion
       OR previo.datos <> p_datos THEN
      RAISE EXCEPTION 'Identificador utilizado por otra operación';
    END IF;
    RETURN previo.resultado;
  END IF;

  resultado := public.sigue_operar_anio_interno(p_accion, p_datos);
  INSERT INTO public.operaciones_anuales(id, responsable, accion, datos, resultado)
  VALUES (clave, actor, p_accion, p_datos, resultado);
  RETURN resultado;
END;
$$;

REVOKE ALL ON FUNCTION public.sigue_operar_anio(text,jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sigue_operar_anio(text,jsonb)
  TO authenticated;

-- Evidencias anuales: bucket privado, hasta 5 MB por archivo.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias-anuales',
  'evidencias-anuales',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY evidencias_anuales_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'evidencias-anuales'
  AND public.sigue_rol_anios() IN ('Administrador','Directora')
);

CREATE POLICY evidencias_anuales_select
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'evidencias-anuales'
  AND public.sigue_rol_anios() IN ('Administrador','Directora','Secretaria')
);

COMMIT;
