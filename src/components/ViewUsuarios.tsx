
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Users,
  Lock,
  UserPlus,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  Pencil,
  UserX,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  ImagePlus,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import IndicadorSeguridadContrasena from "./IndicadorSeguridadContrasena";
import { evaluarContrasena } from "../lib/passwordPolicy";

// ======================================================
// TIPOS
// ======================================================

type Rol =
  | "Administrador"
  | "Secretaria"
  | "Profesora"
  | "Auxiliar";

type RolEditable =
  | "Secretaria"
  | "Profesora"
  | "Auxiliar";

type Estado = "Activo" | "Inactivo";

type Nivel = "Inicial" | "Primaria";

type PerfilUsuario = {
  id: string;
  nombre: string;
  correo: string | null;
  rol: Rol | string;
  estado: Estado | string;
  authUserId: string | null;
  dni: string | null;
  origen_nombre: "api" | "manual" | null;
  codigo_institucional?: string | null;
  nivel_asignado?: Nivel | null;
  aula_asignada?: string | null;
  foto_path?: string | null;
};

type Modo = "crear" | "editar" | "clave" | null;

type RespuestaAccion = {
  ok: boolean;
  error?: string;
  codigo_institucional?: string;
  usuario?: {
    codigo_institucional?: string;
  };
};

// ======================================================
// CONFIGURACIÓN
// ======================================================

const roles: RolEditable[] = [
  "Secretaria",
  "Profesora",
  "Auxiliar",
];

const prefijos: Record<RolEditable, string> = {
  Secretaria: "SEC",
  Profesora: "DOC",
  Auxiliar: "AUX",
};

const aulasPorNivel: Record<Nivel, string[]> = {
  Inicial: ["3 años", "4 años", "5 años"],
  Primaria: [
    "1er Grado",
    "2do Grado",
    "3er Grado",
    "4to Grado",
    "5to Grado",
    "6to Grado",
  ],
};

function esRolEditable(valor: string): valor is RolEditable {
  return roles.includes(valor as RolEditable);
}

function claveValida(valor: string): boolean {
  return (
    valor.length >= 15 &&
    valor.length <= 128 &&
    evaluarContrasena(valor).esValida
  );
}

function obtenerIniciales(nombre: string): string {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "US"
  );
}

function detallesRol(rol: string): string {
  switch (rol) {
    case "Administrador":
      return "Administración, gestión de usuarios y auditoría.";

    case "Secretaria":
      return "Gestión administrativa de estudiantes, listas y recepción.";

    case "Profesora":
      return "Seguimiento de estudiantes y útiles según permisos asignados.";

    case "Auxiliar":
      return "Registro de recepción y control de útiles según permisos asignados.";

    default:
      return "Pendiente de configuración.";
  }
}

// ======================================================
// EDGE FUNCTIONS
// ======================================================

