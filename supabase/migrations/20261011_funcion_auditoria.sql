
-- SIGUE: Función de auditoría automática
-- Preparada para PostgreSQL / Supabase
-- NO ejecutar todavía en la base compartida.

CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    datos_anteriores JSONB;
    datos_nuevos JSONB;
    cambios TEXT[];
    identificador TEXT;
    responsable UUID;
BEGIN
    responsable := auth.uid();

    -- No registrar operaciones sin identidad autenticada.
    -- La política para procesos internos se definirá después.
    IF responsable IS NULL THEN
        RAISE EXCEPTION 'Operación sin usuario autenticado';
    END IF;

    datos_anteriores :=
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE')
        THEN to_jsonb(OLD) ELSE '{}'::jsonb END;

    datos_nuevos :=
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE')
        THEN to_jsonb(NEW) ELSE '{}'::jsonb END;

    identificador := COALESCE(
        datos_nuevos ->> 'id',
        datos_anteriores ->> 'id'
    );

    -- Registrar nombres de campos, no sus valores.
    SELECT ARRAY_AGG(DISTINCT clave ORDER BY clave)
    INTO cambios
    FROM (
        SELECT jsonb_object_keys(datos_nuevos) AS clave
        UNION
        SELECT jsonb_object_keys(datos_anteriores) AS clave
    ) campos
    WHERE clave NOT IN (
        'password', 'contrasenia', 'contraseña',
        'token', 'access_token', 'refresh_token',
        'dni', 'telefono'
    )
    AND (
        TG_OP <> 'UPDATE'
        OR datos_anteriores -> clave
           IS DISTINCT FROM datos_nuevos -> clave
    );

    IF TG_OP = 'UPDATE'
       AND datos_anteriores = datos_nuevos THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.auditoria (
        usuario_auth_id,
        accion,
        tabla_afectada,
        registro_id,
        fecha_hora,
        campos_modificados,
        detalle
    )
    VALUES (
        responsable,
        TG_OP,
        TG_TABLE_NAME,
        identificador,
        NOW(),
        cambios,
        '{}'::jsonb
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

-- Impedir invocación directa desde roles de la API.
REVOKE ALL ON FUNCTION public.registrar_auditoria()
FROM PUBLIC, anon, authenticated;
