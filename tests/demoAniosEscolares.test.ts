import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { catalogoDemo, etapasDemo, iniciarDemo, operarDemo, pendientesDemo, reporteDemo, type DemoAccion, type DemoEstado } from '../src/lib/demoAniosEscolares.ts';
import { cargarDemo, guardarDemo, guardarModoConsulta, limpiarDemo, CLAVE_DEMO_ANIOS } from '../src/lib/demoAniosStorage.ts';
import { periodosParaConsulta, resolverPeriodo } from '../src/lib/consultaAnual.ts';
import { puedeAbrir } from '../src/lib/permisosRoles.ts';

function escenarioPreparado() {
  let s = iniciarDemo();
  const ejecutar = (a: DemoAccion) => { s = operarDemo(s, a, 'Administrador'); };
  ejecutar({ tipo: 'crear', anio: 2027 });
  const decisiones = [
    ['Continúa y promociona', '4 años'], ['Continúa y promociona', '1er Grado'],
    ['Continúa y promociona', '4to Grado'], ['Continúa en el mismo grado', ''],
    ['Se retira', ''], ['Se traslada', ''], ['Egresa', ''], ['Continúa en el mismo grado', ''],
  ] as const;
  s.anios[0].alumnos.forEach((a, i) => ejecutar({ tipo: 'decision', anio: 2026, id: a.id, situacion: decisiones[i][0], destino: decisiones[i][1] }));
  assert.equal(s.anios[1].alumnos.length, 0, 'elegir promoción no crea matrículas');
  assert.ok(pendientesDemo(s).some(p => p.includes('Confirmar')));
  s.anios[0].alumnos.filter(a => a.situacion.startsWith('Continúa')).forEach(a => ejecutar({ tipo: 'confirmar', anio: 2027, id: a.id }));
  for (const grado of new Set(s.anios[1].alumnos.map(a => a.grado))) ejecutar({ tipo: 'lista', anio: 2027, grado, cantidades: catalogoDemo.map(() => 2) });
  s.anios[0].stock.forEach(u => ejecutar({ tipo: 'evaluar', anio: 2026, id: u.id, cantidades: [u.total - 5, 3, 0, 2] }));
  s.anios[0].stock.forEach(u => ejecutar({ tipo: 'baja', anio: 2026, id: u.id }));
  return s;
}
function activar(s: DemoEstado) {
  for (const tipo of ['revisar', 'aprobar', 'activar'] as const) s = operarDemo(s, { tipo, anio: tipo === 'activar' ? 2027 : 2026 }, 'Administrador');
  return s;
}
function almacenamiento() {
  const datos = new Map<string, string>([['sigue:formulario', 'conservar'], ['institucional', 'conservar']]);
  return { datos, getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => { datos.set(k, v); }, removeItem: (k: string) => { datos.delete(k); } };
}

test('ciclo 2026–2027 conserva todos los registros por período y grados históricos', () => {
  const preparado = escenarioPreparado();
  const antes = structuredClone(preparado.anios[0]);
  const resultado = activar(preparado);
  const [anterior, nuevo] = resultado.anios;
  assert.deepEqual(resultado.anios.map(a => a.estado), ['Cerrado', 'Activo']);
  const opciones = periodosParaConsulta('demo', resultado, []);
  assert.deepEqual(opciones.map(p => `${p.anio} — ${p.estado}`), ['2026 — Cerrado', '2027 — Activo']);
  assert.equal(resolverPeriodo(opciones, '2026')?.estado, 'Cerrado');
  assert.equal(resolverPeriodo(opciones, '2027')?.estado, 'Activo');
  assert.deepEqual(anterior.alumnos, antes.alumnos);
  assert.deepEqual(anterior.listas, antes.listas);
  assert.deepEqual(anterior.recepciones, antes.recepciones);
  assert.deepEqual(anterior.stock, antes.stock);
  assert.deepEqual(anterior.movimientos.filter(m => m.tipo === 'Recepción' || m.tipo === 'Baja'), antes.movimientos);
  assert.equal(anterior.alumnos[2].grado, '3er Grado');
  assert.equal(nuevo.alumnos.find(a => a.id === anterior.alumnos[2].id)?.grado, '4to Grado');
  assert.equal(nuevo.alumnos[0].grado, '4 años');
  assert.equal(nuevo.alumnos[1].grado, '1er Grado');
  assert.equal(nuevo.alumnos[3].grado, '2do Grado');
  assert.equal(nuevo.alumnos.length, 5);
  assert.equal(anterior.alumnos.length, 8);
  assert.equal(nuevo.recepciones.length, 0);
  assert.equal(nuevo.movimientos.length, 0, 'la apertura no se contabiliza como compra o recepción');
  assert.equal(anterior.listas[0].cantidades[0], 1);
  assert.equal(nuevo.listas[0].cantidades[0], 2);
  assert.deepEqual(preparado.anios[0], antes, 'el motor no muta su entrada');
  const cerrado = structuredClone(anterior);
  const siguiente = operarDemo(resultado, { tipo: 'crear', anio: 2028 }, 'Administrador');
  const modificado = operarDemo(siguiente, { tipo: 'decision', anio: 2027, id: nuevo.alumnos[2].id, situacion: 'Se retira', destino: '' }, 'Administrador');
  assert.deepEqual(modificado.anios[0], cerrado, 'un nuevo ciclo no altera 2026');
});

