/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Info,
  Package,
  CalendarDays,
  ShieldCheck,
  Zap,
  TrendingUp
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";

// Predicción calculada a partir de datos reales (no ficticios)
interface PrediccionCalculada {
  id: string;
  utilId: string;
  utilNombre: string;
  stockActual: number;
  stockMinimo: number;
  consumoHistorico: number[];
  meses: string[];
  demandaEstimada: number;
  stockProyectado: number;
  fechaProbableAgotamiento: string;
  cantidadRecomendadaReposicion: number;
  nivelConfianza: number;
  hayDatos: boolean;
}

const NOMBRES_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ViewPrediccion() {
  const { utiles, movimientos } = useApp();

  // Calcula las predicciones a partir de los útiles y sus movimientos de salida
  const predicciones = useMemo<PrediccionCalculada[]>(() => {
    // Construye las etiquetas de los últimos 6 meses
    const ahora = new Date();
    const meses: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      meses.push({ key, label: NOMBRES_MES[d.getMonth()] });
    }

    return utiles.map((util) => {
      // Salidas (consumo) de este útil
      const salidas = movimientos.filter(m => m.utilId === util.id && m.tipo === "Salida");
      const porMes: { [key: string]: number } = {};
      salidas.forEach(m => {
        const key = (m.fecha || "").substring(0, 7); // "YYYY-MM"
        porMes[key] = (porMes[key] || 0) + m.cantidad;
      });

      const consumoHistorico = meses.map(mm => porMes[mm.key] || 0);
      const sumaVentana = consumoHistorico.reduce((s, v) => s + v, 0);
      const mesesConDatos = consumoHistorico.filter(v => v > 0).length;
      const hayDatos = mesesConDatos > 0;

      // Consumo promedio mensual (solo sobre meses con actividad)
      const promedio = hayDatos ? Math.round(sumaVentana / mesesConDatos) : 0;

      // Demanda estimada para el próximo mes
      const demandaEstimada = promedio;
      const stockProyectado = Math.max(0, util.stockActual - demandaEstimada);

      // Fecha probable de agotamiento
      let fechaProbableAgotamiento: string;
      if (util.stockActual <= 0) {
        fechaProbableAgotamiento = "Agotado";
      } else if (!hayDatos || promedio <= 0) {
        fechaProbableAgotamiento = "Sin consumo aún";
      } else {
        const mesesRestantes = util.stockActual / promedio;
        const dias = Math.round(mesesRestantes * 30);
        const f = new Date();
        f.setDate(f.getDate() + dias);
        fechaProbableAgotamiento = f.toISOString().split("T")[0];
      }

      // Reposición recomendada
      const objetivo = hayDatos
        ? Math.max(util.stockMinimo, demandaEstimada * 2)
        : util.stockMinimo * 2;
      const cantidadRecomendadaReposicion = Math.max(0, objetivo - util.stockActual);

      // Nivel de confianza según cuántos meses de datos hay
      const nivelConfianza = hayDatos ? Math.min(90, 30 + mesesConDatos * 15) : 25;

      return {
        id: `PRED-${util.id}`,
        utilId: util.id,
        utilNombre: util.nombre,
        stockActual: util.stockActual,
        stockMinimo: util.stockMinimo,
        consumoHistorico,
        meses: meses.map(m => m.label),
        demandaEstimada,
        stockProyectado,
        fechaProbableAgotamiento,
        cantidadRecomendadaReposicion,
        nivelConfianza,
        hayDatos
      };
    });
  }, [utiles, movimientos]);

  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const prediccionActiva = predicciones.find(p => p.id === seleccionadoId) ?? predicciones[0] ?? null;

  // Datos para el gráfico: histórico real + proyección del próximo mes
  const getChartData = (pred: PrediccionCalculada) => {
    const data = pred.consumoHistorico.map((val, i) => ({
      mes: pred.meses[i],
      consumo: val,
      proyeccion: null as number | null
    }));
    const ultimo = pred.consumoHistorico[pred.consumoHistorico.length - 1] ?? 0;
    data.push({
      mes: "Próx.",
      consumo: ultimo,
      proyeccion: pred.demandaEstimada
    });
    return data;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">

      {/* Nota explicativa del método */}
      <div className="glass-card p-4 flex items-start gap-3 bg-indigo-50/30 border-l-4 border-indigo-300">
        <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
          Las proyecciones se calculan a partir del <strong>consumo real registrado</strong> (movimientos de salida de los últimos 6 meses).
          Mientras haya pocos movimientos, las estimaciones serán aproximadas y su nivel de confianza irá subiendo conforme se acumulen datos.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Left list selector */}
        <div className="xl:col-span-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">Materiales en Análisis</span>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {predicciones.length === 0 && (
              <div className="glass-card p-4 text-[11px] text-slate-400 font-bold text-center">
                No hay útiles registrados para analizar.
              </div>
            )}
            {predicciones.map((pred) => {
              const esPeligro = pred.stockActual <= pred.stockMinimo;

              return (
                <button
                  key={pred.id}
                  onClick={() => setSeleccionadoId(pred.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between ${
                    prediccionActiva?.id === pred.id
                      ? "bg-emerald-50/50 border-emerald-400 shadow-xs"
                      : "glass-card hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      esPeligro ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{pred.utilNombre}</h4>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase tracking-wide">CONFIANZA: {pred.nivelConfianza}%</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    esPeligro ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {pred.stockActual} u.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right dashboard details */}
        <div className="xl:col-span-8">
          {prediccionActiva ? (
            <div className="space-y-6">

              {/* Top Analytical Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Metric 1: Stock Actual */}
                <div className="glass-card p-4.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Stock Disponible</span>
                  <h4 className="text-xl font-black text-slate-800 mt-1.5">{prediccionActiva.stockActual} u.</h4>
                  <span className="text-[9px] text-slate-400 font-bold mt-1 block">Físico registrado</span>
                </div>

                {/* Metric 2: Demanda Estimada */}
                <div className="glass-card bg-indigo-50/30 p-4.5 border-l-4 border-indigo-400">
                  <span className="text-[9px] text-indigo-800 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    Demanda Proyectada
                  </span>
                  <h4 className="text-xl font-black text-indigo-950 mt-1.5">{prediccionActiva.demandaEstimada} u.</h4>
                  <span className="text-[9px] text-indigo-600/80 font-bold mt-1 block">Para el siguiente mes</span>
                </div>

                {/* Metric 3: Reposición recomendada */}
                <div className="glass-card bg-emerald-50/30 p-4.5 border-l-4 border-emerald-400">
                  <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Adquisición Recom.
                  </span>
                  <h4 className="text-xl font-black text-emerald-950 mt-1.5">+{prediccionActiva.cantidadRecomendadaReposicion} u.</h4>
                  <span className="text-[9px] text-emerald-600/80 font-bold mt-1 block">Compra de seguridad</span>
                </div>

                {/* Metric 4: Nivel Confianza */}
                <div className="glass-card bg-teal-50/30 p-4.5 border-l-4 border-teal-400">
                  <span className="text-[9px] text-teal-800 font-bold uppercase tracking-wider block">Nivel de Confianza</span>
                  <h4 className="text-xl font-black text-teal-950 mt-1.5">{prediccionActiva.nivelConfianza}%</h4>
                  <span className="text-[9px] text-teal-600/80 font-bold mt-1 block">Según datos disponibles</span>
                </div>

              </div>

              {/* Analytical Chart row */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Histórico de Consumo vs Demanda Proyectada</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Consumo real de los últimos 6 meses y proyección para el próximo</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-600 font-bold rounded">Unidades</span>
                </div>

                <div className="h-68">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData(prediccionActiva)} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", marginTop: "10px" }} />
                      <Line type="monotone" dataKey="consumo" name="Consumo Real Histórico" stroke="#10b981" strokeWidth={3.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="proyeccion" name="Proyección Estimada" stroke="#4f46e5" strokeWidth={3.5} strokeDasharray="5 5" />

                      {/* Alert line representing stockout point if stock actual is low */}
                      <ReferenceLine y={prediccionActiva.stockActual} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "Stock Actual", fill: "#f43f5e", fontSize: 9, position: "top" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Probable stockout date & replenishment schedule */}
              <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                    prediccionActiva.fechaProbableAgotamiento === "Agotado"
                      ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Fecha Estimada de Quiebre / Agotamiento</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Estimación del fin de existencias basado en la velocidad de consumo</p>
                    <span className={`inline-block mt-2 font-black text-sm uppercase px-3 py-1 rounded-lg ${
                      prediccionActiva.fechaProbableAgotamiento === "Agotado"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {prediccionActiva.fechaProbableAgotamiento}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 flex-1 max-w-md text-xs">
                  <h5 className="font-bold text-slate-700 flex items-center gap-1">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Plan de Reposición Sugerido
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
                    {prediccionActiva.cantidadRecomendadaReposicion > 0 ? (
                      <>Se sugiere tramitar una requisición por <strong>{prediccionActiva.cantidadRecomendadaReposicion} unidades</strong> para mantener un stock de seguridad adecuado.</>
                    ) : (
                      <>El stock actual es suficiente por ahora. No se requiere reposición inmediata.</>
                    )}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold">
              Seleccione un material escolar para analizar su predicción.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}