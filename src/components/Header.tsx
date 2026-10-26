
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Bell, CircleUserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseClerk } from "../lib/useSupabaseClerk";

interface HeaderProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
}

type PerfilHeader = {
  nombre: string | null;
  foto_path: string | null;
};

export default function Header({
  vistaActiva,
  setVistaActiva,
}: HeaderProps) {
  const { alertas, configuracionColegio } = useApp();

  const {
    cliente: clienteClerk,
    isLoaded,
    isSignedIn,
    clerkUserId,
  } = useSupabaseClerk();

  const [perfilHeader, setPerfilHeader] =
    useState<PerfilHeader | null>(null);

  const [fotoPerfilUrl, setFotoPerfilUrl] =
    useState<string | null>(null);

  // =============================================
  // CARGAR DATOS DEL USUARIO ACTUAL
  // =============================================

  useEffect(() => {
    if (!isLoaded) return;

    let activo = true;

    async function cargarPerfil() {
      setPerfilHeader(null);
      setFotoPerfilUrl(null);

      try {
        if (isSignedIn && clerkUserId) {
          const { data, error } = await clienteClerk
            .from("usuarios")
            .select("nombre, foto_path")
            .eq("clerk_user_id", clerkUserId)
            .eq("estado", "Activo")
            .maybeSingle();

          if (activo && !error && data) {
            setPerfilHeader(data as PerfilHeader);
          }
        } else {
          const { data: auth, error: authError } =
            await supabase.auth.getUser();

          if (authError || !auth.user || !activo) {
            return;
          }

          const { data, error } = await supabase
            .from("usuarios")
            .select("nombre, foto_path")
            .eq("authUserId", auth.user.id)
            .eq("estado", "Activo")
            .maybeSingle();

          if (activo && !error && data) {
            setPerfilHeader(data as PerfilHeader);
          }
        }
      } catch (error) {
        console.error(
          "No se pudo cargar la foto del encabezado:",
          error
        );
      }
    }

    void cargarPerfil();

    return () => {
      activo = false;
    };
  }, [
    isLoaded,
    isSignedIn,
    clerkUserId,
    clienteClerk,
    vistaActiva,
  ]);

  // =============================================
  // CARGAR FOTO DESDE SUPABASE STORAGE
  // =============================================

  useEffect(() => {
    let activo = true;

    async function cargarFoto() {
      setFotoPerfilUrl(null);

      if (!perfilHeader?.foto_path) return;

      try {
        const cliente =
          isSignedIn && clerkUserId
            ? clienteClerk
            : supabase;

        const { data, error } = await cliente.storage
          .from("fotos-perfil")
          .createSignedUrl(
            perfilHeader.foto_path,
            3600
          );

        if (!activo) return;

        if (error) {
          console.error(
            "No se pudo acceder a la fotografía:",
            error.message
          );
          return;
        }

        if (data?.signedUrl) {
          setFotoPerfilUrl(data.signedUrl);
        }
      } catch (error) {
        console.error(
          "Error al cargar la fotografía:",
          error
        );
      }
    }

    void cargarFoto();

    return () => {
      activo = false;
    };
  }, [
    perfilHeader?.foto_path,
    isSignedIn,
    clerkUserId,
    clienteClerk,
  ]);

  // =============================================
  // INICIALES DEL USUARIO
  // =============================================

  const inicialesHeader =
    perfilHeader?.nombre
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "US";

  // =============================================
  // ALERTAS
  // =============================================

  const activeAlertsCount = alertas.filter(
    (al) => !al.resuelta
  ).length;

  // =============================================
  // TÍTULOS DE LOS MÓDULOS
  // =============================================

  const getTituloVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return "Panel de Control General";

      case "estudiantes":
        return "Gestión de Estudiantes";

      case "utiles":
        return "Catálogo de Útiles Escolares";

      case "listas":
        return "Listas Escolares Requeridas";

      case "recepcion":
        return "Recepción y Registro de Entregas";

      case "control_stock":
        return "Control de Stock y Niveles de Almacén";

      case "movimientos":
        return "Historial de Movimientos de Inventario";

      case "prediccion":
        return "Predicción de Stock y Demanda";

      case "alertas":
        return "Alertas Inteligentes de Inventario";

      case "reportes":
        return "Generador de Reportes y Estadísticas";

      case "usuarios":
        return "Perfiles de Usuarios y Permisos de Acceso";

      case "auditoria":
        return "Historial de Auditoría";

      case "mi_perfil":
        return "Mi perfil y Seguridad de la Cuenta";

      default:
        return "Sistema de Gestión";
    }
  };

  // =============================================
  // SUBTÍTULOS DE LOS MÓDULOS
  // =============================================

  const getSubtituloVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return `Resumen actual de inventario, recepciones y proyecciones para el año escolar ${configuracionColegio.anioEscolar}.`;

      case "estudiantes":
        return "Fichas de estudiantes matriculados y asignación de listas de útiles.";

      case "utiles":
        return "Catálogo unificado de materiales escolares, almacenes y stock mínimo.";

      case "listas":
        return "Configuración y asignación de útiles requeridos por grado, nivel y sección.";

      case "recepcion":
        return "Control detallado de útiles entregados por los padres y generación de actas.";

      case "control_stock":
        return "Monitoreo en tiempo real de entradas, salidas y alertas de stock bajo.";

      case "movimientos":
        return "Registro detallado de transacciones de ingreso, egreso, merma y distribución.";

      case "prediccion":
        return "Proyecciones analíticas y fechas de quiebre de stock basadas en el consumo registrado.";

      case "alertas":
        return "Notificaciones de reabastecimiento urgente, sobreconsumo o inactividad.";

      case "reportes":
        return "Generación, visualización y exportación de documentos oficiales del almacén.";

      case "usuarios":
        return "Roles institucionales con niveles de acceso adaptados para la I.E.P.";

      case "auditoria":
        return "Consulta de actividades y operaciones registradas en el sistema.";

      case "mi_perfil":
        return "Consulta tus datos institucionales, cambia tu contraseña y configura tu correo secundario.";

      default:
        return "I.E.P. Genios del Millennium";
    }
  };

  // =============================================
  // INTERFAZ DEL HEADER
  // =============================================

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-sm shrink-0">

      {/* TÍTULO Y SUBTÍTULO */}

      <div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block leading-none mb-1">
          I.E.P. Genios del Millennium • Gestión Escolar
        </span>

        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 leading-none">
          {getTituloVista()}
        </h2>

        <p className="text-[11px] text-slate-400 mt-1 font-medium truncate max-w-xl">
          {getSubtituloVista()}
        </p>
      </div>

      {/* CONTROLES DEL ENCABEZADO */}

      <div className="flex items-center gap-3">

        {/* NOTIFICACIONES */}

        <button
          type="button"
          onClick={() => setVistaActiva("alertas")}
          title="Notificaciones"
          aria-label="Ver notificaciones"
          className="relative p-2.5 bg-slate-50 text-slate-600 hover:text-emerald-700 rounded-xl transition-all duration-200 border border-slate-100 hover:border-emerald-100"
        >
          <Bell size={19} />

          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* MI PERFIL CON FOTOGRAFÍA */}

        <button
          type="button"
          onClick={() => setVistaActiva("mi_perfil")}
          title="Mi perfil"
          aria-label="Abrir mi perfil"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
            vistaActiva === "mi_perfil"
              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
              : "border-slate-100 bg-slate-50 text-slate-600 hover:border-emerald-100 hover:text-emerald-700"
          }`}
        >

          {/* FOTO O INICIALES */}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-emerald-50">

            {fotoPerfilUrl ? (
              <img
                src={fotoPerfilUrl}
                alt="Fotografía del usuario"
                className="h-full w-full object-cover"
              />
            ) : perfilHeader?.nombre ? (
              <span className="text-[11px] font-bold text-emerald-700">
                {inicialesHeader}
              </span>
            ) : (
              <CircleUserRound size={19} />
            )}

          </div>

          <span className="hidden sm:inline">
            Mi perfil
          </span>

        </button>

      </div>
    </header>
  );
}
