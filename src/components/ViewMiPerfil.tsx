
import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Send,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import IndicadorSeguridadContrasena from "./IndicadorSeguridadContrasena";
import { evaluarContrasena } from "../lib/passwordPolicy";

interface Perfil {
  nombre: string;
  correo: string;
  rol: string;
  estado: string;
}

interface EstadoCorreo {
  correo_secundario: string | null;
  verificado: boolean;
  fecha_verificacion: string | null;
  correo_pendiente: string | null;
}

export default function ViewMiPerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [estadoCorreo, setEstadoCorreo] =
    useState<EstadoCorreo | null>(null);

  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [actualizandoCorreo, setActualizandoCorreo] =
    useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] =
    useState("");
  const [mostrarContrasenas, setMostrarContrasenas] =
    useState(false);

  // Consultar exclusivamente la información del usuario
  // autenticado mediante la función SQL protegida.
  const consultarEstadoCorreo = async () => {
    const { data, error: errorConsulta } =
      await supabase.rpc("obtener_mi_estado_correo");

    if (errorConsulta) {
      throw new Error(
        "No se pudo consultar el correo secundario: " +
          errorConsulta.message
      );
    }

    const registro = Array.isArray(data)
      ? data[0] ?? null
      : data ?? null;

    return registro as EstadoCorreo | null;
  };

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      try {
        const {
          data: { user },
          error: errorAuth,
        } = await supabase.auth.getUser();

        if (errorAuth || !user) {
          throw new Error("No existe una sesión autenticada.");
        }

        const { data, error: errorPerfil } = await supabase
          .from("usuarios")
          .select("nombre, correo, rol, estado")
          .eq("authUserId", user.id)
          .single();

        if (errorPerfil || !data) {
          throw new Error(
            "No se pudo consultar tu perfil institucional."
          );
        }

        const correo = await consultarEstadoCorreo();

        if (activo) {
          setPerfil(data as Perfil);
          setEstadoCorreo(correo);
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar tu perfil."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargarPerfil();

    return () => {
      activo = false;
    };
  }, []);

  const actualizarCorreo = async () => {
    setError("");
    setMensaje("");
    setActualizandoCorreo(true);

    try {
      const registro = await consultarEstadoCorreo();
      setEstadoCorreo(registro);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la información."
      );
    } finally {
      setActualizandoCorreo(false);
    }
  };

  const solicitarVerificacion = async (e: FormEvent) => {
    e.preventDefault();

    if (enviandoCorreo) return;

    setError("");
    setMensaje("");

    if (!perfil || perfil.estado !== "Activo") {
      setError("Tu cuenta no está habilitada.");
      return;
    }

    const correo = nuevoCorreo.trim().toLowerCase();
    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (correo.length > 254 || !formato.test(correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (correo === perfil.correo.trim().toLowerCase()) {
      setError(
        "El correo secundario debe ser diferente al principal."
      );
      return;
    }

    if (
      estadoCorreo?.verificado &&
      correo ===
        estadoCorreo.correo_secundario?.toLowerCase()
    ) {
      setError("Ese correo ya está verificado.");
      return;
    }

    setEnviandoCorreo(true);

    try {
      const { data, error: errorFuncion } =
        await supabase.functions.invoke(
          "solicitar-verificacion-correo",
          {
            body: { correo },
          }
        );

      if (errorFuncion) {
        let detalle = "No se pudo enviar la verificación.";

        const respuesta = errorFuncion.context;

        if (respuesta instanceof Response) {
          const contenido = await respuesta
            .clone()
            .json()
            .catch(() => null);

          if (typeof contenido?.error === "string") {
            detalle = contenido.error;
          }
        }

        throw new Error(detalle);
      }

      if (!data?.ok) {
        throw new Error(
          data?.error || "La solicitud no fue aceptada."
        );
      }

      setMensaje(
        data.mensaje ||
          "Solicitud registrada. Revisa el correo indicado."
      );

      setNuevoCorreo("");

      // Mostrar la nueva dirección pendiente.
      const registro = await consultarEstadoCorreo();
      setEstadoCorreo(registro);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al solicitar la verificación."
      );
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const cambiarContrasena = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    setError("");
    setMensaje("");

    if (!perfil || perfil.estado !== "Activo") {
      setError("No se pudo identificar una cuenta activa.");
      return;
    }

    if (!evaluarContrasena(nuevaContrasena).esValida) {
      setError(
        "La nueva contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número, un símbolo y no contener espacios."
      );
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (contrasenaActual === nuevaContrasena) {
      setError(
        "La nueva contraseña debe ser diferente a la actual."
      );
      return;
    }

    setGuardando(true);

    try {
      const { error: errorVerificacion } =
        await supabase.auth.signInWithPassword({
          email: perfil.correo,
          password: contrasenaActual,
        });

      if (errorVerificacion) {
        throw new Error("La contraseña actual es incorrecta.");
      }

      const { error: errorCambio } =
        await supabase.auth.updateUser({
          password: nuevaContrasena,
        });

      if (errorCambio) {
        throw new Error(errorCambio.message);
      }

      setContrasenaActual("");
      setNuevaContrasena("");
      setConfirmarContrasena("");

      setMensaje("Tu contraseña se actualizó correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la contraseña."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        Cargando información de tu perfil...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <UserRound className="text-emerald-600" />
            Mi perfil
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Administra la información y seguridad de tu cuenta.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </div>
        )}

        {mensaje && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={20} className="shrink-0" />
            {mensaje}
          </div>
        )}

        {perfil && (
          <>
            {/* Información institucional */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800">
                <UserRound
                  className="text-emerald-600"
                  size={21}
                />
                Información institucional
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["Nombre completo", perfil.nombre],
                  ["Correo principal", perfil.correo],
                  ["Rol institucional", perfil.rol],
                  ["Estado de la cuenta", perfil.estado],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      {etiqueta}
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {valor}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Correo secundario */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Mail
                    className="text-emerald-600"
                    size={21}
                  />
                  Correo secundario
                </h2>

                <button
                  type="button"
                  onClick={() => void actualizarCorreo()}
                  disabled={actualizandoCorreo}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                  {actualizandoCorreo
                    ? "Actualizando..."
                    : "Actualizar estado"}
                </button>
              </div>

              <p className="mb-5 text-sm text-slate-500">
                Utiliza un correo personal al que tengas
                acceso para recibir notificaciones de seguridad.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-600">
                    Correo secundario actual
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {estadoCorreo?.correo_secundario ||
                      "No registrado"}
                  </div>
                </div>

                {estadoCorreo?.correo_secundario &&
                  (estadoCorreo.verificado ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={17} />
                      Correo verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                      <AlertCircle size={17} />
                      Correo no verificado
                    </span>
                  ))}

                {estadoCorreo?.verificado &&
                  estadoCorreo.fecha_verificacion && (
                    <p className="text-xs text-slate-500">
                      Verificado el{" "}
                      {new Date(
                        estadoCorreo.fecha_verificacion
                      ).toLocaleString("es-PE")}
                    </p>
                  )}

                {estadoCorreo?.correo_pendiente && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                      <Clock3 size={18} />
                      Correo pendiente de verificación
                    </div>

                    <p className="mt-2 break-all text-sm text-amber-900">
                      {estadoCorreo.correo_pendiente}
                    </p>

                    <p className="mt-2 text-xs text-amber-700">
                      Abre el enlace enviado a esta dirección
                      para completar la verificación.
                      Tu correo anterior se conserva.
                    </p>
                  </div>
                )}

                <form
                  onSubmit={solicitarVerificacion}
                  className="space-y-4 border-t border-slate-100 pt-5"
                >
                  <div>
                    <label
                      htmlFor="nuevo-correo-secundario"
                      className="mb-2 block text-sm font-semibold text-slate-600"
                    >
                      Agregar o cambiar correo secundario
                    </label>

                    <input
                      id="nuevo-correo-secundario"
                      type="email"
                      value={nuevoCorreo}
                      onChange={(e) =>
                        setNuevoCorreo(e.target.value)
                      }
                      placeholder="correo.personal@gmail.com"
                      autoComplete="email"
                      required
                      disabled={enviandoCorreo}
                      className="w-full max-w-lg rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviandoCorreo}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Send size={17} />
                    {enviandoCorreo
                      ? "Solicitando..."
                      : "Enviar enlace de verificación"}
                  </button>
                </form>
              </div>
            </section>

            {/* Cambiar contraseña */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                <LockKeyhole
                  className="text-emerald-600"
                  size={21}
                />
                Cambiar contraseña
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Utiliza una contraseña segura de al menos
                12 caracteres.
              </p>

              <form
                onSubmit={cambiarContrasena}
                className="max-w-lg space-y-4"
              >
                {[
                  {
                    etiqueta: "Contraseña actual",
                    valor: contrasenaActual,
                    cambio: setContrasenaActual,
                  },
                  {
                    etiqueta: "Nueva contraseña",
                    valor: nuevaContrasena,
                    cambio: setNuevaContrasena,
                  },
                  {
                    etiqueta: "Confirmar nueva contraseña",
                    valor: confirmarContrasena,
                    cambio: setConfirmarContrasena,
                  },
                ].map((campo, indice) => (
                  <div key={campo.etiqueta}>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      {campo.etiqueta}
                    </label>

                    <input
                      type={
                        mostrarContrasenas ? "text" : "password"
                      }
                      value={campo.valor}
                      onChange={(e) =>
                        campo.cambio(e.target.value)
                      }
                      required
                      autoComplete={
                        indice === 0
                          ? "current-password"
                          : "new-password"
                      }
                      disabled={guardando}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                  </div>
                ))}

                <IndicadorSeguridadContrasena contrasena={nuevaContrasena} />
                {confirmarContrasena && (
                  <p className={`text-xs font-medium ${nuevaContrasena === confirmarContrasena ? "text-emerald-700" : "text-red-600"}`}>
                    {nuevaContrasena === confirmarContrasena ? "Las contraseñas coinciden." : "Las contraseñas no coinciden."}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setMostrarContrasenas(!mostrarContrasenas)
                  }
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  {mostrarContrasenas ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                  {mostrarContrasenas
                    ? "Ocultar contraseñas"
                    : "Mostrar contraseñas"}
                </button>

                <button
                  type="submit"
                  disabled={guardando || !contrasenaActual || !evaluarContrasena(nuevaContrasena).esValida || nuevaContrasena !== confirmarContrasena || nuevaContrasena === contrasenaActual}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save size={18} />
                  {guardando
                    ? "Actualizando..."
                    : "Actualizar contraseña"}
                </button>
              </form>
            </section>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={17}
                className="text-emerald-600"
              />
              Tu rol institucional no puede modificarse
              desde esta sección.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
