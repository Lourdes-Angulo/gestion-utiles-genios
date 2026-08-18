/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  X,
  Printer,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function ViewReportes() {
  const { recepciones, utiles, movimientos, predicciones } = useApp();

  const [reporteActivo, setReporteActivo] = useState<"stock" | "entregas" | "faltantes" | "consumo">("stock");
  
  // Download simulation states
  const [descargando, setDescargando] = useState(false);
  const [formatoDescarga, setFormatoDescarga] = useState("");
  const [descargaExitosa, setDescargaExitosa] = useState(false);

  // 1. Calculate entregas stats
  const totalEntregas = recepciones.length;
  const entregasCompletas = recepciones.filter(r => r.estado === "Completo").length;
  const entregasIncompletas = recepciones.filter(r => r.estado === "Incompleto").length;
  const entregasPendientes = recepciones.filter(r => r.estado === "Pendiente").length;

  const dataEntregasChart = [
    { name: "Completo", value: entregasCompletas, color: "#10b981" },
    { name: "Incompleto", value: entregasIncompletas, color: "#f59e0b" },
    { name: "Pendiente", value: entregasPendientes, color: "#64748b" }
  ];

  // 2. Fetch faltantes data from recepciones
  const listadoFaltantes = recepciones
    .filter(r => r.estado === "Incompleto")
    .map(r => {
      const utilesFaltantesList = r.items
        .filter(it => it.cantidadEsperada > it.cantidadEntregada)
        .map(it => ({
          nombre: it.utilNombre,
          faltan: it.cantidadEsperada - it.cantidadEntregada
        }));

      return {
        estudiante: r.estudianteNombre,
        apoderado: r.apoderadoNombre,
        grado: r.grado,
        utiles: utilesFaltantesList
      };
    });

  const handleDescargar = (formato: "PDF" | "Excel") => {
    setFormatoDescarga(formato);
    setDescargando(true);
    setDescargaExitosa(false);

    // Simulate download processing
    setTimeout(() => {
      setDescargando(false);
      setDescargaExitosa(true);
      setTimeout(() => setDescargaExitosa(false), 2500);
    }, 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {/* Simulation Feedback Alert */}
      {descargaExitosa && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">Reporte oficial exportado en formato .{formatoDescarga.toLowerCase() === "pdf" ? "pdf" : "xlsx"} correctamente. ¡Descarga completada!</span>
          </div>
        </div>
      )}

      {/* Selector and Global Export Header */}
      <div className="glass-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Report tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setReporteActivo("stock")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              reporteActivo === "stock" ? "bg-white text-emerald-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Niveles de Stock
          </button>
          <button
            onClick={() => setReporteActivo("entregas")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              reporteActivo === "entregas" ? "bg-white text-emerald-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Estado de Entregas
          </button>
          <button
            onClick={() => setReporteActivo("faltantes")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              reporteActivo === "faltantes" ? "bg-white text-emerald-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Útiles Faltantes por Alumno
          </button>
          <button
            onClick={() => setReporteActivo("consumo")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
              reporteActivo === "consumo" ? "bg-white text-emerald-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Consumo y Movimientos
          </button>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDescargar("PDF")}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5 text-emerald-400" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Dynamic Report Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT: Tab-specific detailed reporting layout */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* REPORT 1: Stock levels & low indicators */}
          {reporteActivo === "stock" && (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-150 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-800 text-sm">Reporte de Estado de Stock Físico</h4>
                <p className="text-[10px] text-slate-400 mt-1">Existencias físicas contra stock mínimo de contingencia</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Código</th>
                      <th className="p-4">Material Escolar</th>
                      <th className="p-4">Ubicación</th>
                      <th className="p-4 text-center">Mínimo</th>
                      <th className="p-4 text-center">Actual</th>
                      <th className="p-4 text-center">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {utiles.map((ut) => {
                      const diferencia = ut.stockActual - ut.stockMinimo;
                      const esBajo = ut.stockActual <= ut.stockMinimo;

                      return (
                        <tr key={ut.id} className="hover:bg-slate-50/40">
                          <td className="p-4 pl-6 font-mono font-bold text-slate-400">{ut.codigo}</td>
                          <td className="p-4 font-bold text-slate-800">{ut.nombre}</td>
                          <td className="p-4 text-slate-500">{ut.ubicación}</td>
                          <td className="p-4 text-center">{ut.stockMinimo}</td>
                          <td className={`p-4 text-center font-black ${esBajo ? "text-rose-500" : "text-emerald-600"}`}>
                            {ut.stockActual}
                          </td>
                          <td className={`p-4 text-center font-bold font-mono ${diferencia < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {diferencia > 0 ? `+${diferencia}` : diferencia}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 2: Estado de Entregas checklist */}
          {reporteActivo === "entregas" && (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-150 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-800 text-sm">Reporte General de Entregas por Alumno</h4>
                <p className="text-[10px] text-slate-400 mt-1">Relación total de recepciones registradas por apoderados</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Estudiante</th>
                      <th className="p-4">Apoderado</th>
                      <th className="p-4">Grado</th>
                      <th className="p-4">Fecha Recepción</th>
                      <th className="p-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {recepciones.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50/40">
                        <td className="p-4 pl-6 font-bold text-slate-800">{rc.estudianteNombre}</td>
                        <td className="p-4 text-slate-500">{rc.apoderadoNombre}</td>
                        <td className="p-4 font-bold text-slate-700">{rc.grado}</td>
                        <td className="p-4 font-mono text-slate-400">{rc.fechaRecepcion}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            rc.estado === "Completo" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                              : rc.estado === "Incompleto"
                              ? "bg-amber-50 text-amber-700 border border-amber-150"
                              : "bg-slate-100 text-slate-500 border border-slate-250"
                          }`}>
                            {rc.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT 3: Útiles faltantes por estudiante */}
          {reporteActivo === "faltantes" && (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-150 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-800 text-sm">Reporte de Materiales Faltantes por Cobrar</h4>
                <p className="text-[10px] text-slate-400 mt-1">Lista pormenorizada de útiles escolares pendientes de entrega por las familias</p>
              </div>

              <div className="divide-y divide-slate-100">
                {listadoFaltantes.length > 0 ? (
                  listadoFaltantes.map((lf, i) => (
                    <div key={i} className="p-6 hover:bg-slate-50/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                        <div>
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black uppercase">
                            Entrega Parcial / Incompleta
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 mt-1.5">{lf.estudiante}</h5>
                          <span className="text-[10px] text-slate-400 block font-medium">Grado: {lf.grado}</span>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 font-bold">
                          Apoderado: <span className="text-slate-600">{lf.apoderado}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lf.utiles.map((ut, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-rose-50/40 rounded-xl border border-rose-100 text-xs">
                            <span className="font-bold text-slate-700 truncate pr-3">{ut.nombre}</span>
                            <span className="text-rose-600 font-black shrink-0">Faltan: {ut.faltan} u.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold">
                    No existen entregas incompletas registradas. ¡Felicitaciones!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REPORT 4: Consumo por periodo y movimientos */}
          {reporteActivo === "consumo" && (
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-150 bg-slate-50/50">
                <h4 className="font-extrabold text-slate-800 text-sm">Resumen Analítico de Consumo</h4>
                <p className="text-[10px] text-slate-400 mt-1">Transacciones de salida de almacén por bimestre actual</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Fecha</th>
                      <th className="p-4">Material / Útil</th>
                      <th className="p-4 text-center">Tipo</th>
                      <th className="p-4 text-center">Cant.</th>
                      <th className="p-4">Motivo de Transacción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {movimientos.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50/40">
                        <td className="p-4 pl-6 font-mono text-slate-400">{mov.fecha}</td>
                        <td className="p-4 font-bold text-slate-800">{mov.utilNombre}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            mov.tipo === "Entrada" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className={`p-4 text-center font-black ${mov.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"}`}>
                          {mov.tipo === "Entrada" ? "+" : "-"}{mov.cantidad}
                        </td>
                        <td className="p-4 text-slate-500">{mov.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT: Graphical Summaries Bento Grid */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Chart 1: Entregas completion rate */}
          <div className="glass-card p-6 flex flex-col">
            <div className="flex items-center gap-1.5 mb-4">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Tasa de Cumplimiento</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Avance global de entrega de útiles</p>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataEntregasChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dataEntregasChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {dataEntregasChart.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500 font-bold">{item.name}</span>
                  </div>
                  <strong className="text-slate-800 font-black">
                    {item.value} familias ({Math.round((item.value / Math.max(totalEntregas, 1)) * 100)}%)
                  </strong>
                </div>
              ))}
            </div>
          </div>



        </div>

      </div>

      {/* Export loading dialog */}
      {descargando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-150 max-w-xs w-full text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
            <div>
              <h4 className="text-sm font-black text-slate-800">Exportando Reporte</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-bold">Compilando datos en formato .{formatoDescarga.toLowerCase() === "pdf" ? "pdf" : "xlsx"}...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
