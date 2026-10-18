
import React, { useState } from "react";
import { useSignIn } from "@clerk/react";
import { supabase } from "../lib/supabaseClient";
import InsigniaColegio from "./InsigniaColegio";

import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  IdCard,
  ArrowLeft,
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

type Modo = "codigo" | "correo";

export default function Login({
  onLoginSuccess,
}: LoginProps) {

  // Autenticación institucional de Profesora y Auxiliar.
  const { signIn } = useSignIn();

  const [modo, setModo] = useState<Modo>("codigo");
  const [codigo, setCodigo] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] =
    useState(false);

  const cambiarModo = (nuevoModo: Modo) => {
    setModo(nuevoModo);
    setErrorMsg("");
    setInfoMsg("");
    setContrasenia("");
    setMostrarRecuperacion(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (cargando) return;

    setErrorMsg("");
    setInfoMsg("");

    if (!contrasenia) {
      setErrorMsg("Ingresa tu contraseña.");
      return;
    }

    const codigoNormalizado = codigo.trim().toUpperCase();
    const emailLower = correo.trim().toLowerCase();

    if (
      modo === "codigo" &&
      !/^(ADM|SEC|DOC|AUX|ING)-\d{4,}$/.test(
        codigoNormalizado
      )
    ) {
      setErrorMsg(
        "Ingresa un código institucional válido, por ejemplo DOC-0009."
      );
      return;
    }

    if (
      modo === "correo" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)
    ) {
      setErrorMsg("Ingresa un correo electrónico válido.");
      return;
    }

    setCargando(true);

    try {
      // ===================================================
      // PROFESORA Y AUXILIAR: AUTENTICACIÓN CON CLERK
      // ===================================================
      if (
        modo === "codigo" &&
        /^(DOC|AUX|ING)-\d{4,}$/.test(codigoNormalizado)
      ) {
        const { error: errorClerk } =
          await signIn.password({
            identifier: codigoNormalizado.toLowerCase(),
            password: contrasenia,
          });

        if (errorClerk) {
          setErrorMsg(
            "No se pudo iniciar sesión. Verifica tu código y contraseña."
          );
          return;
        }

        if (signIn.status !== "complete") {
          setErrorMsg(
            "La autenticación requiere completar un paso adicional."
          );
          return;
        }

        const { error: errorFinalizacion } =
          await signIn.finalize({
            navigate: () => {
              // App.tsx todavía debe integrar esta sesión
              // y exigir el cambio de contraseña.
            },
          });

        if (errorFinalizacion) {
          setErrorMsg(
            "No se pudo completar la sesión de Clerk."
          );
          return;
        }

        setContrasenia("");

        setInfoMsg(
          "Credenciales correctas. Verificando perfil institucional..."
        );

        // App.tsx detecta la sesión activa de Clerk.
        return;
      }

      // ===================================================
      // ADMINISTRADOR Y SECRETARÍA: SUPABASE AUTH
      // ===================================================
      if (modo === "codigo") {
        const { data, error: errorFuncion } =
          await supabase.functions.invoke(
            "iniciar-sesion-codigo",
            {
              body: {
                codigo: codigoNormalizado,
                contrasena: contrasenia,
              },
            }
          );

        if (
          errorFuncion ||
          !data?.ok ||
          !data?.access_token ||
          !data?.refresh_token
        ) {
          setErrorMsg(
            "No se pudo iniciar sesión. Revisa tu código o contraseña."
          );
          return;
        }

        const { data: inicio, error: errorSesion } =
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });

        if (errorSesion || !inicio.session) {
          setErrorMsg(
            "No se pudo establecer la sesión segura."
          );
          return;
        }

        localStorage.removeItem(
          "sesion_colegio_usuario_id"
        );

        setContrasenia("");
        onLoginSuccess();
        return;
      }

      // ===================================================
      // ACCESO TEMPORAL POR CORREO: CUENTAS EXISTENTES
      // ===================================================
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: emailLower,
          password: contrasenia,
        });

      if (error || !data.session) {
        setErrorMsg(
          "No se pudo iniciar sesión. Verifica tus credenciales."
        );
        return;
      }

      localStorage.removeItem(
        "sesion_colegio_usuario_id"
      );

      setContrasenia("");
      onLoginSuccess();
    } catch (err) {
      console.error("Error de autenticación:", err);

      setErrorMsg(
        "No se pudo iniciar sesión. Verifica tus credenciales e inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleForgotPassword = async () => {
    if (cargando) return;

    setErrorMsg("");
    setInfoMsg("");

    const emailLower = correo.trim().toLowerCase();

    if (
      !emailLower ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)
    ) {
      setErrorMsg(
        "Ingresa tu correo electrónico para recuperar la contraseña."
      );
      return;
    }

    setCargando(true);

    try {
      // Este flujo corresponde todavía a cuentas
      // que utilizan Supabase Auth.
      await supabase.auth.resetPasswordForEmail(
        emailLower,
        {
          redirectTo:
            `${window.location.origin}/restablecer-contrasena`,
        }
      );

      setInfoMsg(
        "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña. Revisa también Spam."
      );
    } catch {
      setErrorMsg(
        "No se pudo procesar la solicitud. Inténtalo más tarde."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f0f4f8] p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="h-2 bg-emerald-600 w-full" />

        <div className="p-8 flex flex-col items-center">
          <InsigniaColegio
            size={130}
            className="mb-4"
          />

          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              I.E.P. GENIOS DEL MILLENNIUM
            </h2>

            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Sistema de Recepción de Útiles
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="w-full bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex gap-3 mb-5 text-xs font-semibold"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex gap-3 mb-5 text-xs font-semibold"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {mostrarRecuperacion ? (
            <div className="w-full space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">
                Recuperar contraseña
              </h3>

              <p className="text-xs text-slate-500">
                Usa el correo verificado de tu cuenta.
                La recuperación de cuentas Clerk se
                configurará por separado.
              </p>

              <label
                htmlFor="correo-recuperacion"
                className="block text-xs font-semibold text-slate-600"
              >
                Correo electrónico
              </label>

              <input
                id="correo-recuperacion"
                type="email"
                value={correo}
                onChange={(e) =>
                  setCorreo(e.target.value)
                }
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm"
                placeholder="correo@ejemplo.com"
              />

              <button
                type="button"
                disabled={cargando}
                onClick={handleForgotPassword}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
              >
                Enviar enlace de recuperación
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarRecuperacion(false);
                  setErrorMsg("");
                  setInfoMsg("");
                }}
                className="flex items-center gap-2 mx-auto text-xs text-slate-600"
              >
                <ArrowLeft size={15} />
                Volver al inicio
              </button>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="w-full space-y-4 text-xs font-bold"
              >
                <div>
                  <label
                    htmlFor="identificador"
                    className="block text-slate-500 mb-1.5 uppercase tracking-wide"
                  >
                    {modo === "codigo"
                      ? "Código institucional"
                      : "Correo electrónico (acceso temporal)"}
                  </label>

                  <div className="relative">
                    {modo === "codigo" ? (
                      <IdCard className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    ) : (
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                    )}

                    <input
                      id="identificador"
                      type={
                        modo === "codigo"
                          ? "text"
                          : "email"
                      }
                      value={
                        modo === "codigo"
                          ? codigo
                          : correo
                      }
                      onChange={(e) =>
                        modo === "codigo"
                          ? setCodigo(
                              e.target.value
                                .toUpperCase()
                                .replace(/\s/g, "")
                            )
                          : setCorreo(e.target.value)
                      }
                      placeholder={
                        modo === "codigo"
                          ? "DOC-0009"
                          : "correo@ejemplo.com"
                      }
                      autoComplete="username"
                      required
                      disabled={cargando}
                      maxLength={
                        modo === "codigo"
                          ? 16
                          : undefined
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="clave-login"
                    className="block text-slate-500 mb-1.5 uppercase tracking-wide"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />

                    <input
                      id="clave-login"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={contrasenia}
                      onChange={(e) =>
                        setContrasenia(e.target.value)
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={cargando}
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setShowPassword((v) => !v)
                      }
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <LogIn className="w-4 h-4" />
                  {cargando
                    ? "Iniciando sesión..."
                    : "Iniciar sesión"}
                </button>
              </form>

              <div className="mt-4 w-full text-center space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarRecuperacion(true)
                  }
                  className="block mx-auto text-xs font-bold text-emerald-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    cambiarModo(
                      modo === "codigo"
                        ? "correo"
                        : "codigo"
                    )
                  }
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-700 underline"
                >
                  {modo === "codigo"
                    ? "Acceder con correo (temporal)"
                    : "Volver al acceso por código institucional"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest flex items-center gap-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        I.E.P. «Genios del Millennium» — Perú
      </p>
    </div>
  );
}
