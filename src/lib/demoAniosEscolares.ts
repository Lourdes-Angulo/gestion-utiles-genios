import { grados, situaciones, type Situacion } from './aniosEscolares.ts';

export type DemoAlumno = { id: string; anio: number; nombre: string; grado: string; situacion: Situacion; destino: string };
export type DemoStock = {
  id: string; anio: number; nombre: string; apertura: number; aperturaRevision: number; total: number;
  bueno: number; deteriorado: number; vencido: number; inutilizable: number; evaluado: boolean; baja: boolean;
};
export type DemoLista = { anio: number; grado: string; cantidades: number[] };
export type DemoRecepcion = { id: string; anio: number; estudianteId: string; fecha: string; cantidades: number[] };
export type DemoMovimiento = { id: string; anio: number; utilId: string; tipo: 'Recepción' | 'Baja' | 'Traslado apto' | 'Custodia en revisión'; cantidad: number; referencia: string };
export type DemoPeriodo = {
  anio: number; estado: 'Activo' | 'En preparación' | 'Cerrado';
  alumnos: DemoAlumno[]; stock: DemoStock[]; listas: DemoLista[];
  recepciones: DemoRecepcion[]; movimientos: DemoMovimiento[];
  revisado: boolean; aprobado: boolean;
  cierre: { anio: number; destino: number; responsable: string } | null;
};
export type DemoEstado = { anios: DemoPeriodo[] };
export type DemoAccion =
  | { tipo: 'crear'; anio: number }
  | { tipo: 'decision'; anio: number; id: string; situacion: Situacion; destino: string }
  | { tipo: 'confirmar'; anio: number; id: string }
  | { tipo: 'lista'; anio: number; grado: string; cantidades: number[] }
  | { tipo: 'evaluar'; anio: number; id: string; cantidades: number[] }
  | { tipo: 'baja'; anio: number; id: string }
  | { tipo: 'revisar' | 'aprobar' | 'activar'; anio: number };

export const catalogoDemo = [
  { id: 'demo-cuaderno', nombre: 'Cuadernos', total: 40 },
  { id: 'demo-lapiz', nombre: 'Lápices', total: 30 },
  { id: 'demo-colores', nombre: 'Cajas de colores', total: 20 },
  { id: 'demo-borrador', nombre: 'Borradores', total: 35 },
  { id: 'demo-tijera', nombre: 'Tijeras', total: 15 },
  { id: 'demo-pegamento', nombre: 'Pegamentos', total: 20 },
  { id: 'demo-papel', nombre: 'Paquetes de papel bond', total: 25 },
  { id: 'demo-plumon', nombre: 'Plumones', total: 32 },
];
const continua = (a: DemoAlumno) => a.situacion.startsWith('Continúa');
const cantidadesValidas = (valores: number[], longitud: number) => valores.length === longitud && valores.every(n => Number.isSafeInteger(n) && n >= 0);

function periodoVacio(anio: number): DemoPeriodo {
  return {
    anio, estado: 'En preparación', alumnos: [], stock: [], listas: [], recepciones: [], movimientos: [],
    revisado: false, aprobado: false, cierre: null,
  };
}

