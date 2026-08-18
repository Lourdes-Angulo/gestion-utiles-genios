/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UtilEscolar } from "../types";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Check,
  X,
  Filter,
  Eye,
  AlertTriangle,
  Info
} from "lucide-react";

export default function ViewUtiles() {
  const {
    utiles,
    registrarUtil,
    editarUtil,
    desactivarUtil,
    usuarioActivo
  } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState(""); // "", "normal", "bajo", "vacio"

  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [utilSeleccionado, setUtilSeleccionado] = useState<UtilEscolar | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState("");
  const [formCategoria, setFormCategoria] = useState("Cuadernos");
  const [formUnidadMedida, setFormUnidadMedida] = useState("Unidad");
  const [formStockActual, setFormStockActual] = useState(0);
  const [formStockMinimo, setFormStockMinimo] = useState(10);
  const [formUbicacion, setFormUbicacion] = useState("");

  const [mensajeExito, setMensajeExito] = useState("");

  const puedeGestionar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const categorias = ["Cuadernos", "Escritura", "Papelería", "Arte y Pintura", "Pegamentos", "Otros"];
  const unidades = ["Unidad", "Caja", "Paquete", "Docena", "Millar"];

  const handleAbrirRegistro = () => {
    setEsEdicion(false);
    setFormNombre("");
    setFormCategoria("Cuadernos");
    setFormUnidadMedida("Unidad");
    setFormStockActual(0);
    setFormStockMinimo(10);
    setFormUbicacion("");
    setMostrarModalRegistro(true);
  };

  const handleAbrirEdicion = (ut: UtilEscolar) => {
    setEsEdicion(true);
    setUtilSeleccionado(ut);
    setFormNombre(ut.nombre);
    setFormCategoria(ut.categoria);
    setFormUnidadMedida(ut.unidadMedida);
    setFormStockActual(ut.stockActual);
    setFormStockMinimo(ut.stockMinimo);
    setFormUbicacion(ut.ubicación);
    setMostrarModalRegistro(true);
  };

  const handleVerDetalle = (ut: UtilEscolar) => {
    setUtilSeleccionado(ut);
    setMostrarModalDetalle(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    if (esEdicion && utilSeleccionado) {
      editarUtil({
        ...utilSeleccionado,
        nombre: formNombre,
        categoria: formCategoria,
        unidadMedida: formUnidadMedida,
        stockActual: formStockActual,
        stockMinimo: formStockMinimo,
        ubicación: formUbicacion
      });
      setMensajeExito("Útil escolar modificado con éxito.");
    } else {
      const nuevoCodigo = `UTI-${String(utiles.length + 1).padStart(3, "0")}`;
      registrarUtil({
        codigo: nuevoCodigo,
        nombre: formNombre,
        categoria: formCategoria,
        unidadMedida: formUnidadMedida,
        stockActual: formStockActual,
        stockMinimo: formStockMinimo,
        ubicación: formUbicacion,
        estado: "Activo"
      });
      setMensajeExito("Nuevo útil escolar agregado al catálogo.");
    }

    setMostrarModalRegistro(false);
    setTimeout(() => setMensajeExito(""), 4000);
  };

  // Filters application
  const utilesFiltrados = utiles.filter(ut => {
    const term = filtroBusqueda.toLowerCase();
    const cumpleBusqueda = ut.nombre.toLowerCase().includes(term) || ut.codigo.toLowerCase().includes(term) || ut.ubicación.toLowerCase().includes(term);
    const cumpleCategoria = filtroCategoria === "" || ut.categoria === filtroCategoria;
    
    let cumpleDisponibilidad = true;
    if (filtroDisponibilidad === "normal") {
      cumpleDisponibilidad = ut.stockActual > ut.stockMinimo;
    } else if (filtroDisponibilidad === "bajo") {
      cumpleDisponibilidad = ut.stockActual <= ut.stockMinimo && ut.stockActual > 0;
    } else if (filtroDisponibilidad === "vacio") {
      cumpleDisponibilidad = ut.stockActual === 0;
    }

    return cumpleBusqueda && cumpleCategoria && cumpleDisponibilidad;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <Package className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o ubicación..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
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
              value={filtroDisponibilidad}
              onChange={(e) => setFiltroDisponibilidad(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Cualquier cantidad</option>
              <option value="normal">Stock Normal</option>
              <option value="bajo">Stock Bajo</option>
              <option value="vacio">Sin Stock</option>
            </select>
          </div>

          {puedeGestionar && (
            <button
              onClick={handleAbrirRegistro}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Nuevo Útil Escolar
            </button>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {utilesFiltrados.length > 0 ? (
          utilesFiltrados.map((ut) => {
            const esStockBajo = ut.stockActual <= ut.stockMinimo && ut.stockActual > 0;
            const esSinStock = ut.stockActual === 0;

            return (
              <div
                key={ut.id}
                className={`glass-card p-6 flex flex-col justify-between ${
                  esSinStock 
                    ? "border-l-4 border-l-rose-500" 
                    : esStockBajo 
                    ? "border-l-4 border-l-amber-500" 
                    : "border-l-4 border-l-emerald-500"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 mb-3.5">
                    <div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase">
                        {ut.categoria}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-2" title={ut.nombre}>
                        {ut.nombre}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {ut.codigo}
                    </span>
                  </div>

                  {/* Stock meter */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Stock Actual:</span>
                      <span className={`text-sm font-black ${
                        esSinStock ? "text-rose-600" : esStockBajo ? "text-amber-500" : "text-emerald-600"
                      }`}>
                        {ut.stockActual} {ut.unidadMedida}(s)
                      </span>
                    </div>

                    {/* Stock level indicators */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          esSinStock ? "bg-rose-500" : esStockBajo ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min((ut.stockActual / Math.max(ut.stockMinimo * 2.5, 1)) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1">
                      <span>Mínimo: {ut.stockMinimo}</span>
                      <span className="flex items-center gap-1">
                        Ubicación: <strong className="text-slate-700">{ut.ubicación || "-"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Action Buttons */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    esSinStock 
                      ? "bg-rose-50 text-rose-700 border border-rose-100" 
                      : esStockBajo 
                      ? "bg-amber-50 text-amber-700 border border-amber-100" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {esSinStock ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Sin Stock
                      </>
                    ) : esStockBajo ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Stock Bajo
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Disponible
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVerDetalle(ut)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {puedeGestionar && (
                      <>
                        <button
                          onClick={() => handleAbrirEdicion(ut)}
                          className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => desactivarUtil(ut.id)}
                          className={`p-2 rounded-lg transition-colors border border-transparent ${
                            ut.estado === "Activo" 
                              ? "text-slate-400 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-100" 
                              : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-100"
                          }`}
                          title={ut.estado === "Activo" ? "Desactivar" : "Activar"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold col-span-full">
            No se encontraron útiles escolares en el catálogo con los filtros aplicados.
          </div>
        )}
      </div>

      {/* Modal: Registrar / Editar Útil */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                {esEdicion ? "Modificar Ficha de Material" : "Adicionar Nuevo Útil Escolar"}
              </h3>
              <button
                onClick={() => setMostrarModalRegistro(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Descripción del Útil</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Lapicero Trilux color Azul (Faber-Castell)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Categoría</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Unidad de Medida</label>
                  <select
                    value={formUnidadMedida}
                    onChange={(e) => setFormUnidadMedida(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    {unidades.map(un => (
                      <option key={un} value={un}>{un}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Stock Inicial Disponible</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStockActual}
                    onChange={(e) => setFormStockActual(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Stock Mínimo Alerta</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Ubicación física en Almacén</label>
                <input
                  type="text"
                  required
                  value={formUbicacion}
                  onChange={(e) => setFormUbicacion(e.target.value)}
                  placeholder="Ej. Estante A-3, Pasillo Central"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalRegistro(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold"
                >
                  <Check className="w-4.5 h-4.5" />
                  {esEdicion ? "Guardar Cambios" : "Completar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver Detalle del Útil */}
      {mostrarModalDetalle && utilSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-850 rounded-xl text-emerald-300">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Ficha de Inventario</h3>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold block mt-0.5">{utilSeleccionado.codigo}</span>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="text-emerald-300 hover:text-white p-1 bg-emerald-900/60 rounded-lg border border-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs font-semibold">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold mb-1">Nombre del Material</span>
                <span className="text-xs font-bold text-slate-800 block">{utilSeleccionado.nombre}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Categoría</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.categoria}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Unidad</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.unidadMedida}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Stock Físico Actual</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{utilSeleccionado.stockActual}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Límite Mínimo</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{utilSeleccionado.stockMinimo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Ubicación Física</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.ubicación}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Habilitado</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.estado}</span>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2 text-emerald-950">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold block">Historial y Flujo</span>
                  <p className="text-[9px] mt-0.5 leading-relaxed text-slate-600">
                    Las entradas y salidas de este producto quedan registradas automáticamente con la entrega de útiles escolares por parte de las familias o mediante el reabastecimiento general.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalDetalle(false)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors w-full font-bold"
                >
                  Cerrar Ficha de Inventario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
