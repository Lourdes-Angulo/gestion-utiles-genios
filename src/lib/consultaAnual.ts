import type { AnioEscolar } from './aniosEscolares';
import type { DemoEstado } from './demoAniosEscolares';
export type PeriodoConsulta = { id: string; anio: number; estado: AnioEscolar['estado'] };
export function periodosParaConsulta(modo: 'real' | 'demo' | null, demo: DemoEstado, reales: PeriodoConsulta[]): PeriodoConsulta[] {
  return modo === 'demo'
    ? demo.anios.map(p => ({ id: String(p.anio), anio: p.anio, estado: p.estado }))
    : reales.map(p => ({ id: p.id, anio: p.anio, estado: p.estado }));
}
export function resolverPeriodo(periodos: PeriodoConsulta[], id: string) {
  return periodos.find(p => p.id === id) ?? periodos.find(p => p.estado === 'Activo') ?? periodos[0] ?? null;
}
export const vistasAnuales = ['estudiantes', 'listas', 'recepcion', 'control_stock', 'movimientos', 'reportes'];
export function requiereConsultaAnual(vista: string, modo: 'real' | 'demo' | null, periodo: PeriodoConsulta | null) {
  if (['inicio', 'utiles', 'prediccion'].includes(vista)) return modo === 'demo' || !!periodo && periodo.estado !== 'Activo';
  return vistasAnuales.includes(vista) && (modo === 'demo' || !!periodo && periodo.estado !== 'Activo');
}
