import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Users, Lock, UserPlus, RefreshCw, Search, AlertCircle, CheckCircle2, X, ShieldCheck, Pencil, UserX, UserCheck, KeyRound, Eye, EyeOff, Camera, ImagePlus } from "lucide-react";



import IndicadorSeguridadContrasena from "../IndicadorSeguridadContrasena";

import { evaluarContrasena } from "../../lib/passwordPolicy";



type Rol = "Administrador" | "Secretaria" | "Profesora" | "Auxiliar";

type Estado = "Activo" | "Inactivo";

type PerfilUsuario = {

  id: string;

  nombre: string;

  correo: string;

  rol: Rol | string;

  estado: Estado | string;

  authUserId: string | null;

  dni: string | null;

  origen_nombre: "api" | "manual" | null;

  codigo_institucional?: string | null;
  nivel_asignado?: "Inicial" | "Primaria" | null;
  aula_asignada?: string | null;

};

type Modo = "crear" | "editar" | "clave" | null;

const roles = ["Secretaria", "Profesora", "Auxiliar"] as const;

const aulasPorNivel: Record<"Inicial" | "Primaria", string[]> = {
  Inicial: ["3 años", "4 años", "5 años"],
  Primaria: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
};

const prefijos: Record<RolEditable, string> = { Secretaria: "SEC", Profesora: "DOC", Auxiliar: "AUX" };

type RolEditable = (typeof roles)[number];

const esRolEditable = (v: string): v is RolEditable => roles.some((r) => r === v);



// Debe coincidir con la política de las pantallas Mi Perfil y Restablecer.
const claveValida = (v: string) => v.length >= 15 && evaluarContrasena(v).esValida;



function detallesRol(rol: string): string {

  switch (rol) {

    case "Administrador": return "Administración, gestión de usuarios y auditoría.";

    case "Secretaria": case "Secretaría": return "Gestión administrativa de estudiantes, listas y recepción.";

    case "Profesora": return "Seguimiento de estudiantes y útiles según los permisos asignados.";

    case "Auxiliar": return "Registro de recepción y control de útiles según los permisos asignados.";

    default: return "Pendiente de configuración.";

  }

}



