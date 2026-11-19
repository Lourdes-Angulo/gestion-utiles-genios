import { useState, type FormEvent } from 'react';
import { CalendarDays, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConsultaAnual } from '../context/ConsultaAnualContext';
import { grados, situaciones, sugerirPromocion, type Situacion } from '../lib/aniosEscolares';
import { catalogoDemo, etapasDemo, iniciarDemo, operarDemo, pendientesDemo, reporteDemo, type DemoAccion, type DemoAlumno, type DemoPeriodo } from '../lib/demoAniosEscolares';
import { guardarDemo, limpiarDemo } from '../lib/demoAniosStorage';

const campo = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm';
const boton = 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const tarjeta = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';
const secciones = [
  ['continuidad', 'Continuidad'], ['matriculas', 'Matrículas'], ['listas', 'Listas de útiles'],
  ['stock', 'Inventario y bajas'], ['recepciones', 'Recepciones'], ['movimientos', 'Movimientos'],
  ['cierre', 'Cierre y activación'], ['reporte', 'Reporte anual'],
];

export default function DemoAniosEscolares() {
  const { rolSesion } = useApp();
  const { demo: estado, setDemo: setEstado, seleccionado, seleccionar, avisoDemo } = useConsultaAnual();
  const seleccion = seleccionado?.anio;
  const setSeleccion = (anio: number) => seleccionar(String(anio));
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState(avisoDemo);
  const [etapa, setEtapa] = useState('continuidad');
  const admin = rolSesion === 'Administrador';
  const autorizado = admin || rolSesion === 'Secretaria';
  const activo = estado.anios.find(a => a.estado === 'Activo')!;
  const destino = estado.anios.find(a => a.estado === 'En preparación');
  const periodo = estado.anios.find(a => a.anio === seleccion) ?? activo;
  const cerrado = periodo.estado === 'Cerrado';
  const bloqueado = cerrado || !destino || activo.aprobado;
  const pendientes = pendientesDemo(estado);
  const origenConsulta = periodo.estado === 'En preparación' ? activo : periodo;

  function ejecutar(accion: DemoAccion) {
    setError(''); setMensaje('');
    try {
      const siguiente = operarDemo(estado, accion, rolSesion);
      setEstado(siguiente);
      // Los años recién creados aparecen en el selector al actualizar el contexto.
      try {
        guardarDemo(window.localStorage, siguiente);
        setMensaje(accion.tipo === 'activar' ? 'Nuevo año activado. Seleccione el año anterior para consultar su historial.' : 'Avance ficticio guardado en este navegador.');
      } catch { setMensaje('El avance está en memoria. El navegador no permitió guardarlo para otra recarga.'); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Revise los datos.'); }
  }
  function reiniciar() {
    if (!admin || !window.confirm('¿Eliminar los avances locales de esta demostración y volver a 2026?')) return;
    const inicial = iniciarDemo();
    limpiarDemo(); setEstado(inicial); setSeleccion(2026); setEtapa('continuidad');
    setError('');
    try {
      guardarDemo(window.localStorage, inicial);
      setMensaje('Simulación reiniciada en 2026. Modo demostración guardado.');
    } catch { setMensaje('Simulación reiniciada en memoria. El navegador no permitió guardarla.'); }
  }
  function irPaso(seccion: string) {
    setEtapa(seccion === 'crear' ? 'continuidad' : seccion);
    const ultimoCerrado = estado.anios.filter(a => a.estado === 'Cerrado').at(-1);
    if (seccion === 'reporte' || (!destino && ['continuidad', 'stock', 'cierre'].includes(seccion))) {
      setSeleccion(ultimoCerrado?.anio ?? activo.anio);
    } else setSeleccion(['matriculas', 'listas'].includes(seccion) && destino ? destino.anio : activo.anio);
  }
  if (!autorizado) return <p role="alert" className="p-8">No tiene permisos para esta simulación.</p>;
  return <div className="space-y-6 p-4 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800"><CalendarDays className="text-emerald-600" />Gestión de años escolares</h1>
      <button type="button" className={campo + ' !w-auto'} disabled={!admin} onClick={reiniciar}><RotateCcw className="mr-2 inline" size={16} />Reiniciar simulación</button>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-bold">Modo demostración</p>
      <p>Todos los registros son ficticios. Los avances se conservan en este navegador durante 48 horas desde el último guardado y se eliminan al cerrar sesión o reiniciar.</p>
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
    {mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{mensaje}</p>}
    <div className={tarjeta}>
      <label className="block font-semibold">Año escolar de consulta<select className={campo + ' mt-2'} value={periodo.anio} onChange={e => { setSeleccion(Number(e.target.value)); setError(''); }}>
        {estado.anios.map(a => <option key={a.anio} value={a.anio}>{a.anio} — {a.estado}</option>)}
      </select></label>
      <p className="text-sm text-slate-500">Año activo de la simulación {activo.anio}. La selección cambia únicamente la consulta.</p>
      {cerrado && <p className="rounded-xl bg-slate-100 p-3 text-sm font-semibold">Período cerrado · Solo lectura</p>}
    </div>
    <details className={tarjeta} open><summary className="cursor-pointer font-bold">{!destino && estado.anios.some(a => a.estado === 'Cerrado') ? `Cambio a ${activo.anio} completado` : 'Etapas del cambio de año'}</summary>
      <ol className="grid gap-2 md:grid-cols-2">{etapasDemo(estado).map((p, i) => <li key={p.nombre}>
        <button type="button" disabled={p.estado === 'Bloqueada'} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left text-sm disabled:opacity-50" onClick={() => irPaso(p.seccion)}>
          <span>{i + 1}. {p.nombre}</span><span className={p.estado === 'Completada' ? 'font-semibold text-emerald-700' : 'text-slate-500'}>{p.estado}</span>
        </button>
      </li>)}</ol>
    </details>
    {!destino && !cerrado && <form className={tarjeta} onSubmit={e => { e.preventDefault(); ejecutar({ tipo: 'crear', anio: Number(new FormData(e.currentTarget).get('anio')) }); }}>
      <h2 className="font-bold">Crear año escolar en preparación</h2>
      <label className="block">Año nuevo<input key={activo.anio} className={campo} name="anio" type="number" required min={activo.anio + 1} max="9999" defaultValue={activo.anio + 1} disabled={!admin} /></label>
      <button className={boton} disabled={!admin}>Crear año ficticio</button>
    </form>}
    <nav className="flex flex-wrap gap-2" aria-label="Secciones del año consultado">{secciones.map(([id, nombre]) => <button type="button" key={id} aria-pressed={etapa === id} className={etapa === id ? boton : campo + ' !w-auto'} onClick={() => setEtapa(id)}>{nombre}</button>)}</nav>
    {etapa === 'continuidad' && <section className={tarjeta}>
      <h2 className="font-bold">Continuidad de {origenConsulta.anio}{periodo.estado === 'En preparación' ? ` hacia ${periodo.anio}` : ''}</h2>
      <p className="text-sm text-slate-500">Guardar una decisión permite revisarla. La matrícula del siguiente año se confirma individualmente en Matrículas.</p>
      {origenConsulta.alumnos.map(a => <DecisionDemo key={`${origenConsulta.anio}-${a.id}`} alumno={a} bloqueado={bloqueado || periodo.estado !== 'Activo'} guardar={ejecutar} />)}
      {periodo.estado === 'En preparación' && <button className={campo + ' !w-auto'} onClick={() => setSeleccion(activo.anio)}>Revisar decisiones en {activo.anio}</button>}
    </section>}
    {etapa === 'matriculas' && <section className={tarjeta}>
      <h2 className="font-bold">Matrículas confirmadas de {periodo.anio} · {periodo.alumnos.length}</h2>
      <TablaMatriculas periodo={periodo} />
      {periodo.estado === 'En preparación' && <div className="space-y-3"><h3 className="font-semibold">Confirmar continuidad desde {activo.anio}</h3>
        {activo.alumnos.filter(a => a.situacion.startsWith('Continúa')).map(a => {
          const confirmada = periodo.alumnos.some(m => m.id === a.id);
          return <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"><span>{a.nombre} · {a.grado} → {a.destino} · {a.situacion}</span><button className={boton} disabled={!admin || bloqueado || confirmada} onClick={() => ejecutar({ tipo: 'confirmar', anio: periodo.anio, id: a.id })}>{confirmada ? 'Matrícula confirmada' : 'Confirmar matrícula individual'}</button></div>;
        })}
        {activo.alumnos.some(a => a.situacion === 'Pendiente de revisión') && <p className="text-sm text-amber-700">Hay estudiantes pendientes de revisión en {activo.anio}.</p>}
      </div>}
    </section>}
    {etapa === 'listas' && <section className={tarjeta}>
      <h2 className="font-bold">Listas de útiles de {periodo.anio}</h2>
      {periodo.estado === 'En preparación' && admin && <form key={periodo.anio} className="grid items-end gap-3 md:grid-cols-3" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); ejecutar({ tipo: 'lista', anio: periodo.anio, grado: String(d.get('grado')), cantidades: catalogoDemo.map(u => Number(d.get(u.id))) }); }}>
        <label>Grado<select className={campo} name="grado" disabled={bloqueado}>{grados.map(g => <option key={g}>{g}</option>)}</select></label>
        {catalogoDemo.map(u => <label key={u.id}>{u.nombre} por estudiante<input name={u.id} className={campo} type="number" required min="0" defaultValue="1" disabled={bloqueado} /></label>)}
        <button className={boton} disabled={bloqueado}>Guardar lista del grado</button>
      </form>}
      {periodo.listas.map(l => <div key={l.grado} className="rounded-xl bg-slate-50 p-4 text-sm"><h3 className="font-semibold">{l.anio} · {l.grado}</h3><p>{catalogoDemo.map((u, i) => `${u.nombre} ${l.cantidades[i]}`).join(' · ')}</p></div>)}
      {periodo.listas.length === 0 && <p className="text-sm text-slate-500">Este período todavía no tiene listas preparadas.</p>}
      {destino && periodo.estado === 'Activo' && <button className={campo + ' !w-auto'} onClick={() => setSeleccion(destino.anio)}>Preparar listas de {destino.anio}</button>}
    </section>}
    {etapa === 'stock' && <section className={tarjeta}>
      <h2 className="font-bold">Inventario de {periodo.anio}</h2>
      <p className="text-sm text-slate-500">Los aptos forman el saldo inicial disponible. Los deteriorados quedan segregados en revisión. Vencidos e inutilizables requieren baja autorizada.</p>
      {periodo.stock.length === 0 && <p>La apertura se calculará al aprobar el cierre y activar este período.</p>}
      <InventarioDemo periodo={periodo} />
      {!cerrado && periodo.estado === 'Activo' && periodo.stock.map(u => <div key={`${periodo.anio}-${u.id}`} className="space-y-3 rounded-xl border p-4">
        <h3 className="font-semibold">{u.nombre} · Saldo antes de evaluación {u.total}</h3>
        <form className="grid items-end gap-3 md:grid-cols-5" onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); ejecutar({ tipo: 'evaluar', anio: periodo.anio, id: u.id, cantidades: ['bueno','deteriorado','vencido','inutilizable'].map(k => Number(d.get(k))) }); }}>
          {(['bueno','deteriorado','vencido','inutilizable'] as const).map(k => <label key={k} className="capitalize">{k}<input className={campo} name={k} type="number" min="0" max={u.total} required defaultValue={u[k]} disabled={bloqueado || !admin || u.baja} /></label>)}
          <button className={boton} disabled={bloqueado || !admin || u.baja}>Guardar evaluación</button>
        </form>
        {u.evaluado && u.vencido + u.inutilizable > 0 && <button className={boton} disabled={bloqueado || !admin || u.baja} onClick={() => ejecutar({ tipo: 'baja', anio: periodo.anio, id: u.id })}>{u.baja ? 'Baja simulada registrada' : `Autorizar baja simulada de ${u.vencido + u.inutilizable} unidades`}</button>}
      </div>)}
    </section>}
    {etapa === 'recepciones' && <section className={tarjeta}><h2 className="font-bold">Recepciones de {periodo.anio}</h2>
      {periodo.recepciones.map(r => <div key={r.id} className="rounded-xl border p-4 text-sm"><p>{r.fecha} · {periodo.alumnos.find(a => a.id === r.estudianteId)?.nombre} · {r.id}</p><p>{catalogoDemo.map((u, i) => `${u.nombre} ${r.cantidades[i]}`).join(' · ')}</p></div>)}
      {periodo.recepciones.length === 0 && <p className="text-sm text-slate-500">Sin recepciones registradas en este período.</p>}
    </section>}
    {etapa === 'movimientos' && <section className={tarjeta}><h2 className="font-bold">Movimientos de {periodo.anio}</h2>
      <p className="text-sm text-slate-500">El traslado de aptos y la custodia se registran como continuidad de saldo entre años.</p>
      {periodo.movimientos.map(m => <div key={m.id} className="rounded-xl border p-3 text-sm">{m.anio} · {catalogoDemo.find(u => u.id === m.utilId)?.nombre} · {m.tipo} · {m.cantidad} · {m.referencia}</div>)}
      {periodo.movimientos.length === 0 && <p className="text-sm text-slate-500">Sin movimientos en este período.</p>}
    </section>}
    {etapa === 'cierre' && <section className={tarjeta}>
      <h2 className="font-bold">Cierre de {periodo.anio}</h2>
      {cerrado && periodo.cierre ? <><p>Cierre aprobado por {periodo.cierre.responsable} en demostración. Apertura del siguiente año {periodo.cierre.destino}.</p><InventarioDemo periodo={periodo} /></> : <>
        <p className="text-sm">Origen {activo.anio} · Destino {destino?.anio ?? 'pendiente'} · Revisión {activo.revisado ? 'completa' : 'pendiente'} · Aprobación {activo.aprobado ? 'registrada' : 'pendiente'}</p>
        {pendientes.length > 0 ? <ul className="list-inside list-disc text-sm text-slate-600">{pendientes.map(p => <li key={p}>{p}</li>)}</ul> : <p>Continuidad, matrículas, listas, clasificación y bajas completas.</p>}
        <div className="flex flex-wrap gap-3">
          <button className={boton} disabled={!admin || bloqueado || pendientes.length > 0} onClick={() => ejecutar({ tipo: 'revisar', anio: activo.anio })}>Revisar cierre anual</button>
          <button className={boton} disabled={!admin || !activo.revisado || activo.aprobado} onClick={() => ejecutar({ tipo: 'aprobar', anio: activo.anio })}>Simular aprobación administrativa</button>
          <button className={boton} disabled={!admin || !activo.aprobado || !destino} onClick={() => destino && ejecutar({ tipo: 'activar', anio: destino.anio })}>Activar {destino?.anio ?? 'nuevo año'}</button>
        </div>
      </>}
    </section>}
    {etapa === 'reporte' && <ReporteDemo periodo={periodo} />}
  </div>;
}