export function iniciarDemo(): DemoEstado {
  const periodo = periodoVacio(2026);
  periodo.estado = 'Activo';
  periodo.alumnos = [
    ['Ana Torres', '3 años'], ['Bruno Salas', '5 años'], ['Carla Ríos', '3er Grado'],
    ['Diego Luna', '2do Grado'], ['Elena Vega', '4to Grado'], ['Fabio Soto', '5to Grado'],
    ['Gabriela León', '6to Grado'], ['Hugo Díaz', '1er Grado'],
  ].map(([nombre, grado], i) => ({ id: `demo-alumno-${i}`, anio: 2026, nombre: `${nombre} (ficticio)`, grado, situacion: 'Pendiente de revisión', destino: '' }));
  periodo.stock = catalogoDemo.map(u => ({
    ...u, anio: 2026, apertura: 10, aperturaRevision: 0,
    bueno: 0, deteriorado: 0, vencido: 0, inutilizable: 0, evaluado: false, baja: false,
  }));
  periodo.listas = [...new Set(periodo.alumnos.map(a => a.grado))].map(grado => ({ anio: 2026, grado, cantidades: catalogoDemo.map(() => 1) }));
  periodo.recepciones = [{ id: 'demo-recepcion-2026', anio: 2026, estudianteId: periodo.alumnos[0].id, fecha: '2026-03-09', cantidades: catalogoDemo.map(u => u.total - 10) }];
  periodo.movimientos = catalogoDemo.map((u, i) => ({ id: `demo-recepcion-mov-${i}`, anio: 2026, utilId: u.id, tipo: 'Recepción', cantidad: u.total - 10, referencia: 'demo-recepcion-2026' }));
  return { anios: [periodo] };
}

export function pendientesDemo(s: DemoEstado): string[] {
  const origen = s.anios.find(a => a.estado === 'Activo');
  const destino = s.anios.find(a => a.estado === 'En preparación');
  const pendientes: string[] = [];
  if (!destino) pendientes.push('Crear el año en preparación');
  if (!origen) return [...pendientes, 'No hay año activo'];
  if (origen.alumnos.some(a => a.situacion === 'Pendiente de revisión')) pendientes.push('Revisar cada estudiante');
  if (origen.alumnos.filter(continua).some(a => !destino?.alumnos.some(m => m.id === a.id && m.grado === a.destino))) pendientes.push('Confirmar individualmente las matrículas de continuidad');
  if (destino?.alumnos.some(a => !destino.listas.some(l => l.grado === a.grado))) pendientes.push('Preparar las listas de cada grado matriculado');
  if (origen.stock.some(u => !u.evaluado)) pendientes.push('Evaluar todos los sobrantes');
  if (origen.stock.some(u => u.vencido + u.inutilizable > 0 && !u.baja)) pendientes.push('Registrar las bajas de vencidos e inutilizables');
  return pendientes;
}

