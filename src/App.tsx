/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Import Login
import Login from "./components/Login";

// Import view components
import ViewInicio from "./components/ViewInicio";
import ViewEstudiantes from "./components/ViewEstudiantes";
import ViewApoderados from "./components/ViewApoderados";
import ViewUtiles from "./components/ViewUtiles";
import ViewListasUtiles from "./components/ViewListasUtiles";
import ViewRecepcion from "./components/ViewRecepcion";
import ViewControlStock from "./components/ViewControlStock";
import ViewMovimientos from "./components/ViewMovimientos";
import ViewPrediccion from "./components/ViewPrediccion";
import ViewAlertas from "./components/ViewAlertas";
import ViewReportes from "./components/ViewReportes";
import ViewUsuarios from "./components/ViewUsuarios";
import ViewConfiguracion from "./components/ViewConfiguracion";

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
      case "apoderados":
        return <ViewApoderados />;
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
      case "configuracion":
        return <ViewConfiguracion />;
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
  const [sesionIniciada, setSesionIniciada] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sesion_colegio_iniciada") === "true";
    }
    return false;
  });

  const handleLoginSuccess = () => {
    setSesionIniciada(true);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sesion_colegio_iniciada");
      localStorage.removeItem("sesion_colegio_usuario_id");
    }
    setSesionIniciada(false);
  };

  return (
    <AppProvider>
      {sesionIniciada ? (
        <MainLayout onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </AppProvider>
  );
}
