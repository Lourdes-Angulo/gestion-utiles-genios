
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function responder(
  contenido: Record<string, unknown>,
  status = 200,
  headersAdicionales: Record<string, string> = {}
) {
  return new Response(JSON.stringify(contenido), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headersAdicionales,
    },
  });
}

function esErrorTemporal(status: number) {
  return status === 408 || status >= 500;
}

Deno.serve(async (req) => {
  // 1. CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return responder(
      { error: "Método no permitido." },
      405
    );
  }

  try {
    // 2. Variables de entorno
    const tokenApiPeru = Deno.env.get("APIPERU_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!tokenApiPeru || !supabaseUrl || !supabaseAnonKey) {
      console.error(
        "consulta-dni: configuración incompleta del servidor."
      );

      return responder(
        {
          error:
            "La consulta automática de DNI no está configurada. " +
            "Contacta al administrador o ingresa el nombre manualmente.",
        },
        503
      );
    }

    // 3. Validar sesión de Supabase
    const authorization =
      req.headers.get("Authorization") ?? "";

    const jwt = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!jwt) {
      return responder(
        {
          error:
            "Debes iniciar sesión para consultar un DNI.",
        },
        401
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser(jwt);

    if (authError || !authData.user) {
      return responder(
        {
          error:
            "Tu sesión es inválida o ha expirado. Inicia sesión nuevamente.",
        },
        401
      );
    }

    // 4. Verificar usuario institucional activo
    const { data: perfil, error: perfilError } =
      await supabase
        .from("usuarios")
        .select("rol, estado")
        .eq("authUserId", authData.user.id)
        .maybeSingle();

    if (perfilError) {
      console.error(
        "consulta-dni: no se pudo verificar el perfil institucional."
      );

      return responder(
        {
          error:
            "No se pudieron comprobar tus permisos.",
        },
        403
      );
    }

    if (
      !perfil ||
      perfil.estado !== "Activo" ||
      ![
        "Administrador",
        "Secretaria",
        "Secretaría",
      ].includes(perfil.rol)
    ) {
      return responder(
        {
          error:
            "No tienes autorización para consultar DNI.",
        },
        403
      );
    }

    // 5. Leer y validar DNI
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return responder(
        { error: "Solicitud inválida." },
        400
      );
    }

    const dni =
      body &&
      typeof body === "object" &&
      "dni" in body &&
      typeof body.dni === "string"
        ? body.dni.trim()
        : "";

    if (!/^\d{8}$/.test(dni)) {
      return responder(
        {
          error:
            "El DNI debe contener exactamente 8 dígitos.",
        },
        400
      );
    }

    // 6. Consultar API Perú
    let respuesta: Response;

    try {
      respuesta = await fetch(
        "https://api.apiperu.dev/dni",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenApiPeru}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dni }),
          signal: AbortSignal.timeout(10000),
        }
      );
    } catch (error) {
      console.error(
        "consulta-dni: error de conexión con API Perú:",
        error instanceof Error
          ? error.name
          : "desconocido"
      );

      return responder(
        {
          error:
            "No se pudo conectar con el servicio de DNI. " +
            "Puedes ingresar el nombre completo manualmente.",
        },
        503
      );
    }

    // 7. Manejar errores específicos

    // Límite de consultas del proveedor
    if (respuesta.status === 429) {
      console.warn(
        "consulta-dni: API Perú devolvió 429. " +
        "Límite de consultas alcanzado."
      );

      const retryAfter =
        respuesta.headers.get("Retry-After");

      const headers: Record<string, string> = {};

      // Propagar solamente un valor Retry-After válido.
      if (
        retryAfter &&
        (
          /^\d+$/.test(retryAfter) ||
          !Number.isNaN(Date.parse(retryAfter))
        )
      ) {
        headers["Retry-After"] = retryAfter;
      }

      return responder(
        {
          error:
            "Se alcanzó el límite de consultas de DNI " +
            "del proveedor API Perú. " +
            "Puedes ingresar el nombre completo manualmente " +
            "o consultar con el administrador del sistema.",
          codigo: "LIMITE_CONSULTAS_DNI",
        },
        429,
        headers
      );
    }

    // Token incorrecto o acceso rechazado
    if (
      respuesta.status === 401 ||
      respuesta.status === 403
    ) {
      console.error(
        "consulta-dni: API Perú rechazó las credenciales.",
        respuesta.status
      );

      return responder(
        {
          error:
            "El servicio de DNI rechazó sus credenciales. " +
            "Contacta al administrador o ingresa los datos manualmente.",
          codigo: "ERROR_CREDENCIALES_PROVEEDOR",
        },
        503
      );
    }

    // DNI no encontrado
    if (respuesta.status === 404) {
      return responder(
        {
          error:
            "No se encontraron datos para este DNI.",
        },
        404
      );
    }

    // Otros errores del proveedor
    if (!respuesta.ok) {
      console.error(
        "consulta-dni: API Perú respondió con estado:",
        respuesta.status
      );

      return responder(
        {
          error: esErrorTemporal(respuesta.status)
            ? "El servicio de DNI está temporalmente no disponible. " +
              "Puedes ingresar el nombre manualmente."
            : "No se pudo consultar el DNI. " +
              "Puedes ingresar el nombre manualmente.",
        },
        503
      );
    }

    // 8. Procesar respuesta
    let resultado: unknown;

    try {
      resultado = await respuesta.json();
    } catch {
      console.error(
        "consulta-dni: respuesta JSON inválida del proveedor."
      );

      return responder(
        {
          error:
            "El proveedor devolvió una respuesta inválida.",
        },
        502
      );
    }

    if (
      !resultado ||
      typeof resultado !== "object" ||
      !("success" in resultado) ||
      resultado.success !== true ||
      !("data" in resultado) ||
      !resultado.data ||
      typeof resultado.data !== "object"
    ) {
      return responder(
        {
          error:
            "No se encontraron datos válidos para este DNI.",
        },
        404
      );
    }

    // 9. Adaptar campos al formato de SIGUE
    const persona = resultado.data as Record<
      string,
      unknown
    >;

    const nombres =
      typeof persona.nombres === "string"
        ? persona.nombres.trim()
        : "";

    const apellidoPaterno =
      typeof persona.apellido_paterno === "string"
        ? persona.apellido_paterno.trim()
        : "";

    const apellidoMaterno =
      typeof persona.apellido_materno === "string"
        ? persona.apellido_materno.trim()
        : "";

    if (!nombres || !apellidoPaterno) {
      return responder(
        {
          error:
            "La información del DNI está incompleta. " +
            "Puedes ingresar el nombre manualmente.",
        },
        404
      );
    }

    const nombreCompleto = [
      nombres,
      apellidoPaterno,
      apellidoMaterno,
    ]
      .filter(Boolean)
      .join(" ");

    // 10. Responder al frontend
    return responder({
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      nombreCompleto,
    });
  } catch (error) {
    console.error(
      "consulta-dni: error inesperado:",
      error instanceof Error
        ? error.name
        : "desconocido"
    );

    return responder(
      {
        error:
          "No se pudo completar la consulta de DNI. " +
          "Puedes ingresar el nombre completo manualmente.",
      },
      503
    );
  }
});
