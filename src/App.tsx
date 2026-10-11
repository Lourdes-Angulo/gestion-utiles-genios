/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AppProvider } from "./context/AppContext";
import { supabase } from "./lib/supabaseClient";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Import Login
import Login from "./components/Login";

// Import view components
import ViewInicio from "./components/ViewInicio";
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

interface MainLayoutProps {
  onLogout: () => void;
}

function MainLayout({ onLogout }: MainLayoutProps) {
  const [vistaActiva, setVistaActiva] = useState("inicio");

  const renderVista = () => {
    switch (vistaActiva) {
      case "inicio":
        return <ViewInicio setVistaActiva={setVistaActiva} />;
      case "estudiantes":
        return <ViewEstudiantes />;
      case "utiles":
        return <ViewUtiles />;
      case "listas":
        return <ViewListasUtiles />;
      case "recepcion":
        return <ViewRecepcion />;
      case "control_stock":
        return <ViewControlStock />;
      case "movimientos":
        return <ViewMovimientos />;
      case "prediccion":
        return <ViewPrediccion />;
      case "alertas":
        return <ViewAlertas />;
      case "reportes":
        return <ViewReportes />;
      case "usuarios":
        return <ViewUsuarios />;
      case "auditoria":
        return <ViewAuditoria />;
      default:
        return <ViewInicio setVistaActiva={setVistaActiva} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar navigation */}
      <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} onLogout={onLogout} />

      {/* Main content frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <Header vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />

        {/* View container */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {renderVista()}
        </main>
      </div>
    </div>
  );
}


export default function App() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  useEffect(() => {
    let activo = true;

    // Recuperar la sesión desde Supabase Auth
    supabase.auth.getSession().then(({ data, error }) => {
      if (!activo) return;

      if (error) {
        console.error("Error al recuperar la sesión:", error.message);
        setSesion(null);
      } else {
        setSesion(data.session);
      }

      setVerificandoSesion(false);
    }).catch((error) => {
      if (!activo) return;
      console.error("Error al verificar la sesión:", error);
      setSesion(null);
      setVerificandoSesion(false);
    });

    // Detectar cuando un usuario inicia o cierra sesión
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
        if (!activo) return;

        setSesion(nuevaSesion);
        setVerificandoSesion(false);
      });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    // La sesión se actualiza mediante onAuthStateChange.
    // No se concede acceso usando localStorage.
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      return;
    }

    localStorage.removeItem("sesion_colegio_iniciada");
    localStorage.removeItem("sesion_colegio_usuario_id");

    setSesion(null);
  };

  if (verificandoSesion) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <p className="text-slate-600">
            Verificando sesión segura...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      {sesion ? (
        <MainLayout onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </AppProvider>
  );
}

