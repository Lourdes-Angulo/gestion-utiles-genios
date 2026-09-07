/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { Usuario } from "../types";
import {
  Users,
  Lock,
  Info
} from "lucide-react";

export default function ViewUsuarios() {
  const { usuarios, usuarioActivo } = useApp();

  const getPermisosDescripcion = (rol: Usuario["rol"]) => {
    switch (rol) {
      case "Administrador":
        return "Acceso total e irrestricto a todos los módulos, gestión de almacén, base de datos y administración de usuarios.";
      case "Secretaria":
        return "Gestión de matrículas (Estudiantes), control de recepciones, listas de útiles y consulta de stock.";
      default:
        return "Sin permisos asignados.";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8] text-xs font-semibold">

      {/* Control Panel / Header */}
      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Usuarios y Permisos</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Roles del personal del colegio con acceso al sistema</p>
          </div>
        </div>
      </div>

      {/* Nota informativa sobre la gestión de cuentas */}
      <div className="glass-card p-4 flex items-start gap-3 bg-indigo-50/30 border-l-4 border-indigo-300">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
          Esta sección muestra los perfiles y sus niveles de acceso. La creación de nuevas cuentas y el cambio
          de contraseñas se gestionan de forma segura desde el panel de administración del sistema (Supabase),
          para garantizar el manejo protegido de las credenciales.
        </p>
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usuarios.map((usr) => {
          const esMismoUsuario = usr.id === usuarioActivo.id;
          return (
            <div
              key={usr.id}
              className={`glass-card p-6 flex flex-col justify-between gap-4 relative transition-all duration-200 ${esMismoUsuario ? "ring-2 ring-emerald-500/20 bg-emerald-50/5 border-l-4 border-l-emerald-600" : "border-l-4 border-l-slate-400"
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

                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${usr.estado === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-150 text-slate-500"
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

            </div>
          );
        })}
      </div>

    </div>
  );
}