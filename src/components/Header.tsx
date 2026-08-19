/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { Bell, Sparkles } from "lucide-react";

interface HeaderProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
}

export default function Header({ vistaActiva, setVistaActiva }: HeaderProps) {
  const { alertas, configuracionColegio } = useApp();

  const activeAlertsCount = alertas.filter(al => !al.resuelta).length;

  const getTituloVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return "Panel de Control General";
      case "estudiantes":
        return "Gestión de Estudiantes";
      case "apoderados":
        return "Gestión de Apoderados / Tutores";
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
        return "Predicción de Stock y Demanda con Inteligencia Artificial";
      case "alertas":
        return "Alertas Inteligentes de Inventario";
      case "reportes":
        return "Generador de Reportes y Estadísticas";
      case "usuarios":
        return "Perfiles de Usuarios y Permisos de Acceso";
      default:
        return "Sistema de Gestión";
    }
  };

  const getSubtituloVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return `Resumen actual de inventario, recepciones y proyecciones para el año escolar ${configuracionColegio.anioEscolar}.`;
      case "estudiantes":
        return "Fichas de estudiantes matriculados y asignación de listas de útiles.";
      case "apoderados":
        return "Registro de padres de familia, tutores legales y datos de contacto oficiales.";
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
        return "Proyecciones analíticas y fechas de quiebre de stock generadas mediante IA predictiva.";
      case "alertas":
        return "Notificaciones de reabastecimiento urgente, sobreconsumo o inactividad.";
      case "reportes":
        return "Generación, visualización y exportación de documentos oficiales del almacén.";
      case "usuarios":
        return "Roles institucionales con niveles de acceso adaptados para la I.E.P.";
      default:
        return "I.E.P. Genios del Millennium";
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-sm shrink-0">
      {/* Title section */}
      <div>
        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block leading-none mb-1">
          I.E.P. Genios del Millennium • Gestión Escolar
        </span>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2 leading-none">
          {getTituloVista()}
          {vistaActiva === "prediccion" && (
            <span className="flex items-center gap-0.5 px-2 py-0.5 text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold rounded-md uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Algoritmo de Demanda
            </span>
          )}
        </h2>
        <p className="text-[11px] text-slate-400 mt-1 font-medium truncate max-w-xl">
          {getSubtituloVista()}
        </p>
      </div>

      {/* Right control section */}
      <div className="flex items-center gap-4">
        {/* Alerts Notification Bell */}
        <button
          onClick={() => setVistaActiva("alertas")}
          className="relative p-2.5 bg-slate-50 text-slate-600 hover:text-emerald-700 rounded-xl transition-all duration-200 border border-slate-100 hover:border-emerald-100"
        >
          <Bell className="w-4.5 h-4.5" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