test('inventario conserva 30 contabilizados, 25 aptos, 3 deteriorados y 2 bajas sin duplicar', () => {
  const s = activar(escenarioPreparado());
  const previo = s.anios[0].stock.find(u => u.id === 'demo-lapiz')!;
  const apertura = s.anios[1].stock.find(u => u.id === 'demo-lapiz')!;
  assert.equal(previo.total, 30);
  assert.deepEqual([previo.bueno, previo.deteriorado, previo.inutilizable, previo.baja], [25, 3, 2, true]);
  assert.deepEqual([apertura.apertura, apertura.aperturaRevision, apertura.total], [25, 3, 28]);
  assert.equal(apertura.total + previo.vencido + previo.inutilizable, previo.total);
  const traslado = s.anios[0].movimientos.filter(m => m.utilId === previo.id && m.tipo === 'Traslado apto');
  assert.equal(traslado.length, 1);
  assert.equal(traslado[0].cantidad, 25);
  assert.throws(() => operarDemo(s, { tipo: 'activar', anio: 2027 }, 'Administrador'));
});

test('reporte anual se calcula a partir de cada período y permanece tras consultar 2027', () => {
  const s = activar(escenarioPreparado());
  const r = reporteDemo(s.anios[0]);
  assert.deepEqual({ matriculados: r.matriculados, promovidos: r.promovidos, repiten: r.repiten, retirados: r.retirados, trasladados: r.trasladados, egresados: r.egresados, pendientes: r.pendientes }, { matriculados: 8, promovidos: 3, repiten: 2, retirados: 1, trasladados: 1, egresados: 1, pendientes: 0 });
  assert.equal(r.recibidos, catalogoDemo.reduce((n, u) => n + u.total - 10, 0));
  assert.equal(r.disponibles, catalogoDemo.reduce((n, u) => n + u.total - 5, 0));
  assert.equal(r.aptosTrasladados, r.disponibles);
  assert.equal(r.deteriorados, 24);
  assert.equal(r.bajas, 16);
  assert.equal(reporteDemo(s.anios[1]).recibidos, 0);
  assert.deepEqual(reporteDemo(s.anios[0]), r);
});

test('decisión editable invalida la matrícula previa y revisión, sin promover pendientes', () => {
  let s = escenarioPreparado();
  s = operarDemo(s, { tipo: 'revisar', anio: 2026 }, 'Administrador');
  s = operarDemo(s, { tipo: 'decision', anio: 2026, id: s.anios[0].alumnos[0].id, situacion: 'Continúa en el mismo grado', destino: '' }, 'Secretaria');
  assert.equal(s.anios[0].revisado, false);
  assert.equal(s.anios[1].alumnos.length, 4);
  assert.throws(() => operarDemo(s, { tipo: 'aprobar', anio: 2026 }, 'Administrador'));
  s = operarDemo(s, { tipo: 'decision', anio: 2026, id: s.anios[0].alumnos[7].id, situacion: 'Pendiente de revisión', destino: '' }, 'Administrador');
  assert.ok(pendientesDemo(s).some(p => p.includes('Revisar cada')));
  assert.throws(() => operarDemo(s, { tipo: 'confirmar', anio: 2027, id: s.anios[0].alumnos[7].id }, 'Administrador'));
});

