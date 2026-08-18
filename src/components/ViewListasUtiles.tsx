/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { ListaUtil } from "../types";
import {
  ClipboardList,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  GraduationCap,
  Sparkles,
  Check,
  X,
  PlusCircle
} from "lucide-react";

export default function ViewListasUtiles() {
  const {
    listas,
    utiles,
    guardarListaUtil,
    eliminarListaUtil,
    estudiantes,
    usuarioActivo,
    configuracionColegio
  } = useApp();

  const [filtroNivel, setFiltroNivel] = useState<"" | "Inicial" | "Primaria">("");
  const [listaSeleccionada, setListaSeleccionada] = useState<ListaUtil | null>(listas[0] || null);

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [formNivel, setFormNivel] = useState<"Inicial" | "Primaria">("Primaria");
  const [formGrado, setFormGrado] = useState("1er Grado");
  const [formAnio, setFormAnio] = useState(configuracionColegio.anioEscolar);
  const [itemsForm, setItemsForm] = useState<{ utilId: string; cantidadRequerida: number }[]>([]);

  const [mensajeExito, setMensajeExito] = useState("");

  const puedeGestionar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleAbrirCrear = () => {
    setFormNivel("Primaria");
    setFormGrado("1er Grado");
    setFormAnio(configuracionColegio.anioEscolar);
    setItemsForm([{ utilId: utiles[0]?.id || "", cantidadRequerida: 1 }]);
    setMostrarModalCrear(true);
  };

  const handleAgregarItemForm = () => {
    setItemsForm(prev => [...prev, { utilId: utiles[0]?.id || "", cantidadRequerida: 1 }]);
  };

  const handleQuitarItemForm = (idx: number) => {
    setItemsForm(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCambiarItemForm = (idx: number, campo: "utilId" | "cantidadRequerida", valor: any) => {
    setItemsForm(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          [campo]: campo === "cantidadRequerida" ? Number(valor) : valor
        };
      }
      return item;
    }));
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsForm.length === 0) return;

    const listaItems = itemsForm.map(it => {
      const utilObj = utiles.find(u => u.id === it.utilId);
      return {
        utilId: it.utilId,
        utilNombre: utilObj ? utilObj.nombre : "Material desconocido",
        cantidadRequerida: it.cantidadRequerida
      };
    });

    const nuevaLista: ListaUtil = {
      id: "",
      anioEscolar: formAnio,
      nivel: formNivel,
      grado: formGrado,
      items: listaItems
    };

    guardarListaUtil(nuevaLista);
    setMostrarModalCrear(false);
    setMensajeExito("Lista de útiles configurada con éxito.");
    
    // Auto-select the newly created or updated list
    const actualizadas = listas.find(l => l.grado === formGrado && l.nivel === formNivel);
    if (actualizadas) {
      setListaSeleccionada(actualizadas);
    } else {
      setListaSeleccionada(nuevaLista);
    }

    setTimeout(() => setMensajeExito(""), 4000);
  };

  // Get total students enrolled in this selected grade
  const getAlumnosEnGrado = (grado: string) => {
    return estudiantes.filter(e => e.grado === grado && e.estado === "Activo").length;
  };

  const listasFiltradas = listas.filter(l => filtroNivel === "" || l.nivel === filtroNivel);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Header filter & List Actions */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Año Escolar de Gestión: {configuracionColegio.anioEscolar}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Listas vigentes y cantidades estimadas por alumno matriculado</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-400">Nivel:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value as any)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todos los niveles</option>
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
            </select>
          </div>

          {puedeGestionar && (
            <button
              onClick={handleAbrirCrear}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Crear / Modificar Lista
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: List Selector */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">Listas por Grado Académico</span>
          {listasFiltradas.length > 0 ? (
            listasFiltradas.map((lista) => {
              const isSelected = listaSeleccionada?.id === lista.id || (listaSeleccionada?.grado === lista.grado && listaSeleccionada?.nivel === lista.nivel);
              const totalItems = lista.items.reduce((sum, it) => sum + it.cantidadRequerida, 0);
              const alumnosCount = getAlumnosEnGrado(lista.grado);

              return (
                <button
                  key={lista.id}
                  onClick={() => setListaSeleccionada(lista)}
                  className={`w-full text-left p-4.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-300 shadow-xs"
                      : "glass-card hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isSelected ? "bg-emerald-200/50 text-emerald-800 border-emerald-300" : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs">
                        {lista.grado}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-semibold">{lista.nivel}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] text-slate-400 font-semibold">{lista.items.length} Útiles</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {totalItems} unid.
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 font-bold">
                      {alumnosCount} Alumno(s)
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-150 text-center text-slate-400 text-xs font-bold">
              No hay listas definidas para este nivel.
            </div>
          )}
        </div>

        {/* Right Side: List Details checklist */}
        <div className="lg:col-span-8">
          {listaSeleccionada ? (
            <div className="glass-card overflow-hidden flex flex-col">
              
              {/* Header Details */}
              <div className="p-6 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 rounded">
                      Listado oficial
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-slate-150 text-slate-600 px-2 py-0.5 rounded">
                      Año {listaSeleccionada.anioEscolar}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm mt-2">
                    Lista de Útiles Requeridos - {listaSeleccionada.grado} ({listaSeleccionada.nivel})
                  </h3>
                </div>

                {puedeGestionar && (
                  <button
                    onClick={() => {
                      if (confirm("¿Está seguro de eliminar esta lista de útiles?")) {
                        eliminarListaUtil(listaSeleccionada.id);
                        setListaSeleccionada(listas[0] || null);
                      }
                    }}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-xs hover:underline bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Lista
                  </button>
                )}
              </div>

              {/* Grid with statistics of list requirements */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100">
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-800 font-bold block mb-1">
                    Total Útiles por Estudiante
                  </span>
                  <span className="text-xl font-black text-emerald-950">
                    {listaSeleccionada.items.reduce((sum, i) => sum + i.cantidadRequerida, 0)} <span className="text-xs font-bold text-emerald-800">unidades en total</span>
                  </span>
                </div>

                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[9px] uppercase tracking-wider text-indigo-800 font-bold block mb-1">
                    Demanda Estimada del Grado ({getAlumnosEnGrado(listaSeleccionada.grado)} alumnos)
                  </span>
                  <span className="text-xl font-black text-indigo-950">
                    {listaSeleccionada.items.reduce((sum, i) => sum + i.cantidadRequerida, 0) * getAlumnosEnGrado(listaSeleccionada.grado)} <span className="text-xs font-bold text-indigo-800">unidades requeridas</span>
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="p-4 pl-6">Nro.</th>
                      <th className="p-4">Material Escolar / Útil</th>
                      <th className="p-4 text-center">Cant. Requerida</th>
                      <th className="p-4 text-right pr-6">Acción Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {listaSeleccionada.items.map((item, idx) => {
                      const utilObj = utiles.find(u => u.id === item.utilId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-emerald-600" />
                              <div>
                                <span className="font-bold text-slate-800 block">{item.utilNombre}</span>
                                {utilObj && (
                                  <span className="text-[9px] text-slate-400 block mt-0.5">Ubicación: {utilObj.ubicación}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-slate-800">
                            {item.cantidadRequerida}
                          </td>
                          <td className="p-4 text-right pr-6">
                            <span className="text-[10px] bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                              Recepción y control de stock
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold">
              Selecciona un grado académico para ver los útiles escolares requeridos.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Crear / Modificar Lista */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-2xl w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                Configurar Lista de Útiles Escolares ({formAnio})
              </h3>
              <button
                onClick={() => setMostrarModalCrear(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Nivel</label>
                  <select
                    value={formNivel}
                    onChange={(e) => {
                      const selectedNivel = e.target.value as "Inicial" | "Primaria";
                      setFormNivel(selectedNivel);
                      if (selectedNivel === "Inicial") {
                        setFormGrado("3 años");
                      } else {
                        setFormGrado("1er Grado");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    <option value="Inicial">Inicial</option>
                    <option value="Primaria">Primaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Grado Académico</label>
                  <select
                    value={formGrado}
                    onChange={(e) => setFormGrado(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    {formNivel === "Inicial" && (
                      <>
                        <option value="3 años">3 años</option>
                        <option value="4 años">4 años</option>
                        <option value="5 años">5 años</option>
                      </>
                    )}
                    {formNivel === "Primaria" && (
                      <>
                        <option value="1er Grado">1er Grado</option>
                        <option value="2do Grado">2do Grado</option>
                        <option value="3er Grado">3er Grado</option>
                        <option value="4to Grado">4to Grado</option>
                        <option value="5to Grado">5to Grado</option>
                        <option value="6to Grado">6to Grado</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Año Escolar</label>
                  <input
                    type="text"
                    required
                    value={formAnio}
                    onChange={(e) => setFormAnio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Editor */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Útiles escolares requeridos</span>
                  <button
                    type="button"
                    onClick={handleAgregarItemForm}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Añadir Material
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {itemsForm.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <select
                          value={item.utilId}
                          onChange={(e) => handleCambiarItemForm(idx, "utilId", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-1.5 px-2.5"
                        >
                          {utiles.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre} ({u.unidadMedida})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min={1}
                          value={item.cantidadRequerida}
                          onChange={(e) => handleCambiarItemForm(idx, "cantidadRequerida", e.target.value)}
                          placeholder="Cant."
                          className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-center py-1.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuitarItemForm(idx)}
                        disabled={itemsForm.length === 1}
                        className="text-rose-500 hover:text-rose-700 p-2 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-bold"
                >
                  <Check className="w-4.5 h-4.5" />
                  Guardar Requerimientos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
