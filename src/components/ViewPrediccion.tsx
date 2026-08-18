/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Prediccion } from "../types";
import {
  Info,
  Package,
  CalendarDays,
  ShieldCheck,
  Zap
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

export default function ViewPrediccion() {
  const { predicciones, utiles } = useApp();

  const [prediccionActiva, setPrediccionActiva] = useState<Prediccion | null>(predicciones[0] || null);

  // Convert historical consumption array to Recharts-friendly data
  const getChartData = (pred: Prediccion) => {
    const mesesHistoricos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    const data = pred.consumoHistorico.map((val, i) => ({
      mes: mesesHistoricos[i],
      consumo: val,
      proyeccion: null as number | null
    }));

    // Add projected data linking from last historical month
    const ultimoHistorico = pred.consumoHistorico[pred.consumoHistorico.length - 1];
    data.push({
      mes: "Jul (Proy.)",
      consumo: ultimoHistorico, // Connect line
      proyeccion: pred.demandaEstimada
    });

    return data;
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left list selector */}
        <div className="xl:col-span-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">Materiales en Análisis</span>
          
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {predicciones.map((pred) => {
              const utilObj = utiles.find(u => u.id === pred.utilId);
              const esPeligro = pred.stockActual <= (utilObj?.stockMinimo || 20);

              return (
                <button
                  key={pred.id}
                  onClick={() => setPrediccionActiva(pred)}
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
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase tracking-wide">CONFIDENCIA: {pred.nivelConfianza}%</span>
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
                  <span className="text-[9px] text-teal-600/80 font-bold mt-1 block">Precisión estadística</span>
                </div>

              </div>

              {/* Analytical Chart row */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Histórico de Consumo vs Demanda Proyectada</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Gráfico de serie temporal de consumo real (6 meses) y proyección estadística</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-600 font-bold rounded">Unidad de Medida</span>
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
                      <Line type="monotone" dataKey="proyeccion" name="Proyección IA Estimada" stroke="#4f46e5" strokeWidth={3.5} strokeDasharray="5 5" />
                      
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
                    <p className="text-[10px] text-slate-400 mt-1">Estimación del fin de existencias basado en velocidad de despacho</p>
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
                    Para asegurar la operatividad educativa, se sugiere tramitar una requisición por <strong>{prediccionActiva.cantidadRecomendadaReposicion} unidades</strong> con el proveedor local antes de la fecha límite señalada.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold">
              Seleccione un material escolar para analizar su predicción estadística.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
