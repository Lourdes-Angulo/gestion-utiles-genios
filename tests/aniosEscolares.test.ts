import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { grados, sugerirPromocion, validarEvaluacion } from '../src/lib/aniosEscolares.ts';

const adminSub = '00000000-0000-4000-8000-000000000001';
const secretariaSub = '00000000-0000-4000-8000-000000000002';

async function prepararBase() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role authenticator;
    create schema auth; create schema storage;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.jwt() to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
    alter table storage.objects enable row level security;
    create table public.usuarios(id text primary key,nombre text,rol text,estado text,"authUserId" uuid,clerk_user_id text,debe_cambiar_contrasena boolean,nivel_asignado text,aula_asignada text);
    create table public.estudiantes(id text primary key,codigo text,nombres text,apellidos text,nivel text,grado text,estado text,"apoderadoId" text,"apoderadoNombre" text);
    create table public.utiles(id text primary key,nombre text,"stockActual" integer,"stockMinimo" integer);
    create table public.listas_utiles(id text primary key,"anioEscolar" text,nivel text,grado text,items jsonb);
    create table public.recepciones(id text primary key,"estudianteId" text,"estudianteNombre" text,"apoderadoId" text,"apoderadoNombre" text,grado text,nivel text,"fechaRecepcion" text,items jsonb,estado text,observaciones text,"recibidoPor" text,"entregadoPor" text,"numeroEntregas" integer);
    create table public.movimientos(id text primary key default gen_random_uuid()::text,tipo text,"utilId" text,"utilNombre" text,cantidad integer,fecha text,responsable text,motivo text,"stockAnterior" integer,"stockResultante" integer);
    create table public.auditoria(id uuid primary key default gen_random_uuid());
    insert into public.usuarios values
      ('admin','Administrador','Administrador','Activo','${adminSub}',null,false,null,null),
      ('secretaria','Secretaria','Secretaria','Activo','${secretariaSub}',null,false,null,null),
      ('docente','Profesora','Profesora','Activo',null,'user_docente',false,'Inicial','3 años'),
      ('auxiliar','Auxiliar','Auxiliar','Activo',null,'user_auxiliar',false,'Inicial','4 años');
    insert into public.estudiantes select 'e'||n,'EST-'||n,'Alumno '||n,'Prueba','Inicial','3 años','Activo','ap1','Apoderado' from generate_series(1,9) n;
    update public.estudiantes set nivel='Primaria',grado='6to Grado' where id='e5';
    insert into public.utiles values ('u1','Cuadernos',20,5);
    insert into public.listas_utiles values ('l1','2026','Inicial','3 años','[{"utilId":"u1","utilNombre":"Cuadernos","cantidadRequerida":3}]');
    grant usage on schema public to authenticated;
    grant select,insert,update,delete on all tables in schema public to authenticated;
  `);
  const migraciones = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter(f => f.startsWith('20261113')).sort();
  for (const archivo of migraciones) await db.exec(await readFile(new URL(`../supabase/migrations/${archivo}`, import.meta.url), 'utf8'));
  return db;
}

async function identidad(db: PGlite, sub: string) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub, role: 'authenticated' })]);
  await db.exec('set role authenticated');
}

async function operar(db: PGlite, accion: string, datos: Record<string, unknown>, operacionId = crypto.randomUUID()) {
  const resultado = await db.query<{ resultado: { id?: string; repetida?: boolean } }>('select public.sigue_operar_anio($1,$2::jsonb) as resultado', [accion, JSON.stringify({ ...datos, operacion_id: operacionId })]);
  return resultado.rows[0].resultado;
}

async function escalar(db: PGlite, sql: string) {
  const resultado = await db.query<Record<string, unknown>>(sql);
  return Object.values(resultado.rows[0])[0];
}

test('Sugerencias individuales de todos los grados y evaluación física', () => {
  for (let i = 0; i < grados.length - 1; i++) assert.equal(sugerirPromocion(i < 3 ? 'Inicial' : 'Primaria', grados[i])?.grado, grados[i + 1]);
  assert.equal(sugerirPromocion('Primaria','6to Grado')?.egresa, true);
  assert.equal(sugerirPromocion('Inicial','Desconocido'), null);
  assert.equal(sugerirPromocion('Primaria','3 años'), null);
  assert.equal(validarEvaluacion(20,[15,3,0,2,0]), true);
  for (const cantidades of [[15,3,0,3,0],[-1,21,0,0,0],[1.5,18.5,0,0,0],[20,0,0,0]]) assert.equal(validarEvaluacion(20,cantidades), false);
});

test('Ciclo anual con PostgreSQL, RLS y transacciones', async t => {
  const db = await prepararBase();
  t.after(() => db.close());
  await identidad(db, adminSub);
  const origen = (await operar(db,'crear',{ anio:2026,fecha_inicio:'2026-03-01',fecha_fin:'2026-12-20' })).id!;
  for (let n = 1; n <= 6; n++) await operar(db,'matricular',{ anio_id:origen,estudiante_id:`e${n}`,nivel:n === 5 ? 'Primaria' : 'Inicial',grado:n === 5 ? '6to Grado' : '3 años' });
  await operar(db,'activar',{ anio_id:origen,confirmado:true });
  let destino = '';

  await t.test('Crear 2027 conserva 2026 activo y evita duplicados', async () => {
    destino = (await operar(db,'crear',{ anio:2027,fecha_inicio:'2027-03-01',fecha_fin:'2027-12-20' })).id!;
    assert.equal(await escalar(db,"select count(*)::int from public.anios_escolares where estado='Activo'"),1);
    await assert.rejects(operar(db,'crear',{ anio:2027,fecha_inicio:'2027-03-01',fecha_fin:'2027-12-20' }),/unique|duplic/i);
    await assert.rejects(operar(db,'activar',{ anio_id:destino,confirmado:true }),/Cierre el año activo/);
    await assert.rejects(db.exec("update public.anios_escolares set estado='Activo'"),/permission denied/);
    await db.exec('reset role');
    await assert.rejects(db.exec(`update public.anios_escolares set estado='Activo' where id='${destino}'`),/unique|duplic/i);
    await identidad(db,adminSub);
  });

  await t.test('Secretaría registra decisiones individuales sin promover pendientes', async () => {
    await identidad(db, secretariaSub);
    for (const [estudiante_id,situacion] of [['e1','Continúa y promociona'],['e2','Continúa en el mismo grado'],['e3','Se retira'],['e4','Se traslada'],['e5','Egresa'],['e6','Pendiente de revisión']]) {
      await operar(db,'continuidad',{ anio_id:destino,origen_id:origen,estudiante_id,situacion,nivel:situacion.startsWith('Continúa') ? 'Inicial' : null,grado:situacion==='Continúa y promociona' ? '4 años' : situacion==='Continúa en el mismo grado' ? '3 años' : null,observaciones:'Revisado individualmente' });
    }
    assert.equal(await escalar(db,`select count(*)::int from public.matriculas where anio_id='${destino}'`),0);
    for (const accion of ['crear','cerrar','activar','aprobar','evaluar','baja']) await assert.rejects(operar(db,accion,{ anio_id:origen }),/Requiere Administrador/);
  });

  await t.test('Administrador aprueba exclusivamente las decisiones de continuidad', async () => {
    await identidad(db, adminSub);
    await operar(db,'aprobar',{ anio_id:destino,confirmado:true });
    await operar(db,'aprobar',{ anio_id:destino,confirmado:true });
    assert.equal(await escalar(db,`select count(*)::int from public.matriculas where anio_id='${destino}'`),2);
    assert.equal(await escalar(db,`select grado from public.matriculas where anio_id='${destino}' and estudiante_id='e2'`),'3 años');
    assert.equal(await escalar(db,`select count(*)::int from public.matriculas where anio_id='${destino}' and estudiante_id in ('e3','e4','e5','e6')`),0);
  });

  await t.test('Revisión de aprobación conserva trazabilidad y permite corregir', async () => {
    await operar(db,'reabrir_decision',{ anio_id:destino,estudiante_id:'e1' });
    await operar(db,'continuidad',{ anio_id:destino,origen_id:origen,estudiante_id:'e1',situacion:'Continúa y promociona',nivel:'Inicial',grado:'4 años' });
    await operar(db,'aprobar',{ anio_id:destino,confirmado:true });
    assert.ok(Number(await escalar(db,"select count(*)::int from public.eventos_anios where tabla='matriculas' and accion='DELETE'"))>0);
  });

  await t.test('Nuevos y retornantes usan la misma ficha sin matrículas duplicadas', async () => {
    await identidad(db, secretariaSub);
    for (let n = 7; n <= 8; n++) {
      const datos = { anio_id:destino,estudiante_id:`e${n}`,nivel:'Inicial',grado:'3 años' };
      await operar(db,'matricular',datos); await operar(db,'matricular',datos);
    }
    assert.equal(await escalar(db,'select count(*)::int from public.estudiantes'),9);
    assert.equal(await escalar(db,`select count(*)::int from public.matriculas where anio_id='${destino}'`),4);
    await assert.rejects(operar(db,'matricular',{ anio_id:destino,estudiante_id:'e6',nivel:'Inicial',grado:'4 años' }),/continuidad/);
  });

  await t.test('Copiar listas es idempotente y conserva recepciones pendientes', async () => {
    await identidad(db, adminSub);
    await operar(db,'copiar_listas',{ anio_id:destino,origen_id:origen }); await operar(db,'copiar_listas',{ anio_id:destino,origen_id:origen });
    assert.equal(await escalar(db,"select count(*)::int from public.listas_utiles where \"anioEscolar\"='2027'"),1);
    assert.equal(await escalar(db,'select count(*)::int from public.recepciones'),0);
  });

  await t.test('Asignaciones anuales se preparan sin cambiar el aula del año activo', async () => {
    await operar(db,'asignar_personal',{ anio_id:destino,usuario_id:'docente',nivel:'Inicial',grado:'4 años' });
    assert.equal(await escalar(db,"select aula_asignada from public.usuarios where id='docente'"),'3 años');
    await assert.rejects(operar(db,'asignar_personal',{ anio_id:destino,usuario_id:'admin',nivel:'Inicial',grado:'4 años' }),/Seleccione una Profesora/);
  });

  await t.test('Recepción anual incrementa sólo la diferencia y rechaza un aula ajena', async () => {
    await identidad(db,'user_auxiliar');
    await assert.rejects(db.query('select public.sigue_guardar_recepcion_anual($1,$2::jsonb)', ['e1','{"u1":2}']),/aula asignada/);
    await identidad(db,'user_docente');
    for (let i=0;i<2;i++) await db.query('select public.sigue_guardar_recepcion_anual($1,$2::jsonb)', ['e1','{"u1":2}']);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),22);
    assert.equal(await escalar(db,'select count(*)::int from public.recepciones'),1);
    await db.query('select public.sigue_guardar_recepcion_anual($1,$2::jsonb)', ['e1','{"u1":3}']);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),23);
    await assert.rejects(db.query('select public.sigue_guardar_recepcion_anual($1,$2::jsonb)', ['e1','{"u1":1}']),/desactualizada/);
  });

  await t.test('Profesora y Auxiliar carecen de operaciones administrativas y escritura directa', async () => {
    for (const sujeto of ['user_docente','user_auxiliar']) {
      await identidad(db,sujeto);
      await assert.rejects(operar(db,'crear',{ anio:2028 }),/no autorizada/);
      await assert.rejects(operar(db,'cerrar',{ anio_id:origen }),/no autorizada/);
      await assert.rejects(db.exec(`insert into public.matriculas(anio_id,estudiante_id,nivel,grado,creado_por) values('${destino}','e9','Inicial','3 años','docente')`),/permission denied/);
      assert.equal(await escalar(db,'select count(*)::int from public.cierres_anuales'),0);
    }
  });

  await t.test('Evaluación rechaza negativos, excesos y stock desactualizado', async () => {
    await identidad(db,adminSub);
    const datos = { anio_id:origen,util_id:'u1',contabilizado:23,bueno:18,deteriorado:3,vencido:0,inutilizable:2,comprometido:0 };
    await assert.rejects(operar(db,'evaluar',{ ...datos,bueno:-1 }),/check constraint/);
    await assert.rejects(operar(db,'evaluar',{ ...datos,bueno:19 }),/check constraint/);
    await assert.rejects(operar(db,'evaluar',{ ...datos,contabilizado:24 }),/stock cambió/);
    await operar(db,'evaluar',datos);
    await assert.rejects(operar(db,'movimiento',{ anio_id:origen,util_id:'u1',tipo:'Salida',cantidad:19,motivo:'Uso en Aula' }),/Stock apto insuficiente/);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),23);
  });

  await t.test('Baja administrativa es atómica e idempotente', async () => {
    const datos = { anio_id:origen,util_id:'u1',cantidad:1,motivo:'Pérdida',observaciones:'Acta de baja' };
    const id = crypto.randomUUID();
    await operar(db,'baja',datos,id); await operar(db,'baja',datos,id);
    assert.equal(await escalar(db,'select count(*)::int from public.bajas_inventario'),1);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),22);
    await assert.rejects(operar(db,'baja',{ ...datos,motivo:'Inválido' }),/check constraint/);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),22);
    assert.equal(await escalar(db,'select bueno from public.evaluaciones_stock'),17);
  });

  await t.test('El cierre bloquea pendientes y compromisos sin cambios parciales', async () => {
    const datos = { anio_id:origen,destino_id:destino,confirmado:true,observaciones:'Acta anual' };
    await assert.rejects(operar(db,'cerrar',datos),/pendientes de continuidad/);
    await operar(db,'continuidad',{ anio_id:destino,origen_id:origen,estudiante_id:'e6',situacion:'Se retira',observaciones:'Confirmado' });
    await operar(db,'evaluar',{ anio_id:origen,util_id:'u1',contabilizado:22,bueno:16,deteriorado:3,vencido:0,inutilizable:2,comprometido:1 });
    await assert.rejects(operar(db,'cerrar',datos),/comprometidas/);
    assert.equal(await escalar(db,'select count(*)::int from public.cierres_anuales'),0);
    await operar(db,'evaluar',{ anio_id:origen,util_id:'u1',contabilizado:22,bueno:17,deteriorado:3,vencido:0,inutilizable:2,comprometido:0 });
  });

  await t.test('Cierre y traslado repetidos conservan stock y saldo histórico', async () => {
    const datos = { anio_id:origen,destino_id:destino,confirmado:true,observaciones:'Acta anual' };
    await operar(db,'cerrar',datos); await operar(db,'cerrar',datos);
    assert.equal(await escalar(db,'select count(*)::int from public.cierres_anuales'),1);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),17);
    assert.equal(await escalar(db,'select saldo_apertura from public.detalle_cierre_stock'),17);
    assert.equal(await escalar(db,"select count(*)::int from public.movimientos where motivo like 'Cierre anual%'"),1);
  });

  await t.test('Período cerrado rechaza recepciones, movimientos y listas ordinarias', async () => {
    await assert.rejects(db.exec("update public.recepciones set observaciones='Cambio'"),/histórico/);
    await assert.rejects(db.exec("update public.movimientos set motivo='Cambio'"),/histórico/);
    await assert.rejects(db.exec("update public.listas_utiles set items='[]' where \"anioEscolar\"='2026'"),/cerrado/);
    await assert.rejects(db.query('select public.sigue_guardar_recepcion_anual($1,$2::jsonb)',['e1','{"u1":3}']),/año activo/);
    await assert.rejects(db.exec("update public.utiles set \"stockActual\"=99"),/año activo/);
  });

  await t.test('Activación conserva saldo, ficha personal e historial académico', async () => {
    await operar(db,'activar',{ anio_id:destino,confirmado:true }); await operar(db,'activar',{ anio_id:destino,confirmado:true });
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),17);
    assert.equal(await escalar(db,"select grado from public.estudiantes where id='e1'"),'4 años');
    assert.equal(await escalar(db,"select estado from public.estudiantes where id='e3'"),'Inactivo');
    assert.equal(await escalar(db,"select count(*)::int from public.matriculas where estudiante_id='e1'"),2);
    assert.equal(await escalar(db,`select count(*)::int from public.recepciones where anio_id='${destino}'`),0);
    assert.equal(await escalar(db,"select aula_asignada from public.usuarios where id='docente'"),'4 años');
  });

  await t.test('Recuperar deteriorados una sola vez conserva evidencia original', async () => {
    const detalleId = await escalar(db,'select id from public.detalle_cierre_stock');
    const id = crypto.randomUUID();
    const datos = { anio_id:destino,detalle_id:detalleId,cantidad:2,observaciones:'Revisión física y reparación verificadas' };
    await operar(db,'reevaluar',datos,id); await operar(db,'reevaluar',datos,id);
    assert.equal(await escalar(db,'select "stockActual" from public.utiles'),19);
    assert.equal(await escalar(db,'select deteriorado_pendiente from public.detalle_cierre_stock'),1);
    assert.equal(await escalar(db,"select (evaluacion->>'deteriorado')::int from public.detalle_cierre_stock"),3);
  });

  await t.test('Reportes históricos conservan matrículas, recepciones y responsables', async () => {
    await identidad(db,secretariaSub);
    assert.equal(await escalar(db,`select count(*)::int from public.matriculas where anio_id='${origen}'`),6);
    assert.equal(await escalar(db,`select count(*)::int from public.recepciones where anio_id='${origen}'`),1);
    assert.ok(Number(await escalar(db,'select count(*)::int from public.eventos_anios'))>0);
    assert.equal(await escalar(db,"select responsable from public.continuidad_estudiantes where estudiante_id='e2'"),'secretaria');
  });

  await t.test('RLS rechaza escritura directa, anónimos y suplantación de la operación interna', async () => {
    await assert.rejects(db.exec("insert into public.sigue_operaciones_periodo_internas values(txid_current())"),/permission denied/);
    await assert.rejects(db.exec('delete from public.eventos_anios'),/permission denied/);
    await assert.rejects(db.query('select public.sigue_operar_anio_interno($1,$2::jsonb)',['activar',JSON.stringify({ anio_id:origen })]),/permission denied/);
    await db.exec('reset role; set role anon');
    await assert.rejects(db.exec('select * from public.anios_escolares'),/permission denied/);
    await assert.rejects(operar(db,'crear',{}),/permission denied/);
  });
});

test('Asignación inicial explícita conserva cantidades e impide reinterpretar el histórico', async t => {
  const db = await prepararBase();
  t.after(() => db.close());
  await db.exec(`insert into public.recepciones(id,"estudianteId",items) values('anterior','e1','[]');
    insert into public.movimientos(id,tipo,"utilId",cantidad) values('mov-anterior','Entrada','u1',20);`);
  await identidad(db,adminSub);
  const anio = (await operar(db,'crear',{ anio:2026,fecha_inicio:'2026-03-01',fecha_fin:'2026-12-20' })).id;
  await assert.rejects(db.query('select public.sigue_asignar_historico($1,$2,$3)',[anio,['anterior'],['mov-anterior']]),/requieren matrícula/);
  await operar(db,'matricular',{ anio_id:anio,estudiante_id:'e1',nivel:'Inicial',grado:'3 años' });
  await db.query('select public.sigue_asignar_historico($1,$2,$3)',[anio,['anterior'],['mov-anterior']]);
  await db.query('select public.sigue_asignar_historico($1,$2,$3)',[anio,['anterior'],['mov-anterior']]);
  assert.equal(await escalar(db,'select "stockActual" from public.utiles'),20);
  assert.equal(await escalar(db,'select anio_id from public.recepciones'),anio);
  assert.equal(await escalar(db,'select count(*)::int from public.movimientos'),1);
  await operar(db,'activar',{ anio_id:anio,confirmado:true });
  await assert.rejects(db.query('select public.sigue_asignar_historico($1,$2,$3)',[anio,['anterior'],['mov-anterior']]),/preparación inicial/);
});

test('La sesión conserva el temporizador de diez minutos y la identidad de MainLayout', async () => {
  const app = await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(app,/const INACTIVIDAD_MS = 10 \* 60 \* 1000/);
  assert.match(app,/function MainLayout\(/);
  assert.doesNotMatch(app,/key=\{.*(?:token|sesionSupabase|session).*\}/);
  // Comprobación de código. La persistencia real de formularios requiere además QA de navegador.
});
