import { useCallback, useEffect, useState } from "react";
import { useClerk } from "@clerk/react";
import { useSupabaseClerk } from "./lib/useSupabaseClerk";
import type { Session } from "@supabase/supabase-js";
import { AppProvider } from "./context/AppContext";
import { supabase } from "./lib/supabaseClient";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./components/Login";
import ViewInicio from "./components/ViewInicio";
import ViewInicioPersonal from "./components/ViewInicioPersonal";
import ViewEstudiantes from "./components/ViewEstudiantes";
import ViewUtiles from "./components/ViewUtiles";
import ViewListasUtiles from "./components/ViewListasUtiles";
import ViewRecepcion from "./components/ViewRecepcion";
import ViewControlStock from "./components/ViewControlStock";
import ViewMovimientos from "./components/ViewMovimientos";
import ViewPrediccion from "./components/ViewPrediccion";
import ViewAlertas from "./components/ViewAlertas";
import ViewReportes from "./components/ViewReportes";
import ViewUsuarios from "./components/ViewUsuarios";
import ViewAuditoria from "./components/ViewAuditoria";
import ViewMiPerfil from "./components/ViewMiPerfil";
import ViewVerificarCorreo from "./components/ViewVerificarCorreo";
import ViewRestablecerContrasena from "./components/ViewRestablecerContrasena";
import ViewCambioObligatorio from "./components/ViewCambioObligatorio";
import { esRolSIGUE, puedeAbrir, type RolSIGUE } from "./lib/permisosRoles";
import DemoJaime from "./components/DemoJaime";

type Props = { onLogout: () => void; rol: RolSIGUE };

function MainLayout({ onLogout, rol }: Props) {
  const CLAVE_VISTA = `sigue:vista:${rol}`;
  const [vistaSolicitada, setVistaSolicitada] = useState(() => {
    if (window.location.hash.startsWith("#/verificar-correo")) return "verificar_correo";
    return sessionStorage.getItem(CLAVE_VISTA) ?? "inicio";
  });
  useEffect(() => {
    if (puedeAbrir(rol, vistaSolicitada)) sessionStorage.setItem(CLAVE_VISTA, vistaSolicitada);
  }, [rol, vistaSolicitada, CLAVE_VISTA]);
  const vistaActiva = puedeAbrir(rol, vistaSolicitada) ? vistaSolicitada : "inicio";
  const setVistaActiva = (vista: string) => setVistaSolicitada(puedeAbrir(rol, vista) ? vista : "inicio");
  function renderVista() {
    switch (vistaActiva) {
      case "inicio": return rol === "Profesora" || rol === "Auxiliar" ? <ViewInicioPersonal rol={rol} setVistaActiva={setVistaActiva} /> : <ViewInicio setVistaActiva={setVistaActiva} />;
      case "estudiantes": return <ViewEstudiantes />;
      case "utiles": return <ViewUtiles />;
      case "listas": return <ViewListasUtiles />;
      case "recepcion": return <ViewRecepcion />;
      case "control_stock": return <ViewControlStock />;
      case "movimientos": return <ViewMovimientos />;
      case "prediccion": return <ViewPrediccion />;
      case "alertas": return <ViewAlertas />;
      case "reportes": return <ViewReportes />;
      case "usuarios": return <ViewUsuarios />;
      case "auditoria": return <ViewAuditoria />;
      case "mi_perfil": return <ViewMiPerfil />;
      case "verificar_correo": return <ViewVerificarCorreo />;
      default: return <ViewInicio setVistaActiva={setVistaActiva} />;
    }
  }
  return <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
    <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} onLogout={onLogout} rol={rol}/>
    <div className="flex-1 flex min-w-0 flex-col overflow-hidden"><Header vistaActiva={vistaActiva} setVistaActiva={setVistaActiva}/><main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">{renderVista()}</main></div>
  </div>;
}

type PerfilValidado = { id: string; rol: RolSIGUE; requiereCambio: boolean };

