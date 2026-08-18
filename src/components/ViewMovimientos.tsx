/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Movimiento } from "../types";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Check,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  User,
  HelpCircle,
  PackageCheck,
  Calendar
} from "lucide-react";

export default function ViewMovimientos() {
  const {
    movimientos,
    utiles,
    registrarNuevoMovimiento,
    usuarioActivo,
    listas
  } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState(""); // "", "Entrada", "Salida"
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const categorias = ["Cuadernos", "Escritura", "Papelería", "Arte y Pintura", "Pegamentos", "Otros"];

  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);

  // Form States
  const [formTipo, setFormTipo] = useState<"Entrada" | "Salida">("Entrada");
  const [formUtilId, setFormUtilId] = useState(utiles[0]?.id || "");
  const [formCantidad, setFormCantidad] = useState(1);
  const [formMotivo, setFormMotivo] = useState("Reabastecimiento directo");
  const [formGradoAula, setFormGradoAula] = useState("3 años");
  const [formSeccionAula, setFormSeccionAula] = useState("A");

  const [mensajeExito, setMensajeExito] = useState("");

  const puedeGestionar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const motivosEntrada = [
    "Reabastecimiento directo"
  ];

  const motivosSalida = [
    "Uso en Aula",
    "Pérdida / Deterioro de Material"
  ];

  const handleAbrirRegistro = () => {
    setFormTipo("Entrada");
    setFormUtilId(utiles[0]?.id || "");
    setFormCantidad(1);
    setFormMotivo("Reabastecimiento directo");
    setFormGradoAula("3 años");
    setFormSeccionAula("A");
    setMostrarModalRegistro(true);
  };

  const handleTipoChange = (tipo: "Entrada" | "Salida") => {
    setFormTipo(tipo);
    setFormMotivo(tipo === "Entrada" ? "Reabastecimiento directo" : "Uso en Aula");
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (formCantidad <= 0) return;

    const utilObj = utiles.find(u => u.id === formUtilId);
    if (!utilObj) return;

    const stockAnterior = utilObj.stockActual;
    let stockResultante = stockAnterior;

    if (formTipo === "Entrada") {
      stockResultante = stockAnterior + formCantidad;
    } else {
      if (formCantidad > stockAnterior) {
        alert("La cantidad de salida no puede superar al stock actual disponible.");
        return;
      }
      stockResultante = stockAnterior - formCantidad;
    }

    const finalMotivo = (formTipo === "Salida" && formMotivo === "Uso en Aula")
      ? `Uso en Aula (${formGradoAula} - Sección ${formSeccionAula})`
      : formMotivo;

    registrarNuevoMovimiento({
      tipo: formTipo,
      utilId: formUtilId,
      utilNombre: utilObj.nombre,
      cantidad: formCantidad,
      responsable: `${usuarioActivo.nombre} (${usuarioActivo.rol})`,
      motivo: finalMotivo,
      stockAnterior,
      stockResultante
    });

    setMostrarModalRegistro(false);
    setMensajeExito("Movimiento de inventario consolidado y registrado.");
    setTimeout(() => setMensajeExito(""), 4000);
  };

  const filtrarPorGrado = filtroGrado !== "";
  const utilIdsPermitidosPorGrado = new Set<string>();

  if (filtrarPorGrado) {
    listas.forEach(l => {
      if (l.grado === filtroGrado) {
        l.items.forEach(item => {
          utilIdsPermitidosPorGrado.add(item.utilId);
        });
      }
    });
  }

  const movimientosFiltrados = movimientos.filter(mov => {
    const term = filtroBusqueda.toLowerCase();
    const cumpleBusqueda =
      mov.utilNombre.toLowerCase().includes(term) ||
      mov.motivo.toLowerCase().includes(term) ||
      mov.responsable.toLowerCase().includes(term);

    const cumpleTipo = filtroTipo === "" || mov.tipo === filtroTipo;

    const cumpleGrado = !filtrarPorGrado || 
      utilIdsPermitidosPorGrado.has(mov.utilId) || 
      mov.motivo.toLowerCase().includes(filtroGrado.toLowerCase());

    const utilObj = utiles.find(u => u.id === mov.utilId);
    const cumpleCategoria = filtroCategoria === "" || (utilObj && utilObj.categoria === filtroCategoria);

    const cumpleFecha = filtroFecha === "" || mov.fecha.startsWith(filtroFecha);

    return cumpleBusqueda && cumpleTipo && cumpleGrado && cumpleCategoria && cumpleFecha;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por material, responsable o motivo..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Cualquier movimiento</option>
              <option value="Entrada">Entradas (Ingresos)</option>
              <option value="Salida">Salidas (Egresos)</option>
            </select>
          </div>

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
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 outline-none"
            />
            {filtroFecha && (
              <button
                onClick={() => setFiltroFecha("")}
                className="text-slate-400 hover:text-slate-600 ml-1 flex items-center"
                title="Limpiar fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {puedeGestionar && (
            <button
              onClick={handleAbrirRegistro}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Registrar Movimiento Manual
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Tabular view of all movements */}
        <div className="xl:col-span-8 glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4.5 pl-6">Fecha y Hora</th>
                  <th className="p-4.5">Tipo</th>
                  <th className="p-4.5">Útil / Material</th>
                  <th className="p-4.5 text-center">Cantidad</th>
                  <th className="p-4.5 text-center">Stock Anterior</th>
                  <th className="p-4.5 text-center">Resultado</th>
                  <th className="p-4.5">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                {movimientosFiltrados.length > 0 ? (
                  movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4.5 pl-6 font-mono text-slate-400">
                        {mov.fecha}
                      </td>
                      <td className="p-4.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          mov.tipo === "Entrada" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                            : "bg-rose-50 text-rose-800 border-rose-100"
                        }`}>
                          {mov.tipo === "Entrada" ? (
                            <>
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              Entrada
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              Salida
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4.5">
                        <span className="font-bold text-slate-800 block">{mov.utilNombre}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Por: {mov.responsable}</span>
                      </td>
                      <td className={`p-4.5 text-center font-black text-sm ${
                        mov.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {mov.tipo === "Entrada" ? "+" : "-"}{mov.cantidad}
                      </td>
                      <td className="p-4.5 text-center text-slate-400 font-mono">
                        {mov.stockAnterior}
                      </td>
                      <td className="p-4.5 text-center text-slate-700 font-bold font-mono">
                        {mov.stockResultante}
                      </td>
                      <td className="p-4.5 text-slate-500 max-w-[140px] truncate" title={mov.motivo}>
                        {mov.motivo}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      No se registraron transacciones con el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Graphic Timeline layout */}
        <div className="xl:col-span-4 glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Línea de Tiempo de Inventario</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Sucesos recientes en orden cronológico</p>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto max-h-[460px] pr-1">
            {movimientos.slice(0, 5).map((mov, i) => (
              <div key={mov.id} className="relative flex gap-3.5 pl-1">
                {/* Visual Timeline line */}
                {i < 4 && (
                  <span className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-150 -translate-x-1/2" />
                )}
                
                {/* Circle Icon */}
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm z-10 ${
                  mov.tipo === "Entrada" 
                    ? "bg-emerald-500 text-white" 
                    : "bg-rose-500 text-white"
                }`}>
                  <PackageCheck className="w-4 h-4" />
                </span>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex-1 text-xs">
                  <span className="text-[9px] text-slate-400 font-mono block mb-1">{mov.fecha}</span>
                  <p className="font-bold text-slate-800">{mov.utilNombre}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-150">
                    <span className="text-[10px] text-slate-400">{mov.motivo}</span>
                    <strong className={`font-black ${
                      mov.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {mov.tipo === "Entrada" ? "+" : "-"}{mov.cantidad}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: Registrar Movimiento Manual */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
                Registrar Movimiento Manual de Inventario
              </h3>
              <button
                onClick={() => setMostrarModalRegistro(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTipoChange("Entrada")}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 font-bold ${
                    formTipo === "Entrada"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                  <span>Entrada (Ingreso / Compra)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTipoChange("Salida")}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 font-bold ${
                    formTipo === "Salida"
                      ? "bg-rose-50 border-rose-500 text-rose-800"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <ArrowUpRight className="w-6 h-6 text-rose-600" />
                  <span>Salida (Egreso / Ajuste / Pérdida)</span>
                </button>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Seleccionar Útil Escolar</label>
                <select
                  value={formUtilId}
                  onChange={(e) => setFormUtilId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                >
                  {utiles.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} (Disponibles: {u.stockActual} - {u.unidadMedida}s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Cantidad a Transaccionar</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Motivo del Ajuste</label>
                  <select
                    value={formMotivo}
                    onChange={(e) => setFormMotivo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    {formTipo === "Entrada"
                      ? motivosEntrada.map(m => <option key={m} value={m}>{m}</option>)
                      : motivosSalida.map(m => <option key={m} value={m}>{m}</option>)
                    }
                  </select>
                </div>
              </div>

              {formTipo === "Salida" && formMotivo === "Uso en Aula" && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fade-in">
                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Grado Destino</label>
                    <select
                      value={formGradoAula}
                      onChange={(e) => setFormGradoAula(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                    >
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
                  <div>
                    <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Sección Destino</label>
                    <select
                      value={formSeccionAula}
                      onChange={(e) => setFormSeccionAula(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                    >
                      <option value="A">Sección A</option>
                      <option value="B">Sección B</option>
                      <option value="C">Sección C</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalRegistro(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-bold"
                >
                  <Check className="w-4.5 h-4.5" />
                  Procesar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
