import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { periodosParaConsulta, resolverPeriodo, requiereConsultaAnual } from '../src/lib/consultaAnual.ts';
import { iniciarDemo, operarDemo } from '../src/lib/demoAniosEscolares.ts';

test('consulta de un período cerrado no modifica el activo ni inventa años', () => {
  const periodos = [{ id: '2026', anio: 2026, estado: 'Cerrado' as const }, { id: '2027', anio: 2027, estado: 'Activo' as const }];
  const antes = structuredClone(periodos);
  assert.equal(resolverPeriodo(periodos, '')?.anio, 2027);
  assert.equal(resolverPeriodo(periodos, '2026')?.estado, 'Cerrado');
  assert.equal(resolverPeriodo(periodos, '2030')?.anio, 2027);
  assert.equal(resolverPeriodo([], '2026'), null);
  assert.deepEqual(periodos, antes);
});

test('módulos históricos se presentan en consulta de solo lectura y el activo mantiene sus operaciones', () => {
  const cerrado = { id: 'cerrado', anio: 2026, estado: 'Cerrado' as const };
  const activo = { id: 'activo', anio: 2027, estado: 'Activo' as const };
  for (const vista of ['estudiantes', 'listas', 'recepcion', 'control_stock', 'movimientos', 'reportes']) {
    assert.equal(requiereConsultaAnual(vista, 'real', cerrado), true);
    assert.equal(requiereConsultaAnual(vista, 'real', activo), false);
    assert.equal(requiereConsultaAnual(vista, 'demo', activo), true);
  }
  assert.equal(requiereConsultaAnual('mi_perfil', 'demo', cerrado), false);
  assert.equal(requiereConsultaAnual('inicio', 'demo', activo), true);
});

test('selector consulta datos existentes de la simulación sin modificarla', () => {
  assert.deepEqual(periodosParaConsulta('demo', iniciarDemo(), []), [{ id: '2026', anio: 2026, estado: 'Activo' }]);
  const s = operarDemo(iniciarDemo(), { tipo: 'crear', anio: 2027 }, 'Administrador');
  const antes = structuredClone(s);
  const p = periodosParaConsulta('demo', s, []);
  assert.equal(p.length, 2);
  assert.equal(resolverPeriodo(p, '2027')?.estado, 'En preparación');
  assert.equal(resolverPeriodo(p, '2026')?.estado, 'Activo');
  assert.deepEqual(s, antes);
  assert.deepEqual(periodosParaConsulta('real', s, []), []);
  const reales = [{ id: 'real-2025', anio: 2025, estado: 'Activo' as const }];
  assert.deepEqual(periodosParaConsulta('real', s, reales), reales);
});

test('cabecera, permisos y retención de formularios conservan los puntos de entrada', async () => {
  const sidebar = await readFile('src/components/Sidebar.tsx', 'utf8');
  assert.doesNotMatch(sidebar, /anios_escolares|Gestión de años escolares/);
  const header = await readFile('src/components/Header.tsx', 'utf8');
  assert.match(header, /puedeAbrir\(rolSesion, "anios_escolares"\)/);
  assert.match(header, /onClick=\{\(\) => setVistaActiva\("anios_escolares"\)\}/);
  assert.ok(header.indexOf('<Bell') < header.indexOf('<CalendarDays'));
  assert.ok(header.indexOf('<CalendarDays') < header.indexOf('aria-label="Año escolar de consulta"'));
  assert.ok(header.indexOf('aria-label="Año escolar de consulta"') < header.indexOf('title="Mi perfil"'));
  const contexto = await readFile('src/context/ConsultaAnualContext.tsx', 'utf8');
  assert.doesNotMatch(contexto, /\.rpc\(|\.from\(|fetch\(|operarAnio\(/);
  const app = await readFile('src/App.tsx', 'utf8');
  assert.match(app, /vistasConFormulario\.filter\(vista => puedeAbrir\(rol, vista\)\)\.map/);
  assert.match(app, /key=\{vista\}/);
  assert.match(app, /display: vista !== vistaActiva \|\| consultaAnual \? 'none'/);
  assert.match(app, /case "anios_escolares": return <ViewAniosEscolares/);
});