// Motor local puro compartido por la interfaz y las pruebas del ciclo anual.
export function operarDemo(estado: DemoEstado, accion: DemoAccion, rol: string | null, responsable = 'Administrador'): DemoEstado {
  if (rol !== 'Administrador' && !(rol === 'Secretaria' && accion.tipo === 'decision')) throw new Error('No tiene permisos para esta acción administrativa.');
  const s = structuredClone(estado);
  const activo = s.anios.find(a => a.estado === 'Activo');
  const destino = s.anios.find(a => a.estado === 'En preparación');
  if (accion.tipo === 'crear') {
    if (!activo || destino || !Number.isSafeInteger(accion.anio) || accion.anio <= activo.anio || accion.anio > 9999 || s.anios.some(a => a.anio === accion.anio)) throw new Error('Seleccione un año nuevo posterior al activo.');
    s.anios.push(periodoVacio(accion.anio));
    return s;
  }
  const periodo = s.anios.find(a => a.anio === accion.anio);
  if (!periodo || periodo.estado === 'Cerrado') throw new Error('El período cerrado es de solo lectura.');
  if (!activo || !destino) throw new Error('Cree primero el año en preparación.');
  if (activo.aprobado && accion.tipo !== 'activar') throw new Error('El cierre ya está aprobado. Active el nuevo año.');
  const anioRequerido = ['lista', 'confirmar', 'activar'].includes(accion.tipo) ? destino.anio : activo.anio;
  if (periodo.anio !== anioRequerido) throw new Error('La acción no corresponde al período seleccionado.');

  switch (accion.tipo) {
    case 'decision': {
      const alumno = activo.alumnos.find(a => a.id === accion.id);
      if (!alumno || !situaciones.includes(accion.situacion)) throw new Error('Seleccione una decisión individual.');
      const grado = accion.situacion === 'Continúa en el mismo grado' ? alumno.grado : accion.destino;
      if (accion.situacion.startsWith('Continúa') && !grados.includes(grado)) throw new Error('Seleccione el grado de destino.');
      if (accion.situacion === 'Continúa y promociona' && (grados.indexOf(grado) !== grados.indexOf(alumno.grado) + 1 || alumno.grado === '6to Grado')) throw new Error('Revise el grado de promoción.');
      if (accion.situacion === 'Egresa' && alumno.grado !== '6to Grado') throw new Error('El egreso corresponde al último grado.');
      const nuevoDestino = accion.situacion.startsWith('Continúa') ? grado : '';
      if (alumno.situacion !== accion.situacion || alumno.destino !== nuevoDestino) {
        destino.alumnos = destino.alumnos.filter(a => a.id !== alumno.id);
      }
      Object.assign(alumno, { situacion: accion.situacion, destino: nuevoDestino });
      break;
    }
    case 'confirmar': {
      const alumno = activo.alumnos.find(a => a.id === accion.id);
      if (!alumno || !continua(alumno) || !grados.includes(alumno.destino)) throw new Error('Guarde primero una decisión de continuidad válida.');
      if (destino.alumnos.some(a => a.id === alumno.id)) throw new Error('La matrícula ya está confirmada.');
      destino.alumnos.push({ ...alumno, anio: destino.anio, grado: alumno.destino, destino: '', situacion: 'Pendiente de revisión' });
      break;
    }
    case 'lista': {
      if (!grados.includes(accion.grado) || !cantidadesValidas(accion.cantidades, catalogoDemo.length) || !accion.cantidades.some(n => n > 0)) throw new Error('Revise el grado y las cantidades de la lista.');
      destino.listas = destino.listas.filter(l => l.grado !== accion.grado);
      destino.listas.push({ anio: destino.anio, grado: accion.grado, cantidades: accion.cantidades });
      break;
    }
    case 'evaluar': {
      const u = activo.stock.find(u => u.id === accion.id);
      if (!u || !cantidadesValidas(accion.cantidades, 4) || accion.cantidades.reduce((a, b) => a + b, 0) !== u.total) throw new Error('La clasificación debe sumar el saldo físico completo.');
      if (u.baja) throw new Error('La baja ya se registró.');
      [u.bueno, u.deteriorado, u.vencido, u.inutilizable] = accion.cantidades;
      u.evaluado = true;
      break;
    }
    case 'baja': {
      const u = activo.stock.find(u => u.id === accion.id);
      if (!u?.evaluado || u.baja || u.vencido + u.inutilizable === 0) throw new Error('No hay una baja pendiente para este útil.');
      u.baja = true;
      activo.movimientos.push({ id: `demo-baja-${activo.anio}-${u.id}`, anio: activo.anio, utilId: u.id, tipo: 'Baja', cantidad: u.vencido + u.inutilizable, referencia: `Baja autorizada en demostración por ${responsable}` });
      break;
    }
    case 'revisar':
    case 'aprobar':
    case 'activar': {
      const pendientes = pendientesDemo(s);
      if (pendientes.length) throw new Error(pendientes.join('. '));
      if (accion.tipo === 'revisar') activo.revisado = true;
      if (accion.tipo === 'aprobar') {
        if (!activo.revisado) throw new Error('Revise primero el cierre anual.');
        activo.aprobado = true;
      }
      if (accion.tipo === 'activar') {
        if (!activo.aprobado) throw new Error('Se requiere aprobación administrativa.');
        activo.cierre = { anio: activo.anio, destino: destino.anio, responsable };
        activo.estado = 'Cerrado';
        destino.estado = 'Activo';
        // El saldo disponible se reemplaza con los aptos. Los deteriorados permanecen segregados.
        destino.stock = activo.stock.map(u => ({ ...u, anio: destino.anio, apertura: u.bueno, aperturaRevision: u.deteriorado, total: u.bueno + u.deteriorado, bueno: 0, deteriorado: 0, vencido: 0, inutilizable: 0, evaluado: false, baja: false }));
        for (const u of activo.stock) {
          activo.movimientos.push({ id: `demo-traslado-${activo.anio}-${u.id}`, anio: activo.anio, utilId: u.id, tipo: 'Traslado apto', cantidad: u.bueno, referencia: `Apertura de ${destino.anio}, sin entrada física` });
          if (u.deteriorado > 0) activo.movimientos.push({ id: `demo-custodia-${activo.anio}-${u.id}`, anio: activo.anio, utilId: u.id, tipo: 'Custodia en revisión', cantidad: u.deteriorado, referencia: `Segregado en ${destino.anio}` });
        }
      }
      return s;
    }
  }
  activo.revisado = false;
  return s;
}