test('el motor bloquea cambios en períodos cerrados y acciones sin permisos', () => {
  const s = activar(escenarioPreparado());
  const cerrado: DemoAccion[] = [
    { tipo: 'decision', anio: 2026, id: s.anios[0].alumnos[0].id, situacion: 'Se retira', destino: '' },
    { tipo: 'lista', anio: 2026, grado: '1er Grado', cantidades: catalogoDemo.map(() => 1) },
    { tipo: 'evaluar', anio: 2026, id: 'demo-lapiz', cantidades: [30, 0, 0, 0] },
    { tipo: 'baja', anio: 2026, id: 'demo-lapiz' }, { tipo: 'confirmar', anio: 2026, id: s.anios[0].alumnos[0].id },
    { tipo: 'revisar', anio: 2026 }, { tipo: 'aprobar', anio: 2026 }, { tipo: 'activar', anio: 2026 },
  ];
  for (const accion of cerrado) assert.throws(() => operarDemo(s, accion, 'Administrador'), /solo lectura/);
  for (const rol of ['Secretaria', 'Profesora', 'Auxiliar', null, 'Directora']) {
    for (const accion of [...cerrado.filter(a => a.tipo !== 'decision'), { tipo: 'crear', anio: 2028 } as const]) assert.throws(() => operarDemo(s, accion, rol), /permisos/);
  }
  for (const rol of ['Secretaria', 'Profesora', 'Auxiliar'] as const) assert.equal(puedeAbrir(rol, 'anios_escolares'), false);
});

test('bloqueos por evaluación incompleta, baja pendiente, revisión y aprobación', () => {
  let s = operarDemo(iniciarDemo(), { tipo: 'crear', anio: 2027 }, 'Administrador');
  assert.throws(() => operarDemo(s, { tipo: 'revisar', anio: 2026 }, 'Administrador'));
  assert.throws(() => operarDemo(s, { tipo: 'evaluar', anio: 2026, id: 'demo-lapiz', cantidades: [-1, 31, 0, 0] }, 'Administrador'));
  assert.throws(() => operarDemo(s, { tipo: 'evaluar', anio: 2026, id: 'demo-lapiz', cantidades: [31, 0, 0, 0] }, 'Administrador'));
  assert.throws(() => operarDemo(s, { tipo: 'evaluar', anio: 2026, id: 'demo-lapiz', cantidades: [29.5, 0.5, 0, 0] }, 'Administrador'));
  assert.throws(() => operarDemo(s, { tipo: 'decision', anio: 2026, id: s.anios[0].alumnos[2].id, situacion: 'Continúa y promociona', destino: '6to Grado' }, 'Administrador'));
  s = escenarioPreparado();
  s.anios[0].stock[0].evaluado = false;
  assert.throws(() => operarDemo(s, { tipo: 'revisar', anio: 2026 }, 'Administrador'), /Evaluar/);
  s = escenarioPreparado(); s.anios[0].stock[0].baja = false;
  assert.throws(() => operarDemo(s, { tipo: 'revisar', anio: 2026 }, 'Administrador'), /bajas/);
  s = escenarioPreparado();
  assert.throws(() => operarDemo(s, { tipo: 'activar', anio: 2027 }, 'Administrador'), /aprobación/);
  assert.throws(() => operarDemo(s, { tipo: 'aprobar', anio: 2026 }, 'Administrador'), /Revise/);
});

test('persistencia versionada sobrevive a recarga y reiniciar elimina solo la demostración', () => {
  const almacen = almacenamiento();
  const s = activar(escenarioPreparado());
  guardarDemo(almacen, s, 1_000);
  const recargado = cargarDemo(almacen, 2_000);
  assert.equal(recargado.modo, 'demo');
  assert.deepEqual(recargado.estado, s);
  assert.equal(recargado.estado.anios[0].alumnos[2].grado, '3er Grado');
  assert.equal(recargado.estado.anios[1].alumnos[2].grado, '4to Grado');
  assert.deepEqual(reporteDemo(recargado.estado.anios[0]), reporteDemo(s.anios[0]));
  const contenido = almacen.getItem(CLAVE_DEMO_ANIOS)!;
  assert.doesNotMatch(contenido, /token|password|credential|authUserId|clerk_user_id/i);
  limpiarDemo(almacen);
  assert.equal(almacen.getItem(CLAVE_DEMO_ANIOS), null);
  assert.equal(almacen.getItem('sigue:formulario'), 'conservar');
  assert.equal(almacen.getItem('institucional'), 'conservar');
  assert.deepEqual(cargarDemo(almacen).estado, iniciarDemo());
});

