
-- SIGUE - Triggers de auditoría
-- Preparación para la base de datos Supabase.
-- NO ejecutar sin revisar el esquema real.

DO $$
DECLARE
    nombre_tabla TEXT;
BEGIN
    FOREACH nombre_tabla IN ARRAY ARRAY[
        'usuarios',
        'estudiantes',
        'utiles',
        'listas_utiles',
        'recepciones',
        'movimientos',
        'alertas'
    ]
    LOOP
        -- Solo configurar triggers si existe la tabla.
        IF to_regclass(
            format('public.%I', nombre_tabla)
        ) IS NOT NULL THEN

            EXECUTE format(
                'DROP TRIGGER IF EXISTS trg_auditoria_%I ON public.%I',
                nombre_tabla,
                nombre_tabla
            );

            EXECUTE format(
                'CREATE TRIGGER trg_auditoria_%I
                 AFTER INSERT OR UPDATE OR DELETE
                 ON public.%I
                 FOR EACH ROW
                 EXECUTE FUNCTION public.registrar_auditoria()',
                nombre_tabla,
                nombre_tabla
            );
        END IF;
    END LOOP;
END;
$$;
