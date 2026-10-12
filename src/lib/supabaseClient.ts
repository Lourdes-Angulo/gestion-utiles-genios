
import {
  createClient,
  type Session,
} from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Estado temporal de recuperación, solo en memoria.
let sesionRecuperacion: Session | null = null;

const observadores = new Set<() => void>();

function notificarCambio() {
  observadores.forEach((avisar) => avisar());
}

// Escuchar desde el inicio, no cuando se abra la vista.
supabase.auth.onAuthStateChange((evento, sesion) => {
  if (evento === "PASSWORD_RECOVERY") {
    sesionRecuperacion = sesion;
    notificarCambio();
  }

  if (evento === "SIGNED_OUT") {
    sesionRecuperacion = null;
    notificarCambio();
  }
});

export function obtenerSesionRecuperacion() {
  return sesionRecuperacion;
}

export function limpiarSesionRecuperacion() {
  sesionRecuperacion = null;
  notificarCambio();
}

export function escucharSesionRecuperacion(
  avisar: () => void
) {
  observadores.add(avisar);

  return () => {
    observadores.delete(avisar);
  };
}
