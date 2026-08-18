/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Settings,
  Building2,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  HelpCircle,
  Undo2
} from "lucide-react";

export default function ViewConfiguracion() {
  const {
    configuracionColegio,
    actualizarConfiguracionColegio,
    restablecerValoresDeFabrica,
    usuarioActivo
  } = useApp();

  // Form states
  const [formNombre, setFormNombre] = useState(configuracionColegio.nombre);
  const [formDireccion, setFormDireccion] = useState(configuracionColegio.direccion);
  const [formUgelCode, setFormUgelCode] = useState(configuracionColegio.codigoUgel);
  const [formRdNumber, setFormRdNumber] = useState(configuracionColegio.resolucionDirectoral);
  const [formAnio, setFormAnio] = useState(configuracionColegio.anioEscolar);
  const [formDirector, setFormDirector] = useState(configuracionColegio.directorNombre);
  const [formTelefono, setFormTelefono] = useState(configuracionColegio.telefono);

  const [mensajeExito, setMensajeExito] = useState("");
  const [mostrarModalConfirmarReset, setMostrarModalConfirmarReset] = useState(false);

  const puedeModificar = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleGuardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeModificar) return;

    actualizarConfiguracionColegio({
      nombre: formNombre,
      direccion: formDireccion,
      codigoUgel: formUgelCode,
      resolucionDirectoral: formRdNumber,
      anioEscolar: formAnio,
      directorNombre: formDirector,
      telefono: formTelefono
    });

    setMensajeExito("Parámetros institucionales guardados con éxito.");
    setTimeout(() => setMensajeExito(""), 4000);
  };

  const handleRestablecerFabrica = () => {
    restablecerValoresDeFabrica();
    setFormNombre("I.E.P. Genios del Millennium");
    setFormDireccion("Av. Universitaria 1045, Los Olivos, Lima - Perú");
    setFormUgelCode("UGEL 02 - Rímac/San Martín de Porres/Los Olivos");
    setFormRdNumber("R.D. Nº 0451-2015-ED");
    setFormAnio("2026");
    setFormDirector("Dra. Beatriz Castillo Paredes");
    setFormTelefono("+51 (01) 523-8841");
    
    setMostrarModalConfirmarReset(false);
    setMensajeExito("Base de datos y parámetros restablecidos a valores de fábrica.");
    setTimeout(() => setMensajeExito(""), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8] text-xs font-semibold">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <Settings className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Edit Institutional Settings */}
        <div className="lg:col-span-8 glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-150 bg-slate-50 flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Ficha de Identificación Institucional</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Parámetros de matrícula y cabeceras de constancias oficiales</p>
            </div>
          </div>

          <form onSubmit={handleGuardarConfiguracion} className="p-6 space-y-5">
            <div>
              <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Nombre Oficial de la Institución</label>
              <input
                type="text"
                required
                disabled={!puedeModificar}
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Código UGEL</label>
                <input
                  type="text"
                  required
                  disabled={!puedeModificar}
                  value={formUgelCode}
                  onChange={(e) => setFormUgelCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Resolución Directoral (R.D.)</label>
                <input
                  type="text"
                  required
                  disabled={!puedeModificar}
                  value={formRdNumber}
                  onChange={(e) => setFormRdNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Año Escolar de Gestión</label>
                <input
                  type="text"
                  required
                  disabled={!puedeModificar}
                  value={formAnio}
                  onChange={(e) => setFormAnio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Director(a) General</label>
                <input
                  type="text"
                  required
                  disabled={!puedeModificar}
                  value={formDirector}
                  onChange={(e) => setFormDirector(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Teléfono de Oficina</label>
                <input
                  type="text"
                  required
                  disabled={!puedeModificar}
                  value={formTelefono}
                  onChange={(e) => setFormTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Dirección Física del Local</label>
              <input
                type="text"
                required
                disabled={!puedeModificar}
                value={formDireccion}
                onChange={(e) => setFormDireccion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none disabled:opacity-60"
              />
            </div>

            {puedeModificar && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 font-bold shadow-xs transition-colors"
                >
                  <Check className="w-4.5 h-4.5" />
                  Guardar Configuración
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Info: Maintenance Tools & Backup */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Box 1: Backup & Reset */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Mantenimiento de Datos</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Control de registros y restauración</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              En caso de requerir re-inicializar el prototipo con todos sus alumnos, movimientos de almacén y predicciones iniciales ficticias, ejecute el restablecimiento general.
            </p>

            {["Administrador"].includes(usuarioActivo.rol) ? (
              <button
                type="button"
                onClick={() => setMostrarModalConfirmarReset(true)}
                className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-150 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Undo2 className="w-4.5 h-4.5" />
                Restablecer Base de Datos
              </button>
            ) : (
              <div className="p-3.5 bg-amber-50 text-amber-800 border border-amber-150 rounded-2xl flex items-start gap-2.5">
                <Shield className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-600" />
                <span className="text-[10px] font-semibold leading-relaxed">
                  Solo los perfiles con rol <strong>Administrador</strong> están facultados para vaciar la memoria de la aplicación.
                </span>
              </div>
            )}
          </div>



        </div>

      </div>

      {/* Confirmation Modal for Reset */}
      {mostrarModalConfirmarReset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-150 max-w-sm w-full text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
              <Undo2 className="w-6 h-6" />
            </div>
            
            <div>
              <h4 className="text-sm font-black text-slate-800">¿Restablecer Base de Datos?</h4>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                Esta acción restablecerá por completo todos los estudiantes, apoderados, movimientos cargados y recepciones hechas a los valores de fábrica de la I.E.P. Genios del Millennium. Esta operación es irreversible.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmarReset(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestablecerFabrica}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
