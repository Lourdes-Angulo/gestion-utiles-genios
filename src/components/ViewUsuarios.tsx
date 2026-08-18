/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Usuario } from "../types";
import {
  Users,
  ShieldAlert,
  UserPlus,
  Edit,
  X,
  Check,
  Trash2,
  Lock,
  Eye,
  KeyRound
} from "lucide-react";

export default function ViewUsuarios() {
  const { usuarios, guardarUsuario, eliminarUsuario, usuarioActivo } = useApp();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState("");
  const [formCorreo, setFormCorreo] = useState("");
  const [formRol, setFormRol] = useState<"Administrador" | "Secretaria">("Secretaria");
  const [formEstado, setFormEstado] = useState<"Activo" | "Inactivo">("Activo");

  const [mensajeExito, setMensajeExito] = useState("");

  const tienePermisosEdicion = ["Administrador", "Secretaria"].includes(usuarioActivo.rol);

  const handleAbrirCrear = () => {
    setUsuarioEditando(null);
    setFormNombre("");
    setFormCorreo("");
    setFormRol("Secretaria");
    setFormEstado("Activo");
    setMostrarModal(true);
  };

  const handleAbrirEditar = (usr: Usuario) => {
    setUsuarioEditando(usr);
    setFormNombre(usr.nombre);
    setFormCorreo(usr.correo);
    setFormRol(usr.rol);
    setFormEstado(usr.estado);
    setMostrarModal(true);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formCorreo) return;

    const nuevoUsuario: Usuario = {
      id: usuarioEditando ? usuarioEditando.id : `usr-${Date.now()}`,
      nombre: formNombre,
      correo: formCorreo,
      rol: formRol,
      permisos: usuarioEditando ? usuarioEditando.permisos : ["Ver todo"],
      estado: formEstado,
      avatar: usuarioEditando ? usuarioEditando.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
    };

    guardarUsuario(nuevoUsuario);
    setMostrarModal(false);
    setMensajeExito(usuarioEditando ? "Usuario actualizado con éxito." : "Nuevo usuario registrado en el sistema.");
    setTimeout(() => setMensajeExito(""), 4000);
  };

  const getPermisosDescripcion = (rol: Usuario["rol"]) => {
    switch (rol) {
      case "Administrador":
        return "Acceso total e irrestricto a todos los módulos, configuración general, gestión de almacén, base de datos y administración de usuarios.";
      case "Secretaria":
        return "Gestión de matrículas (Estudiantes), registro de apoderados, control de recepciones, listas de útiles y consulta de stock.";
      default:
        return "Sin permisos asignados.";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8] text-xs font-semibold">
      
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">
          <Users className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Control Panel / Actions */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Usuarios y Permisos</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Gestión de accesos y asignación de roles para el personal del colegio</p>
          </div>
        </div>

        {tienePermisosEdicion && (
          <button
            onClick={handleAbrirCrear}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            <UserPlus className="w-4.5 h-4.5" />
            Añadir Nuevo Usuario
          </button>
        )}
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usuarios.map((usr) => {
          const esMismoUsuario = usr.id === usuarioActivo.id;
          return (
            <div
              key={usr.id}
              className={`glass-card p-6 flex flex-col justify-between gap-4 relative transition-all duration-200 ${
                esMismoUsuario ? "ring-2 ring-emerald-500/20 bg-emerald-50/5 border-l-4 border-l-emerald-600" : "border-l-4 border-l-slate-400"
              }`}
            >
              
              {/* Top Row: Info and state badge */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-150 flex items-center justify-center font-black text-slate-700 text-sm border border-slate-200 shrink-0">
                    {usr.nombre.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      {usr.nombre}
                      {esMismoUsuario && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px] uppercase tracking-wider">
                          Tú
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5 font-mono">{usr.correo}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  usr.estado === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-150 text-slate-500"
                }`}>
                  {usr.estado}
                </span>
              </div>

              {/* Middle Row: Permissions details */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150/50 text-[11px] text-slate-500 space-y-2">
                <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                  <span className="text-slate-400 uppercase tracking-wide font-bold">Rol de Acceso:</span>
                  <span className="text-emerald-800 font-extrabold">{usr.rol}</span>
                </div>
                <p className="font-semibold leading-relaxed text-slate-600">{getPermisosDescripcion(usr.rol)}</p>
              </div>

              {/* Bottom Actions Row */}
              {tienePermisosEdicion && (
                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAbrirEditar(usr)}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-bold text-[11px] hover:underline"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Perfil
                  </button>

                  {!esMismoUsuario && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Está seguro de eliminar el acceso de ${usr.nombre}?`)) {
                          eliminarUsuario(usr.id);
                        }
                      }}
                      className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-[11px] hover:underline"
                    >
                      <Trash2 className="w-4 h-4" />
                      Dar de Baja
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Modal: Agregar / Editar Usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {usuarioEditando ? "Editar Credenciales" : "Añadir Nuevo Acceso"}
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ejm: Shirley Meléndez"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Correo de Acceso (Email)</label>
                <input
                  type="email"
                  required
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  placeholder="Ejm: s.melendez@iepgenios.edu.pe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Rol Operativo</label>
                  <select
                    value={formRol}
                    onChange={(e) => setFormRol(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Secretaria">Secretaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Estado</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 font-bold"
                >
                  <Check className="w-4.5 h-4.5" />
                  Confirmar Guardado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
