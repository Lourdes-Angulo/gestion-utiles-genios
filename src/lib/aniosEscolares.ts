import type { SupabaseClient } from '@supabase/supabase-js';

export interface AnioEscolar {
  id: string;
  anio: number;
  estado: 'En preparación' | 'Activo' | 'Cerrado';
  fecha_inicio: string;
  fecha_fin: string;
  creado_en: string;
  creado_por: string;
  cerrado_en: string | null;
  cerrado_por: string | null;
  observaciones: string;
}

export const situaciones = ['Pendiente de revisión', 'Continúa y promociona', 'Continúa en el mismo grado', 'Se retira', 'Se traslada', 'Egresa'] as const;
export type Situacion = typeof situaciones[number];
export const grados = ['3 años', '4 años', '5 años', '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];

export function sugerirPromocion(nivel: string, grado: string) {
  const posicion = grados.indexOf(grado);
  if (posicion < 0 || (nivel === 'Inicial') !== (posicion < 3)) return null;
  if (posicion === grados.length - 1) return { nivel, grado, egresa: true };
  return { nivel: posicion < 2 ? 'Inicial' : 'Primaria', grado: grados[posicion + 1], egresa: false };
}

export function validarEvaluacion(stock: number, cantidades: number[]) {
  return Number.isSafeInteger(stock) && stock >= 0 && cantidades.length === 5 &&
    cantidades.every(n => Number.isSafeInteger(n) && n >= 0) &&
    cantidades.reduce((total, n) => total + n, 0) === stock;
}

const operacionesPendientes = new Map<string, string>();

export async function operarAnio(cliente: SupabaseClient, accion: string, datos: Record<string, unknown>) {
  const clave = JSON.stringify([accion, datos]);
  const operacionId = datos.operacion_id ?? operacionesPendientes.get(clave) ?? crypto.randomUUID();
  operacionesPendientes.set(clave, String(operacionId));
  const { data, error } = await cliente.rpc('sigue_operar_anio', { p_accion: accion, p_datos: { ...datos, operacion_id: operacionId } });
  if (error) throw new Error(error.message);
  operacionesPendientes.delete(clave);
  return data;
}

export interface Matricula {
  id: string;
  anio_id: string;
  estudiante_id: string;
  nivel: 'Inicial' | 'Primaria';
  grado: string;
}

export interface Continuidad {
  id: string;
  origen_id: string;
  destino_id: string;
  estudiante_id: string;
  situacion: Situacion;
  nivel: string | null;
  grado: string | null;
  observaciones: string;
  responsable: string;
  actualizado_en: string;
}

export interface EvaluacionStock {
  id: string;
  anio_id: string;
  util_id: string;
  contabilizado: number;
  bueno: number;
  deteriorado: number;
  vencido: number;
  inutilizable: number;
  comprometido: number;
  observaciones: string;
  evidencia: string | null;
}
