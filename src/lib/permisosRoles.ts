export type RolSIGUE = "Administrador" | "Secretaria" | "Profesora" | "Auxiliar";

export const ACCESOS: Record<RolSIGUE, readonly string[]> = {
  Administrador: ["inicio", "estudiantes", "utiles", "listas", "recepcion", "control_stock", "movimientos", "prediccion", "alertas", "reportes", "usuarios", "auditoria", "mi_perfil", "verificar_correo"],
  Secretaria: ["inicio", "estudiantes", "utiles", "listas", "recepcion", "control_stock", "movimientos", "prediccion", "alertas", "reportes", "mi_perfil", "verificar_correo"],
  Profesora: ["inicio", "estudiantes", "utiles", "listas", "recepcion", "reportes", "mi_perfil", "verificar_correo"],
  Auxiliar: ["inicio", "estudiantes", "listas", "recepcion", "reportes", "mi_perfil", "verificar_correo"],
};

export function esRolSIGUE(rol: unknown): rol is RolSIGUE {
  return rol === "Administrador" || rol === "Secretaria" || rol === "Profesora" || rol === "Auxiliar";
}

export function puedeAbrir(rol: RolSIGUE, vista: string): boolean {
  return ACCESOS[rol].includes(vista);
}