async function invocarAccion(
  funcion: string,
  body: Record<string, unknown>
): Promise<RespuestaAccion> {
  const { data, error } = await supabase.functions.invoke(
    funcion,
    { body }
  );

  if (error) {
    let mensaje =
      `No se pudo completar la operación (${funcion}).`;

    if (error.context instanceof Response) {
      const contenido = await error.context
        .clone()
        .json()
        .catch(() => null);

      if (typeof contenido?.error === "string") {
        mensaje = contenido.error;
      }
    }

    throw new Error(mensaje);
  }

  if (!data?.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "El servidor no confirmó la operación."
    );
  }

  return data as RespuestaAccion;
}

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function ViewUsuarios() {
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [buscandoDni, setBuscandoDni] = useState(false);

  const [usuarios, setUsuarios] =
    useState<PerfilUsuario[]>([]);

  const [miAuthId, setMiAuthId] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [modo, setModo] = useState<Modo>(null);

  const [seleccionado, setSeleccionado] =
    useState<PerfilUsuario | null>(null);

  const [dni, setDni] = useState("");
  const [origenNombre, setOrigenNombre] =
    useState<"api" | "manual">("manual");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] =
    useState<RolEditable>("Secretaria");

  const [nivelAsignado, setNivelAsignado] =
    useState<"" | Nivel>("");

  const [aulaAsignada, setAulaAsignada] = useState("");

  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] =
    useState(false);

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoVistaPrevia, setFotoVistaPrevia] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Fotografías firmadas de los usuarios.
  const [fotosUsuarios, setFotosUsuarios] =
    useState<Record<string, string>>({});

  // ======================================================
  // VISTA PREVIA DE FOTOGRAFÍA
  // ======================================================

  useEffect(() => {
    if (!foto) {
      setFotoVistaPrevia(null);
      return;
    }

    const url = URL.createObjectURL(foto);
    setFotoVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const seleccionarFoto = (archivo?: File) => {
    if (!archivo) return;

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !tiposPermitidos.includes(archivo.type) ||
      archivo.size > 2 * 1024 * 1024 ||
      archivo.size === 0
    ) {
      setError(
        "Selecciona una imagen JPG, PNG o WebP de máximo 2 MB."
      );
      return;
    }

    setError("");
    setFoto(archivo);
  };

  // ======================================================
  // CARGAR USUARIOS
  // ======================================================

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    try {
      const { data, error: errorLista } =
        await supabase
          .from("usuarios")
          .select(
            "id, nombre, correo, rol, estado, authUserId, dni, origen_nombre, codigo_institucional, nivel_asignado, aula_asignada, foto_path"
          )
          .order("nombre", {
            ascending: true,
          });

      if (errorLista) throw errorLista;

      setUsuarios(
        (data ?? []) as PerfilUsuario[]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los usuarios."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  // ======================================================
  // VERIFICAR ADMINISTRADOR
  // ======================================================

  useEffect(() => {
    let activo = true;

    const verificar = async () => {
      try {
        const { data: auth, error: errorAuth } =
          await supabase.auth.getUser();

        if (errorAuth || !auth.user) {
          throw new Error("Debes iniciar sesión.");
        }

        const { data: perfil, error: errorPerfil } =
          await supabase
            .from("usuarios")
            .select("rol, estado")
            .eq("authUserId", auth.user.id)
            .maybeSingle();

        if (errorPerfil) throw errorPerfil;
        if (!activo) return;

        setMiAuthId(auth.user.id);

        if (
          perfil?.rol !== "Administrador" ||
          perfil?.estado !== "Activo"
        ) {
          setAutorizado(false);
          setError(
            "Solo el Administrador puede gestionar usuarios."
          );
          return;
        }

        setAutorizado(true);
        await cargarUsuarios();
      } catch (err) {
        if (activo) {
          setAutorizado(false);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo verificar la sesión."
          );
        }
      } finally {
        if (activo) setVerificando(false);
      }
    };

    void verificar();

    return () => {
      activo = false;
    };
  }, [cargarUsuarios]);

  // ======================================================
  // CARGAR FOTOGRAFÍAS DESDE SUPABASE STORAGE
  // ======================================================

  useEffect(() => {
    let activo = true;

    const cargarFotografias = async () => {
      if (!autorizado) {
        setFotosUsuarios({});
        return;
      }

      const usuariosConFoto = usuarios.filter(
        (usuario) => Boolean(usuario.foto_path)
      );

      if (usuariosConFoto.length === 0) {
        setFotosUsuarios({});
        return;
      }

      const resultados = await Promise.all(
        usuariosConFoto.map(async (usuario) => {
          if (!usuario.foto_path) return null;

          const { data, error } =
            await supabase.storage
              .from("fotos-perfil")
              .createSignedUrl(
                usuario.foto_path,
                3600
              );

          if (error || !data?.signedUrl) {
            console.warn(
              "No se pudo cargar la foto de un usuario.",
              {
                usuarioId: usuario.id,
                error: error?.message,
              }
            );

            return null;
          }

          return {
            id: usuario.id,
            url: data.signedUrl,
          };
        })
      );

      if (!activo) return;

      const fotos: Record<string, string> = {};

      resultados.forEach((resultado) => {
        if (resultado) {
          fotos[resultado.id] = resultado.url;
        }
      });

      setFotosUsuarios(fotos);
    };

    void cargarFotografias();

    return () => {
      activo = false;
    };
  }, [usuarios, autorizado]);

  // Actualizar el listado cuando se cambie una foto.
  useEffect(() => {
    if (!autorizado) return;

    const actualizarFotos = () => {
      void cargarUsuarios();
    };

    window.addEventListener(
      "sigue-foto-actualizada",
      actualizarFotos
    );

    return () => {
      window.removeEventListener(
        "sigue-foto-actualizada",
        actualizarFotos
      );
    };
  }, [autorizado, cargarUsuarios]);

  // ======================================================
  // LIMPIAR FORMULARIO
  // ======================================================

  const limpiarFormulario = () => {
    setSeleccionado(null);
    setDni("");
    setOrigenNombre("manual");
    setNombre("");
    setCorreo("");
    setRol("Secretaria");
    setNivelAsignado("");
    setAulaAsignada("");
    setClave("");
    setMostrarClave(false);
    setFoto(null);
    setError("");
    setMensaje("");
  };

  const abrirNuevo = () => {
    limpiarFormulario();
    setModo("crear");
  };

  const abrirEditar = (usuario: PerfilUsuario) => {
    setSeleccionado(usuario);
    setDni(usuario.dni ?? "");
    setNombre(usuario.nombre);
    setCorreo(usuario.correo ?? "");
    setOrigenNombre(
      usuario.origen_nombre ?? "manual"
    );
    setRol(
      esRolEditable(usuario.rol)
        ? usuario.rol
        : "Secretaria"
    );

    setNivelAsignado(
      usuario.nivel_asignado ?? ""
    );

    setAulaAsignada(
      usuario.aula_asignada ?? ""
    );

    setClave("");
    setMostrarClave(false);
    setFoto(null);
    setError("");
    setMensaje("");
    setModo("editar");
  };

  const abrirClave = (usuario: PerfilUsuario) => {
    setSeleccionado(usuario);
    setClave("");
    setMostrarClave(false);
    setFoto(null);
    setError("");
    setMensaje("");
    setModo("clave");
  };

  // ======================================================
  // CONSULTAR DNI
  // ======================================================

  const buscarDni = async () => {
    if (!/^\d{8}$/.test(dni)) {
      setError(
        "El DNI debe contener 8 dígitos."
      );
      return;
    }

    setError("");
    setBuscandoDni(true);

    try {
      const { data, error: fallo } =
        await supabase.functions.invoke(
          "consulta-dni",
          {
            body: { dni },
          }
        );

      if (fallo || !data?.nombres) {
        throw new Error(
          "No se encontraron datos del DNI. Puedes ingresarlos manualmente."
        );
      }

      const nombreCompleto = [
        data.nombres,
        data.apellidoPaterno,
        data.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (!nombreCompleto) {
        throw new Error(
          "No se encontraron nombres completos."
        );
      }

      setNombre(nombreCompleto);
      setOrigenNombre("api");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo consultar el DNI."
      );
    } finally {
      setBuscandoDni(false);
    }
  };

  // ======================================================
  // CREAR / EDITAR / CONTRASEÑA
  // ======================================================

  const guardar = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!autorizado || guardando || !modo) {
      return;
    }

    setError("");
    setMensaje("");

    if (
      modo === "crear" ||
      modo === "editar"
    ) {
      if (
        rol === "Profesora" &&
        (
          !nivelAsignado ||
          !aulaAsignada ||
          !aulasPorNivel[nivelAsignado].includes(
            aulaAsignada
          )
        )
      ) {
        setError(
          "Selecciona un nivel y un aula válidos para la Profesora."
        );
        return;
      }

      if (
        rol === "Auxiliar" &&
        !nivelAsignado
      ) {
        setError(
          "Selecciona el nivel asignado a la Auxiliar."
        );
        return;
      }

      if (nombre.trim().length < 3) {
        setError(
          "Ingresa el nombre completo."
        );
        return;
      }

      // El correo es opcional.
      if (
        correo.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          correo.trim()
        )
      ) {
        setError(
          "Ingresa un correo válido o deja el campo vacío."
        );
        return;
      }
    }

    if (
      (modo === "crear" ||
        modo === "clave") &&
      !claveValida(clave)
    ) {
      setError(
        "La contraseña provisional debe tener entre 15 y 128 caracteres, mayúscula, minúscula, número y símbolo, sin espacios."
      );
      return;
    }

    setGuardando(true);

    try {
      // CREAR USUARIO
      if (modo === "crear") {
        const funcionAlta =
          rol === "Secretaria"
            ? "crear-usuario"
            : "crear-usuario-clerk";

        const respuesta =
          await invocarAccion(
            funcionAlta,
            {
              dni: dni || null,
              origenNombre,
              nombre: nombre.trim(),
              correo: correo.trim().toLowerCase(),
              rol,
              nivel_asignado:
                rol === "Secretaria"
                  ? null
                  : nivelAsignado,
              aula_asignada:
                rol === "Profesora"
                  ? aulaAsignada
                  : null,
              contrasenaProvisional: clave,
            }
          );

        const codigoCreado =
          rol === "Secretaria"
            ? respuesta.usuario
                ?.codigo_institucional
            : respuesta.codigo_institucional;

        if (
          typeof codigoCreado !== "string" ||
          !codigoCreado
        ) {
          throw new Error(
            "No se recibió el código institucional. Revisa Supabase antes de repetir el registro."
          );
        }

        setMensaje(
          `Usuario registrado: ${codigoCreado}. Debe cambiar la contraseña provisional en su primer ingreso.`
        );
      }

      // EDITAR USUARIO
      else if (
        modo === "editar" &&
        seleccionado
      ) {
        if (
          seleccionado.rol === "Administrador"
        ) {
          throw new Error(
            "No se puede modificar un Administrador desde este formulario."
          );
        }

        await invocarAccion(
          "administrar-usuario",
          {
            accion: "editar",
            usuarioId: seleccionado.id,
            dni: dni || null,
            origenNombre,
            nombre: nombre.trim(),
            correo: correo.trim().toLowerCase(),
            rol,
            nivel_asignado:
              rol === "Secretaria"
                ? null
                : nivelAsignado,
            aula_asignada:
              rol === "Profesora"
                ? aulaAsignada
                : null,
          }
        );

        setMensaje(
          "Usuario actualizado correctamente."
        );
      }

      // RESTABLECER CONTRASEÑA
      else if (
        modo === "clave" &&
        seleccionado
      ) {
        if (
          seleccionado.rol === "Administrador"
        ) {
          throw new Error(
            "No se puede restablecer una cuenta Administrador desde este formulario."
          );
        }

        await invocarAccion(
          "administrar-usuario",
          {
            accion: "restablecer-clave",
            usuarioId: seleccionado.id,
            contrasenaProvisional: clave,
          }
        );

        setMensaje(
          "Contraseña provisional asignada. Se requerirá cambiarla en el siguiente inicio de sesión."
        );
      }

      setClave("");
      setModo(null);
      setSeleccionado(null);

      await cargarUsuarios();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar."
      );
    } finally {
      setGuardando(false);
    }
  };

  // ======================================================
  // CAMBIAR ESTADO
  // ======================================================

  const alternarEstado = async (
    usuario: PerfilUsuario
  ) => {
    if (!autorizado || guardando) {
      return;
    }

    if (
      usuario.rol === "Administrador" ||
      usuario.authUserId === miAuthId
    ) {
      setError(
        "No se puede inhabilitar la cuenta del Administrador desde esta opción."
      );
      return;
    }

    const nuevoEstado: Estado =
      usuario.estado === "Activo"
        ? "Inactivo"
        : "Activo";

    if (
      !window.confirm(
        `¿Confirmas ${
          nuevoEstado === "Inactivo"
            ? "inhabilitar"
            : "habilitar"
        } la cuenta de ${usuario.nombre}?`
      )
    ) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await invocarAccion(
        "administrar-usuario",
        {
          accion: "cambiar-estado",
          usuarioId: usuario.id,
          estado: nuevoEstado,
        }
      );

      setMensaje(
        `Usuario ${
          nuevoEstado === "Activo"
            ? "habilitado"
            : "inhabilitado"
        } correctamente.`
      );

      await cargarUsuarios();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado."
      );
    } finally {
      setGuardando(false);
    }
  };

  // ======================================================
  // FILTROS Y ESTADÍSTICAS
  // ======================================================

  const filtrados = usuarios.filter(
    (usuario) =>
      [
        usuario.codigo_institucional ?? "",
        usuario.nombre,
        usuario.correo ?? "",
        usuario.rol,
        usuario.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(
          busqueda.trim().toLowerCase()
        )
  );

  const activos = usuarios.filter(
    (usuario) =>
      usuario.estado === "Activo"
  ).length;

  // ======================================================
  // INTERFAZ
  // ======================================================

  return (
    <div className="flex-1 overflow-y-auto bg-[#f0f4f8] p-5 text-slate-800 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ENCABEZADO */}
        <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-emerald-600" />

            <div>
              <h2 className="text-lg font-bold">
                Usuarios
              </h2>

              <p className="text-sm text-slate-500">
                Personal autorizado para ingresar a SIGUE.
              </p>
            </div>
          </div>

          {autorizado && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  void cargarUsuarios()
                }
                disabled={cargando}
                className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>

              <button
                type="button"
                onClick={abrirNuevo}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <UserPlus size={17} />
                Nuevo usuario
              </button>
            </div>
          )}
        </div>

        {/* MENSAJES */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {mensaje && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={19} />
            <span>{mensaje}</span>
          </div>
        )}

        {verificando ? (
          <p className="text-sm">
            Verificando permisos...
          </p>
        ) : autorizado ? (
          <>
            {/* ESTADÍSTICAS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">
                  Usuarios registrados
                </p>
                <p className="text-2xl font-bold">
                  {usuarios.length}
                </p>
              </div>

              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">
                  Activos
                </p>
                <p className="text-2xl font-bold text-emerald-700">
                  {activos}
                </p>
              </div>

              <div className="glass-card p-4">
                <p className="text-sm text-slate-500">
                  Inactivos
                </p>
                <p className="text-2xl font-bold">
                  {usuarios.length - activos}
                </p>
              </div>
            </div>

            {/* LISTADO */}
            <div className="glass-card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <Users
                    size={19}
                    className="text-emerald-600"
                  />
                  Listado de usuarios
                </h3>

                <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                  <Search
                    size={17}
                    className="text-slate-400"
                  />

                  <input
                    value={busqueda}
                    onChange={(e) =>
                      setBusqueda(
                        e.target.value
                      )
                    }
                    placeholder="Buscar código, usuario o rol"
                    aria-label="Buscar usuarios"
                    className="w-56 max-w-full text-sm outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">

                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">CÓDIGO</th>
                      <th className="p-3">USUARIO</th>
                      <th className="p-3">ROL</th>
                      <th className="p-3">ESTADO</th>
                      <th className="p-3">ACCESO</th>
                      <th className="p-3">ACCIONES</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtrados.map(
                      (usuario) => (
                        <tr
                          key={usuario.id}
                          className="border-b border-slate-100"
                        >

                          {/* CÓDIGO */}
                          <td className="p-3 font-mono text-xs font-semibold text-emerald-700">
                            {usuario.codigo_institucional ||
                              "Sin asignar"}
                          </td>

                          {/* USUARIO Y FOTO */}
                          <td className="p-3">
                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                {fotosUsuarios[usuario.id] ? (
                                  <img
                                    src={
                                      fotosUsuarios[
                                        usuario.id
                                      ]
                                    }
                                    alt={`Fotografía de ${usuario.nombre}`}
                                    className="h-full w-full object-cover"
                                    onError={() => {
                                      setFotosUsuarios(
                                        (anterior) => {
                                          const copia = {
                                            ...anterior,
                                          };

                                          delete copia[
                                            usuario.id
                                          ];

                                          return copia;
                                        }
                                      );
                                    }}
                                  />
                                ) : (
                                  obtenerIniciales(
                                    usuario.nombre
                                  )
                                )}
                              </div>

                              <div>
                                <div className="font-bold">
                                  {usuario.nombre}

                                  {usuario.authUserId ===
                                    miAuthId && (
                                    <span className="ml-2 text-xs text-emerald-600">
                                      (Tú)
                                    </span>
                                  )}
                                </div>

                                <div className="break-all text-xs text-slate-500">
                                  {usuario.correo ||
                                    "Sin correo de recuperación"}
                                </div>

                                {usuario.nivel_asignado && (
                                  <div className="text-xs text-emerald-700">
                                    {
                                      usuario.nivel_asignado
                                    }

                                    {usuario.aula_asignada
                                      ? ` · ${usuario.aula_asignada}`
                                      : " · Todo el nivel"}
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>

                          {/* ROL */}
                          <td className="p-3">
                            <p className="font-semibold">
                              {usuario.rol === "Secretaria"
                                ? "Secretaría"
                                : usuario.rol}
                            </p>

                            <p className="max-w-xs text-xs text-slate-500">
                              {detallesRol(
                                usuario.rol
                              )}
                            </p>
                          </td>

                          {/* ESTADO */}
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                usuario.estado === "Activo"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {usuario.estado}
                            </span>
                          </td>

                          {/* ACCESO */}
                          <td className="p-3 text-xs">
                            {usuario.authUserId
                              ? "Vinculado"
                              : usuario.rol === "Profesora" ||
                                  usuario.rol === "Auxiliar"
                                ? "Clerk"
                                : "Sin vincular"}
                          </td>

                          {/* ACCIONES */}
                          <td className="p-3">
                            {usuario.rol !==
                              "Administrador" && (
                              <div className="flex flex-wrap gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirEditar(
                                      usuario
                                    )
                                  }
                                  title="Editar usuario"
                                  aria-label={`Editar ${usuario.nombre}`}
                                  className="rounded-lg border p-2 hover:bg-slate-50"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirClave(
                                      usuario
                                    )
                                  }
                                  title="Asignar contraseña provisional"
                                  aria-label={`Cambiar contraseña de ${usuario.nombre}`}
                                  className="rounded-lg border p-2 hover:bg-slate-50"
                                >
                                  <KeyRound size={16} />
                                </button>

                                <button
                                  type="button"
                                  disabled={guardando}
                                  onClick={() =>
                                    void alternarEstado(
                                      usuario
                                    )
                                  }
                                  title={
                                    usuario.estado ===
                                    "Activo"
                                      ? "Inhabilitar"
                                      : "Habilitar"
                                  }
                                  aria-label={`Cambiar estado de ${usuario.nombre}`}
                                  className="rounded-lg border p-2 hover:bg-slate-50"
                                >
                                  {usuario.estado ===
                                  "Activo" ? (
                                    <UserX size={16} />
                                  ) : (
                                    <UserCheck
                                      size={16}
                                    />
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {!cargando &&
                  filtrados.length === 0 && (
                    <p className="p-5 text-center text-sm text-slate-500">
                      No se encontraron usuarios.
                    </p>
                  )}

                {cargando && (
                  <p className="p-4 text-sm">
                    Actualizando usuarios...
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="glass-card flex gap-3 p-5 text-sm">
            <ShieldCheck
              className="text-emerald-600"
              size={20}
            />
            Solo el Administrador puede consultar esta pantalla.
          </div>
        )}
      </div>

      {/* MODAL DE USUARIOS */}
      {modo && autorizado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            modo === "crear"
              ? "Registrar usuario"
              : modo === "editar"
                ? "Editar usuario"
                : "Cambiar contraseña"
          }
        >
          <form
            onSubmit={(e) => void guardar(e)}
            className={`my-auto w-full space-y-5 rounded-2xl bg-white p-5 shadow-xl md:p-7 ${
              modo === "clave"
                ? "max-w-xl"
                : "max-w-5xl"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <UserPlus
                  className="text-emerald-600"
                  size={21}
                />

                {modo === "crear"
                  ? "Registrar nuevo usuario"
                  : modo === "editar"
                    ? "Editar usuario"
                    : "Asignar contraseña provisional"}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setModo(null)
                }
                disabled={guardando}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {modo === "clave" ? (
              <div className="space-y-4">

                <label className="block text-sm font-semibold">
                  Contraseña provisional

                  <div className="relative mt-1">
                    <input
                      required
                      type={
                        mostrarClave
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={clave}
                      onChange={(e) =>
                        setClave(
                          e.target.value
                        )
                      }
                      disabled={guardando}
                      className="w-full rounded-xl border p-3 pr-12 font-normal"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarClave(
                          !mostrarClave
                        )
                      }
                      aria-label={
                        mostrarClave
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute right-3 top-3 text-slate-600"
                    >
                      {mostrarClave ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </label>

                <IndicadorSeguridadContrasena
                  contrasena={clave}
                />

                <p className="text-xs text-slate-500">
                  La persona deberá cambiar esta
                  contraseña en su primer acceso.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">

                {/* DATOS PERSONALES */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Datos personales y acceso
                  </h4>

                  <label className="block text-sm font-semibold">
                    DNI

                    <div className="mt-1 flex gap-2">
                      <input
                        inputMode="numeric"
                        maxLength={8}
                        value={dni}
                        onChange={(e) => {
                          setDni(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          );
                          setOrigenNombre("manual");
                        }}
                        readOnly={
                          modo === "editar" &&
                          seleccionado?.origen_nombre ===
                            "api"
                        }
                        placeholder="8 dígitos"
                        className="min-w-0 flex-1 rounded-xl border p-3 font-normal"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          void buscarDni()
                        }
                        disabled={
                          buscandoDni ||
                          guardando ||
                          dni.length !== 8
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {buscandoDni
                          ? "Buscando..."
                          : "Buscar"}
                      </button>
                    </div>
                  </label>

                  <label className="block text-sm font-semibold">
                    Nombre completo

                    <input
                      required
                      minLength={3}
                      maxLength={160}
                      value={nombre}
                      onChange={(e) => {
                        setNombre(e.target.value);
                        setOrigenNombre("manual");
                      }}
                      readOnly={
                        origenNombre === "api"
                      }
                      disabled={guardando}
                      className={`mt-1 w-full rounded-xl border p-3 font-normal ${
                        origenNombre === "api"
                          ? "cursor-not-allowed bg-slate-100 text-slate-600"
                          : ""
                      }`}
                    />

                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {origenNombre === "api"
                        ? "Nombre obtenido por consulta DNI."
                        : "Nombre ingresado manualmente."}
                    </span>
                  </label>

                  {/* CÓDIGO */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <label className="block text-sm font-semibold text-emerald-900">
                      Código institucional
                    </label>

                    <div className="mt-1 rounded-lg border border-emerald-100 bg-white px-3 py-3 font-mono text-sm font-semibold text-slate-700">
                      {modo === "editar"
                        ? seleccionado?.codigo_institucional ||
                          "Aún no asignado"
                        : `${prefijos[rol]}- (asignado al guardar)`}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      El código institucional se
                      genera automáticamente al
                      registrar al usuario.
                    </p>
                  </div>

                  {/* CORREO OPCIONAL */}
                  <label className="block text-sm font-semibold">
                    Correo electrónico de recuperación
                    (opcional)

                    <input
                      type="email"
                      maxLength={254}
                      value={correo}
                      onChange={(e) =>
                        setCorreo(
                          e.target.value
                        )
                      }
                      readOnly={
                        modo === "editar"
                      }
                      disabled={guardando}
                      placeholder="Puedes dejarlo vacío"
                      className="mt-1 w-full rounded-xl border p-3 font-normal"
                    />
                  </label>

                  {/* ROL */}
                  <label className="block text-sm font-semibold">
                    Rol

                    <select
                      value={rol}
                      onChange={(e) => {
                        const nuevoRol =
                          e.target.value as RolEditable;

                        setRol(nuevoRol);

                        if (
                          nuevoRol === "Secretaria"
                        ) {
                          setNivelAsignado("");
                          setAulaAsignada("");
                        } else if (
                          nuevoRol === "Auxiliar"
                        ) {
                          setAulaAsignada("");
                        }
                      }}
                      disabled={guardando}
                      className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"
                    >
                      <option value="Secretaria">
                        Secretaría
                      </option>

                      <option value="Profesora">
                        Profesora
                      </option>

                      <option value="Auxiliar">
                        Auxiliar
                      </option>
                    </select>
                  </label>
                </section>

                {/* FOTO Y SEGURIDAD */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Foto de perfil{" "}
                    {modo === "crear"
                      ? "y seguridad"
                      : ""}
                  </h4>

                  <div className="flex items-center justify-center gap-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm">
                      {fotoVistaPrevia ? (
                        <img
                          src={fotoVistaPrevia}
                          alt="Vista previa de la fotografía"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {nombre.trim()
                            ? obtenerIniciales(
                                nombre
                              )
                            : (
                              <Camera
                                size={28}
                              />
                            )}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <label
                        htmlFor="foto-usuario"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        <ImagePlus size={16} />
                        Subir imagen
                      </label>

                      <input
                        id="foto-usuario"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={guardando}
                        onChange={(e) =>
                          seleccionarFoto(
                            e.target.files?.[0]
                          )
                        }
                      />

                      <p className="text-xs text-slate-500">
                        JPG, PNG o WebP · máximo 2 MB.
                      </p>

                      {foto && (
                        <>
                          <p className="max-w-[220px] truncate text-xs text-emerald-700">
                            {foto.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setFoto(null)
                            }
                            className="text-xs font-semibold text-slate-600 underline"
                          >
                            Quitar imagen
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ASIGNACIÓN */}
                  {(rol === "Profesora" ||
                    rol === "Auxiliar") && (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <p className="text-sm font-bold text-emerald-900">
                        Asignación académica
                      </p>

                      <label className="block text-sm font-semibold">
                        Nivel asignado

                        <select
                          value={nivelAsignado}
                          onChange={(e) => {
                            setNivelAsignado(
                              e.target.value as
                                | ""
                                | Nivel
                            );

                            setAulaAsignada("");
                          }}
                          disabled={guardando}
                          className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"
                        >
                          <option value="">
                            Seleccionar nivel
                          </option>

                          <option value="Inicial">
                            Inicial
                          </option>

                          <option value="Primaria">
                            Primaria
                          </option>
                        </select>
                      </label>

                      {rol === "Profesora" && (
                        <label className="block text-sm font-semibold">
                          Aula asignada

                          <select
                            value={aulaAsignada}
                            onChange={(e) =>
                              setAulaAsignada(
                                e.target.value
                              )
                            }
                            disabled={
                              !nivelAsignado ||
                              guardando
                            }
                            className="mt-1 w-full rounded-xl border bg-white p-3 font-normal disabled:opacity-50"
                          >
                            <option value="">
                              Seleccionar aula
                            </option>

                            {nivelAsignado &&
                              aulasPorNivel[
                                nivelAsignado
                              ].map((aula) => (
                                <option
                                  key={aula}
                                  value={aula}
                                >
                                  {aula}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                    </div>
                  )}

                  {/* CONTRASEÑA */}
                  {modo === "crear" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold">
                        Contraseña provisional

                        <div className="relative mt-1">
                          <input
                            required
                            type={
                              mostrarClave
                                ? "text"
                                : "password"
                            }
                            autoComplete="new-password"
                            value={clave}
                            onChange={(e) =>
                              setClave(
                                e.target.value
                              )
                            }
                            disabled={guardando}
                            className="w-full rounded-xl border p-3 pr-12 font-normal"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setMostrarClave(
                                !mostrarClave
                              )
                            }
                            aria-label={
                              mostrarClave
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                            className="absolute right-3 top-3 text-slate-600"
                          >
                            {mostrarClave ? (
                              <EyeOff size={19} />
                            ) : (
                              <Eye size={19} />
                            )}
                          </button>
                        </div>
                      </label>

                      <IndicadorSeguridadContrasena
                        contrasena={clave}
                      />
                    </div>
                  )}
                </section>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* BOTONES */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setModo(null)
                }
                disabled={guardando}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  guardando ||
                  (
                    modo === "crear" &&
                    !claveValida(clave)
                  ) ||
                  (
                    modo === "clave" &&
                    !claveValida(clave)
                  )
                }
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : modo === "crear"
                    ? "Registrar usuario"
                    : modo === "editar"
                      ? "Guardar cambios"
                      : "Asignar contraseña"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
