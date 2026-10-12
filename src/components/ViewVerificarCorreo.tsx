
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

type Estado = "listo" | "verificando" | "exito" | "error";

export default function ViewVerificarCorreo() {
  const [estado, setEstado] = useState<Estado>("listo");
  const [mensaje, setMensaje] = useState(
    "Confirma que deseas verificar este correo secundario."
  );

  const tokenRef = useRef<string | null>(null);
  const solicitudIniciada = useRef(false);

  useEffect(() => {
    // Recuperar el token desde el enlace.
    const fragmento = window.location.hash;
    const parametros = new URLSearchParams(
      fragmento.split("?")[1] || ""
    );

    const token = parametros.get("token");

    // Evitar volver a leer el enlace durante
    // las ejecuciones adicionales de StrictMode.
    if (token && !tokenRef.current) {
      tokenRef.current = token;
    }

    // Retirar el token de la barra del navegador.
    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search +
        "#/verificar-correo"
    );

    if (
      !tokenRef.current ||
      !/^[a-f0-9]{64}$/i.test(tokenRef.current)
    ) {
      setEstado("error");
      setMensaje(
        "El enlace no contiene un token válido. Solicita uno nuevo desde Mi perfil."
      );
    }
  }, []);

  const confirmarCorreo = async () => {
    const token = tokenRef.current;

    if (
      !token ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      solicitudIniciada.current
    ) {
      return;
    }

    solicitudIniciada.current = true;
    setEstado("verificando");
    setMensaje("Estamos verificando tu correo secundario...");

    try {
      const {
        data: { user },
        error: errorUsuario,
      } = await supabase.auth.getUser();

      if (errorUsuario || !user) {
        throw new Error(
          "Tu sesión ha caducado. Inicia sesión nuevamente."
        );
      }

      const { data, error } =
        await supabase.functions.invoke(
          "confirmar-verificacion-correo",
          {
            body: { token },
          }
        );

      if (error) {
        const respuesta = error.context;

        if (respuesta instanceof Response) {
          const detalle = await respuesta
            .clone()
            .json()
            .catch(() => null);

          throw new Error(
            detalle?.error ||
              "No se pudo confirmar el correo."
          );
        }

        throw new Error(
          "No se pudo conectar con el servicio de verificación."
        );
      }

      if (!data?.ok) {
        throw new Error(
          data?.error || "La verificación no fue aceptada."
        );
      }

      // No conservar el token después del éxito.
      tokenRef.current = null;

      setEstado("exito");
      setMensaje(
        "Tu correo secundario fue verificado correctamente."
      );
    } catch (err) {
      setEstado("error");
      setMensaje(
        err instanceof Error
          ? err.message
          : "Ocurrió un error durante la verificación."
      );
    } finally {
      solicitudIniciada.current = false;
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

        {estado === "verificando" ? (
          <LoaderCircle
            size={48}
            className="mx-auto mb-4 animate-spin text-emerald-600"
          />
        ) : estado === "exito" ? (
          <CheckCircle2
            size={48}
            className="mx-auto mb-4 text-emerald-600"
          />
        ) : estado === "error" ? (
          <AlertCircle
            size={48}
            className="mx-auto mb-4 text-red-500"
          />
        ) : (
          <ShieldCheck
            size={48}
            className="mx-auto mb-4 text-emerald-600"
          />
        )}

        <h2 className="text-xl font-bold text-slate-800">
          {estado === "listo"
            ? "Confirmar correo secundario"
            : estado === "verificando"
              ? "Verificando correo"
              : estado === "exito"
                ? "Correo verificado"
                : "No se pudo verificar"}
        </h2>

        <p className="mt-3 text-sm text-slate-600">
          {mensaje}
        </p>

        {estado === "listo" && (
          <button
            type="button"
            onClick={confirmarCorreo}
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Confirmar mi correo
          </button>
        )}

        {estado !== "verificando" && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-700">
            <MailCheck size={18} />
            SIGUE · Genios del Millennium
          </div>
        )}
      </div>
    </div>
  );
}
