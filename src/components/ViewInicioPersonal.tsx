import { useMemo, useState } from "react";
import {
  GraduationCap, BookOpen, ClipboardCheck, Package, Users,
  CheckCircle2, Clock3, AlertTriangle, Search, ArrowRight,
  ShieldCheck, Layers3, PieChart,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { RolSIGUE } from "../lib/permisosRoles";
import type { Estudiante, Recepcion, Usuario } from "../types";

type Props = {
  rol: Extract<RolSIGUE, "Profesora" | "Auxiliar">;
  setVistaActiva: (vista: string) => void;
};
type UsuarioConAsignacion = Usuario & {
  nivel_asignado?: string | null;
  aula_asignada?: string | null;
};
type Estado = "Completo" | "Incompleto" | "Pendiente";

function condicionRecepcion(recepcion?: Recepcion): Estado {
  if (!recepcion) return "Pendiente";
  const items = recepcion.items ?? [];
  if (!items.length) return "Pendiente";
  const esperado = items.reduce((s, i) => s + Math.max(0, i.cantidadEsperada || 0), 0);
  const entregado = items.reduce((s, i) => s + Math.max(0, i.cantidadEntregada || 0), 0);
  if (entregado === 0) return "Pendiente";
  return esperado > 0 && items.every(i => i.cantidadEntregada >= i.cantidadEsperada)
    ? "Completo" : "Incompleto";
}

const estilos: Record<Estado, string> = {
  Completo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Incompleto: "bg-amber-50 text-amber-800 border-amber-200",
  Pendiente: "bg-slate-100 text-slate-600 border-slate-200",
};

function obtenerPrimerNombre(nombreCompleto?: string) {
  if (!nombreCompleto?.trim()) return "Docente";
  return nombreCompleto.trim().split(/\s+/)[0];
}

export default function ViewInicioPersonal({ rol, setVistaActiva }: Props) {
  const { estudiantes, recepciones, listas, utiles, usuarioActivo, configuracionColegio } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const profesora = rol === "Profesora";
  const perfil = usuarioActivo as UsuarioConAsignacion;
  const nivel = perfil.nivel_asignado?.trim() || "";
  const aula = perfil.aula_asignada?.trim() || "";
  const asignado = Boolean(nivel && (!profesora || aula));
  const nombreCorto = obtenerPrimerNombre(perfil?.nombre);

  const estudiantesAsignados = useMemo(() => {
    if (!asignado) return [] as Estudiante[];
    return estudiantes.filter(e =>
      e.nivel === nivel && (!profesora || e.grado === aula)
    );
  }, [estudiantes, nivel, aula, profesora, asignado]);

  const recepcionPorEstudiante = useMemo(() => {
    const idsPermitidos = new Set(estudiantesAsignados.map(e => e.id));
    const resultado = new Map<string, Recepcion>();
    for (const r of recepciones) {
      if (!idsPermitidos.has(r.estudianteId)) continue;
      const anterior = resultado.get(r.estudianteId);
      if (!anterior || (r.fechaRecepcion ?? "") >= (anterior.fechaRecepcion ?? "")) {
        resultado.set(r.estudianteId, r);
      }
    }
    return resultado;
  }, [recepciones, estudiantesAsignados]);

  const filas = useMemo(() => estudiantesAsignados.map(e => ({
    estudiante: e,
    recepcion: recepcionPorEstudiante.get(e.id),
    condicion: condicionRecepcion(recepcionPorEstudiante.get(e.id)),
  })), [estudiantesAsignados, recepcionPorEstudiante]);

  const completos = filas.filter(f => f.condicion === "Completo").length;
  const incompletos = filas.filter(f => f.condicion === "Incompleto").length;
  const pendientes = filas.filter(f => f.condicion === "Pendiente").length;
  const total = filas.length;
  const porcentaje = total ? Math.round((completos / total) * 100) : 0;

  const porcentajeCompleto = total ? Math.round((completos / total) * 100) : 0;
  const porcentajeIncompleto = total ? Math.round((incompletos / total) * 100) : 0;
  const porcentajePendiente = total ? Math.round((pendientes / total) * 100) : 0;

  const listasAsignadas = asignado ? listas.filter(l =>
    l.nivel === nivel && (!profesora || l.grado === aula) &&
    l.anioEscolar === configuracionColegio.anioEscolar
  ) : [];

  const filtradas = filas.filter(({ estudiante: e }) => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    return !termino || `${e.nombres} ${e.apellidos} ${e.codigo ?? ""} ${e.grado}`
      .toLocaleLowerCase("es").includes(termino);
  }).sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos, "es"));

  const resumenGrafico = [
    { nombre: "Completas", valor: completos, porcentaje: porcentajeCompleto, colorBarra: "bg-emerald-500", colorFondo: "bg-emerald-50", colorTexto: "text-emerald-700" },
    { nombre: "Incompletas", valor: incompletos, porcentaje: porcentajeIncompleto, colorBarra: "bg-amber-500", colorFondo: "bg-amber-50", colorTexto: "text-amber-700" },
    { nombre: "Pendientes", valor: pendientes, porcentaje: porcentajePendiente, colorBarra: "bg-slate-500", colorFondo: "bg-slate-100", colorTexto: "text-slate-700" },
  ];

  const estudiantesConAvance = [...filas]
    .map((fila) => {
      const items = fila.recepcion?.items ?? [];
      const esperado = items.reduce((s, i) => s + Math.max(0, i.cantidadEsperada || 0), 0);
      const entregado = items.reduce((s, i) => s + Math.max(0, i.cantidadEntregada || 0), 0);
      const progreso = esperado > 0 ? Math.min(100, Math.round((entregado / esperado) * 100)) : 0;
      return { ...fila, progreso };
    })
    .sort((a, b) => b.progreso - a.progreso || a.estudiante.apellidos.localeCompare(b.estudiante.apellidos, "es"))
    .slice(0, 5);

  const tarjetas = [
    { titulo: "Estudiantes", valor: total, detalle: profesora ? "De mi aula" : "De mi nivel", Icono: Users, tono: "text-sky-700 bg-sky-50" },
    { titulo: "Recepción completa", valor: completos, detalle: "Todos los materiales recibidos", Icono: CheckCircle2, tono: "text-emerald-700 bg-emerald-50" },
    { titulo: "Recepción incompleta", valor: incompletos, detalle: "Faltan materiales por entregar", Icono: AlertTriangle, tono: "text-amber-700 bg-amber-50" },
    { titulo: "Pendientes", valor: pendientes, detalle: "Sin entregas registradas", Icono: Clock3, tono: "text-slate-700 bg-slate-100" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f0f4f8] p-5 md:p-8 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Panel de control · {configuracionColegio.anioEscolar}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Hola, {nombreCorto}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{profesora ? "Profesora" : "Auxiliar"}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={19} /> {asignado ? (profesora ? `${nivel} · ${aula}` : nivel) : "Asignación pendiente"}
            </div>
          </div>
        </section>

        {!asignado ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            No se pudo identificar tu nivel{profesora ? " y aula" : ""} asignado. Comunícate con Administración. Por seguridad no se muestran estudiantes ni cifras institucionales.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {tarjetas.map(({ titulo, valor, detalle, Icono, tono }) => (
                <div key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className={`inline-flex rounded-xl p-2.5 ${tono}`}><Icono size={21} /></span>
                  <p className="mt-3 text-xs font-semibold text-slate-500">{titulo}</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{valor}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{detalle}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><PieChart size={20} /></span>
                  <div>
                    <h3 className="text-base font-bold">Resumen visual de recepciones</h3>
                    <p className="text-xs text-slate-500">Distribución de estados en tu {profesora ? "aula" : "nivel"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
                    <div
                      className="h-44 w-44 rounded-full"
                      style={{
                        background: total === 0 ? "#e2e8f0" : `conic-gradient(
                          #10b981 0% ${porcentajeCompleto}%,
                          #f59e0b ${porcentajeCompleto}% ${porcentajeCompleto + porcentajeIncompleto}%,
                          #64748b ${porcentajeCompleto + porcentajeIncompleto}% 100%
                        )`,
                      }}
                    />
                    <div className="absolute flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                      <span className="text-3xl font-black text-slate-900">{total}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Estudiantes</span>
                    </div>
                  </div>
                  <div className="w-full space-y-3">
                    {resumenGrafico.map((item) => (
                      <div key={item.nombre} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-3.5 w-3.5 rounded-full ${item.colorBarra}`} />
                          <span className="text-sm font-semibold text-slate-700">{item.nombre}</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${item.colorTexto}`}>{item.valor}</p>
                          <p className="text-[11px] text-slate-500">{item.porcentaje}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><PieChart size={20} /></span>
                  <div>
                    <h3 className="text-base font-bold">Avance por estudiante</h3>
                    <p className="text-xs text-slate-500">Vista rápida del progreso de entregas registradas</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {estudiantesConAvance.length ? estudiantesConAvance.map(({ estudiante, progreso }) => (
                    <div key={estudiante.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-700">{estudiante.nombres} {estudiante.apellidos}</span>
                        <span className="font-bold text-slate-900">{progreso}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${progreso === 100 ? "bg-emerald-500" : progreso > 0 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${progreso}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">Todavía no hay datos suficientes para mostrar el gráfico de avance.</p>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1.15fr)]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-bold">Avance de recepciones</h3>
                    <strong className="text-2xl text-emerald-700">{porcentaje}%</strong>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{completos} de {total} estudiantes con entrega completa.</p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${porcentaje}%` }} />
                  </div>
                  <button type="button" onClick={() => setVistaActiva("recepcion")} className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline">
                    Ver recepciones <ArrowRight size={16} />
                  </button>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-bold">Accesos rápidos</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { nombre: "Estudiantes", destino: "estudiantes", descripcion: "Registrar y consultar", Icono: GraduationCap },
                      { nombre: "Listas de útiles", destino: "listas", descripcion: profesora ? "Gestionar mi lista" : "Consultar listas", Icono: BookOpen },
                      { nombre: "Recepción", destino: "recepcion", descripcion: "Registrar entregas", Icono: ClipboardCheck },
                      ...(profesora ? [{ nombre: "Útiles escolares", destino: "utiles", descripcion: "Consultar y registrar", Icono: Package }] : []),
                    ].map(({ nombre, destino, descripcion, Icono }) => (
                      <button key={destino} type="button" onClick={() => setVistaActiva(destino)} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40">
                        <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Icono size={20} /></span>
                        <span><strong className="block text-sm">{nombre}</strong><span className="text-xs text-slate-500">{descripcion}</span></span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Layers3 size={15} /> {listasAsignadas.length} lista(s) del período · {profesora ? `${utiles.length} producto(s) visibles en catálogo` : "Solo consulta de listas"}</p>
                </section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold">Estudiantes y condición de recepción</h3>
                      <p className="mt-1 text-xs text-slate-500">{profesora ? `Aula ${aula}` : `Nivel ${nivel}`} · {total} estudiantes</p>
                    </div>
                    <button type="button" onClick={() => setVistaActiva("estudiantes")} className="text-xs font-bold text-emerald-700 hover:underline">Ver estudiantes</button>
                  </div>
                  <div className="relative mt-4">
                    <Search size={17} className="absolute left-3 top-3 text-slate-400" />
                    <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar estudiante..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="max-h-[540px] overflow-auto">
                  {filtradas.length ? filtradas.map(({ estudiante, recepcion, condicion }) => (
                    <div key={estudiante.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{estudiante.apellidos}, {estudiante.nombres}</p>
                        <p className="mt-1 text-xs text-slate-500">{estudiante.grado} · {estudiante.codigo}</p>
                        {recepcion && <p className="mt-1 text-[11px] text-slate-400">Última recepción: {recepcion.fechaRecepcion || "Sin fecha"}</p>}
                      </div>
                      <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${estilos[condicion]}`}>{condicion}</span>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-sm text-slate-500">No se encontraron estudiantes en esta búsqueda.</div>
                  )}
                </div>
                <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
                  La condición se calcula según las cantidades registradas; sin recepción se muestra «Pendiente».
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
