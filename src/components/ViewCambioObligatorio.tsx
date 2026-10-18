import { useState, type FormEvent } from "react";
import { LockKeyhole, Eye, EyeOff, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "@clerk/react";
import IndicadorSeguridadContrasena from "./IndicadorSeguridadContrasena";
import { evaluarContrasena } from "../lib/passwordPolicy";

type Props = { proveedor?: "clerk" | "supabase"; onCompletado: () => Promise<void> | void; onLogout: () => Promise<void> | void };

export default function ViewCambioObligatorio({ proveedor = "supabase", onCompletado, onLogout }: Props) {
  const { getToken } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ver, setVer] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cargando) return;
    setError(""); setMensaje("");
    if (!evaluarContrasena(nueva).esValida) { setError("La contraseña nueva no cumple los requisitos de seguridad."); return; }
    if (actual === nueva) { setError("La contraseña nueva debe ser distinta de la provisional."); return; }
    if (nueva !== confirmar) { setError("Las contraseñas no coinciden."); return; }
    setCargando(true);
    try {
      const token = proveedor === "clerk" ? await getToken() : null;
      if (proveedor === "clerk" && !token) throw new Error("La sesión de Clerk ha caducado.");
      const { data, error: fallo } = await supabase.functions.invoke(
        proveedor === "clerk" ? "completar-primer-acceso-clerk" : "completar-primer-acceso",
        {
          body: { contrasenaActual: actual, nuevaContrasena: nueva },
          ...(proveedor === "clerk" ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        }
      );
      if (fallo) {
        let detalle = "No se pudo actualizar la contraseña.";
        if (fallo.context instanceof Response) {
          const respuesta = await fallo.context.clone().json().catch(() => null);
          if (typeof respuesta?.error === "string") detalle = respuesta.error;
        }
        throw new Error(detalle);
      }
      if (!data?.ok) throw new Error(data?.error || "No se pudo confirmar el cambio.");
      setActual(""); setNueva(""); setConfirmar("");
      setMensaje("Contraseña actualizada. Verificando tu acceso...");
      await onCompletado();
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cambiar la contraseña."); }
    finally { setCargando(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3"><LockKeyhole className="text-emerald-600" size={28}/><div><h1 className="text-xl font-bold text-slate-800">Cambio obligatorio de contraseña</h1><p className="text-sm text-slate-500">Por seguridad, debes reemplazar la contraseña provisional antes de acceder a SIGUE.</p></div></div>
        {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={19}/>{error}</div>}
        {mensaje && <div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={19}/>{mensaje}</div>}
        <form onSubmit={guardar} className="space-y-4">
          {[{id:"clave-actual",titulo:"Contraseña provisional actual",valor:actual,fn:setActual,autocomplete:"current-password"},{id:"clave-nueva",titulo:"Nueva contraseña",valor:nueva,fn:setNueva,autocomplete:"new-password"},{id:"clave-confirmar",titulo:"Confirmar nueva contraseña",valor:confirmar,fn:setConfirmar,autocomplete:"new-password"}].map(c => <label key={c.id} htmlFor={c.id} className="block text-sm font-semibold text-slate-700">{c.titulo}<input id={c.id} type={ver ? "text" : "password"} autoComplete={c.autocomplete} value={c.valor} onChange={e => c.fn(e.target.value)} disabled={cargando} required className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal focus:border-emerald-500 focus:outline-none"/></label>)}
          <IndicadorSeguridadContrasena contrasena={nueva}/>
          {confirmar && <p className={`text-xs font-medium ${nueva === confirmar ? "text-emerald-700" : "text-red-600"}`}>{nueva === confirmar ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}</p>}
          <button type="button" onClick={() => setVer(v => !v)} className="flex items-center gap-2 text-sm text-slate-600">{ver ? <EyeOff size={17}/> : <Eye size={17}/>} {ver ? "Ocultar contraseñas" : "Mostrar contraseñas"}</button>
          <button type="submit" disabled={cargando || !actual || !evaluarContrasena(nueva).esValida || nueva !== confirmar || nueva === actual} className="w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{cargando ? "Actualizando..." : "Guardar y continuar"}</button>
        </form>
        <button type="button" onClick={() => void onLogout()} disabled={cargando} className="flex items-center gap-2 text-sm font-semibold text-slate-600 disabled:opacity-50"><LogOut size={16}/> Cerrar sesión</button>
      </div>
    </div>
  );
}
