
import { useApp } from "../context/AppContext";
import logoColegio from "../logo-colegio.png";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CheckSquare,
  Package,
  ArrowLeftRight,
  TrendingUp,
  Bell,
  FileText,
  UserCheck,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  puedeAbrir,
  type RolSIGUE,
} from "../lib/permisosRoles";

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  rol: RolSIGUE;
  onLogout?: () => void;
}

export default function Sidebar({
  vistaActiva,
  setVistaActiva,
  rol,
  onLogout,
}: SidebarProps) {
  const { alertas, recepciones } = useApp();

  const alertasActivasCount = alertas.filter(
    (a) => !a.resuelta
  ).length;

  const pendientesCount = recepciones.filter(
    (r) => r.estado === "Pendiente"
  ).length;

  const menuItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: LayoutDashboard,
    },
    {
      id: "estudiantes",
      label: "Estudiantes",
      icon: GraduationCap,
    },
    {
      id: "utiles",
      label: "Útiles escolares",
      icon: BookOpen,
    },
    {
      id: "listas",
      label: "Listas de útiles",
      icon: ClipboardList,
    },
    {
      id: "recepcion",
      label: "Recepción de útiles",
      icon: CheckSquare,
      badge: pendientesCount,
    },
    {
      id: "control_stock",
      label: "Control de stock",
      icon: Package,
    },
    {
      id: "movimientos",
      label: "Movimientos",
      icon: ArrowLeftRight,
    },
    {
      id: "prediccion",
      label: "Predicción de stock",
      icon: TrendingUp,
    },
    {
      id: "alertas",
      label: "Alertas",
      icon: Bell,
      badge: alertasActivasCount,
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: FileText,
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: UserCheck,
    },
    {
      id: "auditoria",
      label: "Auditoría",
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-800 shadow-sm">

      {/* ENCABEZADO CON INSIGNIA DEL COLEGIO */}
      <div className="flex items-center border-b border-slate-100 px-4 py-5">
        <div className="flex w-full items-center gap-3">

          {/* Insignia utilizada en el inicio de sesión */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <img
              src={logoColegio}
              alt="Insignia de la I.E.P. Genios del Millennium"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Nombre de la institución */}
          <div className="min-w-0 flex-1">
            <h1 className="text-[12px] font-bold uppercase leading-snug tracking-wide text-emerald-700">
              GENIOS DEL MILLENNIUM
            </h1>

            <p className="mt-1 text-[11px] font-medium text-slate-400">
              Gestión Inteligente
            </p>
          </div>
        </div>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">

        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos del Sistema
        </div>

        {menuItems
          .filter((item) => puedeAbrir(rol, item.id))
          .map((item) => {
            const Icon = item.icon;
            const activo = vistaActiva === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setVistaActiva(item.id)}
                className={`sidebar-item-bento group flex w-full items-center justify-between px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  activo
                    ? "sidebar-item-bento-active"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      activo
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  />

                  <span className="tracking-wide">
                    {item.label}
                  </span>
                </div>

                {"badge" in item &&
                  typeof item.badge === "number" &&
                  item.badge > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
              </button>
            );
          })}
      </nav>

      {/* CERRAR SESIÓN */}
      <div className="border-t border-slate-100 bg-slate-50 p-4">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        )}
      </div>
    </aside>
  );
}