function DecisionDemo({ alumno, bloqueado, guardar }: { alumno: DemoAlumno; bloqueado: boolean; guardar: (accion: DemoAccion) => void }) {
  const [situacion, setSituacion] = useState<Situacion>(alumno.situacion);
  const nivel = grados.indexOf(alumno.grado) < 3 ? 'Inicial' : 'Primaria';
  const sugerencia = sugerirPromocion(nivel, alumno.grado);
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    guardar({ tipo: 'decision', anio: alumno.anio, id: alumno.id, situacion, destino: String(new FormData(e.currentTarget).get('destino') ?? '') });
  }
  return <form className="grid items-end gap-3 rounded-xl border p-4 md:grid-cols-4" onSubmit={enviar}>
    <div><p className="font-semibold">{alumno.nombre}</p><p className="text-sm text-slate-500">{alumno.anio} · {nivel} · {alumno.grado}</p><p className="text-xs text-slate-500">Guardado {alumno.situacion} {alumno.destino}</p><p className="text-xs text-slate-500">Sugerencia {sugerencia?.egresa ? 'Egresa' : sugerencia?.grado}</p></div>
    <label>Decisión<select className={campo} value={situacion} disabled={bloqueado} onChange={e => setSituacion(e.target.value as Situacion)}>{situaciones.map(s => <option key={s}>{s}</option>)}</select></label>
    <label>Grado destino<select className={campo} name="destino" defaultValue={alumno.destino} disabled={bloqueado || situacion !== 'Continúa y promociona'}><option value="">Seleccione un grado</option>{grados.map(g => <option key={g}>{g}</option>)}</select></label>
    {!bloqueado && <button className={boton}>Guardar decisión individual</button>}
  </form>;
}

