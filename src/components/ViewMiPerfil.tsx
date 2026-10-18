import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@clerk/react";
import {
  UserRound, Mail, ShieldCheck, LockKeyhole, Eye, EyeOff, Save,
  AlertCircle, CheckCircle2, Clock3, RefreshCw, Send, Plus,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseClerk } from "../lib/useSupabaseClerk";
import IndicadorSeguridadContrasena from "./IndicadorSeguridadContrasena";
import { evaluarContrasena } from "../lib/passwordPolicy";

type Perfil = {
  nombre: string | null;
  correo: string | null;
  dni: string | null;
  rol: string | null;
  estado: string | null;
  codigo_institucional: string | null;
  nivel_asignado: string | null;
  aula_asignada: string | null;
};

type EstadoCorreo = {
  correo_secundario: string | null;
  verificado: boolean;
  correo_pendiente: string | null;
};

const caja = "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all";
const entrada = "w-full max-w-lg rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60";

export default function ViewMiPerfil() {
  const { cliente: clienteClerk, isLoaded, isSignedIn, clerkUserId } = useSupabaseClerk();
  const { user: usuarioClerk } = useUser();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [proveedor, setProveedor] = useState<"clerk" | "supabase" | null>(null);
  const [correoAuth, setCorreoAuth] = useState("");
  const [correoVerificado, setCorreoVerificado] = useState(false);
  const [estadoCorreo, setEstadoCorreo] = useState<EstadoCorreo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [mostrarAgregarCorreo, setMostrarAgregarCorreo] = useState(false);
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [codigoVerificacion, setCodigoVerificacion] = useState("");
  const [correoPendienteId, setCorreoPendienteId] = useState<string | null>(null);
  const [emailPendiente, setEmailPendiente] = useState("");
  const [procesandoCorreo, setProcesandoCorreo] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    let vigente = true;
    async function cargar() {
      setCargando(true);
      setError("");
      setPerfil(null);
      setProveedor(null);
      try {
        if (isSignedIn && clerkUserId) {
          const { data, error: fallo } = await clienteClerk.from("usuarios")
            .select("nombre,correo,dni,rol,estado,codigo_institucional,nivel_asignado,aula_asignada,debe_cambiar_contrasena")
            .eq("clerk_user_id", clerkUserId).maybeSingle();
          if (fallo || !data || data.estado !== "Activo" || data.debe_cambiar_contrasena) {
            throw new Error("No se pudo validar tu perfil institucional con Clerk.");
          }
          if (vigente) {
            setPerfil(data as Perfil);
            setProveedor("clerk");
            setCorreoAuth(usuarioClerk?.primaryEmailAddress?.emailAddress ?? "");
            setCorreoVerificado(usuarioClerk?.primaryEmailAddress?.verification?.status === "verified");
            // El registro de correo adicional actual usa UUID de Supabase Auth.
            setEstadoCorreo(null);
          }
        } else {
          const { data: auth, error: authError } = await supabase.auth.getUser();
          if (authError || !auth.user) throw new Error("No existe una sesión autenticada.");
          const { data, error: fallo } = await supabase.from("usuarios")
            .select("nombre,correo,dni,rol,estado,codigo_institucional,nivel_asignado,aula_asignada")
            .eq("authUserId", auth.user.id).maybeSingle();
          if (fallo || !data || data.estado !== "Activo") {
            throw new Error("No se pudo validar tu perfil institucional.");
          }
          const resultado = await supabase.rpc("obtener_mi_estado_correo");
          const extra = Array.isArray(resultado.data) ? resultado.data[0] ?? null : resultado.data ?? null;
          if (vigente) {
            setPerfil(data as Perfil);
            setProveedor("supabase");
            setCorreoAuth(auth.user.email ?? "");
            setCorreoVerificado(Boolean(auth.user.email_confirmed_at));
            setEstadoCorreo(resultado.error ? null : extra as EstadoCorreo | null);
          }
        }
      } catch (e) {
        if (vigente) setError(e instanceof Error ? e.message : "No se pudo cargar el perfil.");
      } finally {
        if (vigente) setCargando(false);
      }
    }
    void cargar();
    return () => { vigente = false; };
  }, [isLoaded, isSignedIn, clerkUserId, clienteClerk, usuarioClerk]);

  const actualizarEstado = async () => {
    setActualizando(true);
    setError(""); setMensaje("");
    try {
      if (proveedor === "clerk") {
        await usuarioClerk?.reload();
        setCorreoAuth(usuarioClerk?.primaryEmailAddress?.emailAddress ?? "");
        setCorreoVerificado(usuarioClerk?.primaryEmailAddress?.verification?.status === "verified");
      } else {
        const { data, error: fallo } = await supabase.auth.getUser();
        if (fallo || !data.user) throw new Error("Sesión no disponible.");
        setCorreoAuth(data.user.email ?? "");
        setCorreoVerificado(Boolean(data.user.email_confirmed_at));
        const extra = await supabase.rpc("obtener_mi_estado_correo");
        setEstadoCorreo(extra.error ? null : (Array.isArray(extra.data) ? extra.data[0] ?? null : extra.data));
      }
      setMensaje("Información de correo actualizada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el correo.");
    } finally { setActualizando(false); }
  };

  const agregarCorreo = async (e: FormEvent) => {
    e.preventDefault();
    if (procesandoCorreo) return;
    setError(""); setMensaje("");
    const correo = nuevoCorreo.trim().toLowerCase();
    if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError("Introduce una dirección de correo válida."); return;
    }
    setProcesandoCorreo(true);
    try {
      if (proveedor === "clerk") {
        if (!usuarioClerk) throw new Error("No hay sesión de Clerk disponible.");
        const existente = usuarioClerk.emailAddresses.find(ea => ea.emailAddress.toLowerCase() === correo);
        const email = existente ?? await usuarioClerk.createEmailAddress({ email: correo });
        if (email.verification?.status === "verified") {
          setMensaje("Este correo ya está verificado en Clerk.");
          setCorreoAuth(email.emailAddress);
          setCorreoVerificado(true);
          setMostrarAgregarCorreo(false);
          return;
        }
        await email.prepareVerification({ strategy: "email_code" });
        setCorreoPendienteId(email.id);
        setEmailPendiente(correo);
        setCodigoVerificacion("");
        setMensaje("Se envió un código de verificación a tu correo. Introduce el código recibido.");
      } else if (proveedor === "supabase") {
        // Esta función debe validar la sesión y verificar el correo del lado servidor.
        // No cambia el correo de inicio de sesión ni marca verificaciones desde el cliente.
        const { data, error: fallo } = await supabase.functions.invoke("solicitar-verificacion-correo", {
          body: { correo },
        });
        if (fallo) {
          let detalle = "No está disponible el envío de verificación. Comprueba que la función segura esté desplegada.";
          if (fallo.context instanceof Response) {
            const cuerpo = await fallo.context.clone().json().catch(() => null);
            if (typeof cuerpo?.error === "string") detalle = cuerpo.error;
          }
          throw new Error(detalle);
        }
        if (!data?.ok) throw new Error(data?.error || "No se pudo solicitar la verificación.");
        setEmailPendiente(correo);
        setMensaje("Solicitud enviada. Revisa tu correo y sigue el enlace de verificación; aún no está vinculado.");
        const extra = await supabase.rpc("obtener_mi_estado_correo");
        if (!extra.error) setEstadoCorreo(Array.isArray(extra.data) ? extra.data[0] ?? null : extra.data);
      } else throw new Error("No se ha identificado una sesión válida.");
    } catch (e) {
      const detalles = (e as { errors?: { longMessage?: string; message?: string }[] })?.errors;
      setError(detalles?.[0]?.longMessage || detalles?.[0]?.message || (e instanceof Error ? e.message : "Error al registrar el correo."));
    } finally { setProcesandoCorreo(false); }
  };

  const verificarCorreoClerk = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioClerk || !correoPendienteId || procesandoCorreo) return;
    setError(""); setMensaje(""); setProcesandoCorreo(true);
    try {
      const email = usuarioClerk.emailAddresses.find(item => item.id === correoPendienteId);
      if (!email) throw new Error("No encontramos el correo pendiente; actualiza la página y vuelve a agregarlo.");
      const resultado = await email.attemptVerification({ code: codigoVerificacion.trim() });
      if (resultado.verification?.status !== "verified") {
        throw new Error("El código no pudo verificarse. Compruébalo e inténtalo otra vez.");
      }
      await usuarioClerk.reload();
      setCorreoPendienteId(null);
      setCodigoVerificacion("");
      setNuevoCorreo("");
      setMostrarAgregarCorreo(false);
      setCorreoAuth(usuarioClerk.primaryEmailAddress?.emailAddress ?? "");
      setCorreoVerificado(usuarioClerk.primaryEmailAddress?.verification?.status === "verified");
      setMensaje("Correo verificado en Clerk. Ya está asociado a tu cuenta; revisaremos por separado la recuperación de contraseñas.");
    } catch (e) {
      const detalles = (e as { errors?: { longMessage?: string; message?: string }[] })?.errors;
      setError(detalles?.[0]?.longMessage || detalles?.[0]?.message || (e instanceof Error ? e.message : "No se pudo verificar el código."));
    } finally { setProcesandoCorreo(false); }
  };

  const cambiarContrasena = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setError(""); setMensaje("");
    if (!perfil || perfil.estado !== "Activo") { setError("Cuenta no autorizada."); return; }
    if (nueva.length < 15 || !evaluarContrasena(nueva).esValida) {
      setError("La contraseña debe tener al menos 15 caracteres, mayúscula, minúscula, número, símbolo y ningún espacio.");
      return;
    }
    if (actual === nueva || nueva !== confirmar) {
      setError("Revisa la contraseña actual y la confirmación de la nueva contraseña.");
      return;
    }
    setGuardando(true);
    try {
      if (proveedor === "clerk") {
        if (!usuarioClerk) throw new Error("Sesión Clerk no disponible.");
        await usuarioClerk.updatePassword({ currentPassword: actual, newPassword: nueva, signOutOfOtherSessions: true });
      } else if (proveedor === "supabase") {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user?.email) throw new Error("Tu cuenta no tiene correo de autenticación disponible.");
        const { error: verificarError } = await supabase.auth.signInWithPassword({ email: data.user.email, password: actual });
        if (verificarError) throw new Error("La contraseña actual es incorrecta.");
        const { error: guardarError } = await supabase.auth.updateUser({ password: nueva });
        if (guardarError) throw guardarError;
      } else throw new Error("No existe una sesión válida.");
      setActual(""); setNueva(""); setConfirmar("");
      setMensaje("Contraseña actualizada correctamente.");
    } catch (e) {
      const fallos = (e as { errors?: { longMessage?: string; message?: string }[] })?.errors;
      setError(fallos?.[0]?.longMessage || fallos?.[0]?.message || (e instanceof Error ? e.message : "No se pudo cambiar la contraseña."));
    } finally { setGuardando(false); }
  };

  if (cargando) return <div className="flex-1 p-8 text-center text-slate-500">Cargando información de tu perfil...</div>;
  const vinculado = Boolean(correoAuth);
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800"><UserRound className="text-emerald-600"/> Mi perfil</h1>
          <p className="mt-1 text-sm text-slate-500">Consulta tus datos institucionales, correo vinculado y opciones de seguridad.</p>
        </header>
        {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={20}/>{error}</div>}
        {mensaje && <div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={20}/>{mensaje}</div>}
        {perfil && <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800"><UserRound size={21} className="text-emerald-600"/> Información institucional</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {([
                ["Nombre completo", perfil.nombre || "No registrado"],
                ["DNI", perfil.dni || "No registrado"],
                ["Código institucional", perfil.codigo_institucional || "No asignado"],
                ["Rol institucional", perfil.rol || "No asignado"],
                ["Estado de la cuenta", perfil.estado || "Sin estado"],
                ["Nivel asignado", perfil.nivel_asignado || "No aplica"],
                ["Aula asignada", perfil.aula_asignada || "No aplica"],
                ["Correo asociado", correoAuth || "No vinculado"],
              ] as [string, string][]).map(([etiqueta, valor]) => (
                <div key={etiqueta}><label className="mb-2 block text-sm font-semibold text-slate-600">{etiqueta}</label><div className={caja}>{valor}</div></div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Mail size={21} className="text-emerald-600"/> Correo de recuperación</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setMostrarAgregarCorreo(v => !v); setError(""); setMensaje(""); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><Plus size={15}/>{correoAuth ? "Agregar otro correo" : "Agregar correo electrónico"}</button>
                <button type="button" onClick={() => void actualizarEstado()} disabled={actualizando} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={14} className="mr-1 inline"/>{actualizando ? "Actualizando..." : "Actualizar estado"}</button>
              </div>
            </div>
            {vinculado ? <>
              <div className={caja}>{correoAuth}</div>
              <p className={`mt-3 flex items-center gap-2 text-sm ${correoVerificado ? "text-emerald-700" : "text-amber-700"}`}>{correoVerificado ? <CheckCircle2 size={17}/> : <Clock3 size={17}/>} {correoVerificado ? "Correo confirmado por el proveedor de identidad" : "Correo aún no confirmado"}</p>
            </> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No tienes un correo de recuperación vinculado.</p>}
            {proveedor === "clerk" && usuarioClerk?.emailAddresses.some(ea => ea.verification?.status === "verified") &&
              <p className="mt-3 text-sm text-emerald-700">Correos verificados en Clerk: {usuarioClerk.emailAddresses.filter(ea => ea.verification?.status === "verified").map(ea => ea.emailAddress).join(", ")}</p>}
            {proveedor === "supabase" && estadoCorreo?.correo_secundario && <p className="mt-3 text-sm text-slate-700">Correo adicional: {estadoCorreo.correo_secundario} ({estadoCorreo.verificado ? "verificado" : "no verificado"})</p>}
            {mostrarAgregarCorreo && <form onSubmit={agregarCorreo} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
              <label htmlFor="correo-adicional" className="block text-sm font-semibold text-slate-700">Correo electrónico que deseas verificar</label>
              <input id="correo-adicional" type="email" required value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} disabled={procesandoCorreo || Boolean(correoPendienteId)} autoComplete="email" placeholder="nombre@ejemplo.com" className={entrada}/>
              <button type="submit" disabled={procesandoCorreo || Boolean(correoPendienteId)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Send size={17}/>{procesandoCorreo ? "Enviando..." : "Enviar verificación"}</button>
            </form>}
            {proveedor === "clerk" && correoPendienteId && <form onSubmit={verificarCorreoClerk} className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Verificar correo electrónico: {emailPendiente}</p>
              <label htmlFor="codigo-correo" className="block text-sm text-slate-700">Código que recibiste por correo</label>
              <input id="codigo-correo" value={codigoVerificacion} onChange={e => setCodigoVerificacion(e.target.value)} inputMode="numeric" required autoComplete="one-time-code" disabled={procesandoCorreo} className={entrada}/>
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={procesandoCorreo || !codigoVerificacion.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verificar código</button>
                <button type="button" disabled={procesandoCorreo} onClick={() => { setCorreoPendienteId(null); setCodigoVerificacion(""); setMostrarAgregarCorreo(true); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Usar otro correo</button>
              </div>
            </form>}
            {proveedor === "supabase" && estadoCorreo?.correo_pendiente && <p className="mt-3 text-sm text-amber-700">Pendiente de verificar: {estadoCorreo.correo_pendiente}. Comprueba el enlace que recibas.</p>}
            <p className="mt-4 text-xs text-amber-700">La verificación confirma la propiedad del correo. Su uso para recuperación de contraseñas requiere que el proveedor de identidad tenga configurado ese mecanismo; no se activa automáticamente en SIGUE.</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800"><LockKeyhole size={21} className="text-emerald-600"/> Cambiar contraseña</h2>
            <p className="mb-5 text-sm text-slate-500">Usa una contraseña de al menos 15 caracteres.</p>
            <form onSubmit={cambiarContrasena} className="max-w-lg space-y-4">
              {([
                { label: "Contraseña actual", valor: actual, fn: setActual },
                { label: "Nueva contraseña", valor: nueva, fn: setNueva },
                { label: "Confirmar nueva contraseña", valor: confirmar, fn: setConfirmar },
              ]).map((campo, i) => <div key={campo.label}>
                <label className="mb-2 block text-sm font-semibold text-slate-600">{campo.label}</label>
                <input type={mostrar ? "text" : "password"} value={campo.valor} onChange={e => campo.fn(e.target.value)} required autoComplete={i === 0 ? "current-password" : "new-password"} disabled={guardando} className={entrada}/>
              </div>)}
              <IndicadorSeguridadContrasena contrasena={nueva}/>
              {confirmar && <p className={`text-xs ${nueva === confirmar ? "text-emerald-700" : "text-red-600"}`}>{nueva === confirmar ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}</p>}
              <button type="button" onClick={() => setMostrar(v => !v)} className="flex items-center gap-2 text-sm text-slate-600">{mostrar ? <EyeOff size={17}/> : <Eye size={17}/>} {mostrar ? "Ocultar contraseñas" : "Mostrar contraseñas"}</button>
              <button type="submit" disabled={guardando || !actual || nueva.length < 15 || !evaluarContrasena(nueva).esValida || nueva !== confirmar || nueva === actual} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Save size={18}/>{guardando ? "Actualizando..." : "Actualizar contraseña"}</button>
            </form>
          </section>
          <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={17} className="text-emerald-600"/> Tu rol institucional no puede modificarse desde esta sección.</p>
        </>}
      </div>
    </div>
  );
}
