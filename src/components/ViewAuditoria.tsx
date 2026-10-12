
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  History,
  FileClock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type Accion = "Creación" | "Modificación" | "Eliminación";

interface RegistroBD {
  id: string;
  accion: string;
  tabla_afectada: string;
  registro_id: string | null;
  usuario_auth_id: string | null;
  fecha_hora: string;
  campos_modificados: string[] | null;
}

interface PerfilBD {
  nombre: string;
  correo: string;
  rol?: string;
  "authUserId": string | null;
}

interface RegistroAuditoria {
  id: string;
  usuario: string;
  accion: Accion;
  modulo: string;
  descripcion: string;
  fecha: string;
}

const modulos: Record<string, string> = {
  usuarios: "Usuarios",
  estudiantes: "Estudiantes",
  apoderados: "Apoderados",
  utiles: "Útiles escolares",
  utiles_auditoria_prueba: "Útiles (pruebas)",
  listas_utiles: "Listas de útiles",
  recepciones: "Recepción de útiles",
  movimientos: "Movimientos",
  predicciones: "Predicciones",
  alertas: "Alertas",
};

function transformarRegistro(
  registro: RegistroBD,
  nombres: Map<string, string>
): RegistroAuditoria {
  const accion: Accion =
    registro.accion === "INSERT"
      ? "Creación"
      : registro.accion === "UPDATE"
      ? "Modificación"
      : "Eliminación";

  const modulo =
    modulos[registro.tabla_afectada] ??
    registro.tabla_afectada;

  const usuario = registro.usuario_auth_id
    ? nombres.get(registro.usuario_auth_id) ??
      `Usuario ${registro.usuario_auth_id.slice(0, 8)}`
    : "Usuario no identificado";

  const campos = Array.isArray(registro.campos_modificados)
    ? registro.campos_modificados.join(", ")
    : "";

  const referencia = registro.registro_id
    ? ` (${registro.registro_id})`
    : "";

  let descripcion = "";

  if (accion === "Creación") {
    descripcion = `Se creó un registro en ${modulo}${referencia}.`;
  } else if (accion === "Modificación") {
    descripcion = `Se modificó un registro en ${modulo}${referencia}.`;

    if (campos) {
      descripcion += ` Campos: ${campos}.`;
    }
  } else {
    descripcion = `Se eliminó un registro en ${modulo}${referencia}.`;
  }

  return {
    id: registro.id,
    usuario,
    accion,
    modulo,
    descripcion,
    fecha: registro.fecha_hora,
  };
}

