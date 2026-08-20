/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  BookOpen,
  Package,
  AlertTriangle,
  ClipboardCheck,
  BellRing,
  ArrowUpRight,
  TrendingUp,
  FilePlus,
  UserPlus,
  PackageCheck,
  ChevronRight,
  Sparkles
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
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

interface ViewInicioProps {
  setVistaActiva: (vista: string) => void;
}

export default function ViewInicio({ setVistaActiva }: ViewInicioProps) {
  const { estudiantes, utiles, recepciones, alertas, movimientos, configuracionColegio } = useApp();

  // 1. Calculate indicators
  const totalEstudiantes = estudiantes.length;
  const totalUtiles = utiles.length;
  const stockDisponible = utiles.reduce((sum, u) => sum + u.stockActual, 0);

  // Capacidad de referencia del almacén (ajústala al valor real del colegio).
  const capacidadStock = 1000;
  const porcentajeStock = Math.min(100, Math.round((stockDisponible / capacidadStock) * 100));

  const utilesBajos = utiles.filter(u => u.stockActual <= u.stockMinimo && u.stockActual > 0).length;
  const utilesSinStock = utiles.filter(u => u.stockActual === 0).length;
  const totalStockBajo = utilesBajos + utilesSinStock;

  const recepcionesPendientes = recepciones.filter(r => r.estado === "Pendiente").length;
  const alertasActivas = alertas.filter(a => !a.resuelta).length;

  // 2. Chart 1: Estado del Stock (Pie Chart)
  const stockNormal = utiles.filter(u => u.stockActual > u.stockMinimo).length;
  const dataEstadoStock = [
    { name: "Normal", value: stockNormal, color: "#10b981" }, // emerald-500
    { name: "Stock Bajo", value: utilesBajos, color: "#f59e0b" }, // amber-500
    { name: "Sin Stock", value: utilesSinStock, color: "#ef4444" } // rose-500
  ];

  // 3. Chart 2: Útiles recibidos por mes (Bar Chart)
  const dataRecibidosPorMes: { mes: string; cantidad: number }[] = [];

  // 4. Chart 3: Productos con mayor consumo
  const dataMayorConsumo: { name: string; consumo: number }[] = [];

  // 5. Chart 4: Proyección de Demanda (Line Chart)
  const dataProyeccion: { name: string; actual: number; proyectado: number }[] = [];

  // 6. Chart 5: Evolución de Entradas y Salidas
  const dataEvolucion: { mes: string; entradas: number; salidas: number }[] = [];

  // Colors for Custom Styling
  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#f0f4f8]">
      {/* 1. KPIs Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">

        {/* KPI 1: Estudiantes */}
        <div className="glass-card p-5 border-l-4 border-blue-400 hover:border-l-blue-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estudiantes</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shadow-sm shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">{totalEstudiantes}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Estudiantes registrados</p>
          </div>
        </div>

        {/* KPI 2: Útiles */}
        <div className="glass-card p-5 border-l-4 border-emerald-400 hover:border-l-emerald-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Útiles Registrados</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">{totalUtiles}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Materiales registrados</p>
          </div>
        </div>

        {/* KPI 3: Stock Disponible */}
        <div className="glass-card p-5 border-l-4 border-yellow-400 hover:border-l-yellow-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Global</span>
            <div className="p-2 bg-yellow-50 rounded-xl text-yellow-600 border border-yellow-100 shadow-sm shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">{stockDisponible} u.</h3>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-2">
              <div className="bg-yellow-400 h-1 rounded-full transition-all duration-300" style={{ width: `${porcentajeStock}%` }}></div>
            </div>
          </div>
        </div>

        {/* KPI 4: Stock Bajo */}
        <div className="glass-card p-5 border-l-4 border-red-400 hover:border-l-red-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Bajo</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-red-600">{totalStockBajo}</h3>
            <p className="text-[10px] text-red-400 font-medium mt-1">Requieren pedido</p>
          </div>
        </div>

        {/* KPI 5: Recepciones Pendientes */}
        <div className="glass-card p-5 border-l-4 border-purple-400 hover:border-l-purple-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendientes</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shadow-sm shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800">{recepcionesPendientes}</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Recepciones pendientes</p>
          </div>
        </div>

        {/* KPI 6: Alertas */}
        <div className="glass-card p-5 border-l-4 border-slate-400 hover:border-l-slate-500 transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-orange-500">{alertasActivas}</h3>
            <p className="text-[10px] text-orange-300 font-medium mt-1">Acción necesaria</p>
          </div>
        </div>

      </div>

      {/* 2. Visual Graphs Section - Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Graph 1: Estado actual del stock (Pie Chart) */}
        <div className="glass-card p-6 xl:col-span-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Estado Actual del Stock</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Distribución de útiles por nivel de criticidad</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">Categorías</span>
          </div>

          <div className="h-60 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEstadoStock}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataEstadoStock.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} útiles`, 'Cantidad']}
                  contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "12px", border: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{totalUtiles}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Productos</span>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {dataEstadoStock.map((item, i) => (
              <div key={i} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-slate-700">{item.value}</span>
                </div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 2: Útiles recibidos por mes (Bar Chart) */}
        <div className="glass-card p-6 xl:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Útiles Recibidos por Mes</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Volumen de entrega de útiles por parte de los apoderados</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">Entregas</span>
          </div>

          <div className="h-68">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRecibidosPorMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "12px", border: "none" }}
                />
                <Bar dataKey="cantidad" name="Útiles Recibidos" fill="#c4b5fd" radius={[6, 6, 0, 0]}>
                  {dataRecibidosPorMes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mes === "Mar" ? "#10b981" : "#a7f3d0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Three more charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Graph 3: Productos con mayor consumo */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Productos con Mayor Consumo</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Útiles más demandados o distribuidos a la fecha</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={dataMayorConsumo} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: "#475569", fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }} />
                <Bar dataKey="consumo" fill="#34d399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 4: Proyección de Demanda (Line chart comparing stock vs projection) */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Proyección Inteligente de Demanda
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Stock disponible actual vs Demanda proyectada (Próx. mes)</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataProyeccion} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Line type="monotone" dataKey="actual" name="Stock Actual" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="proyectado" name="Demanda Est." stroke="#3b82f6" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 5: Evolución de Entradas y Salidas */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Entradas vs Salidas Mensuales</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Evolución de reabastecimiento frente a entregas</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataEvolucion} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1e293b", color: "#f8fafc", borderRadius: "8px", fontSize: "11px", border: "none" }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" />
                <Area type="monotone" dataKey="salidas" name="Salidas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorSalidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Bottom Row: Activities & Quick Accesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Activities */}
        <div className="glass-card p-6 lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Actividades Recientes de Inventario</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Últimas transacciones y registros en el almacén</p>
            </div>
            <button
              onClick={() => setVistaActiva("movimientos")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 hover:underline"
            >
              Ver todo <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {movimientos.slice(0, 4).map((mov, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors duration-200">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2 rounded-xl border ${mov.tipo === "Entrada"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">
                      {mov.tipo === "Entrada" ? "Ingreso de útiles" : "Salida de útiles"}: <span className="font-normal text-slate-500">{mov.utilNombre}</span>
                    </h5>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Por: {mov.responsable}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] text-slate-400 font-medium">{mov.motivo}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black block ${mov.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"
                    }`}>
                    {mov.tipo === "Entrada" ? "+" : "-"}{mov.cantidad}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{mov.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Actions */}
        <div className="glass-card p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Accesos Rápidos</h4>
            <p className="text-[11px] text-slate-400 font-medium mb-4">Acciones inmediatas autorizadas para tu perfil</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setVistaActiva("recepcion")}
              className="w-full flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 font-semibold text-xs rounded-2xl border border-emerald-100 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <FilePlus className="w-4 h-4 text-emerald-600" />
                <span>Registrar Recepción de Apoderado</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => setVistaActiva("estudiantes")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-semibold text-xs rounded-2xl border border-slate-150 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>Matricular / Registrar Estudiante</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setVistaActiva("utiles")}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-semibold text-xs rounded-2xl border border-slate-150 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-slate-500" />
                <span>Ingresar Nuevo Útil Escolar</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setVistaActiva("prediccion")}
              className="w-full flex items-center justify-between p-3.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 font-bold text-xs rounded-2xl border border-indigo-100 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Ejecutar Predicción IA de Stock</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-500" />
            </button>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 font-medium bg-slate-50/50 p-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>Actualización en tiempo real activa.</span>
          </div>
        </div>

      </div>
    </div>
  );
}