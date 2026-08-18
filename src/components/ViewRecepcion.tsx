/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Recepcion } from "../types";
import {
  CheckSquare,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  User,
  PlusCircle,
  Printer,
  ChevronRight,
  Info,
  X,
  Check
} from "lucide-react";

export default function ViewRecepcion() {
  const {
    recepciones,
    registrarEntregaRecepcion,
    registrarNuevaRecepcion,
    usuarioActivo,
    configuracionColegio,
    estudiantes,
    listas
  } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  
  const [recepcionSeleccionada, setRecepcionSeleccionada] = useState<Recepcion | null>(null);
  const [mostrarModalRegistrar, setMostrarModalRegistrar] = useState(false);
  const [mostrarConstancia, setMostrarConstancia] = useState(false);

  // Form states for registrar entrega
  const [cantidadesEntregadas, setCantidadesEntregadas] = useState<{ [utilId: string]: number }>({});
  const [formObservaciones, setFormObservaciones] = useState("");

  // States for Nueva Recepcion Modal
  const [mostrarModalNuevaRecepcion, setMostrarModalNuevaRecepcion] = useState(false);
  const [nuevoRecepEstudianteId, setNuevoRecepEstudianteId] = useState("");
  const [nuevoRecepCantidades, setNuevoRecepCantidades] = useState<{ [utilId: string]: number }>({});
  const [nuevoRecepObservaciones, setNuevoRecepObservaciones] = useState("");

  const handleSelectEstudianteNuevaRecepcion = (estId: string) => {
    setNuevoRecepEstudianteId(estId);
    const student = estudiantes.find(e => e.id === estId);
    if (student) {
      const lista = listas.find(l => l.grado === student.grado);
      if (lista) {
        const initialCantidades: { [utilId: string]: number } = {};
        lista.items.forEach(item => {
          initialCantidades[item.utilId] = 0;
        });
        setNuevoRecepCantidades(initialCantidades);
      } else {
        setNuevoRecepCantidades({});
      }
    } else {
      setNuevoRecepCantidades({});
    }
  };

  const handleCantidadNuevaRecepChange = (utilId: string, val: number, max: number) => {
    setNuevoRecepCantidades(prev => ({
      ...prev,
      [utilId]: Math.min(Math.max(val, 0), max)
    }));
  };

  const handleGuardarNuevaRecepcion = (e: React.FormEvent) => {
    e.preventDefault();
    const student = estudiantes.find(e => e.id === nuevoRecepEstudianteId);
    if (!student) return;

    const lista = listas.find(l => l.grado === student.grado);
    if (!lista) return;

    const items = lista.items.map(item => {
      const entregado = nuevoRecepCantidades[item.utilId] ?? 0;
      return {
        utilId: item.utilId,
        utilNombre: item.utilNombre,
        cantidadEsperada: item.cantidadRequerida,
        cantidadEntregada: entregado
      };
    });

    const completo = items.every(it => it.cantidadEntregada >= it.cantidadEsperada);
    const vacio = items.every(it => it.cantidadEntregada === 0);
    const estado = completo ? "Completo" : (vacio ? "Pendiente" : "Incompleto");

    const nueva = {
      estudianteId: student.id,
      estudianteNombre: `${student.nombres} ${student.apellidos}`,
      apoderadoId: student.apoderadoId,
      apoderadoNombre: student.apoderadoNombre,
      grado: student.grado,
      nivel: student.nivel,
      fechaRecepcion: new Date().toISOString().split("T")[0],
      items,
      estado,
      observaciones: nuevoRecepObservaciones,
      recibidoPor: `${usuarioActivo.nombre} (${usuarioActivo.rol})`
    };

    registrarNuevaRecepcion(nueva);
    setMostrarModalNuevaRecepcion(false);
    
    // Auto-select the newly created reception sheet
    // Give it a tiny delay to allow state update
    setTimeout(() => {
      setRecepcionSeleccionada({
        ...nueva,
        id: `R${String(recepciones.length + 1).padStart(3, "0")}`
      });
    }, 100);
  };

  const puedeRegistrar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleAbrirRegistro = (rc: Recepcion) => {
    setRecepcionSeleccionada(rc);
    const iniciales: { [utilId: string]: number } = {};
    rc.items.forEach(it => {
      iniciales[it.utilId] = it.cantidadEntregada;
    });
    setCantidadesEntregadas(iniciales);
    setFormObservaciones(rc.observaciones || "");
    setMostrarModalRegistrar(true);
  };

  const handleVerConstancia = (rc: Recepcion) => {
    setRecepcionSeleccionada(rc);
    setMostrarConstancia(true);
  };

  const handleGuardarEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recepcionSeleccionada) return;

    registrarEntregaRecepcion(
      recepcionSeleccionada.id,
      cantidadesEntregadas,
      formObservaciones,
      `${usuarioActivo.nombre} (${usuarioActivo.rol})`
    );

    setMostrarModalRegistrar(false);
    // Auto-re-select updated reception to show changes
    const updated = recepciones.find(r => r.id === recepcionSeleccionada.id);
    if (updated) setRecepcionSeleccionada(updated);
  };

  const handleCantidadChange = (utilId: string, val: number, max: number) => {
    setCantidadesEntregadas(prev => ({
      ...prev,
      [utilId]: Math.min(Math.max(val, 0), max)
    }));
  };

  const recepcionesFiltradas = recepciones.filter(rc => {
    const term = filtroBusqueda.toLowerCase();
    const cumpleBusqueda =
      rc.estudianteNombre.toLowerCase().includes(term) ||
      rc.apoderadoNombre.toLowerCase().includes(term) ||
      rc.grado.toLowerCase().includes(term);

    const cumpleEstado = filtroEstado === "" || rc.estado === filtroEstado;

    return cumpleBusqueda && cumpleEstado;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alumno, apoderado, grado..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Cualquier estado</option>
              <option value="Completo">Completo</option>
              <option value="Incompleto">Incompleto</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          {puedeRegistrar && (
            <button
              onClick={() => {
                setNuevoRecepEstudianteId("");
                setNuevoRecepCantidades({});
                setNuevoRecepObservaciones("");
                setMostrarModalNuevaRecepcion(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Nueva Recepción
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Enrolled Students & Delivery Progress */}
        <div className="xl:col-span-6 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">Historial de Recepciones</span>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {recepcionesFiltradas.length > 0 ? (
              recepcionesFiltradas.map((rc) => {
                const totalItems = rc.items.length;
                const totalEntregados = rc.items.reduce((sum, it) => sum + it.cantidadEntregada, 0);
                const totalEsperados = rc.items.reduce((sum, it) => sum + it.cantidadEsperada, 0);

                return (
                  <div
                    key={rc.id}
                    onClick={() => setRecepcionSeleccionada(rc)}
                    className={`p-4.5 rounded-3xl border transition-all duration-150 cursor-pointer text-xs font-semibold flex items-center justify-between ${
                      recepcionSeleccionada?.id === rc.id
                        ? "bg-emerald-50 border-emerald-300 shadow-xs"
                        : "glass-card hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2 rounded-xl mt-0.5 border ${
                        rc.estado === "Completo"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : rc.estado === "Incompleto"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}>
                        {rc.estado === "Completo" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : rc.estado === "Incompleto" ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <HelpCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{rc.estudianteNombre}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Apoderado: {rc.apoderadoNombre}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {rc.grado}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {totalEntregados} de {totalEsperados} útiles entregados
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        rc.estado === "Completo"
                          ? "bg-emerald-100 text-emerald-800"
                          : rc.estado === "Incompleto"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {rc.estado}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-2 font-mono">{rc.fechaRecepcion}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold">
                No se registraron entregas con la búsqueda actual.
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Delivery Sheet / Action Screen */}
        <div className="xl:col-span-6">
          {recepcionSeleccionada ? (
            <div className="glass-card overflow-hidden flex flex-col justify-between">
              
              {/* Header card */}
              <div className="p-6 bg-slate-50 border-b border-slate-150">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md uppercase">
                      Hoja de Recepción
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-sm mt-2">
                      {recepcionSeleccionada.estudianteNombre}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Grado: {recepcionSeleccionada.grado} ({recepcionSeleccionada.nivel})</p>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    recepcionSeleccionada.estado === "Completo"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : recepcionSeleccionada.estado === "Incompleto"
                      ? "bg-amber-100 text-amber-800 border border-amber-200 animate-pulse"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}>
                    {recepcionSeleccionada.estado}
                  </span>
                </div>
              </div>

              {/* Delivery items details */}
              <div className="p-6 space-y-5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Apoderado:</span>
                    <span className="text-slate-800 font-bold">{recepcionSeleccionada.apoderadoNombre}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400 font-bold">Última Fecha:</span>
                    <span className="text-slate-800 font-bold font-mono">{recepcionSeleccionada.fechaRecepcion}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400 font-bold">Recibido por:</span>
                    <span className="text-slate-800 font-bold">{recepcionSeleccionada.recibidoPor}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Listado de Materiales</span>
                  
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {recepcionSeleccionada.items.map((item, idx) => {
                      const faltante = item.cantidadEsperada - item.cantidadEntregada;
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 text-xs pr-4 line-clamp-2">{item.utilNombre}</span>
                          <div className="text-right shrink-0">
                            <span className="text-xs text-slate-600 block">
                              Recibido: <strong className="text-slate-800">{item.cantidadEntregada}</strong> / {item.cantidadEsperada}
                            </span>
                            {faltante > 0 ? (
                              <span className="text-[9px] text-amber-600 font-bold">Faltan {faltante}</span>
                            ) : (
                              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 justify-end">
                                <Check className="w-3 h-3" /> Completo
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {recepcionSeleccionada.observaciones && (
                  <div className="p-3.5 bg-slate-50 border-l-4 border-emerald-600 text-[11px] text-slate-600 rounded-r-xl">
                    <strong className="text-slate-800 block mb-0.5">Observaciones:</strong>
                    {recepcionSeleccionada.observaciones}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row gap-3">
                {puedeRegistrar && recepcionSeleccionada.estado !== "Completo" && (
                  <button
                    onClick={() => handleAbrirRegistro(recepcionSeleccionada)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-colors"
                  >
                    <CheckSquare className="w-4.5 h-4.5" />
                    Registrar Entrega
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold">
              Seleccione un estudiante del historial para ver el control detallado de su entrega.
            </div>
          )}
        </div>

      </div>

      {/* Modal: Registrar Entrega */}
      {mostrarModalRegistrar && recepcionSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                Registrar Entrega de Útiles
              </h3>
              <button
                onClick={() => setMostrarModalRegistrar(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEntrega} className="p-6 space-y-4 text-xs font-semibold">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1 text-slate-500">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ficha Académica</span>
                <span className="text-xs font-bold text-slate-700">{recepcionSeleccionada.estudianteNombre}</span>
                <span className="text-[10px] font-semibold">{recepcionSeleccionada.grado} - {recepcionSeleccionada.nivel}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">Materiales esperados</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide font-bold">Cantidad Entregada</span>
                </div>

                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {recepcionSeleccionada.items.map((item) => (
                    <div key={item.utilId} className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-700 text-xs pr-4 line-clamp-1">{item.utilNombre}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={item.cantidadEntregada}
                          max={item.cantidadEsperada}
                          value={cantidadesEntregadas[item.utilId] ?? 0}
                          onChange={(e) => handleCantidadChange(item.utilId, Number(e.target.value), item.cantidadEsperada)}
                          className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-400 font-bold">/ {item.cantidadEsperada}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Observaciones de Entrega</label>
                <textarea
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  placeholder="Detallar si faltan materiales, acuerdos de regularización, etc..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none h-16 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalRegistrar(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-bold"
                >
                  <Check className="w-4.5 h-4.5" />
                  Completar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Constancia de Recepción (Official printable mock receipt) */}
      {mostrarConstancia && recepcionSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-xl w-full overflow-hidden animate-scale-up">
            
            {/* Header control */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4.5 h-4.5 text-emerald-600" />
                Imprimir Constancia de Entrega
              </span>
              <button
                onClick={() => setMostrarConstancia(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Official Receipt document itself */}
            <div id="constancia-imprimir" className="p-8 space-y-6 text-xs font-medium text-slate-700 bg-white">
              <div className="text-center border-b border-slate-200 pb-5">
                <h4 className="font-black text-slate-800 text-sm tracking-wide uppercase">{configuracionColegio.nombre}</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">Colegio Privado Particular de Alta Calidad Educativa</p>
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{configuracionColegio.direccion}</p>
                <div className="mt-4 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold inline-block rounded uppercase tracking-wider text-[10px]">
                  Constancia de Recepción de Útiles Escolares - Año {configuracionColegio.anioEscolar}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Código Alumno:</span>
                  <span className="text-slate-800 font-bold block">EST-2026-00{recepcionSeleccionada.id.substring(1)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Fecha Emisión:</span>
                  <span className="text-slate-800 font-bold block font-mono">{recepcionSeleccionada.fechaRecepcion}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Estudiante:</span>
                  <span className="text-slate-800 font-bold block">{recepcionSeleccionada.estudianteNombre}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Apoderado:</span>
                  <span className="text-slate-800 font-bold block">{recepcionSeleccionada.apoderadoNombre}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Grado y Sección:</span>
                  <span className="text-slate-800 font-bold block">{recepcionSeleccionada.grado} ({recepcionSeleccionada.nivel})</span>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Estado Entrega:</span>
                  <span className="text-slate-800 font-bold block uppercase">{recepcionSeleccionada.estado}</span>
                </div>
              </div>

              {/* Items checklist table */}
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wide font-bold block mb-2">Detalle de Materiales Recepcionados:</span>
                <table className="w-full text-left border-collapse border border-slate-150 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-bold uppercase text-slate-500 border-b border-slate-150">
                      <th className="p-2.5 pl-4">Nro.</th>
                      <th className="p-2.5">Descripción Útil</th>
                      <th className="p-2.5 text-center">Requerido</th>
                      <th className="p-2.5 text-center">Entregado</th>
                      <th className="p-2.5 text-center">Faltante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[10px] font-semibold text-slate-700">
                    {recepcionSeleccionada.items.map((it, idx) => {
                      const faltante = it.cantidadEsperada - it.cantidadEntregada;
                      return (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50">
                          <td className="p-2.5 pl-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-800">{it.utilNombre}</td>
                          <td className="p-2.5 text-center font-bold">{it.cantidadEsperada}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-600">{it.cantidadEntregada}</td>
                          <td className="p-2.5 text-center font-bold text-rose-500">{faltante}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {recepcionSeleccionada.observaciones && (
                <div className="p-3 bg-slate-50 border border-slate-200 text-[10px] text-slate-500 rounded-lg">
                  <strong className="text-slate-800 block mb-1">Notas / Compromisos del Apoderado:</strong>
                  {recepcionSeleccionada.observaciones}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-40 border-b border-slate-300 h-12" />
                  <span className="text-[10px] text-slate-800 font-bold mt-2">{recepcionSeleccionada.apoderadoNombre}</span>
                  <span className="text-[8px] text-slate-400 uppercase font-bold mt-0.5">Firma del Apoderado</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-40 border-b border-slate-300 h-12 flex items-end justify-center">
                    <span className="font-mono text-[9px] italic text-slate-300">Sello de Almacén</span>
                  </div>
                  <span className="text-[10px] text-slate-800 font-bold mt-2">{recepcionSeleccionada.recibidoPor}</span>
                  <span className="text-[8px] text-slate-400 uppercase font-bold mt-0.5">Responsable Recepción</span>
                </div>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-150 flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => setMostrarConstancia(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-bold"
              >
                Cerrar Documento
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center gap-2 font-bold shadow-xs"
              >
                <Printer className="w-4.5 h-4.5" />
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nueva Recepción */}
      {mostrarModalNuevaRecepcion && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Nueva Recepción de Útiles
              </h3>
              <button
                onClick={() => setMostrarModalNuevaRecepcion(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaRecepcion} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
              
              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="block text-slate-500 uppercase tracking-wide">Seleccionar Estudiante</label>
                <select
                  value={nuevoRecepEstudianteId}
                  onChange={(e) => handleSelectEstudianteNuevaRecepcion(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="">-- Seleccionar Alumno --</option>
                  {estudiantes
                    .filter(est => est.estado === "Activo")
                    .map(est => (
                      <option key={est.id} value={est.id}>
                        {est.apellidos}, {est.nombres} ({est.grado})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Autoloaded Student and List details */}
              {nuevoRecepEstudianteId && (() => {
                const student = estudiantes.find(e => e.id === nuevoRecepEstudianteId);
                if (!student) return null;
                
                const lista = listas.find(l => l.grado === student.grado);

                return (
                  <div className="space-y-4">
                    {/* Student Info Card */}
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 grid grid-cols-2 gap-3 text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">GRADO / NIVEL</span>
                        <span className="font-bold text-emerald-950">{student.grado} - {student.nivel}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">APODERADO</span>
                        <span className="font-bold text-emerald-950">{student.apoderadoNombre}</span>
                      </div>
                      {student.apoderadoSecundarioNombre && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 font-bold block">APODERADO SECUNDARIO</span>
                          <span className="font-bold text-slate-700">{student.apoderadoSecundarioNombre}</span>
                        </div>
                      )}
                    </div>

                    {/* Materials List Form */}
                    {lista ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            Lista: <span className="text-emerald-800">{lista.nombre}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            CANTIDAD ENTREGADA
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {lista.items.map((item) => {
                            const cantidad = nuevoRecepCantidades[item.utilId] ?? 0;
                            return (
                              <div key={item.utilId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex-1 pr-4">
                                  <span className="font-bold text-slate-700 block text-xs line-clamp-2">{item.utilNombre}</span>
                                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Requerido: {item.cantidadRequerida} unidades</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleCantidadNuevaRecepChange(item.utilId, cantidad - 1, item.cantidadRequerida)}
                                    className="w-7 h-7 bg-white rounded-lg border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center text-sm"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.cantidadRequerida}
                                    value={cantidad}
                                    onChange={(e) => handleCantidadNuevaRecepChange(item.utilId, parseInt(e.target.value) || 0, item.cantidadRequerida)}
                                    className="w-12 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleCantidadNuevaRecepChange(item.utilId, cantidad + 1, item.cantidadRequerida)}
                                    className="w-7 h-7 bg-white rounded-lg border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center text-sm"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>No existe una lista de útiles escolares configurada para el grado "{student.grado}". Registre la lista correspondiente primero.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Observaciones Field */}
              {nuevoRecepEstudianteId && (
                <div className="space-y-1.5">
                  <label className="block text-slate-500 uppercase tracking-wide">Observaciones (Opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre el estado de la entrega, forrado, marcas..."
                    value={nuevoRecepObservaciones}
                    onChange={(e) => setNuevoRecepObservaciones(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  />
                </div>
              )}

              {/* Form Actions footer inside modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevaRecepcion(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    !nuevoRecepEstudianteId ||
                    (() => {
                      const student = estudiantes.find(e => e.id === nuevoRecepEstudianteId);
                      if (!student) return true;
                      const lista = listas.find(l => l.grado === student.grado);
                      return !lista;
                    })()
                  }
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md"
                >
                  Crear Recepción
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
