
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


type Accion = "Creación" | "Modificación" | "Eliminación";

interface RegistroBD {
  id: string;
  accion: string;
  tabla_afectada: string;
  registro_id: string | null;
  usuario_auth_id: string | null;
  usuario_institucional_id: string | null;
  detalle: Record<string, unknown> | null;
  fecha_hora: string;
  campos_modificados: string[] | null;
}

interface PerfilBD {
  id: string;
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
  nombresAuth: Map<string, string>,
  nombresInstitucionales: Map<string, string>
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

  // Operaciones de mantenimiento ejecutadas en SQL Editor carecen de sesión de SIGUE.
  const mantenimiento = registro.detalle?.origen === "Mantenimiento administrativo SQL Editor";
  const usuario = registro.usuario_institucional_id
    ? (nombresInstitucionales.get(registro.usuario_institucional_id) ?? `Usuario institucional ${registro.usuario_institucional_id}`)
    : registro.usuario_auth_id
    ? (nombresAuth.get(registro.usuario_auth_id) ?? "Cuenta de autenticación no vinculada")
    : mantenimiento
    ? "Mantenimiento administrativo (SQL Editor)"
    : "Autor no identificado";

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
    setRegistros([
      {id:'demo-a1',usuario:'Administrador (Ejemplo)',accion:'Creación',modulo:'Útiles escolares',descripcion:'Se registró un material de ejemplo.',fecha:'2026-10-17T10:30:00'},
      {id:'demo-a2',usuario:'Profesora (Ejemplo)',accion:'Modificación',modulo:'Listas de útiles',descripcion:'Se modificó la cantidad requerida de ejemplo.',fecha:'2026-10-16T09:15:00'},
      {id:'demo-a3',usuario:'Secretaría (Ejemplo)',accion:'Creación',modulo:'Estudiantes',descripcion:'Se registró un estudiante ficticio.',fecha:'2026-10-15T15:05:00'},
      {id:'demo-a4',usuario:'Administrador (Ejemplo)',accion:'Eliminación',modulo:'Útiles escolares',descripcion:'Se retiró un registro ficticio.',fecha:'2026-10-14T08:20:00'}
    ]);
    setAutorizado(true); setError(''); setCargando(false);
  }, []);
  useEffect(() => { void cargarAuditoria(); }, [cargarAuditoria]);

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

  const exportarCSV = () => { setError('No tienes permiso para exportar. ING-0001 es de solo lectura.'); };

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
