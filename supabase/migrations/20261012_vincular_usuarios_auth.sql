
-- SIGUE: vinculación de usuarios institucionales
-- con las cuentas de Supabase Authentication.
-- Pendiente de probar en un entorno de desarrollo.

ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS "authUserId" UUID;

-- Evitar que dos perfiles tengan la misma cuenta.
CREATE UNIQUE INDEX IF NOT EXISTS
idx_usuarios_auth_user_id
ON public.usuarios ("authUserId");

-- Vincular las cuentas institucionales a Authentication.
-- ON DELETE RESTRICT evita eliminar una identidad
-- mientras tenga un perfil institucional relacionado.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_auth_user_id_fkey'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
    ADD CONSTRAINT usuarios_auth_user_id_fkey
    FOREIGN KEY ("authUserId")
    REFERENCES auth.users(id)
    ON DELETE RESTRICT;
  END IF;
END;
$$;