export function reporteDemo(p: DemoPeriodo) {
  const sumar = (campo: 'bueno' | 'deteriorado') => p.stock.filter(u => u.evaluado).reduce((n, u) => n + u[campo], 0);
  return {
    matriculados: p.alumnos.length,
    promovidos: p.alumnos.filter(a => a.situacion === 'Continúa y promociona').length,
    repiten: p.alumnos.filter(a => a.situacion === 'Continúa en el mismo grado').length,
    retirados: p.alumnos.filter(a => a.situacion === 'Se retira').length,
    trasladados: p.alumnos.filter(a => a.situacion === 'Se traslada').length,
    egresados: p.alumnos.filter(a => a.situacion === 'Egresa').length,
    pendientes: p.alumnos.filter(a => a.situacion === 'Pendiente de revisión').length,
    recibidos: p.recepciones.reduce((n, r) => n + r.cantidades.reduce((a, b) => a + b, 0), 0),
    disponibles: sumar('bueno'),
    aptosTrasladados: p.movimientos.filter(m => m.tipo === 'Traslado apto').reduce((n, m) => n + m.cantidad, 0),
    deteriorados: sumar('deteriorado'),
    bajas: p.movimientos.filter(m => m.tipo === 'Baja').reduce((n, m) => n + m.cantidad, 0),
  };
}

export function etapasDemo(s: DemoEstado) {
  const origen = s.anios.find(a => a.estado === 'Activo')!;
  const destino = s.anios.find(a => a.estado === 'En preparación');
  const cicloTerminado = !destino && s.anios.some(a => a.estado === 'Cerrado' && a.cierre?.destino === origen.anio);
  const decisiones = origen.alumnos.every(a => a.situacion !== 'Pendiente de revisión');
  const matriculas = !!destino && origen.alumnos.filter(continua).every(a => destino.alumnos.some(m => m.id === a.id));
  const listas = !!destino && destino.alumnos.every(a => destino.listas.some(l => l.grado === a.grado));
  const evaluado = origen.stock.every(u => u.evaluado);
  const bajas = evaluado && origen.stock.every(u => u.vencido + u.inutilizable === 0 || u.baja);
  const pasos = [
    ['Crear año en preparación', !!destino, true, 'crear'],
    ['Revisar continuidad', decisiones, !!destino, 'continuidad'],
    ['Confirmar matrículas', matriculas, !!destino && origen.alumnos.some(continua), 'matriculas'],
    ['Preparar listas', listas, !!destino, 'listas'],
    ['Evaluar sobrantes', evaluado, !!destino, 'stock'],
    ['Registrar bajas', bajas, evaluado && !!destino, 'stock'],
    ['Revisar cierre anual', origen.revisado, !!destino && pendientesDemo(s).length === 0, 'cierre'],
    ['Aprobar cierre', origen.aprobado, origen.revisado, 'cierre'],
    ['Activar nuevo año', false, origen.aprobado, 'cierre'],
    ['Consultar historial anterior', s.anios.some(a => a.estado === 'Cerrado'), s.anios.some(a => a.estado === 'Cerrado'), 'reporte'],
  ] as const;
  return pasos.map(([nombre, completo, habilitado, seccion]) => ({ nombre, seccion, estado: cicloTerminado || completo ? 'Completada' : habilitado ? 'Pendiente' : 'Bloqueada' }));
}