export default function ViewUsuarios() {

  const [autorizado, setAutorizado] = useState(false);

  const [verificando, setVerificando] = useState(true);

  const [cargando, setCargando] = useState(false);

  const [guardando, setGuardando] = useState(false);

  const [buscandoDni, setBuscandoDni] = useState(false);

  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);

  const [miAuthId, setMiAuthId] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [modo, setModo] = useState<Modo>(null);

  const [seleccionado, setSeleccionado] = useState<PerfilUsuario | null>(null);

  const [dni, setDni] = useState("");

  const [origenNombre, setOrigenNombre] = useState<"api" | "manual" | null>("manual");

  const [nombre, setNombre] = useState("");

  const [correo, setCorreo] = useState("");

  const [rol, setRol] = useState<RolEditable>("Secretaria");
  const [nivelAsignado, setNivelAsignado] = useState<"" | "Inicial" | "Primaria">("");
  const [aulaAsignada, setAulaAsignada] = useState("");

  const [clave, setClave] = useState("");

  const [mostrarClave, setMostrarClave] = useState(false);

  const [foto, setFoto] = useState<File | null>(null);

  const [fotoVistaPrevia, setFotoVistaPrevia] = useState<string | null>(null);

  useEffect(() => {

    if (!foto) { setFotoVistaPrevia(null); return; }

    const url = URL.createObjectURL(foto);

    setFotoVistaPrevia(url);

    return () => URL.revokeObjectURL(url);

  }, [foto]);



  const seleccionarFoto = (archivo?: File) => {

    if (!archivo) return;

    if (!archivo.type.startsWith("image/") || archivo.size > 2 * 1024 * 1024) {

      setError("Selecciona una imagen JPG, PNG o WebP de máximo 2 MB.");

      return;

    }

    setError("");

    setFoto(archivo);

  };

  const [error, setError] = useState("");

  const [mensaje, setMensaje] = useState("");



  const cargarUsuarios = useCallback(async () => { setCargando(false); }, []);
  useEffect(() => {
    setVerificando(false);
    setAutorizado(true);
    setMiAuthId('demo-admin');
    setUsuarios([
      {id:'demo-admin',nombre:'Administrador (Ejemplo)',correo:'admin@ejemplo.invalid',rol:'Administrador',estado:'Activo',authUserId:'demo-admin',dni:null,origen_nombre:'manual',codigo_institucional:'ADM-DEMO-001'},
      {id:'demo-prof',nombre:'Profesora (Ejemplo)',correo:'',rol:'Profesora',estado:'Activo',authUserId:'demo-prof',dni:null,origen_nombre:'manual',codigo_institucional:'DOC-DEMO-001',nivel_asignado:'Inicial',aula_asignada:'3 años'},
      {id:'demo-aux',nombre:'Auxiliar (Ejemplo)',correo:'',rol:'Auxiliar',estado:'Activo',authUserId:'demo-aux',dni:null,origen_nombre:'manual',codigo_institucional:'AUX-DEMO-001',nivel_asignado:'Inicial'},
      {id:'demo-sec',nombre:'Secretaría (Ejemplo)',correo:'',rol:'Secretaria',estado:'Activo',authUserId:'demo-sec',dni:null,origen_nombre:'manual',codigo_institucional:'SEC-DEMO-001'}
    ]);
  }, []);
  const denegado = () => setError('No tienes permiso para realizar esta acción. ING-0001 es de solo lectura.');
  const abrirNuevo = denegado;
  const abrirEditar = (_u: PerfilUsuario) => denegado();
  const abrirClave = (_u: PerfilUsuario) => denegado();
  const buscarDni = async () => { denegado(); };
  const guardar = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); denegado(); };
  const alternarEstado = async (_u: PerfilUsuario) => { denegado(); };

  const filtrados = usuarios.filter((u) => `${u.codigo_institucional ?? ""} ${u.nombre} ${u.correo} ${u.rol} ${u.estado}`.toLowerCase().includes(busqueda.trim().toLowerCase()));

  const activos = usuarios.filter((u) => u.estado === "Activo").length;

  return (

    <div className="flex-1 overflow-y-auto bg-[#f0f4f8] p-5 text-slate-800 md:p-8">

      <div className="mx-auto max-w-6xl space-y-5">

        <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">

          <div className="flex items-center gap-3"><Lock className="h-6 w-6 text-emerald-600" /><div><h2 className="text-lg font-bold">Usuarios</h2><p className="text-sm text-slate-500">Personal autorizado para ingresar a SIGUE.</p></div></div>

          {autorizado && <div className="flex gap-2"><button type="button" onClick={() => void cargarUsuarios()} disabled={cargando} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><RefreshCw size={16} /> Actualizar</button><button type="button" onClick={abrirNuevo} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><UserPlus size={17} /> Nuevo usuario</button></div>}

        </div>

        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={19} /><span>{error}</span></div>}

        {mensaje && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={19} /><span>{mensaje}</span></div>}

        {verificando ? <p className="text-sm">Verificando permisos...</p> : autorizado ? <>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="glass-card p-4"><p className="text-sm text-slate-500">Usuarios registrados</p><p className="text-2xl font-bold">{usuarios.length}</p></div>

            <div className="glass-card p-4"><p className="text-sm text-slate-500">Activos</p><p className="text-2xl font-bold text-emerald-700">{activos}</p></div>

            <div className="glass-card p-4"><p className="text-sm text-slate-500">Inactivos</p><p className="text-2xl font-bold">{usuarios.length - activos}</p></div>

          </div>

          <div className="glass-card space-y-4 p-5">

            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-base font-bold"><Users size={19} className="text-emerald-600" /> Listado de usuarios</h3><div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2"><Search size={17} className="text-slate-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar código, usuario o rol" aria-label="Buscar usuarios" className="w-56 max-w-full text-sm outline-none" /></div></div>

            <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead className="border-b bg-slate-50 text-slate-600"><tr><th className="p-3">Código</th><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Estado</th><th className="p-3">Acceso</th><th className="p-3">Acciones</th></tr></thead><tbody>{filtrados.map((u) => <tr key={u.id} className="border-b border-slate-100"><td className="p-3 font-mono text-xs font-semibold text-emerald-700">{u.codigo_institucional || "Sin asignar"}</td><td className="p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700" aria-hidden="true">{u.nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase()}</div><div><div className="font-bold">{u.nombre}{u.authUserId === miAuthId && <span className="ml-2 text-xs text-emerald-600">(Tú)</span>}</div><div className="break-all text-xs text-slate-500">{u.correo}</div>{u.nivel_asignado && <div className="text-xs text-emerald-700">{u.nivel_asignado}{u.aula_asignada ? ` · ${u.aula_asignada}` : " · Todo el nivel"}</div>}</div></div></td><td className="p-3"><p className="font-semibold">{u.rol === "Secretaria" ? "Secretaría" : u.rol}</p><p className="max-w-xs text-xs text-slate-500">{detallesRol(u.rol)}</p></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${u.estado === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{u.estado}</span></td><td className="p-3 text-xs">{u.authUserId ? "Vinculado" : "Sin vincular"}</td><td className="p-3">{u.rol !== "Administrador" && <div className="flex flex-wrap gap-2"><button type="button" onClick={() => abrirEditar(u)} title="Editar usuario" aria-label={`Editar ${u.nombre}`} className="rounded-lg border p-2 hover:bg-slate-50"><Pencil size={16} /></button><button type="button" onClick={() => abrirClave(u)} title="Asignar contraseña provisional" aria-label={`Cambiar contraseña de ${u.nombre}`} className="rounded-lg border p-2 hover:bg-slate-50"><KeyRound size={16} /></button><button type="button" disabled={guardando} onClick={() => void alternarEstado(u)} title={u.estado === "Activo" ? "Inhabilitar" : "Habilitar"} aria-label={`Cambiar estado de ${u.nombre}`} className="rounded-lg border p-2 hover:bg-slate-50">{u.estado === "Activo" ? <UserX size={16} /> : <UserCheck size={16} />}</button></div>}</td></tr>)}</tbody></table>{!cargando && filtrados.length === 0 && <p className="p-5 text-center text-sm text-slate-500">No se encontraron usuarios.</p>}{cargando && <p className="p-4 text-sm">Actualizando usuarios...</p>}</div>

          </div>

        </> : <div className="glass-card flex gap-3 p-5 text-sm"><ShieldCheck className="text-emerald-600" size={20} /> Solo el Administrador puede consultar esta pantalla.</div>}

      </div>

      {modo && autorizado && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 md:p-6"

          role="dialog"

          aria-modal="true"

          aria-label={modo === "crear" ? "Registrar usuario" : modo === "editar" ? "Editar usuario" : "Cambiar contraseña"}

        >

          <form

            onSubmit={(e) => void guardar(e)}

            className={`my-auto w-full space-y-5 rounded-2xl bg-white p-5 shadow-xl md:p-7 ${modo === "clave" ? "max-w-xl" : "max-w-5xl"}`}

          >

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">

              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">

                <UserPlus className="text-emerald-600" size={21} />

                {modo === "crear" ? "Registrar nuevo usuario" : modo === "editar" ? "Editar usuario" : "Asignar contraseña provisional"}

              </h3>

              <button type="button" onClick={() => setModo(null)} disabled={guardando} aria-label="Cerrar"><X size={20} /></button>

            </div>



            {modo === "clave" ? (

              <div className="space-y-4">

                <label className="block text-sm font-semibold">Contraseña provisional

                  <div className="relative mt-1">

                    <input required type={mostrarClave ? "text" : "password"} autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} disabled={guardando} className="w-full rounded-xl border p-3 pr-12 font-normal" />

                    <button type="button" onClick={() => setMostrarClave(!mostrarClave)} aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-3 text-slate-600">{mostrarClave ? <EyeOff size={19} /> : <Eye size={19} />}</button>

                  </div>

                </label>

                <IndicadorSeguridadContrasena contrasena={clave} />

                <p className="text-xs text-slate-500">La persona deberá cambiar esta contraseña en su primer acceso. Entrégala mediante un canal seguro.</p>

              </div>

            ) : (

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">

                <section className="space-y-4">

                  <h4 className="text-sm font-bold text-slate-800">Datos personales y acceso</h4>

                  {(modo === "crear" || modo === "editar") && (

                    <label className="block text-sm font-semibold">DNI

                      <div className="mt-1 flex gap-2">

                        <input inputMode="numeric" maxLength={8} value={dni} onChange={(e) => { setDni(e.target.value.replace(/\D/g, "")); setOrigenNombre("manual"); }} readOnly={modo === "editar" && seleccionado?.origen_nombre === "api"} placeholder="8 dígitos" className={`min-w-0 flex-1 rounded-xl border p-3 font-normal ${modo === "editar" && seleccionado?.origen_nombre === "api" ? "bg-slate-100" : ""}`} />

                        <button type="button" onClick={() => void buscarDni()} disabled={buscandoDni || guardando || dni.length !== 8 || (modo === "editar" && seleccionado?.origen_nombre === "api")} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{buscandoDni ? "Buscando..." : "Buscar"}</button>

                      </div>

                    </label>

                  )}

                  <label className="block text-sm font-semibold">Nombre completo

                    <input required minLength={3} maxLength={160} value={nombre}

                      onChange={(e) => { setNombre(e.target.value); setOrigenNombre("manual"); }}

                      readOnly={origenNombre === "api"}

                      disabled={guardando}

                      className={`mt-1 w-full rounded-xl border p-3 font-normal ${origenNombre === "api" ? "cursor-not-allowed bg-slate-100 text-slate-600" : ""}`} />

                    <span className="mt-1 block text-xs font-normal text-slate-500">

                      {origenNombre === "api" ? "Nombre obtenido por consulta DNI; no se modifica manualmente." :

                        origenNombre === null ? "Origen del nombre no identificado. Puedes consultarlo con el DNI para verificarlo." :

                        "Nombre ingresado manualmente; puedes corregirlo."}

                    </span>

                  </label>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">

                    <label className="block text-sm font-semibold text-emerald-900">Código institucional</label>

                    <div className="mt-1 rounded-lg border border-emerald-100 bg-white px-3 py-3 font-mono text-sm font-semibold text-slate-700">

                      {modo === "editar" ? seleccionado?.codigo_institucional || "Aún no asignado" : `${prefijos[rol]}- (asignado al guardar)`}

                    </div>

                    <p className="mt-1 text-xs font-normal text-slate-500">

                      {modo === "crear" ? "El número consecutivo se reserva automáticamente en Supabase al registrar el usuario; no se reinicia la numeración." : "Código fijo: no se modifica al cambiar de rol."}

                    </p>

                  </div>

                  <label className="block text-sm font-semibold">Correo electrónico de recuperación (opcional)

                    <input type="email" maxLength={254} value={correo} onChange={(e) => setCorreo(e.target.value)} readOnly={modo === "editar"} disabled={guardando} className="mt-1 w-full rounded-xl border p-3 font-normal" />

                  </label>

                  <label className="block text-sm font-semibold">Rol
                    <select value={rol} onChange={(e) => {
                      const nuevoRol = e.target.value as RolEditable;
                      setRol(nuevoRol);
                      if (nuevoRol === "Secretaria") { setNivelAsignado(""); setAulaAsignada(""); }
                      else if (nuevoRol === "Auxiliar") setAulaAsignada("");
                    }} disabled={guardando} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal">
                      <option value="Secretaria">Secretaría</option>
                      <option value="Profesora">Profesora</option>
                      <option value="Auxiliar">Auxiliar</option>
                    </select>
                  </label>

                </section>

                <section className="space-y-4">

                  <h4 className="text-sm font-bold text-slate-800">Foto de perfil {modo === "crear" ? "y seguridad" : ""}</h4>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm">

                      {fotoVistaPrevia ? <img src={fotoVistaPrevia} alt="Vista previa de la foto" className="h-full w-full object-cover" /> : <span aria-label="Avatar predeterminado">{nombre.trim() ? nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() : <Camera size={28} />}</span>}

                    </div>

                    <div className="min-w-0 space-y-1">

                      <label htmlFor="foto-usuario" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"><ImagePlus size={16} /> Subir imagen</label>

                      <input id="foto-usuario" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={guardando} onChange={(e) => seleccionarFoto(e.target.files?.[0])} />

                      <p className="text-xs font-normal text-slate-500">JPG, PNG o WebP · máximo 2 MB.</p>

                      {foto && <><p className="max-w-[220px] truncate text-xs text-emerald-700">{foto.name}</p><button type="button" onClick={() => setFoto(null)} className="text-xs font-semibold text-slate-600 underline">Quitar imagen</button></>}

                      <p className="text-xs font-normal text-amber-700">Vista previa; falta conectar el guardado de fotos.</p>

                    </div>

                  </div>

                  {(rol === "Profesora" || rol === "Auxiliar") && (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <p className="text-sm font-bold text-emerald-900">Asignación académica</p>
                      <p className="text-xs text-slate-600">
                        {rol === "Profesora" ? "La profesora trabajará únicamente con su aula asignada." : "La auxiliar atenderá las recepciones de todo el nivel seleccionado."}
                      </p>
                      <label className="block text-sm font-semibold text-slate-700">
                        Nivel asignado
                        <select
                          value={nivelAsignado}
                          onChange={(e) => { setNivelAsignado(e.target.value as "" | "Inicial" | "Primaria"); setAulaAsignada(""); }}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal"
                        >
                          <option value="">Seleccionar nivel</option>
                          <option value="Inicial">Inicial</option>
                          <option value="Primaria">Primaria</option>
                        </select>
                      </label>
                      {rol === "Profesora" && (
                        <label className="block text-sm font-semibold text-slate-700">
                          Aula asignada
                          <select
                            value={aulaAsignada}
                            onChange={(e) => setAulaAsignada(e.target.value)}
                            disabled={!nivelAsignado}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal disabled:opacity-50"
                          >
                            <option value="">Seleccionar aula</option>
                            {nivelAsignado && aulasPorNivel[nivelAsignado].map(aula => <option key={aula} value={aula}>{aula}</option>)}
                          </select>
                        </label>
                      )}
                      <p className="text-xs font-medium text-amber-700">
                        {modo === "crear" ? "El alta segura de Profesora y Auxiliar usa Clerk. La opción Secretaría necesita su propio flujo de Supabase Auth." : "Al guardar, el nivel y el aula serán validados por la función segura de Supabase."}
                      </p>
                    </div>
                  )}

                  {modo === "crear" && (

                    <div className="space-y-3">

                      <label className="block text-sm font-semibold">Contraseña provisional

                        <div className="relative mt-1">

                          <input required type={mostrarClave ? "text" : "password"} autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} disabled={guardando} className="w-full rounded-xl border p-3 pr-12 font-normal" />

                          <button type="button" onClick={() => setMostrarClave(!mostrarClave)} aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-3 text-slate-600">{mostrarClave ? <EyeOff size={19} /> : <Eye size={19} />}</button>

                        </div>

                      </label>

                      <IndicadorSeguridadContrasena contrasena={clave} />

                      <p className="text-xs text-slate-500">La persona deberá cambiar esta contraseña al iniciar sesión por primera vez.</p>

                      <p className="text-xs font-semibold text-amber-700">El código consecutivo se asigna al registrar. El correo no es obligatorio. Requiere mínimo 15 caracteres en la contraseña.</p>

                    </div>

                  )}

                </section>

              </div>

            )}



            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

              <button type="button" onClick={() => setModo(null)} disabled={guardando} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button>

              <button type="submit" disabled={guardando || (modo === "crear" && (rol === "Secretaria" || !claveValida(clave))) || (modo === "clave" && !claveValida(clave))} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{guardando ? "Guardando..." : modo === "crear" ? "Registrar usuario" : modo === "editar" ? "Guardar cambios" : "Asignar contraseña"}</button>

            </div>

          </form>

        </div>

      )}

    </div>

  );

}
