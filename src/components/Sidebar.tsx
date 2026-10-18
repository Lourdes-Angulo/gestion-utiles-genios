import { useApp } from "../context/AppContext";
import {
  LayoutDashboard, GraduationCap, BookOpen, ClipboardList, CheckSquare,
  Package, ArrowLeftRight, TrendingUp, Bell, FileText, UserCheck, School,
  LogOut, ShieldCheck,
} from "lucide-react";
import { puedeAbrir, type RolSIGUE } from "../lib/permisosRoles";

interface SidebarProps {
  vistaActiva: string;
  setVistaActiva: (vista: string) => void;
  rol: RolSIGUE;
  onLogout?: () => void;
}

export default function Sidebar({ vistaActiva, setVistaActiva, rol, onLogout }: SidebarProps) {
  const { alertas, recepciones } = useApp();
  const alertasActivasCount = alertas.filter(a => !a.resuelta).length;
  const pendientesCount = recepciones.filter(r => r.estado === "Pendiente").length;
  const menuItems = [
    { id: "inicio", label: "Inicio", icon: LayoutDashboard },
    { id: "estudiantes", label: "Estudiantes", icon: GraduationCap },
    { id: "utiles", label: "Útiles escolares", icon: BookOpen },
    { id: "listas", label: "Listas de útiles", icon: ClipboardList },
    { id: "recepcion", label: "Recepción de útiles", icon: CheckSquare, badge: pendientesCount },
    { id: "control_stock", label: "Control de stock", icon: Package },
    { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
    { id: "prediccion", label: "Predicción de stock", icon: TrendingUp },
    { id: "alertas", label: "Alertas", icon: Bell, badge: alertasActivasCount },
    { id: "reportes", label: "Reportes", icon: FileText },
    { id: "usuarios", label: "Usuarios", icon: UserCheck },
    { id: "auditoria", label: "Auditoría", icon: ShieldCheck },
  ];

  return (
    <aside className="w-72 bg-white text-slate-800 h-screen flex flex-col border-r border-slate-200 shadow-sm shrink-0">
      <div className="p-6 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"><School className="w-5 h-5" /></div>
          <div><h1 className="text-xs font-bold leading-tight uppercase tracking-wider text-emerald-700">Genios del Millennium</h1><p className="text-[10px] text-slate-400 font-medium">Gestión Inteligente</p></div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">Módulos del Sistema</div>
        {menuItems.filter(item => puedeAbrir(rol, item.id)).map(item => {
          const Icon = item.icon;
          const activo = vistaActiva === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setVistaActiva(item.id)} className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-all duration-200 group text-sm sidebar-item-bento ${activo ? "sidebar-item-bento-active" : "text-slate-500 hover:text-slate-800"}`}>
              <div className="flex items-center gap-3"><Icon className={`w-4 h-4 ${activo ? "text-emerald-700" : "text-slate-400"}`} /><span className="tracking-wide">{item.label}</span></div>
              {"badge" in item && typeof item.badge === "number" && item.badge > 0 && <span className="text-[10px] text-white bg-rose-500 px-2 py-0.5 rounded-full font-bold">{item.badge}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        {onLogout && <button type="button" onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-100"><LogOut className="w-4 h-4" />Cerrar Sesión</button>}
      </div>
    </aside>
  );
}
