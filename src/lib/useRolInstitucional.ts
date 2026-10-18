import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { supabase } from "./supabaseClient";
import { useSupabaseClerk } from "./useSupabaseClerk";

export type RolInstitucional = "Administrador" | "Secretaria" | "Profesora" | "Auxiliar" | null;
export function useRolInstitucional() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { cliente } = useSupabaseClerk();
  const [rol, setRol] = useState<RolInstitucional>(null);
  const [nivelAsignado, setNivelAsignado] = useState<string | null>(null);
  const [aulaAsignada, setAulaAsignada] = useState<string | null>(null);
  const [cargandoRol, setCargandoRol] = useState(true);
  useEffect(() => {
    if (!isLoaded) return;
    let activo = true;
    const cargar = async () => {
      if (!activo) return;
      setCargandoRol(true); setRol(null); setNivelAsignado(null); setAulaAsignada(null);
      try {
        if (isSignedIn && userId) {
          const { data, error } = await cliente.from("usuarios")
            .select("rol,estado,debe_cambiar_contrasena,nivel_asignado,aula_asignada")
            .eq("clerk_user_id", userId).maybeSingle();
          if (!error && data && data.estado === "Activo" && !data.debe_cambiar_contrasena && activo) {
            if (data.rol === "Profesora" || data.rol === "Auxiliar") {
              setRol(data.rol); setNivelAsignado(data.nivel_asignado); setAulaAsignada(data.aula_asignada);
            }
          }
          return;
        }
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return;
        const { data } = await supabase.from("usuarios")
          .select("rol,estado,debe_cambiar_contrasena")
          .eq("authUserId", auth.user.id).maybeSingle();
        if (activo && data?.estado === "Activo" && !data.debe_cambiar_contrasena) {
          if (data.rol === "Administrador" || data.rol === "Secretaria") setRol(data.rol);
        }
      } finally { if (activo) setCargandoRol(false); }
    };
    void cargar();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { if (activo) void cargar(); });
    return () => { activo = false; subscription.unsubscribe(); };
  }, [isLoaded, isSignedIn, userId, cliente]);
  return { rol, nivelAsignado, aulaAsignada, cargandoRol };
}
