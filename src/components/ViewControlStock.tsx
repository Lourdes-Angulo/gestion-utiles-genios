/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Filter, Search, Package, AlertTriangle, Check, ArrowDown, ArrowUp } from "lucide-react";

export default function ViewControlStock() {
  const { utiles, movimientos, listas } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(""); // "", "Normal", "Bajo", "Sin stock"
  const [filtroGrado, setFiltroGrado] = useState("");

  const categorias = ["Cuadernos", "Escritura", "Papelería", "Arte y Pintura", "Pegamentos", "Otros"];

  // Helper to calculate stock metrics reactively from movements!
  const getMetricasStock = (utilId: string, baseStock: number) => {
    const movsDelUtil = movimientos.filter(m => m.utilId === utilId);
    
    const entradas = movsDelUtil
      .filter(m => m.tipo === "Entrada")
      .reduce((sum, m) => sum + m.cantidad, 0);

    const salidas = movsDelUtil
      .filter(m => m.tipo === "Salida")
      .reduce((sum, m) => sum + m.cantidad, 0);

    // Initial stock is current stock - inputs + outputs
    const stockInicial = Math.max(baseStock - entradas + salidas, 0);

    return {
      stockInicial,
      entradas,
      salidas
    };
  };

  const utilesProcesados = utiles.map(ut => {
    const { stockInicial, entradas, salidas } = getMetricasStock(ut.id, ut.stockActual);
    
    let estado: "Normal" | "Bajo" | "Sin stock" = "Normal";
    if (ut.stockActual === 0) {
      estado = "Sin stock";
    } else if (ut.stockActual <= ut.stockMinimo) {
      estado = "Bajo";
    }

    return {
      ...ut,
      stockInicial,
      entradas,
      salidas,
      estadoStock: estado
    };
  });

  // Filter lists to find relevant utilIds
  const filtrarPorLista = filtroGrado !== "";
  const utilIdsPermitidos = new Set<string>();

  if (filtrarPorLista) {
    listas.forEach(l => {
      const cumpleGrado = l.grado === filtroGrado;
      if (cumpleGrado) {
        l.items.forEach(item => {
          utilIdsPermitidos.add(item.utilId);
        });
      }
    });
  }

  const utilesFiltrados = utilesProcesados.filter(ut => {
    const term = filtroBusqueda.toLowerCase();
    const cumpleBusqueda = ut.nombre.toLowerCase().includes(term) || ut.codigo.toLowerCase().includes(term);
    const cumpleCategoria = filtroCategoria === "" || ut.categoria === filtroCategoria;
    const cumpleEstado = filtroEstado === "" || ut.estadoStock === filtroEstado;
    const cumpleLista = !filtrarPorLista || utilIdsPermitidos.has(ut.id);

    return cumpleBusqueda && cumpleCategoria && cumpleEstado && cumpleLista;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {/* Metrics Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 border-l-4 border-emerald-400 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ítems Disponibles</span>
            <h4 className="text-2xl font-black text-slate-800 mt-1">
              {utilesProcesados.filter(u => u.estadoStock === "Normal").length}
            </h4>
            <span className="text-[9px] text-emerald-600 font-bold mt-1 block">Nivel óptimo de reabastecimiento</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-yellow-400 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ítems con Stock Bajo</span>
            <h4 className="text-2xl font-black text-slate-800 mt-1">
              {utilesProcesados.filter(u => u.estadoStock === "Bajo").length}
            </h4>
            <span className="text-[9px] text-amber-600 font-bold mt-1 block">Requieren compras o reposición</span>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl border border-yellow-100">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-rose-400 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ítems Sin Stock (Quiebre)</span>
            <h4 className="text-2xl font-black text-slate-800 mt-1">
              {utilesProcesados.filter(u => u.estadoStock === "Sin stock").length}
            </h4>
            <span className="text-[9px] text-rose-600 font-bold mt-1 block">Atención crítica e inmediata</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar útil por código o descripción..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todos los grados</option>
              <option value="3 años">3 años (Inicial)</option>
              <option value="4 años">4 años (Inicial)</option>
              <option value="5 años">5 años (Inicial)</option>
              <option value="1er Grado">1er Grado (Primaria)</option>
              <option value="2do Grado">2do Grado (Primaria)</option>
              <option value="3er Grado">3er Grado (Primaria)</option>
              <option value="4to Grado">4to Grado (Primaria)</option>
              <option value="5to Grado">5to Grado (Primaria)</option>
              <option value="6to Grado">6to Grado (Primaria)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todos los estados</option>
              <option value="Normal">Stock Normal</option>
              <option value="Bajo">Stock Bajo</option>
              <option value="Sin stock">Sin Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stock Table Card */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-5 pl-8">Código</th>
                <th className="p-5">Producto / Material</th>
                <th className="p-5 text-center">Stock Inicial</th>
                <th className="p-5 text-center">Entradas (+)</th>
                <th className="p-5 text-center">Salidas (-)</th>
                <th className="p-5 text-center">Stock Mínimo</th>
                <th className="p-5 text-center">Stock Actual</th>
                <th className="p-5 pr-8 text-center">Criticidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
              {utilesFiltrados.length > 0 ? (
                utilesFiltrados.map((ut) => (
                  <tr key={ut.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-5 pl-8 font-mono font-bold text-slate-400">
                      {ut.codigo}
                    </td>
                    <td className="p-5">
                      <div>
                        <span className="font-bold text-slate-800 block">{ut.nombre}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 uppercase tracking-wide font-bold">Categoría: {ut.categoria}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center text-slate-500">
                      {ut.stockInicial} {ut.unidadMedida}(s)
                    </td>
                    <td className="p-5 text-center text-emerald-600 font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowUp className="w-3.5 h-3.5" />
                        {ut.entradas}
                      </span>
                    </td>
                    <td className="p-5 text-center text-rose-500 font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowDown className="w-3.5 h-3.5" />
                        {ut.salidas}
                      </span>
                    </td>
                    <td className="p-5 text-center text-slate-500">
                      {ut.stockMinimo}
                    </td>
                    <td className={`p-5 text-center text-sm font-black ${
                      ut.estadoStock === "Sin stock" ? "text-rose-600" : ut.estadoStock === "Bajo" ? "text-amber-500" : "text-slate-800"
                    }`}>
                      {ut.stockActual}
                    </td>
                    <td className="p-5 pr-8 text-center">
                      <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        ut.estadoStock === "Sin stock"
                          ? "bg-rose-50 text-rose-700 border border-rose-150"
                          : ut.estadoStock === "Bajo"
                          ? "bg-amber-50 text-amber-700 border border-amber-150 animate-pulse"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ut.estadoStock === "Sin stock" ? "bg-rose-600" : ut.estadoStock === "Bajo" ? "bg-amber-500" : "bg-emerald-500"
                        }`} />
                        {ut.estadoStock === "Sin stock" ? "Sin Stock" : ut.estadoStock === "Bajo" ? "Bajo" : "Normal"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No se encontraron productos con los criterios de filtrado seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
