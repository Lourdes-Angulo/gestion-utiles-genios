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
import { limpiarDemo } from './lib/demoAniosStorage';
import ViewAniosEscolares from './components/ViewAniosEscolares';
import ConsultaPeriodo from './components/ConsultaPeriodo';
import { useConsultaAnual } from './context/ConsultaAnualContext';
import { requiereConsultaAnual, vistasAnuales } from './lib/consultaAnual';

type Props = { onLogout: () => void; rol: RolSIGUE };
type PerfilValidado = { id: string; rol: RolSIGUE; requiereCambio: boolean };
const INACTIVIDAD_MS = 10 * 60 * 1000;
const ACTIVIDAD_KEY = "sigue:ultima_actividad";

function MainLayout({ onLogout, rol }: Props) {
  const [estudianteRecepcionId, setEstudianteRecepcionId] = useState<string | null>(null);
  const claveVista = `sigue:vista:${rol}`;
  const [vistaSolicitada, setVistaSolicitada] = useState(() => {
    if (window.location.hash.startsWith("#/verificar-correo")) return "verificar_correo";
    return localStorage.getItem(claveVista) ?? "inicio";
  });

  useEffect(() => {
    if (puedeAbrir(rol, vistaSolicitada)) localStorage.setItem(claveVista, vistaSolicitada);
  }, [rol, vistaSolicitada, claveVista]);

  const vistaActiva = puedeAbrir(rol, vistaSolicitada) ? vistaSolicitada : "inicio";
  const { modo, seleccionado, errorPeriodos } = useConsultaAnual();
  const consultaAnual = requiereConsultaAnual(vistaActiva, modo, seleccionado);
  const [vistasMontadas, setVistasMontadas] = useState<string[]>([]);
  useEffect(() => {
    if (!consultaAnual) setVistasMontadas(anteriores => anteriores.includes(vistaActiva) ? anteriores : [...anteriores, vistaActiva]);
  }, [vistaActiva, consultaAnual]);
  const vistasConFormulario = consultaAnual ? vistasMontadas : [...new Set([...vistasMontadas, vistaActiva])];
  const setVistaActiva = (vista: string) => {
    setEstudianteRecepcionId(null);
    setVistaSolicitada(puedeAbrir(rol, vista) ? vista : "inicio");
  };
  const abrirRecepcionEstudiante = (id: string) => {
    if (!puedeAbrir(rol, "recepcion")) return;
    setEstudianteRecepcionId(id);
    setVistaSolicitada("recepcion");
  };

  function renderVista(vista: string) {
    switch (vista) {
      case "inicio":
        return rol === "Profesora" || rol === "Auxiliar"
          ? <ViewInicioPersonal rol={rol} setVistaActiva={setVistaActiva} />
          : <ViewInicio setVistaActiva={setVistaActiva} />;
      case "anios_escolares": return <ViewAniosEscolares />;
      case "estudiantes": return <ViewEstudiantes onVerLista={abrirRecepcionEstudiante} />;
      case "utiles": return <ViewUtiles />;
      case "listas": return <ViewListasUtiles />;
      case "recepcion": return <ViewRecepcion estudianteSeleccionadoId={estudianteRecepcionId} onLimpiarSeleccion={() => setEstudianteRecepcionId(null)} />;
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} onLogout={onLogout} rol={rol} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {modo === 'demo' && !consultaAnual && vistaActiva !== 'anios_escolares' && <p className="shrink-0 bg-amber-50 px-4 py-2 text-xs text-amber-900">Consulta anual en modo demostración. Este módulo institucional está pendiente de integración con la simulación.</p>}
          {modo !== 'demo' && !seleccionado && vistasAnuales.includes(vistaActiva) && <p role="status" className="shrink-0 bg-amber-50 px-4 py-2 text-xs text-amber-900">{errorPeriodos || 'Integración anual pendiente. Registros operativos sin período verificado.'}</p>}
          {vistasConFormulario.filter(vista => puedeAbrir(rol, vista)).map(vista => <div key={vista} hidden={vista !== vistaActiva || consultaAnual} style={{ display: vista !== vistaActiva || consultaAnual ? 'none' : undefined }} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {renderVista(vista)}
          </div>)}
          {consultaAnual && <ConsultaPeriodo vista={vistaActiva} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const clerk = useClerk();
  const { cliente: supabaseClerk, isLoaded: clerkCargado, isSignedIn, clerkUserId } = useSupabaseClerk();
  const [sesionSupabase, setSesionSupabase] = useState<Session | null>(null);
  const [supabaseInicializado, setSupabaseInicializado] = useState(false);
  const [rol, setRol] = useState<RolSIGUE | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [identidadValidada, setIdentidadValidada] = useState<string | null>(null);
  const [requiereCambio, setRequiereCambio] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState("");
  const [reintento, setReintento] = useState(0);

  const esRutaRecuperacion = window.location.pathname === "/restablecer-contrasena";
  const esClerk = isSignedIn === true && !!clerkUserId;
  const esDemoJaime = esClerk && !!import.meta.env.VITE_DEMO_CLERK_USER_ID && clerkUserId === import.meta.env.VITE_DEMO_CLERK_USER_ID;
  const identidadActual = esClerk ? `clerk:${clerkUserId}` : sesionSupabase ? `supabase:${sesionSupabase.user.id}` : null;

  const verificarSupabase = useCallback(async (session: Session): Promise<PerfilValidado> => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.id !== session.user.id) {
      throw new Error("No se pudo validar tu sesión de Supabase.");
    }
    const { data, error } = await supabase.from("usuarios")
      .select("id, rol, estado, debe_cambiar_contrasena")
      .eq("authUserId", auth.user.id).maybeSingle();
    if (error) throw new Error("No se pudo consultar tu perfil: " + error.message);
    if (!data || data.estado !== "Activo" || !esRolSIGUE(data.rol)) {
      throw new Error("Tu perfil no está activo o no tiene permisos configurados.");
    }
    return { id: data.id, rol: data.rol, requiereCambio: data.debe_cambiar_contrasena === true };
  }, []);

  const verificarClerk = useCallback(async (id: string): Promise<PerfilValidado> => {
    const { data, error } = await supabaseClerk.from("usuarios")
      .select("id, rol, estado, debe_cambiar_contrasena")
      .eq("clerk_user_id", id).maybeSingle();
    if (error) throw new Error("Supabase rechazó la consulta del perfil Clerk: " + error.message);
    if (!data || data.estado !== "Activo" || !esRolSIGUE(data.rol) || !["Profesora", "Auxiliar"].includes(data.rol)) {
      throw new Error("La cuenta de Clerk no tiene un perfil institucional activo de Profesora o Auxiliar.");
    }
    return { id: data.id, rol: data.rol, requiereCambio: data.debe_cambiar_contrasena === true };
  }, [supabaseClerk]);

  // INITIAL_SESSION evita que la aplicación decida antes de leer la sesión guardada.
  useEffect(() => {
    let activo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      queueMicrotask(() => {
        if (!activo) return;
        setSesionSupabase(session);
        if (evento === "INITIAL_SESSION") setSupabaseInicializado(true);
      });
    });
    return () => { activo = false; subscription.unsubscribe(); };
  }, []);

  const limpiarEstado = useCallback(() => {
    limpiarDemo();
    setRol(null);
    setPerfilId(null);
    setIdentidadValidada(null);
    setRequiereCambio(false);
    setErrorAcceso("");
  }, []);

  const cerrarSesion = async () => {
    try {
      if (esClerk) await clerk.signOut();
      if (sesionSupabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } catch (e) {
      setErrorAcceso(e instanceof Error ? e.message : "No se pudo cerrar la sesión.");
      return;
    }
    localStorage.removeItem(ACTIVIDAD_KEY);
    for (const nombreRol of ["Administrador", "Secretaria", "Profesora", "Auxiliar"]) {
      localStorage.removeItem(`sigue:vista:${nombreRol}`);
    }
    sessionStorage.removeItem("sigue:demo:vista");
    localStorage.removeItem("sesion_colegio_iniciada");
    localStorage.removeItem("sesion_colegio_usuario_id");
    limpiarEstado();
    setSesionSupabase(null);
  };

  useEffect(() => {
    if (!clerkCargado || !supabaseInicializado) return;
    let activo = true;
    setErrorAcceso("");

    // Cuando no hay sesión, mostrar directamente el formulario de acceso.
    if (!identidadActual || esDemoJaime) {
      if (!identidadActual) limpiarEstado();
      setVerificandoSesion(false);
      return () => { activo = false; };
    }

    // No desmontar módulos ni formularios al actualizar tokens de la MISMA identidad.
    if (identidadValidada === identidadActual && rol && perfilId) {
      setVerificandoSesion(false);
      return () => { activo = false; };
    }

    setVerificandoSesion(true);
    const verificar = async () => {
      try {
        const perfil = esClerk && clerkUserId
          ? await verificarClerk(clerkUserId)
          : sesionSupabase
            ? await verificarSupabase(sesionSupabase)
            : null;
        if (!activo) return;
        if (!perfil) throw new Error("No se encontró una sesión institucional válida.");
        setRol(perfil.rol);
        setPerfilId(perfil.id);
        setIdentidadValidada(identidadActual);
        setRequiereCambio(perfil.requiereCambio);
      } catch (e) {
        if (!activo) return;
        setIdentidadValidada(null);
        setRol(null);
        setPerfilId(null);
        setErrorAcceso(e instanceof Error ? e.message : "No se pudo verificar tu perfil.");
      } finally {
        if (activo) setVerificandoSesion(false);
      }
    };
    void verificar();
    return () => { activo = false; };
  }, [clerkCargado, supabaseInicializado, identidadActual, identidadValidada, rol, perfilId, esClerk, clerkUserId, esDemoJaime, sesionSupabase?.user.id, verificarClerk, verificarSupabase, limpiarEstado, reintento]);

  // Cerrar sesión tras 10 minutos de inactividad real, sin reiniciar al cambiar pestaña.
  useEffect(() => {
    if (!clerkCargado || !supabaseInicializado || (!esClerk && !sesionSupabase)) return;
    let cerrando = false;
    const ahora = Date.now();
    const anterior = Number(localStorage.getItem(ACTIVIDAD_KEY));
    if (!Number.isFinite(anterior) || anterior <= 0 || anterior > ahora) {
      localStorage.setItem(ACTIVIDAD_KEY, String(ahora));
    }
    let ultimoRegistro = 0;
    const comprobar = () => {
      if (cerrando) return;
      const ultimo = Number(localStorage.getItem(ACTIVIDAD_KEY));
      if (ultimo > 0 && Date.now() - ultimo >= INACTIVIDAD_MS) {
        cerrando = true;
        void cerrarSesion();
      }
    };
    const marcarActividad = () => {
      if (cerrando) return;
      const actual = Date.now();
      const ultimo = Number(localStorage.getItem(ACTIVIDAD_KEY));
      if (ultimo > 0 && actual - ultimo >= INACTIVIDAD_MS) {
        comprobar();
        return;
      }
      if (actual - ultimoRegistro < 1000) return;
      ultimoRegistro = actual;
      localStorage.setItem(ACTIVIDAD_KEY, String(actual));
    };
    const eventos = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    eventos.forEach(evento => window.addEventListener(evento, marcarActividad, { passive: true }));
    const intervalo = window.setInterval(comprobar, 5000);
    comprobar();
    return () => {
      eventos.forEach(evento => window.removeEventListener(evento, marcarActividad));
      window.clearInterval(intervalo);
    };
    // Se vincula a cambios de identidad, no a renovaciones del token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkCargado, supabaseInicializado, esClerk, !!sesionSupabase]);

  const comprobarCambio = async () => {
    const perfil = esClerk && clerkUserId
      ? await verificarClerk(clerkUserId)
      : sesionSupabase ? await verificarSupabase(sesionSupabase) : null;
    if (!perfil || perfil.requiereCambio) {
      throw new Error("El cambio de contraseña todavía no está confirmado en Supabase.");
    }
    setRol(perfil.rol);
    setPerfilId(perfil.id);
    setRequiereCambio(false);
  };

  if (!clerkCargado || !supabaseInicializado || verificandoSesion) {
    return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600">Verificando sesión y permisos...</div>;
  }

  const autenticado = esClerk || !!sesionSupabase;
  const cliente = esClerk ? supabaseClerk : supabase;
  const perfilVigente = identidadActual !== null && identidadValidada === identidadActual;
  const permitirDatos = autenticado && perfilVigente && !!rol && !requiereCambio;

  if (esDemoJaime) return <DemoJaime onLogout={() => void cerrarSesion()} />;

  return (
    <AppProvider cliente={cliente} habilitado={permitirDatos} idUsuario={perfilId} rolUsuario={rol}>
      {esRutaRecuperacion ? <ViewRestablecerContrasena />
        : !autenticado ? <Login onLoginSuccess={() => { /* onAuthStateChange actualiza la sesión */ }} />
        : autenticado && perfilVigente && rol && requiereCambio
          ? <ViewCambioObligatorio proveedor={esClerk ? "clerk" : "supabase"} onCompletado={comprobarCambio} onLogout={cerrarSesion} />
        : autenticado && perfilVigente && rol
          ? <MainLayout rol={rol} onLogout={cerrarSesion} />
          : <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
              <div className="max-w-md space-y-4 rounded-2xl border bg-white p-6 text-center">
                <h2 className="font-bold text-slate-800">No se pudo validar la sesión</h2>
                <p className="text-sm text-rose-700">{errorAcceso || "No se pudo verificar tu perfil."}</p>
                <div className="flex justify-center gap-2">
                  <button type="button" className="rounded-xl bg-emerald-600 px-5 py-2 text-white" onClick={() => setReintento(n => n + 1)}>Reintentar</button>
                  <button type="button" className="rounded-xl bg-rose-50 px-5 py-2 text-rose-700" onClick={() => void cerrarSesion()}>Cerrar sesión</button>
                </div>
              </div>
            </div>}
    </AppProvider>
  );
}
