import { useState, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Calendar, CheckCircle2, Printer } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

type TipoReporte = "stock" | "entregas" | "faltantes" | "consumo";

const COLORES = {
  verde: "#10b981",
  naranja: "#f59e0b",
  rojo: "#f43f5e",
  gris: "#64748b",
};

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontSize: "12px",
};

function PanelGrafico({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-card flex flex-col rounded-2xl bg-white p-6">
      <div className="mb-4 flex items-start gap-2">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
            {titulo}
          </h4>
          <p className="mt-1 text-[11px] text-slate-400">{descripcion}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ViewReportes() {
  const { recepciones, utiles, movimientos, estudiantes, listas, configuracionColegio } = useApp();
  const [reporteActivo, setReporteActivo] = useState<TipoReporte>("stock");
  const [descargaExitosa, setDescargaExitosa] = useState(false);

  // Estado por estudiante activo, incluyendo quienes no tienen ninguna recepción.
  const alumnosReporte = estudiantes.filter((e) => e.estado === "Activo").map((e) => {
    const lista = listas.find((l) =>
      l.nivel === e.nivel && l.grado === e.grado &&
      String(l.anioEscolar) === String(configuracionColegio.anioEscolar)
    );
    const recepcion = recepciones
      .filter((r) => r.estudianteId === e.id)
      .sort((a, b) => String(b.fechaRecepcion).localeCompare(String(a.fechaRecepcion)))[0];
    const utilesPendientes = (lista?.items ?? []).map((item) => {
      const requerido = Math.max(0, Number(item.cantidadRequerida) || 0);
      const recibido = recepcion?.items.find((it) => it.utilId === item.utilId);
      const entregado = Math.min(requerido, Math.max(0, Number(recibido?.cantidadEntregada) || 0));
      return { nombre: item.utilNombre, faltan: requerido - entregado };
    }).filter((item) => item.faltan > 0);
    const estado: "Completo" | "Incompleto" | "Pendiente" | "Sin lista" =
      !lista ? "Sin lista" : !recepcion ? "Pendiente" :
      utilesPendientes.length === 0 ? "Completo" : "Incompleto";
    return {
      id: e.id,
      estudiante: `${e.nombres} ${e.apellidos}`.trim(),
      grado: e.grado,
      entregadoPor: recepcion?.apoderadoNombre || "No registrado",
      fecha: recepcion?.fechaRecepcion || "Sin entrega",
      estado,
      utiles: utilesPendientes,
    };
  });

  const alumnosConLista = alumnosReporte.filter((a) => a.estado !== "Sin lista");
  const entregasCompletas = alumnosConLista.filter((a) => a.estado === "Completo").length;
  const entregasIncompletas = alumnosConLista.filter((a) => a.estado === "Incompleto").length;
  const entregasPendientes = alumnosConLista.filter((a) => a.estado === "Pendiente").length;
  const totalEntregas = alumnosConLista.length;

  const datosEntregas = [
    { name: "Completo", value: entregasCompletas, color: COLORES.verde },
    { name: "Incompleto", value: entregasIncompletas, color: COLORES.naranja },
    { name: "Pendiente", value: entregasPendientes, color: COLORES.gris },
  ];

  // Comparación de stock físico actual frente al mínimo por producto.
  const datosStock = [...utiles]
    .sort((a, b) => a.stockActual - a.stockMinimo - (b.stockActual - b.stockMinimo))
    .slice(0, 10)
    .map((u) => ({
      nombre: u.nombre.length > 17 ? `${u.nombre.slice(0, 17)}…` : u.nombre,
      actual: Math.max(0, Number(u.stockActual) || 0),
      minimo: Math.max(0, Number(u.stockMinimo) || 0),
    }));

  // Incluye entregas parciales y alumnos sin ninguna recepción.
  const listadoFaltantes = alumnosReporte.filter((a) =>
    (a.estado === "Pendiente" || a.estado === "Incompleto") && a.utiles.length > 0
  );

  const datosFaltantes = listadoFaltantes
    .map((r) => ({
      alumno: r.estudiante.length > 19
        ? `${r.estudiante.slice(0, 19)}…`
        : r.estudiante,
      faltantes: r.utiles.reduce((total, u) => total + u.faltan, 0),
    }))
    .sort((a, b) => b.faltantes - a.faltantes)
    .slice(0, 8);

  // Columnas agrupadas: entradas y salidas en cada fecha registrada.
  const totalesPorFecha = new Map<string, { fecha: string; entradas: number; salidas: number }>();
  movimientos.forEach((mov) => {
    const fecha = String(mov.fecha || "").slice(0, 10);
    if (!fecha) return;
    const acumulado = totalesPorFecha.get(fecha) ?? { fecha, entradas: 0, salidas: 0 };
    const cantidad = Math.abs(Number(mov.cantidad) || 0);
    if (mov.tipo === "Entrada") acumulado.entradas += cantidad;
    else if (mov.tipo === "Salida") acumulado.salidas += cantidad;
    totalesPorFecha.set(fecha, acumulado);
  });
  const datosMovimientos = [...totalesPorFecha.values()]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-10)
    .map((dato) => ({
      ...dato,
      etiqueta: dato.fecha.slice(5),
    }));

  const exportarPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString("es-PE");
    doc.setFontSize(14);
    doc.setTextColor(16, 122, 87);
    doc.text(configuracionColegio.nombre || "I.E.P. Genios del Millennium", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Sistema de Gestión de Útiles Escolares", 14, 24);

    let titulo = "";
    let head: string[][] = [];
    const body: (string | number)[][] = [];

    if (reporteActivo === "stock") {
      titulo = "Reporte de Estado de Stock Físico";
      head = [["Código", "Material Escolar", "Ubicación", "Mínimo", "Actual"]];
      utiles.forEach((u) => body.push([u.codigo, u.nombre, u.ubicación || "-", u.stockMinimo, u.stockActual]));
    } else if (reporteActivo === "entregas") {
      titulo = "Reporte General de Entregas por Alumno";
      head = [["Estudiante", "Entregado por", "Grado", "Fecha", "Estado"]];
      alumnosReporte.forEach((r) => body.push([r.estudiante, r.entregadoPor, r.grado, r.fecha, r.estado]));
    } else if (reporteActivo === "faltantes") {
      titulo = "Reporte de Materiales Faltantes por Alumno";
      head = [["Estudiante", "Grado", "Entregado por", "Material", "Cantidad faltante"]];
      listadoFaltantes.forEach((r) => {
        r.utiles.forEach((u) => body.push([r.estudiante, r.grado, r.entregadoPor || "No registrado", u.nombre, u.faltan]));
      });
    } else {
      titulo = "Resumen de Entradas, Salidas y Movimientos";
      head = [["Fecha", "Material / Útil", "Tipo", "Cantidad", "Motivo"]];
      movimientos.forEach((m) => body.push([m.fecha, m.utilNombre, m.tipo, m.cantidad, m.motivo]));
    }

    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(titulo, 14, 34);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Generado: ${fecha}`, 14, 39);
    autoTable(doc, {
      head,
      body,
      startY: 44,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 122, 87], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 248, 250] },
    });
    doc.save(`Reporte-${reporteActivo}-${new Date().toISOString().slice(0, 10)}.pdf`);
    setDescargaExitosa(true);
    window.setTimeout(() => setDescargaExitosa(false), 3000);
  };

  const pestanas: { id: TipoReporte; titulo: string }[] = [
    { id: "stock", titulo: "Niveles de Stock" },
    { id: "entregas", titulo: "Estado de Entregas" },
    { id: "faltantes", titulo: "Útiles Faltantes por Alumno" },
    { id: "consumo", titulo: "Consumo y Movimientos" },
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto bg-[#f0f4f8] p-5 md:p-8">
      {descargaExitosa && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> PDF descargado correctamente.
        </div>
      )}

      <div className="glass-card flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5">
          {pestanas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setReporteActivo(p.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                reporteActivo === p.id
                  ? "bg-white text-emerald-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.titulo}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportarPDF}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-900"
        >
          <Printer className="h-4 w-4 text-emerald-400" /> Descargar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {reporteActivo === "stock" && (
            <section className="glass-card overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 p-6">
                <h4 className="text-sm font-extrabold text-slate-800">Reporte de Estado de Stock Físico</h4>
                <p className="mt-1 text-[11px] text-slate-400">Existencias físicas frente al stock mínimo</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-4">Código</th><th className="p-4">Material escolar</th>
                      <th className="p-4">Ubicación</th><th className="p-4 text-center">Mínimo</th>
                      <th className="p-4 text-center">Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {utiles.map((u) => (
                      <tr key={u.id}>
                        <td className="p-4 font-mono text-slate-500">{u.codigo}</td>
                        <td className="p-4 font-bold text-slate-800">{u.nombre}</td>
                        <td className="p-4 text-slate-500">{u.ubicación || "-"}</td>
                        <td className="p-4 text-center">{u.stockMinimo}</td>
                        <td className={`p-4 text-center font-black ${u.stockActual <= u.stockMinimo ? "text-rose-600" : "text-emerald-700"}`}>
                          {u.stockActual}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {utiles.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay materiales registrados.</p>}
              </div>
            </section>
          )}

          {reporteActivo === "entregas" && (
            <section className="glass-card overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 p-6">
                <h4 className="text-sm font-extrabold text-slate-800">Reporte General de Entregas por Alumno</h4>
                <p className="mt-1 text-[11px] text-slate-400">Estado de entrega de todos los estudiantes activos, incluidos quienes aún no entregan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                    <tr><th className="p-4">Estudiante</th><th className="p-4">Entregado por</th><th className="p-4">Grado</th><th className="p-4">Fecha</th><th className="p-4 text-center">Estado</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alumnosReporte.map((r) => (
                      <tr key={r.id}>
                        <td className="p-4 font-bold text-slate-800">{r.estudiante}</td>
                        <td className="p-4 text-slate-500">{r.entregadoPor}</td>
                        <td className="p-4">{r.grado}</td>
                        <td className="p-4 text-slate-500">{r.fecha}</td>
                        <td className="p-4 text-center">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${r.estado === "Completo" ? "bg-emerald-50 text-emerald-700" : r.estado === "Incompleto" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {alumnosReporte.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay estudiantes activos registrados.</p>}
              </div>
            </section>
          )}

          {reporteActivo === "faltantes" && (
            <section className="glass-card overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 p-6">
                <h4 className="text-sm font-extrabold text-slate-800">Materiales Faltantes por Alumno</h4>
                <p className="mt-1 text-[11px] text-slate-400">Materiales pendientes de entregas parciales y alumnos sin recepción</p>
              </div>
              <div className="divide-y divide-slate-100">
                {listadoFaltantes.map((r, i) => (
                  <div key={`${r.estudiante}-${i}`} className="p-6">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{r.estado === "Pendiente" ? "SIN ENTREGA" : "ENTREGA INCOMPLETA"}</span>
                        <h5 className="mt-2 text-xs font-bold text-slate-800">{r.estudiante}</h5>
                        <p className="text-[11px] text-slate-500">Grado: {r.grado}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Entregado por: {r.entregadoPor || "No registrado"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {r.utiles.map((u, j) => (
                        <div key={`${u.nombre}-${j}`} className="flex justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs">
                          <span className="font-bold text-slate-700">{u.nombre}</span>
                          <strong className="shrink-0 text-rose-600">Faltan: {u.faltan} u.</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {listadoFaltantes.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay útiles faltantes registrados para los estudiantes con listas asignadas.</p>}
              </div>
            </section>
          )}

          {reporteActivo === "consumo" && (
            <section className="glass-card overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 p-6">
                <h4 className="text-sm font-extrabold text-slate-800">Resumen Analítico de Consumo y Movimientos</h4>
                <p className="mt-1 text-[11px] text-slate-400">Entradas y salidas registradas en el almacén</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400">
                    <tr><th className="p-4">Fecha</th><th className="p-4">Material / útil</th><th className="p-4">Tipo</th><th className="p-4">Cantidad</th><th className="p-4">Motivo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="p-4 font-mono text-slate-500">{m.fecha}</td>
                        <td className="p-4 font-bold text-slate-800">{m.utilNombre}</td>
                        <td className="p-4"><span className={`rounded px-2 py-1 font-bold ${m.tipo === "Entrada" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>{m.tipo}</span></td>
                        <td className={`p-4 font-bold ${m.tipo === "Entrada" ? "text-emerald-700" : "text-rose-600"}`}>{m.tipo === "Entrada" ? "+" : "-"}{m.cantidad}</td>
                        <td className="p-4 text-slate-500">{m.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {movimientos.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay movimientos registrados.</p>}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6 xl:col-span-4">
          {reporteActivo === "stock" && (
            <PanelGrafico titulo="Stock por producto" descripcion="Comparación entre existencias actuales y stock mínimo (10 productos críticos)">
              {datosStock.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosStock} layout="vertical" margin={{ top: 5, right: 8, left: 2, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} fontSize={10} />
                      <YAxis type="category" dataKey="nombre" width={94} fontSize={10} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="actual" name="Stock actual" fill={COLORES.verde} radius={[0, 3, 3, 0]} />
                      <Bar dataKey="minimo" name="Stock mínimo" fill={COLORES.naranja} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-12 text-center text-xs text-slate-500">No hay productos para graficar.</p>}
            </PanelGrafico>
          )}

          {reporteActivo === "entregas" && (
            <PanelGrafico titulo="Tasa de cumplimiento" descripcion="Proporción de entregas completas, incompletas y pendientes">
              {totalEntregas > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={datosEntregas} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={3}>
                        {datosEntregas.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-12 text-center text-xs text-slate-500">Sin estudiantes con listas asignadas.</p>}
              <div className="mt-3 space-y-2">
                {datosEntregas.map((d) => (
                  <div key={d.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                    <strong className="text-slate-800">{d.value} ({Math.round((d.value / Math.max(totalEntregas, 1)) * 100)}%)</strong>
                  </div>
                ))}
              </div>
            </PanelGrafico>
          )}

          {reporteActivo === "faltantes" && (
            <PanelGrafico titulo="Faltantes por alumno" descripcion="Estudiantes con más unidades pendientes, incluso sin primera entrega">
              {datosFaltantes.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosFaltantes} layout="vertical" margin={{ top: 5, right: 12, left: 2, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} fontSize={10} />
                      <YAxis type="category" dataKey="alumno" width={115} fontSize={10} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="faltantes" name="Unidades faltantes" fill={COLORES.naranja} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-12 text-center text-xs text-slate-500">No hay faltantes para graficar.</p>}
            </PanelGrafico>
          )}

          {reporteActivo === "consumo" && (
            <PanelGrafico titulo="Entradas y salidas por fecha" descripcion="Columnas agrupadas de los últimos 10 días con movimientos registrados">
              {datosMovimientos.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosMovimientos} margin={{ top: 5, right: 8, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="etiqueta" fontSize={10} />
                      <YAxis allowDecimals={false} fontSize={10} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="entradas" name="Entradas" fill={COLORES.verde} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="salidas" name="Salidas" fill={COLORES.rojo} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="py-12 text-center text-xs text-slate-500">No hay entradas ni salidas para graficar.</p>}
            </PanelGrafico>
          )}
        </div>
      </div>
    </div>
  );
}