export default function App() {
  const clerk = useClerk();
  const { cliente: supabaseClerk, isLoaded: clerkCargado, isSignedIn, clerkUserId } = useSupabaseClerk();
  const [sesionSupabase, setSesionSupabase] = useState<Session | null>(null);
  const [rol, setRol] = useState<RolSIGUE | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [requiereCambio, setRequiereCambio] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");
  const esRutaRecuperacion = window.location.pathname === "/restablecer-contrasena";
  const esClerk = isSignedIn === true && !!clerkUserId;
  const esDemoJaime = esClerk && !!import.meta.env.VITE_DEMO_CLERK_USER_ID && clerkUserId === import.meta.env.VITE_DEMO_CLERK_USER_ID;
  const INACTIVIDAD_MS = 10 * 60 * 1000;

  const verificarSupabase = useCallback(async (session: Session): Promise<PerfilValidado> => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.id !== session.user.id) {
      throw new Error("No se pudo validar tu sesión de Supabase.");
    }
    const { data, error } = await supabase.from("usuarios")
      .select("id, rol, estado, debe_cambiar_contrasena")
      .eq("authUserId", auth.user.id).maybeSingle();
    if (error || !data || data.estado !== "Activo" || !esRolSIGUE(data.rol)) {
      throw new Error("Tu perfil no está activo o no tiene permisos configurados.");
    }
    return { id: data.id, rol: data.rol, requiereCambio: data.debe_cambiar_contrasena === true };
  }, []);

  // La sesión Clerk no es una sesión Supabase Auth. Consultamos con el JWT de Clerk.
  const verificarClerk = useCallback(async (id: string): Promise<PerfilValidado> => {
    const { data, error } = await supabaseClerk.from("usuarios")
      .select("id, rol, estado, debe_cambiar_contrasena")
      .eq("clerk_user_id", id).maybeSingle();
    if (error) {
      throw new Error("Supabase rechazó la consulta del perfil Clerk: " + error.message + ". Comprueba la política RLS de lectura de tu propio perfil.");
    }
    if (!data || data.estado !== "Activo" || !esRolSIGUE(data.rol) || !["Profesora", "Auxiliar"].includes(data.rol)) {
      throw new Error("La cuenta de Clerk no tiene un perfil institucional activo de Profesora o Auxiliar.");
    }
    return { id: data.id, rol: data.rol, requiereCambio: data.debe_cambiar_contrasena === true };
  }, [supabaseClerk]);

  useEffect(() => {
    let activo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      queueMicrotask(() => { if (activo) setSesionSupabase(session); });
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (activo) setSesionSupabase(data.session);
    }).catch(() => { if (activo) setErrorAcceso("No se pudo consultar Supabase Auth."); });
    return () => { activo = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!clerkCargado) return;
    let activo = true;
    setVerificandoSesion(true);
    setRol(null);
    setPerfilId(null);
    setRequiereCambio(false);
    setErrorAcceso("");
    const verificar = async () => {
      try {
        const perfil = esDemoJaime
          ? null
          : esClerk && clerkUserId
          ? await verificarClerk(clerkUserId)
          : sesionSupabase
            ? await verificarSupabase(sesionSupabase)
            : null;
        if (activo && perfil) {
          setRol(perfil.rol);
          setPerfilId(perfil.id);
          setRequiereCambio(perfil.requiereCambio);
        }
      } catch (e) {
        if (activo) setErrorAcceso(e instanceof Error ? e.message : "Error de validación de cuenta.");
      } finally {
        if (activo) setVerificandoSesion(false);
      }
    };
    void verificar();
    return () => { activo = false; };
  }, [clerkCargado, esClerk, esDemoJaime, clerkUserId, sesionSupabase, verificarClerk, verificarSupabase]);

  const cerrarSesion = async () => {
    if (esClerk) await clerk.signOut();
    if (sesionSupabase) {
      const { error } = await supabase.auth.signOut();
      if (error) { setErrorAcceso("No se pudo cerrar la sesión Supabase."); return; }
    }
    localStorage.removeItem("sigue:ultima_actividad");
    sessionStorage.removeItem("sigue:vista:Administrador");
    sessionStorage.removeItem("sigue:vista:Secretaria");
    sessionStorage.removeItem("sigue:vista:Profesora");
    sessionStorage.removeItem("sigue:vista:Auxiliar");
    sessionStorage.removeItem("sigue:demo:vista");
    localStorage.removeItem("sesion_colegio_iniciada");
    localStorage.removeItem("sesion_colegio_usuario_id");
    setRol(null);
    setPerfilId(null);
    setRequiereCambio(false);
    setSesionSupabase(null);
  };

  // Una sesión solo expira por inactividad real; cambiar de pestaña no la reinicia.
  useEffect(() => {
    if (!clerkCargado || (!esClerk && !sesionSupabase)) return;
    const key = "sigue:ultima_actividad";
    let cerrando = false;
    const ahora = Date.now();
    const anterior = Number(localStorage.getItem(key));
    // Si hay marca anterior válida, conserva su antigüedad al montar la aplicación.
    if (!Number.isFinite(anterior) || anterior <= 0 || anterior > ahora) {
      localStorage.setItem(key, String(ahora));
    }
    let ultimoRegistro = 0;
    const comprobar = () => {
      if (cerrando) return;
      const ultimo = Number(localStorage.getItem(key));
      if (ultimo > 0 && Date.now() - ultimo >= INACTIVIDAD_MS) {
        cerrando = true;
        void cerrarSesion();
      }
    };
    const marcarActividad = () => {
      if (cerrando) return;
      const actual = Date.now();
      const ultimo = Number(localStorage.getItem(key));
      if (ultimo > 0 && actual - ultimo >= INACTIVIDAD_MS) {
        comprobar();
        return;
      }
      if (actual - ultimoRegistro < 1000) return;
      ultimoRegistro = actual;
      localStorage.setItem(key, String(actual));
    };
    // No usar visibilitychange: la navegación entre pestañas no es actividad.
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach(evento => window.addEventListener(evento, marcarActividad, { passive: true }));
    const intervalo = window.setInterval(comprobar, 5000);
    comprobar();
    return () => {
      eventos.forEach(evento => window.removeEventListener(evento, marcarActividad));
      window.clearInterval(intervalo);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkCargado, esClerk, !!sesionSupabase]);

  const comprobarCambio = async () => {
    const perfil = esClerk && clerkUserId
      ? await verificarClerk(clerkUserId)
      : sesionSupabase
        ? await verificarSupabase(sesionSupabase)
        : null;
    if (!perfil || perfil.requiereCambio) {
      throw new Error("El cambio de contraseña todavía no está confirmado en Supabase.");
    }
    setRol(perfil.rol);
    setPerfilId(perfil.id);
    setRequiereCambio(false);
  };

  if (verificandoSesion || !clerkCargado) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600">Verificando sesión y permisos...</div>;
  }

  const autenticado = esClerk || !!sesionSupabase;
  const cliente = esClerk ? supabaseClerk : supabase;
  // Importante: NUNCA cargar el contexto de datos si no se ha autorizado el acceso completo.
  const permitirDatos = autenticado && !!rol && !requiereCambio;

  if (esDemoJaime) {
    return <DemoJaime onLogout={() => void cerrarSesion()} />;
  }

  return <AppProvider cliente={cliente} habilitado={permitirDatos} idUsuario={perfilId} rolUsuario={rol}>
    {esRutaRecuperacion ? <ViewRestablecerContrasena /> :
      autenticado && rol && requiereCambio
        ? <ViewCambioObligatorio proveedor={esClerk ? "clerk" : "supabase"} onCompletado={comprobarCambio} onLogout={cerrarSesion} />
        : autenticado && rol
          ? <MainLayout rol={rol} onLogout={cerrarSesion} />
          : autenticado
            ? <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center"><h2 className="font-bold text-slate-800">Acceso pendiente de validación</h2><p className="text-sm text-rose-700">{errorAcceso || "No se pudo verificar tu perfil."}</p><button className="rounded-xl bg-rose-50 px-5 py-2 text-rose-700" onClick={() => void cerrarSesion()}>Cerrar sesión</button></div></div>
            : <Login onLoginSuccess={() => { /* onAuthStateChange actualiza la sesión */ }} />}
  </AppProvider>;
}
