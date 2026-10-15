
import { useEffect, useState, type FormEvent } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  supabase,
  obtenerSesionRecuperacion,
  escucharSesionRecuperacion,
  limpiarSesionRecuperacion,
} from "../lib/supabaseClient";
import IndicadorSeguridadContrasena from "./IndicadorSeguridadContrasena";
import { evaluarContrasena } from "../lib/passwordPolicy";

export default function ViewRestablecerContrasena() {
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [terminado, setTerminado] = useState(false);

  // Solamente se habilita cuando Supabase procesa
  // un enlace de recuperación de contraseña.
  const [recuperacionAutorizada, setRecuperacionAutorizada] =
    useState(() => obtenerSesionRecuperacion() !== null);

  useEffect(() => {
  const actualizarEstado = () => {
    setRecuperacionAutorizada(
      obtenerSesionRecuperacion() !== null
    );
  };

  const dejarDeEscuchar =
    escucharSesionRecuperacion(actualizarEstado);

  actualizarEstado();

  return dejarDeEscuchar;
}, []);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();

    if (cargando || terminado) return;

    setError("");
    setMensaje("");

    if (
        !recuperacionAutorizada ||
        !obtenerSesionRecuperacion()
    ) {
      setError(
        "Debes abrir un enlace de recuperación válido enviado a tu correo."
      );
      return;
    }

    if (!evaluarContrasena(nueva).esValida) {
      setError(
        "La contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número, un símbolo y no contener espacios."
      );
      return;
    }

    if (nueva !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session) {
        throw new Error(
          "La sesión de recuperación no está disponible. Solicita un enlace nuevo."
        );
      }

      const { error: errorCambio } =
        await supabase.auth.updateUser({
          password: nueva,
        });

      if (errorCambio) {
        throw new Error(errorCambio.message);
      }

      setNueva("");
      setConfirmacion("");
      setTerminado(true);
      setRecuperacionAutorizada(false);
      limpiarSesionRecuperacion();

      setMensaje(
        "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con la nueva contraseña."
      );

      // Cerrar la sesión después de restablecerla.
      const { error: errorSalida } =
        await supabase.auth.signOut();

      if (errorSalida) {
        console.error(
          "No se pudo cerrar la sesión automáticamente:",
          errorSalida.message
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <LockKeyhole
          size={42}
          className="mx-auto mb-4 text-emerald-600"
        />

        <h1 className="text-xl font-bold text-slate-800">
          Restablecer contraseña
        </h1>

        <p className="mb-6 mt-2 text-sm text-slate-500">
          Recupera el acceso a tu cuenta de SIGUE
          mediante un enlace enviado a tu correo electrónico.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={19} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mensaje && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 size={19} className="shrink-0" />
            <span>{mensaje}</span>
          </div>
        )}

        {/* Aviso cuando no se ha validado una recuperación */}
        {!terminado && !recuperacionAutorizada && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Para restablecer tu contraseña, solicita un
            enlace desde «¿Olvidaste tu contraseña?» en
            la pantalla de inicio de sesión.

            Si ya abriste el enlace y aparece este aviso,
            solicita uno nuevo.
          </div>
        )}

        {/* Formulario habilitado durante la recuperación */}
        {!terminado && recuperacionAutorizada && (
          <form onSubmit={guardar} className="space-y-4">
            <div>
              <label
                htmlFor="nueva-contrasena"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nueva contraseña
              </label>

              <input
                id="nueva-contrasena"
                type={mostrar ? "text" : "password"}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                disabled={cargando}
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            <IndicadorSeguridadContrasena contrasena={nueva} />

            <div>
              <label
                htmlFor="confirmar-contrasena"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirmar contraseña
              </label>

              <input
                id="confirmar-contrasena"
                type={mostrar ? "text" : "password"}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
                disabled={cargando}
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-emerald-500 disabled:opacity-60"
              />
            </div>

            {confirmacion && (
              <p className={`text-xs font-medium ${nueva === confirmacion ? "text-emerald-700" : "text-red-600"}`}>
                {nueva === confirmacion ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}
              </p>
            )}

            <button
              type="button"
              onClick={() => setMostrar((anterior) => !anterior)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700"
            >
              {mostrar ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}

              {mostrar
                ? "Ocultar contraseñas"
                : "Mostrar contraseñas"}
            </button>

            <button
              type="submit"
              disabled={cargando || !evaluarContrasena(nueva).esValida || nueva !== confirmacion}
              className="w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando
                ? "Actualizando..."
                : "Guardar nueva contraseña"}
            </button>
          </form>
        )}

        <a
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-emerald-700 hover:underline"
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  );
}
