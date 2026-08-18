/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Estudiante } from "../types";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  X,
  GraduationCap,
  Check,
  UserCheck,
  AlertCircle
} from "lucide-react";

export default function ViewEstudiantes() {
  const {
    estudiantes,
    apoderados,
    registrarEstudiante,
    editarEstudiante,
    desactivarEstudiante,
    usuarioActivo
  } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");

  // Modals state
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [esEdicion, setEsEdicion] = useState(false);

  // Form states
  const [formNombres, setFormNombres] = useState("");
  const [formApellidos, setFormApellidos] = useState("");
  const [formGrado, setFormGrado] = useState("1er Grado");
  const [formNivel, setFormNivel] = useState<"Inicial" | "Primaria">("Primaria");
  const [formApoderadoId, setFormApoderadoId] = useState("");
  const [formApoderadoSecundarioId, setFormApoderadoSecundarioId] = useState("");

  const [mensajeExito, setMensajeExito] = useState("");

  // Check roles permissions
  const puedeRegistrar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleAbrirRegistro = () => {
    setEsEdicion(false);
    setFormNombres("");
    setFormApellidos("");
    setFormGrado("1er Grado");
    setFormNivel("Primaria");
    setFormApoderadoId(apoderados[0]?.id || "");
    setFormApoderadoSecundarioId("");
    setMostrarModalRegistro(true);
  };

  const handleAbrirEdicion = (est: Estudiante) => {
    setEsEdicion(true);
    setEstudianteSeleccionado(est);
    setFormNombres(est.nombres);
    setFormApellidos(est.apellidos);
    setFormGrado(est.grado);
    setFormNivel(est.nivel as "Inicial" | "Primaria");
    setFormApoderadoId(est.apoderadoId);
    setFormApoderadoSecundarioId(est.apoderadoSecundarioId || "");
    setMostrarModalRegistro(true);
  };

  const handleVerDetalle = (est: Estudiante) => {
    setEstudianteSeleccionado(est);
    setMostrarModalDetalle(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombres.trim() || !formApellidos.trim()) return;

    const guardianSeleccionado = apoderados.find(a => a.id === formApoderadoId);
    const guardianNombre = guardianSeleccionado 
      ? `${guardianSeleccionado.nombres} ${guardianSeleccionado.apellidos}` 
      : "No asignado";

    const guardianSecundarioSeleccionado = apoderados.find(a => a.id === formApoderadoSecundarioId);
    const guardianSecundarioNombre = guardianSecundarioSeleccionado 
      ? `${guardianSecundarioSeleccionado.nombres} ${guardianSecundarioSeleccionado.apellidos}` 
      : undefined;

    if (esEdicion && estudianteSeleccionado) {
      editarEstudiante({
        ...estudianteSeleccionado,
        nombres: formNombres,
        apellidos: formApellidos,
        grado: formGrado,
        nivel: formNivel,
        apoderadoId: formApoderadoId,
        apoderadoNombre: guardianNombre,
        apoderadoSecundarioId: formApoderadoSecundarioId || undefined,
        apoderadoSecundarioNombre: guardianSecundarioNombre || undefined
      });
      setMensajeExito("Estudiante actualizado correctamente.");
    } else {
      registrarEstudiante({
        nombres: formNombres,
        apellidos: formApellidos,
        grado: formGrado,
        nivel: formNivel,
        apoderadoId: formApoderadoId,
        apoderadoNombre: guardianNombre,
        apoderadoSecundarioId: formApoderadoSecundarioId || undefined,
        apoderadoSecundarioNombre: guardianSecundarioNombre || undefined,
        estado: "Activo"
      });
      setMensajeExito("Estudiante registrado con éxito.");
    }

    setMostrarModalRegistro(false);
    setTimeout(() => setMensajeExito(""), 4000);
  };

  // Filter lists
  const estudiantesFiltrados = estudiantes.filter((est) => {
    const cumpleBusqueda =
      `${est.nombres} ${est.apellidos}`.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      est.codigo.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      est.apoderadoNombre.toLowerCase().includes(filtroBusqueda.toLowerCase());

    const cumpleGrado = filtroGrado === "" || est.grado === filtroGrado;
    const cumpleNivel = filtroNivel === "" || est.nivel === filtroNivel;

    return cumpleBusqueda && cumpleGrado && cumpleNivel;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o apoderado..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"
            >
              <option value="">Todos los niveles</option>
              <option value="Inicial">Inicial</option>
              <option value="Primaria">Primaria</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
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

          {puedeRegistrar && (
            <button
              onClick={handleAbrirRegistro}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Registrar Estudiante
            </button>
          )}
        </div>
      </div>

      {/* Students Table Card */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="p-5 pl-8">Código</th>
                <th className="p-5">Estudiante</th>
                <th className="p-5">Nivel</th>
                <th className="p-5">Grado</th>
                <th className="p-5">Apoderado Responsable</th>
                <th className="p-5 text-center">Estado</th>
                <th className="p-5 pr-8 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
              {estudiantesFiltrados.length > 0 ? (
                estudiantesFiltrados.map((est) => (
                  <tr key={est.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="p-5 pl-8 font-mono font-bold text-slate-400">
                      {est.codigo}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          {est.nombres.charAt(0)}{est.apellidos.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {est.nombres} {est.apellidos}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">I.E.P. Alumno</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        est.nivel === "Inicial" 
                          ? "bg-purple-50 text-purple-700 border border-purple-100" 
                          : est.nivel === "Primaria" 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}>
                        {est.nivel}
                      </span>
                    </td>
                    <td className="p-5 font-semibold text-slate-600">
                      {est.grado}
                    </td>
                    <td className="p-5 font-semibold text-slate-600">
                      {est.apoderadoNombre}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        est.estado === "Activo" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {est.estado}
                      </span>
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerDetalle(est)}
                          title="Ver Ficha Detallada"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-150"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {puedeRegistrar && (
                          <>
                            <button
                              onClick={() => handleAbrirEdicion(est)}
                              title="Editar Ficha"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => desactivarEstudiante(est.id)}
                              title={est.estado === "Activo" ? "Desactivar" : "Activar"}
                              className={`p-2 rounded-lg transition-colors duration-150 ${
                                est.estado === "Activo"
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No se encontraron estudiantes con los filtros especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar / Editar Estudiante */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                {esEdicion ? "Editar Ficha de Estudiante" : "Registrar Nuevo Estudiante"}
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
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Nombres</label>
                  <input
                    type="text"
                    required
                    value={formNombres}
                    onChange={(e) => setFormNombres(e.target.value)}
                    placeholder="Ej. Mateo Sebastian"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    placeholder="Ej. Mendoza Flores"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Nivel Educativo</label>
                  <select
                    value={formNivel}
                    onChange={(e) => {
                      const selectedNivel = e.target.value as "Inicial" | "Primaria";
                      setFormNivel(selectedNivel);
                      // Set default grade matching the selected level
                      if (selectedNivel === "Inicial") {
                        setFormGrado("3 años");
                      } else {
                        setFormGrado("1er Grado");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
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
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Apoderado / Tutor Asociado</label>
                <select
                  value={formApoderadoId}
                  onChange={(e) => setFormApoderadoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  {apoderados.map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.nombres} {ap.apellidos}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Si el apoderado no existe, regístrelo previamente en el módulo "Apoderados".
                </p>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Apoderado Secundario (Opcional)</label>
                <select
                  value={formApoderadoSecundarioId}
                  onChange={(e) => setFormApoderadoSecundarioId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="">-- Sin apoderado secundario --</option>
                  {apoderados
                    .filter(ap => ap.id !== formApoderadoId)
                    .map((ap) => (
                      <option key={ap.id} value={ap.id}>
                        {ap.nombres} {ap.apellidos}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Seleccione un apoderado de respaldo o contacto de emergencia secundario de la lista de apoderados.
                </p>
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

      {/* Modal: Ver Detalle del Estudiante */}
      {mostrarModalDetalle && estudianteSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800 rounded-xl text-emerald-300">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Ficha Oficial del Alumno</h3>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold block mt-0.5">{estudianteSeleccionado.codigo}</span>
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
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-black mx-auto shadow-sm border border-emerald-100">
                  {estudianteSeleccionado.nombres.charAt(0)}{estudianteSeleccionado.apellidos.charAt(0)}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{estudianteSeleccionado.nombres} {estudianteSeleccionado.apellidos}</h4>
                <p className="text-[10px] text-slate-400 mt-1">I.E.P. Genios del Millennium</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Nivel de Estudio</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{estudianteSeleccionado.nivel}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Grado y Sección</span>
                  <span className="text-xs text-slate-700 block mt-0.5">{estudianteSeleccionado.grado}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold mb-1.5">Apoderado Autorizado</span>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">{estudianteSeleccionado.apoderadoNombre}</span>
                  {(() => {
                    const parent = apoderados.find(ap => ap.id === estudianteSeleccionado.apoderadoId);
                    if (parent) {
                      return (
                        <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 font-medium">
                          <span>Teléfono: {parent.telefono}</span>
                          <span>Correo: {parent.correo}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {estudianteSeleccionado.apoderadoSecundarioNombre && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-150 flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Contacto de Respaldo Secundario</span>
                      <span className="text-xs font-bold text-slate-700 mt-0.5">{estudianteSeleccionado.apoderadoSecundarioNombre}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl flex items-start gap-2 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold block">Entrega de Útiles Escolares</span>
                  <p className="text-[9px] mt-0.5 leading-relaxed text-slate-600">
                    Puede revisar el estado de la lista de útiles de este estudiante y recepcionar entregas pendientes en el módulo correspondiente.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMostrarModalDetalle(false)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors w-full font-bold"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
