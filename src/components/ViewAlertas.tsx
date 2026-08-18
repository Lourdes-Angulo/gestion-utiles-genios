/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Alerta } from "../types";
import {
  Bell,
  Check,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
  Inbox
} from "lucide-react";

export default function ViewAlertas() {
  const { alertas, resolverAlerta, usuarioActivo } = useApp();

  const [seccionActiva, setSeccionActiva] = useState<"pendientes" | "resueltas">("pendientes");

  const filtroAlertas = alertas.filter(al => {
    return seccionActiva === "pendientes" ? !al.resuelta : al.resuelta;
  });

  const getIconoAlerta = (tipo: Alerta["tipo"]) => {
    switch (tipo) {
      case "stock_bajo":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "proximo_agotarse":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case "incremento_consumo":
        return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case "sin_movimiento":
        return <Activity className="w-5 h-5 text-slate-500" />;
      case "reposicion_recomendada":
        return <Sparkles className="w-5 h-5 text-teal-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getPrioridadEstilo = (prioridad: Alerta["prioridad"]) => {
    switch (prioridad) {
      case "Alta":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Media":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Baja":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-150";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setSeccionActiva("pendientes")}
          className={`px-5 py-3 text-xs font-bold transition-all duration-200 border-b-2 -mb-0.5 ${
            seccionActiva === "pendientes"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Alertas Activas ({alertas.filter(a => !a.resuelta).length})
        </button>
        <button
          onClick={() => setSeccionActiva("resueltas")}
          className={`px-5 py-3 text-xs font-bold transition-all duration-200 border-b-2 -mb-0.5 ${
            seccionActiva === "resueltas"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Historial de Solucionadas ({alertas.filter(a => a.resuelta).length})
        </button>
      </div>

      {/* List of Alerts */}
      <div className="space-y-4">
        {filtroAlertas.length > 0 ? (
          filtroAlertas.map((al) => (
            <div
              key={al.id}
              className={`glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all duration-200 ${
                al.resuelta 
                  ? "opacity-70 border-l-4 border-l-slate-300" 
                  : al.prioridad === "Alta" 
                  ? "border-l-4 border-l-rose-500" 
                  : "border-l-4 border-l-amber-500"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shrink-0 mt-0.5">
                  {getIconoAlerta(al.tipo)}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getPrioridadEstilo(al.prioridad)}`}>
                      Prioridad {al.prioridad}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {al.fecha}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                      {al.utilNombre}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm pt-1">{al.utilNombre}</h4>
                  <p className="text-slate-500 font-semibold leading-relaxed max-w-2xl">{al.descripcion}</p>
                  
                  {al.accionRecomendada && (
                    <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl mt-3 flex items-start gap-2 max-w-xl text-slate-600 font-semibold">
                      <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-700 text-[10px] uppercase block mb-0.5">Acción Recomendada:</strong>
                        {al.accionRecomendada}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!al.resuelta && ["Administrador", "Secretaria"].includes(usuarioActivo.rol) && (
                <button
                  onClick={() => resolverAlerta(al.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-200 self-start md:self-center shrink-0 shadow-xs"
                >
                  <Check className="w-4.5 h-4.5" />
                  Marcar como Resuelta
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
            <Inbox className="w-12 h-12 text-slate-300" />
            <span>No hay alertas en esta sección. ¡El almacén está funcionando de manera óptima!</span>
          </div>
        )}
      </div>

    </div>
  );
}
