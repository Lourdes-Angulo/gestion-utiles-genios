
-- =====================================================
-- SIGUE - Sistema de Gestión de Útiles Escolares
-- Módulo de Seguridad y Auditoría
-- Fase 1: Estructura del historial
-- =====================================================

-- Tabla de registros de auditoría
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    usuario_auth_id UUID,

    accion TEXT NOT NULL
        CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),

    tabla_afectada TEXT NOT NULL,

    registro_id TEXT,

    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    campos_modificados TEXT[],

    detalle JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
ON public.auditoria (fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
ON public.auditoria (usuario_auth_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla
ON public.auditoria (tabla_afectada);

-- Activar Row Level Security
ALTER TABLE public.auditoria
ENABLE ROW LEVEL SECURITY;

-- No se crean políticas de acceso todavía.
-- Por defecto, los roles anon y authenticated
-- no tendrán acceso mediante la API de Supabase
-- mientras no existan otras políticas aplicables.

-- Pendiente:
-- 1. Confirmar estructura de public.usuarios
-- 2. Crear función de auditoría y triggers
-- 3. Configurar lectura exclusiva para administradores
-- 4. Proteger escritura y eliminación del historial
-- 5. Conectar ViewAuditoria.tsx con Supabase
