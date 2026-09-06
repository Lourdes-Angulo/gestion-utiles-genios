/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardList,
  CheckSquare,
  Package,
  ArrowLeftRight,
  TrendingUp,
  Bell,
  FileText,
  UserCheck,
  Sparkles,
  School,
  LogOut
} from "lucide-react";

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, onLogout }: SidebarProps) {
  const { alertas, recepciones, configuracionColegio } = useApp();

  const alertasActivasCount = alertas.filter(al => !al.resuelta).length;
  const recepcionesPendientesCount = recepciones.filter(rc => rc.estado === "Pendiente").length;

  const menuItems = [
    { id: "inicio", label: "Inicio", icon: LayoutDashboard },
    { id: "estudiantes", label: "Estudiantes", icon: GraduationCap },
    { id: "apoderados", label: "Apoderados", icon: Users },
    { id: "utiles", label: "Útiles escolares", icon: BookOpen },
    { id: "listas", label: "Listas de útiles", icon: ClipboardList },
    { id: "recepcion", label: "Recepción de útiles", icon: CheckSquare, badge: recepcionesPendientesCount, badgeColor: "bg-amber-500" },
    { id: "control_stock", label: "Control de stock", icon: Package },
    { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
    { id: "prediccion", label: "Predicción de stock", icon: TrendingUp },
    { id: "alertas", label: "Alertas", icon: Bell, badge: alertasActivasCount, badgeColor: "bg-rose-500" },
    { id: "reportes", label: "Reportes", icon: FileText },
    { id: "usuarios", label: "Usuarios", icon: UserCheck }
  ];

  return (
    <aside className="w-72 bg-white text-slate-800 h-screen flex flex-col border-r border-slate-200 shadow-sm shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0">
            <School className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold leading-tight uppercase tracking-wider text-emerald-700">
              Genios del Millennium
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Gestión Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">
          Módulos del Sistema
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = vistaActiva === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-all duration-200 group text-sm sidebar-item-bento ${isActive
                  ? "sidebar-item-bento-active"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                />
                <span className="tracking-wide">{item.label}</span>
                {item.isAi && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold rounded uppercase tracking-wider shadow-sm animate-pulse">
                    <Sparkles className="w-2.5 h-2.5" />
                    IA
                  </span>
                )}
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold shadow-inner ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        )}

      </div>
    </aside>
  );
}
