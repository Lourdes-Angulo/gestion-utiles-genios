-- SIGUE | Migración 06: bloqueo temporal de edición por año escolar.
-- Requiere migración 01 y columna anios_escolares.edicion_bloqueada.
-- No crea años, no elimina datos y no modifica sigue_validar_periodo().
BEGIN;

CREATE TABLE IF NOT EXISTS public.sigue_autorizaciones_bloqueo (
  transaccion bigint PRIMARY KEY,
  anio_id uuid NOT NULL REFERENCES public.anios_escolares(id),
  nuevo_estado boolean NOT NULL
);
ALTER TABLE public.sigue_autorizaciones_bloqueo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sigue_autorizaciones_bloqueo FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.historial_bloqueos_anuales (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  anio_id uuid NOT NULL REFERENCES public.anios_escolares(id),
  bloqueado boolean NOT NULL,
  responsable text NOT NULL REFERENCES public.usuarios(id),
  fecha timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.historial_bloqueos_anuales ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.historial_bloqueos_anuales FROM PUBLIC, anon, authenticated;

-- Sólo la función autorizada puede cambiar el indicador de bloqueo.
CREATE OR REPLACE FUNCTION public.sigue_proteger_indicador_bloqueo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.edicion_bloqueada IS DISTINCT FROM OLD.edicion_bloqueada THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.sigue_autorizaciones_bloqueo x
      WHERE x.transaccion = txid_current()
        AND x.anio_id = OLD.id
        AND x.nuevo_estado = NEW.edicion_bloqueada
    ) THEN
      RAISE EXCEPTION 'El bloqueo sólo puede cambiarse mediante la operación autorizada';
    END IF;
  END IF;
  IF OLD.edicion_bloqueada AND NEW.estado IS DISTINCT FROM OLD.estado THEN
    RAISE EXCEPTION 'Desbloquee el año antes de cambiar su estado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sigue_proteger_indicador_bloqueo ON public.anios_escolares;
CREATE TRIGGER trg_sigue_proteger_indicador_bloqueo
BEFORE UPDATE ON public.anios_escolares
FOR EACH ROW EXECUTE FUNCTION public.sigue_proteger_indicador_bloqueo();

CREATE OR REPLACE FUNCTION public.sigue_cambiar_bloqueo_anual(p_anio_id uuid, p_bloquear boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_actor text := public.sigue_actor_anios();
  v_rol text := public.sigue_rol_anios();
  v_anio public.anios_escolares;
BEGIN
  IF v_actor IS NULL OR v_rol IS NULL OR v_rol NOT IN ('Administrador', 'Directora') THEN
    RAISE EXCEPTION 'Sólo Administrador o Directora pueden cambiar el bloqueo';
  END IF;
  IF p_anio_id IS NULL OR p_bloquear IS NULL THEN
    RAISE EXCEPTION 'Se requiere año e indicador de bloqueo';
  END IF;
  PERFORM pg_advisory_xact_lock(741113);
  SELECT * INTO v_anio FROM public.anios_escolares WHERE id = p_anio_id FOR UPDATE;
  IF v_anio.id IS NULL THEN
    RAISE EXCEPTION 'Año escolar inexistente';
  END IF;
  IF v_anio.estado <> 'Activo' THEN
    RAISE EXCEPTION 'El bloqueo temporal sólo corresponde a años activos';
  END IF;
  IF v_anio.edicion_bloqueada IS DISTINCT FROM p_bloquear THEN
    INSERT INTO public.sigue_autorizaciones_bloqueo(transaccion, anio_id, nuevo_estado)
    VALUES (txid_current(), p_anio_id, p_bloquear);

    UPDATE public.anios_escolares
    SET edicion_bloqueada = p_bloquear
    WHERE id = p_anio_id;

    DELETE FROM public.sigue_autorizaciones_bloqueo
    WHERE transaccion = txid_current();

    INSERT INTO public.historial_bloqueos_anuales(anio_id, bloqueado, responsable)
    VALUES (p_anio_id, p_bloquear, v_actor);
  END IF;
  RETURN jsonb_build_object('anio_id', p_anio_id, 'edicion_bloqueada', p_bloquear);
END;
$$;
REVOKE ALL ON FUNCTION public.sigue_cambiar_bloqueo_anual(uuid,boolean)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sigue_cambiar_bloqueo_anual(uuid,boolean)
TO authenticated;

-- Esta protección NO reconoce la excepción interna de sigue_validar_periodo().
-- Abarca las tablas operativas relacionadas directamente con el año.
CREATE OR REPLACE FUNCTION public.sigue_impedir_edicion_bloqueada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_bloqueado boolean := false;
  v_viejo uuid;
  v_nuevo uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(741113);
  IF TG_TABLE_NAME = 'utiles' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.anios_escolares
      WHERE estado = 'Activo' AND edicion_bloqueada
    ) INTO v_bloqueado;
  ELSIF TG_TABLE_NAME = 'listas_utiles' THEN
    IF TG_OP <> 'INSERT' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.anios_escolares
        WHERE anio::text = OLD."anioEscolar"::text AND edicion_bloqueada
      ) INTO v_bloqueado;
    END IF;
    IF NOT v_bloqueado AND TG_OP <> 'DELETE' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.anios_escolares
        WHERE anio::text = NEW."anioEscolar"::text AND edicion_bloqueada
      ) INTO v_bloqueado;
    END IF;
  ELSE
    IF TG_OP <> 'INSERT' THEN v_viejo := OLD.anio_id; END IF;
    IF TG_OP <> 'DELETE' THEN v_nuevo := NEW.anio_id; END IF;
    SELECT EXISTS (
      SELECT 1 FROM public.anios_escolares
      WHERE edicion_bloqueada
        AND (id = v_viejo OR id = v_nuevo OR
          (estado = 'Activo' AND v_viejo IS NULL AND v_nuevo IS NULL))
    ) INTO v_bloqueado;
  END IF;
  IF v_bloqueado THEN
    RAISE EXCEPTION 'El año escolar está bloqueado para modificaciones';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_listas ON public.listas_utiles;
CREATE TRIGGER trg_sigue_bloqueo_listas
BEFORE INSERT OR UPDATE OR DELETE ON public.listas_utiles
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_recepciones ON public.recepciones;
CREATE TRIGGER trg_sigue_bloqueo_recepciones
BEFORE INSERT OR UPDATE OR DELETE ON public.recepciones
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_movimientos ON public.movimientos;
CREATE TRIGGER trg_sigue_bloqueo_movimientos
BEFORE INSERT OR UPDATE OR DELETE ON public.movimientos
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_utiles ON public.utiles;
CREATE TRIGGER trg_sigue_bloqueo_utiles
BEFORE INSERT OR UPDATE OR DELETE ON public.utiles
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_matriculas ON public.matriculas;
CREATE TRIGGER trg_sigue_bloqueo_matriculas
BEFORE INSERT OR UPDATE OR DELETE ON public.matriculas
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

DROP TRIGGER IF EXISTS trg_sigue_bloqueo_evaluaciones ON public.evaluaciones_stock;
CREATE TRIGGER trg_sigue_bloqueo_evaluaciones
BEFORE INSERT OR UPDATE OR DELETE ON public.evaluaciones_stock
FOR EACH ROW EXECUTE FUNCTION public.sigue_impedir_edicion_bloqueada();

COMMIT;