function TablaMatriculas({ periodo }: { periodo: DemoPeriodo }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Estudiante', 'Año', 'Nivel', 'Grado histórico'].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{periodo.alumnos.map(a => <tr key={a.id} className="border-t"><td className="p-2">{a.nombre}</td><td className="p-2">{a.anio}</td><td className="p-2">{grados.indexOf(a.grado) < 3 ? 'Inicial' : 'Primaria'}</td><td className="p-2">{a.grado}</td></tr>)}</tbody></table>{periodo.alumnos.length === 0 && <p className="p-3 text-slate-500">Sin matrículas confirmadas.</p>}</div>;
}

function InventarioDemo({ periodo }: { periodo: DemoPeriodo }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{['Útil', 'Apertura disponible', 'Apertura en revisión', 'Físico antes de evaluar', 'Evaluación', 'Aptos / disponible al cierre', 'Deteriorados', 'Vencidos', 'Inutilizables', 'Baja autorizada', 'Aptos trasladados'].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{periodo.stock.map(u => <tr key={u.id} className="border-t"><td className="p-2">{u.nombre}</td>{[u.apertura, u.aperturaRevision, u.total, u.evaluado ? 'Completa' : 'Pendiente', u.evaluado ? u.bueno : '—', u.evaluado ? u.deteriorado : '—', u.evaluado ? u.vencido : '—', u.evaluado ? u.inutilizable : '—', u.baja ? u.vencido + u.inutilizable : 0, periodo.estado === 'Cerrado' ? u.bueno : '—'].map((n, i) => <td key={i} className="p-2">{n}</td>)}</tr>)}</tbody></table></div>;
}

function ReporteDemo({ periodo }: { periodo: DemoPeriodo }) {
  const r = reporteDemo(periodo);
  const cifras = [
    ['Matriculados', r.matriculados], ['Promovidos', r.promovidos], ['Repiten', r.repiten], ['Retirados', r.retirados],
    ['Trasladados a otra institución', r.trasladados], ['Egresados', r.egresados], ['Pendientes de revisión', r.pendientes],
    ['Útiles recibidos', r.recibidos], ['Disponibles al cierre / evaluados', r.disponibles], ['Aptos trasladados', r.aptosTrasladados],
    ['Deteriorados', r.deteriorados], ['Bajas autorizadas', r.bajas],
  ];
  return <section className={tarjeta}><h2 className="font-bold">Reporte anual de demostración · {periodo.anio} · {periodo.estado}</h2>
    {periodo.estado !== 'Cerrado' && <p className="text-sm text-amber-700">Reporte provisional. Las cifras de inventario corresponden a las evaluaciones guardadas.</p>}
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cifras.map(([nombre, valor]) => <div key={nombre} className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-500">{nombre}</dt><dd className="text-xl font-bold text-slate-800">{valor}</dd></div>)}</dl>
    <TablaMatriculas periodo={periodo} /><InventarioDemo periodo={periodo} />
  </section>;
}

export function ConsultaDemoPeriodo({ vista }: { vista: string }) {
  const { demo, seleccionado } = useConsultaAnual();
  const p = demo.anios.find(a => a.anio === seleccionado?.anio);
  if (!p) return <p className="p-8">Seleccione un año de demostración.</p>;
  return <div className="space-y-5 overflow-y-auto bg-slate-50 p-4 md:p-8">
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Modo demostración · {p.anio} — {p.estado} · Consulta de solo lectura</p>
    {vista === 'estudiantes' && <section className={tarjeta}><h2 className="font-bold">Matrículas de {p.anio}</h2><TablaMatriculas periodo={p} /></section>}
    {vista === 'listas' && <section className={tarjeta}><h2 className="font-bold">Listas de {p.anio}</h2>{p.listas.map(l => <p key={l.grado} className="rounded-xl border p-3 text-sm">{l.grado} · {catalogoDemo.map((u, i) => `${u.nombre} ${l.cantidades[i]}`).join(' · ')}</p>)}{!p.listas.length && <p>Sin listas en este período.</p>}</section>}
    {vista === 'control_stock' && <section className={tarjeta}><h2 className="font-bold">Inventario de {p.anio}</h2><InventarioDemo periodo={p} />{!p.stock.length && <p>Apertura pendiente de activación.</p>}</section>}
    {vista === 'recepcion' && <section className={tarjeta}><h2 className="font-bold">Recepciones de {p.anio}</h2>{p.recepciones.map(r => <p key={r.id} className="rounded-xl border p-3 text-sm">{r.fecha} · {p.alumnos.find(a => a.id === r.estudianteId)?.nombre} · {catalogoDemo.map((u, i) => `${u.nombre} ${r.cantidades[i]}`).join(' · ')}</p>)}{!p.recepciones.length && <p>Sin recepciones en este período.</p>}</section>}
    {vista === 'movimientos' && <section className={tarjeta}><h2 className="font-bold">Movimientos de {p.anio}</h2>{p.movimientos.map(m => <p key={m.id} className="rounded-xl border p-3 text-sm">{catalogoDemo.find(u => u.id === m.utilId)?.nombre} · {m.tipo} · {m.cantidad} · {m.referencia}</p>)}{!p.movimientos.length && <p>Sin movimientos en este período.</p>}</section>}
    {vista === 'reportes' && <ReporteDemo periodo={p} />}
    {!['estudiantes', 'listas', 'control_stock', 'recepcion', 'movimientos', 'reportes'].includes(vista) && <p className={tarjeta}>Este módulo está pendiente de integración con la demostración. Puede consultar las secciones de matrículas, listas, recepción, inventario, movimientos y reportes.</p>}
  </div>;
}