export default function ViewAuditoria() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [accion, setAccion] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [autorizado, setAutorizado] = useState(false);

  const cargarAuditoria = useCallback(async () => {
    setCargando(true);
    setError("");
    setAutorizado(false);
    setRegistros([]);

    try {
      // Verificar la identidad con Supabase Auth
      const { data: autenticacion, error: errorAuth } =
        await supabase.auth.getUser();

      if (errorAuth || !autenticacion.user) {
        throw new Error("Debes iniciar sesión para consultar la auditoría.");
      }

      // Verificar el rol directamente en la base de datos
      const { data: perfil, error: errorPerfil } = await supabase
        .from("usuarios")
        .select('rol, estado')
        .eq("authUserId", autenticacion.user.id)
        .single();

      if (errorPerfil) {
        throw new Error(
          `No se pudo verificar el perfil: ${errorPerfil.message}`
        );
      }

      if (
        !perfil ||
        perfil.rol !== "Administrador" ||
        perfil.estado !== "Activo"
      ) {
        throw new Error(
          "Acceso restringido. Solo el Administrador puede consultar la auditoría."
        );
      }

      setAutorizado(true);

      // Consultar hasta 100 registros recientes
      const { data: actividades, error: errorAuditoria } =
        await supabase
          .from("auditoria")
          .select(
            "id, accion, tabla_afectada, registro_id, usuario_auth_id, fecha_hora, campos_modificados"
          )
          .order("fecha_hora", { ascending: false })
          .limit(100);

      if (errorAuditoria) {
        throw new Error(
          `Error al consultar auditoría: ${errorAuditoria.message}`
        );
      }

      // Obtener los nombres institucionales
      const { data: perfiles, error: errorUsuarios } =
        await supabase
          .from("usuarios")
          .select('nombre, correo, authUserId');

      if (errorUsuarios) {
        throw new Error(
          `Error al consultar responsables: ${errorUsuarios.message}`
        );
      }

      const nombres = new Map<string, string>();

      ((perfiles ?? []) as PerfilBD[]).forEach((p) => {
        if (p.authUserId) {
          nombres.set(p.authUserId, p.nombre || p.correo);
        }
      });

      const resultado = ((actividades ?? []) as RegistroBD[])
        .map((registro) => transformarRegistro(registro, nombres));

      setRegistros(resultado);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el historial."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarAuditoria();
  }, [cargarAuditoria]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return registros.filter((registro) => {
      const coincideBusqueda = [
        registro.usuario,
        registro.modulo,
        registro.descripcion,
        registro.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);

      const coincideAccion =
        accion === "Todas" || registro.accion === accion;

      return coincideBusqueda && coincideAccion;
    });
  }, [registros, busqueda, accion]);

  const exportarCSV = () => {
    if (!autorizado || registrosFiltrados.length === 0) return;

    const cabeceras = [
      "ID",
      "Usuario",
      "Acción",
      "Módulo",
      "Descripción",
      "Fecha",
    ];

    const filas = registrosFiltrados.map((r) => [
      r.id,
      r.usuario,
      r.accion,
      r.modulo,
      r.descripcion,
      r.fecha,
    ]);

    const escapar = (valor: string) => {
      const seguro = /^[=+\-@\t\r]/.test(valor)
        ? "'" + valor
        : valor;

      return `"${seguro.replace(/"/g, '""')}"`;
    };

    const csv = [cabeceras, ...filas]
      .map((fila) => fila.map(escapar).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "auditoria_SIGUE.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tarjetas = [
    {
      titulo: "Actividades recientes",
      valor: registros.length,
      icono: History,
    },
    {
      titulo: "Modificaciones",
      valor: registros.filter(
        (r) => r.accion === "Modificación"
      ).length,
      icono: FileClock,
    },
    {
      titulo: "Eliminaciones",
      valor: registros.filter(
        (r) => r.accion === "Eliminación"
      ).length,
      icono: ShieldCheck,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <ShieldCheck className="text-emerald-600" />
              Historial de Auditoría
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Registro de actividades almacenadas en Supabase.
              Se muestran hasta 100 eventos recientes.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void cargarAuditoria()}
              disabled={cargando}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>

            <button
              onClick={exportarCSV}
              disabled={
                cargando ||
                !autorizado ||
                !!error ||
                registrosFiltrados.length === 0
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {cargando ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">
            Cargando historial de auditoría...
          </div>
        ) : autorizado && !error ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {tarjetas.map((tarjeta) => {
                const Icono = tarjeta.icono;

                return (
                  <div
                    key={tarjeta.titulo}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <Icono
                      className="mb-3 text-emerald-600"
                      size={24}
                    />

                    <p className="text-sm text-slate-500">
                      {tarjeta.titulo}
                    </p>

                    <p className="text-3xl font-bold text-slate-800">
                      {tarjeta.valor}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap gap-3">
                <div className="relative min-w-56 flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-slate-400"
                  />

                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar usuario, módulo o actividad..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
                  />
                </div>

                <select
                  value={accion}
                  onChange={(e) => setAccion(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
                >
                  <option value="Todas">Todas</option>
                  <option value="Creación">Creación</option>
                  <option value="Modificación">Modificación</option>
                  <option value="Eliminación">Eliminación</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">Fecha y hora</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Módulo</th>
                      <th className="p-3">Descripción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registrosFiltrados.map((registro) => (
                      <tr
                        key={registro.id}
                        className="border-b border-slate-100"
                      >
                        <td className="whitespace-nowrap p-3">
                          {new Date(
                            registro.fecha
                          ).toLocaleString("es-PE")}
                        </td>
                        <td className="p-3">
                          {registro.usuario}
                        </td>
                        <td className="p-3">
                          {registro.accion}
                        </td>
                        <td className="p-3">
                          {registro.modulo}
                        </td>
                        <td className="p-3">
                          {registro.descripcion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {registrosFiltrados.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No se encontraron actividades registradas.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
