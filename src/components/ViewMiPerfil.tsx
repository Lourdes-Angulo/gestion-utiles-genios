
import { useEffect, useState, type FormEvent } from "react";
import { useUser } from "@clerk/react";
import {
  UserRound, Mail, ShieldCheck, LockKeyhole,
  Eye, EyeOff, Save, AlertCircle, CheckCircle2,
  Clock3, RefreshCw, Send, Plus
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
  foto_path: string | null;
};

type EstadoCorreo = {
  correo_secundario: string | null;
  verificado: boolean;
  correo_pendiente: string | null;
};

const caja =
  "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 break-all";

const entrada =
  "w-full max-w-lg rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 disabled:opacity-60";

function correoVisible(valor?: string | null): string {
  const email = valor?.trim() ?? "";
  return email.toLowerCase().endsWith("@auth.invalid")
    ? ""
    : email;
}

function mensajeError(error: unknown, alternativo: string): string {
  return error instanceof Error ? error.message : alternativo;
}

export default function ViewMiPerfil() {
  const {
    cliente: clienteClerk,
    isLoaded,
    isSignedIn,
    clerkUserId,
  } = useSupabaseClerk();

  const { user: usuarioClerk } = useUser();

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [proveedor, setProveedor] =
    useState<"clerk" | "supabase" | null>(null);

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState(false);
  const [guardandoFoto, setGuardandoFoto] = useState(false);

  const [correoAuth, setCorreoAuth] = useState("");
  const [correoVerificado, setCorreoVerificado] = useState(false);
  const [estadoCorreo, setEstadoCorreo] =
    useState<EstadoCorreo | null>(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);

  const [mostrarAgregarCorreo, setMostrarAgregarCorreo] =
    useState(false);
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [codigoVerificacion, setCodigoVerificacion] =
    useState("");
  const [correoPendienteId, setCorreoPendienteId] =
    useState<string | null>(null);
  const [emailPendiente, setEmailPendiente] = useState("");
  const [procesandoCorreo, setProcesandoCorreo] =
    useState(false);

  // ============================================
  // CARGAR PERFIL INSTITUCIONAL
  // ============================================

  useEffect(() => {
    if (!isLoaded) return;
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setError("");

      try {
        if (isSignedIn && clerkUserId) {
          const { data, error: fallo } = await clienteClerk
            .from("usuarios")
            .select(
              "nombre,correo,dni,rol,estado,codigo_institucional,nivel_asignado,aula_asignada,debe_cambiar_contrasena,foto_path"
            )
            .eq("clerk_user_id", clerkUserId)
            .maybeSingle();

          if (
            fallo || !data || data.estado !== "Activo" ||
            data.debe_cambiar_contrasena
          ) {
            throw new Error(
              "No se pudo validar tu perfil institucional con Clerk."
            );
          }

          if (vigente) {
            setPerfil(data as Perfil);
            setProveedor("clerk");
            setCorreoAuth(correoVisible(
              usuarioClerk?.primaryEmailAddress?.emailAddress
            ));
            setCorreoVerificado(
              usuarioClerk?.primaryEmailAddress?.verification
                ?.status === "verified"
            );
            setEstadoCorreo(null);
          }
        } else {
          const { data: auth, error: errorAuth } =
            await supabase.auth.getUser();

          if (errorAuth || !auth.user) {
            throw new Error(
              "No existe una sesión autenticada."
            );
          }

          const { data, error: fallo } = await supabase
            .from("usuarios")
            .select(
              "nombre,correo,dni,rol,estado,codigo_institucional,nivel_asignado,aula_asignada,foto_path"
            )
            .eq("authUserId", auth.user.id)
            .maybeSingle();

          if (fallo || !data || data.estado !== "Activo") {
            throw new Error(
              "No se pudo validar tu perfil institucional."
            );
          }

          const resultado = await supabase.rpc(
            "obtener_mi_estado_correo"
          );

          const extra = Array.isArray(resultado.data)
            ? resultado.data[0] ?? null
            : resultado.data ?? null;

          if (vigente) {
            setPerfil(data as Perfil);
            setProveedor("supabase");
            setCorreoAuth(correoVisible(auth.user.email));
            setCorreoVerificado(
              Boolean(auth.user.email_confirmed_at) &&
              Boolean(correoVisible(auth.user.email))
            );
            setEstadoCorreo(
              resultado.error
                ? null
                : (extra as EstadoCorreo | null)
            );
          }
        }
      } catch (e) {
        if (vigente) {
          setError(mensajeError(e, "No se pudo cargar el perfil."));
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();

    return () => {
      vigente = false;
    };
  }, [
    isLoaded, isSignedIn, clerkUserId,
    clienteClerk, usuarioClerk
  ]);

  // ============================================
  // OBTENER FOTO PRIVADA
  // ============================================

  useEffect(() => {
    let vigente = true;

    async function cargarFoto() {
      setFotoUrl(null);
      setErrorFoto(false);

      if (!perfil?.foto_path || !proveedor) return;

      const cliente =
        proveedor === "clerk" ? clienteClerk : supabase;

      const { data, error } = await cliente.storage
        .from("fotos-perfil")
        .createSignedUrl(perfil.foto_path, 3600);

      if (!vigente) return;

      if (error || !data?.signedUrl) {
        setErrorFoto(true);
        return;
      }

      setFotoUrl(data.signedUrl);
    }

    void cargarFoto();

    return () => {
      vigente = false;
    };
  }, [perfil?.foto_path, proveedor, clienteClerk]);

  // ============================================
  // SUBIR O CAMBIAR FOTO
  // ============================================

  const cambiarFoto = async (archivo?: File) => {
    if (!archivo || !perfil || !proveedor || guardandoFoto) {
      return;
    }

    const extensiones: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensiones[archivo.type];

    if (
      !extension ||
      archivo.size > 2 * 1024 * 1024 ||
      archivo.size === 0
    ) {
      setError(
        "Selecciona una imagen JPG, PNG o WebP de máximo 2 MB."
      );
      return;
    }

    setGuardandoFoto(true);
    setError("");
    setMensaje("");

    const cliente =
      proveedor === "clerk" ? clienteClerk : supabase;

    let rutaNueva: string | null = null;
    let subidaRealizada = false;
    let perfilVinculado = false;

    try {
      let identificador: string;

      if (proveedor === "clerk") {
        if (!clerkUserId) {
          throw new Error("No existe una sesión Clerk válida.");
        }
        identificador = clerkUserId;
      } else {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          throw new Error("Debes iniciar sesión nuevamente.");
        }

        identificador = data.user.id;
      }

      const rutaAnterior = perfil.foto_path;
      rutaNueva = `${identificador}/${crypto.randomUUID()}.${extension}`;

      // 1. Subir archivo en la carpeta del propio usuario.
      const { error: errorSubida } = await cliente.storage
        .from("fotos-perfil")
        .upload(rutaNueva, archivo, {
          contentType: archivo.type,
          upsert: false,
          cacheControl: "3600",
        });

      if (errorSubida) throw errorSubida;
      subidaRealizada = true;

      // 2. Actualizar exclusivamente foto_path.
      //    Esta función SQL ya fue creada en Supabase.
      const {
        data: rutaGuardada,
        error: errorActualizacion,
      } = await cliente.rpc("sigue_actualizar_mi_foto", {
        p_foto_path: rutaNueva,
      });

      if (errorActualizacion) throw errorActualizacion;

      if (rutaGuardada !== rutaNueva) {
        throw new Error(
          "Supabase no confirmó la vinculación de la foto."
        );
      }

      perfilVinculado = true;

      // 3. Obtener URL firmada para mostrar la imagen.
      const { data: firma, error: errorFirma } =
        await cliente.storage
          .from("fotos-perfil")
          .createSignedUrl(rutaNueva, 3600);

      setPerfil((anterior) =>
        anterior
          ? { ...anterior, foto_path: rutaNueva }
          : anterior
      );

      if (!errorFirma && firma?.signedUrl) {
        setFotoUrl(firma.signedUrl);
        setErrorFoto(false);
      } else {
        setFotoUrl(null);
        setErrorFoto(true);
      }

      setMensaje("Fotografía actualizada correctamente.");

      // Avisar a otros componentes que la foto cambió.
      window.dispatchEvent(
        new CustomEvent("sigue-foto-actualizada")
      );

      // 4. Limpiar la fotografía anterior.
      if (rutaAnterior && rutaAnterior !== rutaNueva) {
        const { error: errorBorrado } = await cliente.storage
          .from("fotos-perfil")
          .remove([rutaAnterior]);

        if (errorBorrado) {
          console.warn(
            "No se pudo eliminar la fotografía anterior.",
            errorBorrado.message
          );
        }
      }
    } catch (e) {
      // Solo eliminar el archivo nuevo si NO quedó vinculado
      // al perfil institucional.
      if (rutaNueva && subidaRealizada && !perfilVinculado) {
        await cliente.storage
          .from("fotos-perfil")
          .remove([rutaNueva]);
      }

      setError(
        mensajeError(e, "No se pudo actualizar la fotografía.")
      );
    } finally {
      setGuardandoFoto(false);
    }
  };

  // ============================================
  // ELIMINAR FOTO
  // ============================================

  const eliminarFoto = async () => {
    if (!perfil?.foto_path || !proveedor || guardandoFoto) {
      return;
    }

    if (!window.confirm("¿Deseas eliminar tu foto de perfil?")) {
      return;
    }

    setGuardandoFoto(true);
    setError("");
    setMensaje("");

    const cliente =
      proveedor === "clerk" ? clienteClerk : supabase;

    try {
      const rutaAnterior = perfil.foto_path;

      // Desvincular primero la foto de usuarios.
      const {
        error: errorActualizacion,
      } = await cliente.rpc("sigue_actualizar_mi_foto", {
        p_foto_path: null,
      });

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      setPerfil((anterior) =>
        anterior
          ? { ...anterior, foto_path: null }
          : anterior
      );

      setFotoUrl(null);
      setErrorFoto(false);
      setMensaje("Fotografía eliminada del perfil.");

      window.dispatchEvent(
        new CustomEvent("sigue-foto-actualizada")
      );

      // Limpiar Storage.
      const { error: errorBorrado } = await cliente.storage
        .from("fotos-perfil")
        .remove([rutaAnterior]);

      if (errorBorrado) {
        console.warn(
          "No se pudo borrar el archivo anterior.",
          errorBorrado.message
        );
      }
    } catch (e) {
      setError(
        mensajeError(e, "No se pudo eliminar la fotografía.")
      );
    } finally {
      setGuardandoFoto(false);
    }
  };

  // ============================================
  // ACTUALIZAR ESTADO DE CORREO
  // ============================================

  const actualizarEstado = async () => {
    setActualizando(true);
    setError("");
    setMensaje("");

    try {
      if (proveedor === "clerk") {
        await usuarioClerk?.reload();

        setCorreoAuth(correoVisible(
          usuarioClerk?.primaryEmailAddress?.emailAddress
        ));

        setCorreoVerificado(
          usuarioClerk?.primaryEmailAddress?.verification
            ?.status === "verified"
        );
      } else {
        const { data, error: fallo } =
          await supabase.auth.getUser();

        if (fallo || !data.user) {
          throw new Error("Sesión no disponible.");
        }

        setCorreoAuth(correoVisible(data.user.email));
        setCorreoVerificado(
          Boolean(data.user.email_confirmed_at) &&
          Boolean(correoVisible(data.user.email))
        );

        const extra = await supabase.rpc(
          "obtener_mi_estado_correo"
        );

        setEstadoCorreo(
          extra.error
            ? null
            : Array.isArray(extra.data)
              ? extra.data[0] ?? null
              : extra.data
        );
      }

      setMensaje("Información de correo actualizada.");
    } catch (e) {
      setError(
        mensajeError(e, "No se pudo actualizar el correo.")
      );
    } finally {
      setActualizando(false);
    }
  };

  // ============================================
  // AGREGAR CORREO DE RECUPERACIÓN
  // ============================================

  const agregarCorreo = async (e: FormEvent) => {
    e.preventDefault();
    if (procesandoCorreo) return;

    setError("");
    setMensaje("");

    const correo = nuevoCorreo.trim().toLowerCase();

    if (
      correo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      setError("Introduce una dirección de correo válida.");
      return;
    }

    setProcesandoCorreo(true);

    try {
      if (proveedor === "clerk") {
        if (!usuarioClerk) {
          throw new Error("No hay sesión de Clerk disponible.");
        }

        const existente = usuarioClerk.emailAddresses.find(
          (ea) => ea.emailAddress.toLowerCase() === correo
        );

        const email =
          existente ??
          (await usuarioClerk.createEmailAddress({
            email: correo,
          }));

        if (email.verification?.status === "verified") {
          setMensaje("Este correo ya está verificado en Clerk.");
          setCorreoAuth(email.emailAddress);
          setCorreoVerificado(true);
          setMostrarAgregarCorreo(false);
          return;
        }

        await email.prepareVerification({
          strategy: "email_code",
        });

        setCorreoPendienteId(email.id);
        setEmailPendiente(correo);
        setCodigoVerificacion("");

        setMensaje(
          "Se envió un código de verificación a tu correo."
        );
      } else if (proveedor === "supabase") {
        const { data, error: fallo } =
          await supabase.functions.invoke(
            "solicitar-verificacion-correo",
            { body: { correo } }
          );

        if (fallo) {
          let detalle = "No se pudo solicitar la verificación.";

          if (fallo.context instanceof Response) {
            const cuerpo = await fallo.context
              .clone()
              .json()
              .catch(() => null);

            if (typeof cuerpo?.error === "string") {
              detalle = cuerpo.error;
            }
          }

          throw new Error(detalle);
        }

        if (!data?.ok) {
          throw new Error(
            data?.error || "No se pudo solicitar la verificación."
          );
        }

        setEmailPendiente(correo);

        setMensaje(
          "Solicitud enviada. Revisa tu correo y sigue el enlace de verificación."
        );

        const extra = await supabase.rpc(
          "obtener_mi_estado_correo"
        );

        if (!extra.error) {
          setEstadoCorreo(
            Array.isArray(extra.data)
              ? extra.data[0] ?? null
              : extra.data
          );
        }
      } else {
        throw new Error("No existe una sesión válida.");
      }
    } catch (e) {
      const detalles = (
        e as {
          errors?: {
            longMessage?: string;
            message?: string;
          }[];
        }
      )?.errors;

      setError(
        detalles?.[0]?.longMessage ||
        detalles?.[0]?.message ||
        mensajeError(e, "No se pudo registrar el correo.")
      );
    } finally {
      setProcesandoCorreo(false);
    }
  };

  // ============================================
  // VERIFICAR CORREO CLERK
  // ============================================

  const verificarCorreoClerk = async (e: FormEvent) => {
    e.preventDefault();

    if (!usuarioClerk || !correoPendienteId || procesandoCorreo) {
      return;
    }

    setError("");
    setMensaje("");
    setProcesandoCorreo(true);

    try {
      const email = usuarioClerk.emailAddresses.find(
        (item) => item.id === correoPendienteId
      );

      if (!email) {
        throw new Error(
          "No encontramos el correo pendiente. Actualiza e intenta otra vez."
        );
      }

      const resultado = await email.attemptVerification({
        code: codigoVerificacion.trim(),
      });

      if (resultado.verification?.status !== "verified") {
        throw new Error("El código no pudo verificarse.");
      }

      await usuarioClerk.reload();

      setCorreoPendienteId(null);
      setCodigoVerificacion("");
      setNuevoCorreo("");
      setMostrarAgregarCorreo(false);

      setCorreoAuth(correoVisible(email.emailAddress));
      setCorreoVerificado(true);

      setMensaje("Correo verificado correctamente en Clerk.");
    } catch (e) {
      const detalles = (
        e as {
          errors?: {
            longMessage?: string;
            message?: string;
          }[];
        }
      )?.errors;

      setError(
        detalles?.[0]?.longMessage ||
        detalles?.[0]?.message ||
        mensajeError(e, "No se pudo verificar el código.")
      );
    } finally {
      setProcesandoCorreo(false);
    }
  };

  // ============================================
  // CAMBIO DE CONTRASEÑA
  // ============================================

  const cambiarContrasena = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    setError("");
    setMensaje("");

    if (!perfil || perfil.estado !== "Activo") {
      setError("Cuenta no autorizada.");
      return;
    }

    if (
      nueva.length < 15 ||
      nueva.length > 128 ||
      !evaluarContrasena(nueva).esValida
    ) {
      setError(
        "La contraseña debe tener entre 15 y 128 caracteres y cumplir las reglas de seguridad."
      );
      return;
    }

    if (actual === nueva || nueva !== confirmar) {
      setError(
        "Revisa la contraseña actual y la confirmación."
      );
      return;
    }

    setGuardando(true);

    try {
      if (proveedor === "clerk") {
        if (!usuarioClerk) {
          throw new Error("Sesión Clerk no disponible.");
        }

        await usuarioClerk.updatePassword({
          currentPassword: actual,
          newPassword: nueva,
          signOutOfOtherSessions: true,
        });
      } else if (proveedor === "supabase") {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError || !data.user?.email) {
          throw new Error(
            "Tu sesión de autenticación no está disponible."
          );
        }

        // Revalidar contraseña actual.
        const { error: verificarError } =
          await supabase.auth.signInWithPassword({
            email: data.user.email,
            password: actual,
          });

        if (verificarError) {
          throw new Error("La contraseña actual es incorrecta.");
        }

        const { error: guardarError } =
          await supabase.auth.updateUser({
            password: nueva,
          });

        if (guardarError) throw guardarError;
      } else {
        throw new Error("No existe una sesión válida.");
      }

      setActual("");
      setNueva("");
      setConfirmar("");
      setMensaje("Contraseña actualizada correctamente.");
    } catch (e) {
      const fallos = (
        e as {
          errors?: {
            longMessage?: string;
            message?: string;
          }[];
        }
      )?.errors;

      setError(
        fallos?.[0]?.longMessage ||
        fallos?.[0]?.message ||
        mensajeError(e, "No se pudo cambiar la contraseña.")
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================
  // INTERFAZ
  // ============================================

  if (cargando) {
    return (
      <div className="flex-1 p-8 text-center text-slate-500">
        Cargando información de tu perfil...
      </div>
    );
  }

  const correoRecuperacion = correoVisible(
    estadoCorreo?.verificado
      ? estadoCorreo.correo_secundario
      : correoAuth
  );

  const vinculado = Boolean(correoRecuperacion);

  const iniciales =
    perfil?.nombre
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "US";

  const datosPerfil: [string, string][] = [
    ["Nombre completo", perfil?.nombre || "No registrado"],
    ["DNI", perfil?.dni || "No registrado"],
    [
      "Código institucional",
      perfil?.codigo_institucional || "No asignado",
    ],
    [
      "Rol institucional",
      perfil?.rol === "Secretaria"
        ? "Secretaría"
        : perfil?.rol || "No asignado",
    ],
    ["Estado de la cuenta", perfil?.estado || "Sin estado"],
    ["Nivel asignado", perfil?.nivel_asignado || "No aplica"],
    ["Aula asignada", perfil?.aula_asignada || "No aplica"],
    ["Correo asociado", correoRecuperacion || "No vinculado"],
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
            <UserRound className="text-emerald-600" />
            Mi perfil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta tus datos institucionales, correo vinculado
            y opciones de seguridad.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {mensaje && (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={20} />
            {mensaje}
          </div>
        )}

        {perfil && (
          <>
            {/* INFORMACIÓN INSTITUCIONAL */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-7 flex items-center gap-2 text-lg font-bold text-slate-800">
                <UserRound
                  size={21}
                  className="text-emerald-600"
                />
                Información institucional
              </h2>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                {/* FOTO */}
                <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3 lg:w-[30%]">
                  <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-100 bg-emerald-50 shadow-md">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={`Fotografía de ${perfil.nombre ?? "usuario"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-emerald-700">
                        {iniciales}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-center">
                    <p className="text-base font-bold text-slate-800">
                      {perfil.nombre || "Usuario"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {perfil.rol === "Secretaria"
                        ? "Secretaría"
                        : perfil.rol || "Personal institucional"}
                    </p>
                    {perfil.codigo_institucional && (
                      <p className="font-mono text-xs font-semibold text-emerald-700">
                        {perfil.codigo_institucional}
                      </p>
                    )}
                    {errorFoto && perfil.foto_path && (
                      <p className="mt-2 text-xs text-amber-700">
                        No se pudo cargar la fotografía guardada.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <label
                      htmlFor="cambiar-foto-perfil"
                      className={`cursor-pointer rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 ${
                        guardandoFoto
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      {guardandoFoto
                        ? "Guardando..."
                        : "Cambiar foto"}
                    </label>

                    <input
                      id="cambiar-foto-perfil"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={guardandoFoto}
                      onChange={(e) => {
                        void cambiarFoto(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />

                    {perfil.foto_path && (
                      <button
                        type="button"
                        onClick={() => void eliminarFoto()}
                        disabled={guardandoFoto}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        Eliminar foto
                      </button>
                    )}
                  </div>

                  <p className="text-center text-xs text-slate-400">
                    JPG, PNG o WebP · Máximo 2 MB
                  </p>
                </div>

                {/* DATOS A LA DERECHA */}
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  {datosPerfil.map(([etiqueta, valor]) => (
                    <div key={etiqueta} className="min-w-0">
                      <label className="mb-2 block text-sm font-semibold text-slate-600">
                        {etiqueta}
                      </label>
                      <div className={caja}>{valor}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CORREO DE RECUPERACIÓN */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <Mail size={21} className="text-emerald-600" />
                  Correo de recuperación
                </h2>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarAgregarCorreo((v) => !v);
                      setError("");
                      setMensaje("");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Plus size={15} />
                    {vinculado
                      ? "Agregar otro correo"
                      : "Agregar correo electrónico"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void actualizarEstado()}
                    disabled={actualizando}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className="mr-1 inline" />
                    {actualizando
                      ? "Actualizando..."
                      : "Actualizar estado"}
                  </button>
                </div>
              </div>

              {vinculado ? (
                <>
                  <div className={caja}>
                    {correoRecuperacion}
                  </div>
                  <p className={`mt-3 flex items-center gap-2 text-sm ${
                    correoVerificado ||
                    (estadoCorreo?.verificado &&
                      estadoCorreo.correo_secundario === correoRecuperacion)
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}>
                    {correoVerificado ||
                    (estadoCorreo?.verificado &&
                      estadoCorreo.correo_secundario === correoRecuperacion)
                      ? <CheckCircle2 size={17} />
                      : <Clock3 size={17} />}
                    {correoVerificado ||
                    (estadoCorreo?.verificado &&
                      estadoCorreo.correo_secundario === correoRecuperacion)
                      ? "Correo confirmado"
                      : "Correo aún no confirmado"}
                  </p>
                </>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No tienes un correo de recuperación vinculado.
                </p>
              )}

              {proveedor === "supabase" &&
                estadoCorreo?.correo_secundario && (
                  <p className="mt-3 text-sm text-slate-700">
                    Correo adicional:{" "}
                    {estadoCorreo.correo_secundario} (
                    {estadoCorreo.verificado
                      ? "verificado"
                      : "no verificado"})
                  </p>
                )}

              {mostrarAgregarCorreo && (
                <form
                  onSubmit={agregarCorreo}
                  className="mt-5 space-y-3 border-t border-slate-100 pt-5"
                >
                  <label
                    htmlFor="correo-adicional"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Correo electrónico que deseas verificar
                  </label>

                  <input
                    id="correo-adicional"
                    type="email"
                    required
                    value={nuevoCorreo}
                    onChange={(e) =>
                      setNuevoCorreo(e.target.value)
                    }
                    disabled={
                      procesandoCorreo ||
                      Boolean(correoPendienteId)
                    }
                    autoComplete="email"
                    placeholder="nombre@ejemplo.com"
                    className={entrada}
                  />

                  <button
                    type="submit"
                    disabled={
                      procesandoCorreo ||
                      Boolean(correoPendienteId)
                    }
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Send size={17} />
                    {procesandoCorreo
                      ? "Enviando..."
                      : "Enviar verificación"}
                  </button>
                </form>
              )}

              {proveedor === "clerk" &&
                correoPendienteId && (
                  <form
                    onSubmit={verificarCorreoClerk}
                    className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <p className="text-sm font-semibold text-emerald-800">
                      Verificar correo: {emailPendiente}
                    </p>

                    <input
                      value={codigoVerificacion}
                      onChange={(e) =>
                        setCodigoVerificacion(e.target.value)
                      }
                      inputMode="numeric"
                      required
                      autoComplete="one-time-code"
                      disabled={procesandoCorreo}
                      placeholder="Código recibido"
                      className={entrada}
                    />

                    <button
                      type="submit"
                      disabled={
                        procesandoCorreo ||
                        !codigoVerificacion.trim()
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Verificar código
                    </button>
                  </form>
                )}

              {proveedor === "supabase" &&
                estadoCorreo?.correo_pendiente && (
                  <p className="mt-3 text-sm text-amber-700">
                    Pendiente de verificar:{" "}
                    {estadoCorreo.correo_pendiente}.
                    Comprueba el enlace que recibas.
                  </p>
                )}

              <p className="mt-4 text-xs text-amber-700">
                Verificar el correo demuestra su propiedad.
                La recuperación de contraseñas depende de la
                configuración del proveedor de autenticación.
              </p>
            </section>

            {/* CAMBIAR CONTRASEÑA */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
                <LockKeyhole
                  size={21}
                  className="text-emerald-600"
                />
                Cambiar contraseña
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Usa una contraseña de al menos 15 caracteres.
              </p>

              <form
                onSubmit={cambiarContrasena}
                className="max-w-lg space-y-4"
              >
                {[
                  {
                    label: "Contraseña actual",
                    valor: actual,
                    fn: setActual,
                  },
                  {
                    label: "Nueva contraseña",
                    valor: nueva,
                    fn: setNueva,
                  },
                  {
                    label: "Confirmar nueva contraseña",
                    valor: confirmar,
                    fn: setConfirmar,
                  },
                ].map((campo, i) => (
                  <div key={campo.label}>
                    <label className="mb-2 block text-sm font-semibold text-slate-600">
                      {campo.label}
                    </label>

                    <input
                      type={mostrar ? "text" : "password"}
                      value={campo.valor}
                      onChange={(e) =>
                        campo.fn(e.target.value)
                      }
                      required
                      autoComplete={
                        i === 0
                          ? "current-password"
                          : "new-password"
                      }
                      disabled={guardando}
                      className={entrada}
                    />
                  </div>
                ))}

                <IndicadorSeguridadContrasena
                  contrasena={nueva}
                />

                {confirmar && (
                  <p className={`text-xs ${
                    nueva === confirmar
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}>
                    {nueva === confirmar
                      ? "Las contraseñas coinciden."
                      : "Las contraseñas no coinciden."}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  {mostrar
                    ? <EyeOff size={17} />
                    : <Eye size={17} />}
                  {mostrar
                    ? "Ocultar contraseñas"
                    : "Mostrar contraseñas"}
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    !actual ||
                    nueva.length < 15 ||
                    nueva.length > 128 ||
                    !evaluarContrasena(nueva).esValida ||
                    nueva !== confirmar ||
                    nueva === actual
                  }
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save size={18} />
                  {guardando
                    ? "Actualizando..."
                    : "Actualizar contraseña"}
                </button>
              </form>
            </section>

            <p className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck
                size={17}
                className="text-emerald-600"
              />
              Tu rol institucional no puede modificarse
              desde esta sección.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
