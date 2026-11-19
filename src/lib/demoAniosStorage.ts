import { catalogoDemo, iniciarDemo, type DemoEstado } from './demoAniosEscolares.ts';
import { grados, situaciones } from './aniosEscolares.ts';

export const CLAVE_DEMO_ANIOS = 'sigue:demostracion:anios-escolares:v2';
const VERSION = 2;
const DURACION_MS = 48 * 60 * 60 * 1000;
type AlmacenDemo = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ModoConsulta = 'real' | 'demo' | null;

// Validación del formato local antes de permitir su consulta o continuación.
function formatoValido(valor: unknown): valor is DemoEstado {
  if (!valor || typeof valor !== 'object') return false;
  const s = valor as DemoEstado;
  const entero = (n: number) => Number.isSafeInteger(n) && n >= 0;
  const cantidades = (v: number[]) => Array.isArray(v) && v.length === catalogoDemo.length && v.every(entero);
  if (!Array.isArray(s.anios) || s.anios.length === 0 || s.anios.filter(p => p.estado === 'Activo').length !== 1 || s.anios.filter(p => p.estado === 'En preparación').length > 1) return false;
  if (new Set(s.anios.map(p => p.anio)).size !== s.anios.length) return false;
  return s.anios.every(p => {
    if (!entero(p.anio) || p.anio < 1 || p.anio > 9999 || !['Activo', 'En preparación', 'Cerrado'].includes(p.estado)) return false;
    if (typeof p.revisado !== 'boolean' || typeof p.aprobado !== 'boolean') return false;
    if (!Array.isArray(p.alumnos) || !p.alumnos.every(a => a.anio === p.anio && typeof a.id === 'string' && a.id.startsWith('demo-') && typeof a.nombre === 'string' && grados.includes(a.grado) && situaciones.includes(a.situacion) && typeof a.destino === 'string')) return false;
    if (new Set(p.alumnos.map(a => a.id)).size !== p.alumnos.length) return false;
    if (!Array.isArray(p.stock) || p.stock.length !== (p.estado === 'En preparación' ? 0 : catalogoDemo.length)) return false;
    if (!p.stock.every((u, i) => u.id === catalogoDemo[i].id && u.anio === p.anio && typeof u.nombre === 'string' && [u.apertura, u.aperturaRevision, u.total, u.bueno, u.deteriorado, u.vencido, u.inutilizable].every(entero) && typeof u.evaluado === 'boolean' && typeof u.baja === 'boolean' && (!u.evaluado || u.bueno + u.deteriorado + u.vencido + u.inutilizable === u.total))) return false;
    if (!Array.isArray(p.listas) || !p.listas.every(l => l.anio === p.anio && grados.includes(l.grado) && cantidades(l.cantidades))) return false;
    if (!Array.isArray(p.recepciones) || !p.recepciones.every(r => r.anio === p.anio && typeof r.id === 'string' && typeof r.fecha === 'string' && p.alumnos.some(a => a.id === r.estudianteId) && cantidades(r.cantidades))) return false;
    if (!Array.isArray(p.movimientos) || !p.movimientos.every(m => m.anio === p.anio && typeof m.id === 'string' && catalogoDemo.some(u => u.id === m.utilId) && ['Recepción', 'Baja', 'Traslado apto', 'Custodia en revisión'].includes(m.tipo) && entero(m.cantidad) && typeof m.referencia === 'string')) return false;
    return p.cierre === null ? p.estado !== 'Cerrado' : p.estado === 'Cerrado' && p.cierre.anio === p.anio && s.anios.some(a => a.anio === p.cierre.destino && a.anio > p.anio) && typeof p.cierre.responsable === 'string';
  });
}

export function cargarDemo(almacen: AlmacenDemo, ahora = Date.now()): { estado: DemoEstado; aviso: string; modo: ModoConsulta } {
  try {
    const texto = almacen.getItem(CLAVE_DEMO_ANIOS);
    if (!texto) return { estado: iniciarDemo(), aviso: '', modo: null };
    const datos = JSON.parse(texto);
    if (texto.length > 2_000_000 || datos.version !== VERSION || !Number.isFinite(datos.expira) || datos.expira <= ahora || !formatoValido(datos.estado)) {
      almacen.removeItem(CLAVE_DEMO_ANIOS);
      return { estado: iniciarDemo(), aviso: 'La demostración guardada venció o tiene un formato incompatible. Se inició una nueva.', modo: null };
    }
    return { estado: datos.estado, aviso: 'Se recuperaron los avances ficticios guardados.', modo: datos.modo === 'demo' || datos.modo === 'real' ? datos.modo : null };
  } catch {
    try { almacen.removeItem(CLAVE_DEMO_ANIOS); } catch { /* El navegador puede impedir el almacenamiento. */ }
    return { estado: iniciarDemo(), aviso: 'No se pudo recuperar la demostración guardada. Puede continuar con una nueva.', modo: null };
  }
}

export function guardarDemo(almacen: AlmacenDemo, estado: DemoEstado, ahora = Date.now()) {
  almacen.setItem(CLAVE_DEMO_ANIOS, JSON.stringify({ version: VERSION, expira: ahora + DURACION_MS, modo: 'demo', estado }));
}

export function guardarModoConsulta(almacen: AlmacenDemo, modo: 'real' | 'demo', estado: DemoEstado, ahora = Date.now()) {
  if (modo === 'demo') {
    guardarDemo(almacen, estado, ahora);
    return;
  }
  const texto = almacen.getItem(CLAVE_DEMO_ANIOS);
  if (!texto) return;
  const guardado = JSON.parse(texto);
  if (guardado.version === VERSION && guardado.expira > ahora && formatoValido(guardado.estado)) {
    almacen.setItem(CLAVE_DEMO_ANIOS, JSON.stringify({ ...guardado, modo: 'real' }));
  }
}

export function limpiarDemo(almacen?: AlmacenDemo) {
  try { (almacen ?? window.localStorage).removeItem(CLAVE_DEMO_ANIOS); } catch { /* No interrumpir el cierre de sesión. */ }
}