test('elegir demostración guarda 2026 y restaura el modo tras recargar sin depender de períodos reales', () => {
  const almacen = almacenamiento();
  assert.equal(cargarDemo(almacen, 1000).modo, null);
  guardarModoConsulta(almacen, 'demo', iniciarDemo(), 1000);
  const recuperado = cargarDemo(almacen, 2000);
  assert.equal(recuperado.modo, 'demo');
  assert.deepEqual(periodosParaConsulta(recuperado.modo, recuperado.estado, []), [{ id: '2026', anio: 2026, estado: 'Activo' }]);
  guardarModoConsulta(almacen, 'real', recuperado.estado, 3000);
  const real = cargarDemo(almacen, 4000);
  assert.equal(real.modo, 'real');
  assert.deepEqual(periodosParaConsulta(real.modo, real.estado, []), []);
  assert.deepEqual(real.estado, recuperado.estado);
  assert.equal(cargarDemo(almacen, 1000 + 48 * 60 * 60 * 1000).modo, null);
});

test('una demostración anterior sin preferencia mantiene sus datos y exige selección explícita de modo', () => {
  const almacen = almacenamiento();
  guardarDemo(almacen, escenarioPreparado(), 1000);
  const anterior = JSON.parse(almacen.getItem(CLAVE_DEMO_ANIOS)!);
  delete anterior.modo;
  almacen.setItem(CLAVE_DEMO_ANIOS, JSON.stringify(anterior));
  const recuperado = cargarDemo(almacen, 2000);
  assert.equal(recuperado.modo, null);
  assert.deepEqual(recuperado.estado, escenarioPreparado());
});

test('almacenamiento vencido, incompatible, corrupto o bloqueado se maneja sin perder el acceso', () => {
  const almacen = almacenamiento();
  guardarDemo(almacen, iniciarDemo(), 1_000);
  assert.ok(cargarDemo(almacen, 1_000 + 48 * 60 * 60 * 1_000).aviso.includes('venció'));
  for (const texto of ['{', JSON.stringify({ version: 1 }), JSON.stringify({ version: 2, expira: Date.now() + 10000, estado: { anios: [{}] } })]) {
    almacen.setItem(CLAVE_DEMO_ANIOS, texto);
    assert.deepEqual(cargarDemo(almacen).estado, iniciarDemo());
  }
  const bloqueado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('bloqueado'); } };
  assert.deepEqual(cargarDemo(bloqueado).estado, iniciarDemo());
  assert.doesNotThrow(() => limpiarDemo(bloqueado));
});

test('etapas pendientes, completadas y bloqueadas corresponden a los controles del motor', () => {
  const pasos = etapasDemo(iniciarDemo());
  assert.equal(pasos[0].estado, 'Pendiente');
  assert.equal(pasos[1].estado, 'Bloqueada');
  assert.equal(pasos[8].estado, 'Bloqueada');
  const preparado = etapasDemo(escenarioPreparado());
  assert.equal(preparado[0].estado, 'Completada');
  assert.equal(preparado[5].estado, 'Completada');
  assert.equal(preparado[6].estado, 'Pendiente');
  assert.equal(etapasDemo(activar(escenarioPreparado()))[9].estado, 'Completada');
});

test('simulación sin accesos a red y limpieza conectada al cierre de sesión existente', async () => {
  for (const archivo of ['src/lib/demoAniosEscolares.ts', 'src/components/DemoAniosEscolares.tsx', 'src/lib/demoAniosStorage.ts']) {
    const fuente = await readFile(archivo, 'utf8');
    assert.doesNotMatch(fuente, /supabase|\.rpc\(|\.from\(|fetch\(|recargarDatos|\.upload\(/i);
  }
  const app = await readFile('src/App.tsx', 'utf8');
  assert.match(app, /const limpiarEstado = useCallback\(\(\) => \{\s*limpiarDemo\(\)/);
  assert.match(app, /const INACTIVIDAD_MS = 10 \* 60 \* 1000/);
  const vista = await readFile('src/components/ViewAniosEscolares.tsx', 'utf8');
  assert.match(vista, /modo === 'real' && <GestionRealAniosEscolares/);
  const contexto = await readFile('src/context/ConsultaAnualContext.tsx', 'utf8');
  assert.match(contexto, /useState<'real' \| 'demo' \| null>\(null\)/);
});
