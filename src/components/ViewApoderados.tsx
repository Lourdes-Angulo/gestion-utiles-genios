/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Apoderado } from "../types";
import {
  Search,
  Plus,
  Edit2,
  Users,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  FileText
} from "lucide-react";

export default function ViewApoderados() {
  const {
    apoderados,
    registrarApoderado,
    editarApoderado,
    usuarioActivo
  } = useApp();

  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [apoderadoSeleccionado, setApoderadoSeleccionado] = useState<Apoderado | null>(null);

  // Form states
  const [formNombres, setFormNombres] = useState("");
  const [formApellidos, setFormApellidos] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formCorreo, setFormCorreo] = useState("");
  const [formDireccion, setFormDireccion] = useState("");

  const [mensajeExito, setMensajeExito] = useState("");

  const puedeRegistrar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleAbrirRegistro = () => {
    setEsEdicion(false);
    setFormNombres("");
    setFormApellidos("");
    setFormTelefono("");
    setFormCorreo("");
    setFormDireccion("");
    setMostrarModalRegistro(true);
  };

  const handleAbrirEdicion = (apod: Apoderado) => {
    setEsEdicion(true);
    setApoderadoSeleccionado(apod);
    setFormNombres(apod.nombres);
    setFormApellidos(apod.apellidos);
    setFormTelefono(apod.telefono);
    setFormCorreo(apod.correo);
    setFormDireccion(apod.direccion);
    setMostrarModalRegistro(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombres.trim() || !formApellidos.trim()) return;

    if (esEdicion && apoderadoSeleccionado) {
      editarApoderado({
        ...apoderadoSeleccionado,
        nombres: formNombres,
        apellidos: formApellidos,
        telefono: formTelefono,
        correo: formCorreo,
        direccion: formDireccion
      });
      setMensajeExito("Datos del apoderado actualizados con éxito.");
    } else {
      registrarApoderado({
        nombres: formNombres,
        apellidos: formApellidos,
        telefono: formTelefono,
        correo: formCorreo,
        direccion: formDireccion,
        estudiantesIds: [],
        estudiantesNombres: []
      });
      setMensajeExito("Apoderado registrado correctamente en el sistema.");
    }

    setMostrarModalRegistro(false);
    setTimeout(() => setMensajeExito(""), 4000);
  };

  const apoderadosFiltrados = apoderados.filter(ap => {
    const term = filtroBusqueda.toLowerCase();
    return (
      `${ap.nombres} ${ap.apellidos}`.toLowerCase().includes(term) ||
      ap.telefono.includes(term) ||
      ap.correo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <Users className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Control Panel */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
          />
        </div>

        {puedeRegistrar && (
          <button
            onClick={handleAbrirRegistro}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Registrar Apoderado
          </button>
        )}
      </div>

      {/* Grid of Guardians - Bento/Card Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apoderadosFiltrados.length > 0 ? (
          apoderadosFiltrados.map((apod) => (
            <div
              key={apod.id}
              className="glass-card p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                      {apod.nombres.charAt(0)}{apod.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        {apod.nombres} {apod.apellidos}
                      </h4>
                    </div>
                  </div>
                  
                  {puedeRegistrar && (
                    <button
                      onClick={() => handleAbrirEdicion(apod)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Body details */}
                <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{apod.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{apod.correo}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate" title={apod.direccion}>{apod.direccion}</span>
                  </div>
                </div>
              </div>

              {/* Related students */}
              <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 p-3 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  Alumnos Relacionados ({apod.estudiantesNombres.length})
                </span>
                {apod.estudiantesNombres.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {apod.estudiantesNombres.map((name, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-100 shadow-2xs"
                      >
                        <FileText className="w-3 h-3 text-emerald-600" />
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic block">
                    No tiene alumnos asignados todavía. Registre un alumno vinculándolo a este apoderado.
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-150 text-center text-slate-400 font-bold lg:col-span-2">
            No se encontraron apoderados con el término buscado.
          </div>
        )}
      </div>

      {/* Modal: Registrar / Editar Apoderado */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {esEdicion ? "Modificar Datos de Apoderado" : "Registrar Nuevo Apoderado"}
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
                    placeholder="Ej. Carlos Alberto"
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
                    placeholder="Ej. Mendoza Quispe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Teléfono Celular</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    pattern="9\d{8}"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej. 987654321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Dirección del Domicilio</label>
                <input
                  type="text"
                  required
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  placeholder="Ej. Av. Las Flores 450, San Juan de Lurigancho, Lima"
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

    </div>
  );
}
