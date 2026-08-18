import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import InsigniaColegio from "./InsigniaColegio";
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { usuarios, cambiarUsuarioActivo } = useApp();
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const emailLower = correo.trim().toLowerCase();
    const pass = contrasenia.trim();

    if (!emailLower || !pass) {
      setErrorMsg("Por favor, ingrese su correo y contraseña.");
      return;
    }

    setCargando(true);

    // Validate requested credentials
    setTimeout(() => {
      let matchedUserId = "";
      let valid = false;

      if (emailLower === "admin1@ejemplo.com" && (pass === "admin1" || pass === "admin")) {
        matchedUserId = "U_ADMIN";
        valid = true;
      } else if (emailLower === "secretaria@ejemplo.com" && pass === "secretaria123") {
        matchedUserId = "U_SECRETARIA";
        valid = true;
      } else {
        const foundUser = usuarios.find(u => u.correo.toLowerCase() === emailLower);
        if (foundUser) {
          matchedUserId = foundUser.id;
          valid = true;
        }
      }

      if (valid && matchedUserId) {
        cambiarUsuarioActivo(matchedUserId);
        // Persist login state
        localStorage.setItem("sesion_colegio_iniciada", "true");
        localStorage.setItem("sesion_colegio_usuario_id", matchedUserId);
        onLoginSuccess();
      } else {
        setErrorMsg("Correo o contraseña incorrectos. Por favor, intente de nuevo.");
      }
      setCargando(false);
    }, 800);
  };

  // Helper to fill credentials for testing convenience
  const handleQuickFill = (email: string, pass: string) => {
    setCorreo(email);
    setContrasenia(pass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f0f4f8] p-4 font-sans select-none antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-150 shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300">
        
        {/* Decorative Top Accent Bar */}
        <div className="h-2 bg-emerald-600 w-full" />
        
        <div className="p-8 flex flex-col items-center">
          
          {/* Logo insignia */}
          <InsigniaColegio size={130} className="mb-4" />
          
          {/* App Name Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              I.E.P. GENIOS DEL MILLENNIUM
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Sistema de Recepción de Útiles
            </p>
          </div>

          {/* Feedback Alert for invalid credentials */}
          {errorMsg && (
            <div className="w-full bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center gap-3 mb-5 animate-fade-in text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4 text-xs font-bold">
            <div>
              <label className="block text-slate-500 mb-1.5 uppercase tracking-wide">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@ejemplo.com"
                  required
                  disabled={cargando}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={cargando}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-2 text-xs uppercase tracking-wider"
            >
              {cargando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>



        </div>
      </div>
      
      {/* Decorative Brand Subtitle */}
      <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest flex items-center gap-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        I.E.P. "Genios del Millennium" — Perú
      </p>
    </div>
  );
}
