import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Plus, ArrowRight, Users, ClipboardList, PackageCheck, Boxes } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConsultaAnual } from '../context/ConsultaAnualContext';
import { grados, operarAnio, situaciones, sugerirPromocion, validarEvaluacion, type AnioEscolar, type Continuidad, type EvaluacionStock, type Matricula, type Situacion } from '../lib/aniosEscolares';
import { puedeAbrir } from '../lib/permisosRoles';
import PreparacionMatriculas from './PreparacionMatriculas';
import BajaInventario from './BajaInventario';
import AsignacionesAnuales from './AsignacionesAnuales';
import EvidenciaAnual from './EvidenciaAnual';
import ReporteAnual from './ReporteAnual';

const campo = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm w-full';
const boton = 'rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
type Detalle = { id: string; cierre_id: string; util_id: string; saldo_apertura: number; deteriorado_pendiente: number; evaluacion: EvaluacionStock };
type Cierre = { id: string; anio_id: string; destino_id: string; creado_en: string; responsable: string; observaciones: string };

function GestionRealAniosEscolares({ soloPreparacion = false }: { soloPreparacion?: boolean }) {
  const { cliente, estudiantes, utiles, recargarDatos } = useApp();
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [decisiones, setDecisiones] = useState<Continuidad[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionStock[]>([]);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [contadores, setContadores] = useState<{ listas: Record<string, number> | null; recepciones: Record<string, number> | null }>({ listas: null, recepciones: null });
  const { seleccionado, seleccionar: setSeleccion } = useConsultaAnual();
  const seleccion = seleccionado?.id ?? '';
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [crear, setCrear] = useState(false);
  const [seccion, setSeccion] = useState('matriculas');
  const [busqueda, setBusqueda] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState('');
  const [gradoFiltro, setGradoFiltro] = useState('');
  const [situacionFiltro, setSituacionFiltro] = useState('');

  const cargar = useCallback(async () => {
    const resultados = await Promise.all([
      cliente.from('anios_escolares').select('*').order('anio', { ascending: false }),
      cliente.from('matriculas').select('*'), cliente.from('continuidad_estudiantes').select('*'),
      cliente.from('evaluaciones_stock').select('*'), cliente.from('cierres_anuales').select('*').order('creado_en', { ascending: false }),
      cliente.from('detalle_cierre_stock').select('*'),
    ]);
    const fallo = resultados.find(r => r.error);
    if (fallo?.error && ['PGRST205', '42P01'].includes(fallo.error.code)) throw new Error('Faltan migraciones de años escolares en Supabase.');
    if (fallo?.error) throw new Error(`No se pudo cargar el módulo. ${fallo.error.message}. Revise las migraciones y permisos de Supabase.`);
    setAnios(resultados[0].data as AnioEscolar[]);
    setMatriculas(resultados[1].data as Matricula[]);
    setDecisiones(resultados[2].data as Continuidad[]);
    setEvaluaciones(resultados[3].data as EvaluacionStock[]);
    setCierres(resultados[4].data as Cierre[]);
    setDetalles(resultados[5].data as Detalle[]);
    // Contadores reales. Si una consulta falla, se muestra «—»; nunca datos simulados.
    const [listasRespuesta, recepcionesRespuesta] = await Promise.all([
      cliente.from('listas_utiles').select('id, anioEscolar'),
      cliente.from('recepciones').select('id, anio_id'),
    ]);
    const listasPorAnio: Record<string, number> = {};
    if (!listasRespuesta.error) {
      for (const lista of (listasRespuesta.data ?? []) as Array<{ anioEscolar: string }>) {
        const clave = String(lista.anioEscolar);
        listasPorAnio[clave] = (listasPorAnio[clave] ?? 0) + 1;
      }
    }
    const recepcionesPorAnio: Record<string, number> = {};
    if (!recepcionesRespuesta.error) {
      for (const recepcion of (recepcionesRespuesta.data ?? []) as Array<{ anio_id: string | null }>) {
        if (!recepcion.anio_id) continue;
        recepcionesPorAnio[recepcion.anio_id] = (recepcionesPorAnio[recepcion.anio_id] ?? 0) + 1;
      }
    }
    setContadores({
      listas: listasRespuesta.error ? null : listasPorAnio,
      recepciones: recepcionesRespuesta.error ? null : recepcionesPorAnio,
    });
  }, [cliente]);

  useEffect(() => { let vigente = true; cargar().catch(e => { if (vigente) setError(e.message); }).finally(() => { if (vigente) setCargando(false); }); return () => { vigente = false; }; }, [cargar]);

  async function ejecutar(accion: string, datos: Record<string, unknown>) {
    setOcupado(true); setError(''); setMensaje('');
    try {
      await operarAnio(cliente, accion, datos);
      await cargar(); recargarDatos(); setMensaje('Operación guardada correctamente.');
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); return false; }
    finally { setOcupado(false); }
  }

  const anio = anios.find(a => a.id === seleccion) ?? anios[0];
  const origen = anios.filter(a => a.anio < (anio?.anio ?? 0)).sort((a, b) => b.anio - a.anio)[0];
  const seccionVisible = !origen && seccion === 'continuidad' ? 'matriculas' : seccion;
  const activo = anios.find(a => a.estado === 'Activo');
  const primerAnioEnCurso = anios.length === 1 && anio?.estado === 'Activo';
  const destino = anios.filter(a => a.estado === 'En preparación' && a.anio > (anio?.anio ?? 0)).sort((a, b) => a.anio - b.anio)[0];
  const origenMatriculas = matriculas.filter(m => m.anio_id === origen?.id);
  const evaluacionesActuales = evaluaciones.filter(e => e.anio_id === anio?.id);
  const cierre = cierres.find(c => c.anio_id === anio?.id);
  const pendientes = matriculas.filter(m => m.anio_id === anio?.id).filter(m => {
    const decision = decisiones.find(c => c.destino_id === destino?.id && c.estudiante_id === m.estudiante_id);
    return !decision || decision.situacion === 'Pendiente de revisión';
  }).length;
  const productosPendientes = utiles.filter(u => {
    const evaluacion = evaluacionesActuales.find(e => e.util_id === u.id);
    return !evaluacion || evaluacion.contabilizado !== u.stockActual || evaluacion.comprometido > 0;
  }).length;
  // Progreso calculado desde las fechas registradas en Supabase.
  const inicio = anio ? Date.parse(`${anio.fecha_inicio}T00:00:00`) : NaN;
  const fin = anio ? Date.parse(`${anio.fecha_fin}T23:59:59`) : NaN;
  const progreso = Number.isFinite(inicio) && Number.isFinite(fin) && fin > inicio
    ? Math.max(0, Math.min(100, Math.round(((Date.now() - inicio) / (fin - inicio)) * 100)))
    : 0;
  const formatearFecha = (fecha: string) => {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const matriculados = matriculas.filter(m => m.anio_id === anio?.id).length;
  const cantidadListas = anio && contadores.listas ? (contadores.listas[String(anio.anio)] ?? 0) : null;
  const cantidadRecepciones = anio && contadores.recepciones ? (contadores.recepciones[anio.id] ?? 0) : null;
  const unidadesStockActual = utiles.reduce((total, u) => total + (Number(u.stockActual) || 0), 0);
  const siguiente = activo?.anio ? activo.anio + 1 : (anios[0]?.anio ?? new Date().getFullYear()) + 1;
  const siguientePreparado = anios.find(a => a.anio === siguiente && a.estado === 'En preparación');


  async function crearAnio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    if (await ejecutar('crear', datos)) setCrear(false);
  }

  if (anio?.estado === 'Cerrado') return <div className="space-y-4 overflow-y-auto bg-slate-50 p-4 md:p-8">
    <p className="rounded-xl border bg-white p-4 text-sm">{anio.anio} — Cerrado · Solo lectura. Seleccione otro año en la cabecera para continuar la gestión.</p>
    <ReporteAnual key={anio.id} />
  </div>;

  return <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-4 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <CalendarDays className="text-emerald-700" size={24} />
          {soloPreparacion ? 'Preparación de matrículas' : 'Años escolares'}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500">
          Administre el año en curso y prepare el siguiente: continuidad de estudiantes, sobrantes e inventario.
        </p>
      </div>
      {!soloPreparacion && anios.length === 0 &&
        <button type="button" className={boton} onClick={() => setCrear(!crear)}>
          <Plus size={16} className="mr-1 inline" />Crear primer año
        </button>}
    </div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
    {mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{mensaje}</p>}
    {crear && !activo && <form onSubmit={crearAnio} className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-3">
      <label>Año<input required type="number" name="anio" min="1" max="9999" defaultValue={siguiente} className={campo} /></label>
      <label>Fecha de inicio<input required type="date" name="fecha_inicio" className={campo} /></label>
      <label>Fecha de finalización<input required type="date" name="fecha_fin" className={campo} /></label>
      <label className="md:col-span-3">Observaciones<textarea name="observaciones" className={campo} /></label>
      <div className="flex flex-wrap items-center gap-2 md:col-span-3">
        <button disabled={ocupado} className={boton}>Crear en preparación</button>
        <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setCrear(false)}>Cancelar</button>
      </div>
    </form>}
    {cargando ? <p>Cargando años escolares…</p> : anios.length === 0
      ? <p className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Cree el primer año escolar para comenzar. No se han encontrado períodos registrados.</p>
      : <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-5 md:gap-8">
          <div className="text-6xl font-black tracking-tight text-emerald-700 md:text-7xl">{anio.anio}</div>
          <div className="min-w-0 flex-1 space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              {anio.estado === 'Activo' ? 'En curso' : anio.estado}
            </span>
            <h2 className="font-bold text-slate-900">
              {primerAnioEnCurso ? 'Primer período registrado en SIGUE' :
                anio.estado === 'En preparación' ? `Preparación del año ${anio.anio}` : `Año escolar ${anio.anio}`}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              {anio.estado === 'Activo'
                ? 'Gestione estudiantes, listas, recepciones y stock desde los módulos del menú lateral mientras dure el año.'
                : 'Prepare matrículas y continuidad. El año anterior continúa funcionando hasta que se complete su cierre.'}
            </p>
            <div className="pt-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{formatearFecha(anio.fecha_inicio)}</span>
                <span>{progreso}% del período transcurrido</span>
                <span>{formatearFecha(anio.fecha_fin)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`Resumen del año ${anio.anio}`} className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {[
          { valor: String(matriculados), etiqueta: 'Estudiantes matriculados', icono: <Users size={17} /> },
          { valor: cantidadListas === null ? '—' : String(cantidadListas), etiqueta: 'Listas del año', icono: <ClipboardList size={17} /> },
          { valor: cantidadRecepciones === null ? '—' : String(cantidadRecepciones), etiqueta: 'Recepciones del año', icono: <PackageCheck size={17} /> },
          { valor: anio.estado === 'Activo' ? String(unidadesStockActual) : '—', etiqueta: anio.estado === 'Activo' ? 'Unidades en almacén (actual)' : 'Stock histórico: consultar cierre', icono: <Boxes size={17} /> },
        ].map(d => <div key={d.etiqueta} className="border-b border-slate-200 p-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
          <div className="flex items-center justify-between text-slate-400">{d.icono}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{d.valor}</div>
          <p className="text-xs text-slate-500">{d.etiqueta}</p>
        </div>)}
      </section>

      {!soloPreparacion && activo && <section className="space-y-3">
        <div>
          <h2 className="font-bold text-slate-900">Preparar {activo.anio + 1}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {siguientePreparado
              ? `${siguientePreparado.anio} ya está creado en preparación. Complete estos pasos antes del cierre.`
              : 'Al crear el siguiente año se habilitan estos tres pasos, en este orden.'}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { numero: 1, titulo: 'Continuidad', detalle: `Decida qué estudiantes de ${activo.anio} continúan, promocionan, repiten o se retiran.`, seccion: 'continuidad', anioId: siguientePreparado?.id },
            { numero: 2, titulo: 'Evaluación de sobrantes', detalle: `Revise qué útiles de ${activo.anio} pueden trasladarse y cuáles deben retirarse.`, seccion: 'stock', anioId: activo.id },
            { numero: 3, titulo: `Cierre de ${activo.anio}`, detalle: 'Confirme las decisiones y el inventario antes de archivar el período.', seccion: 'cierre', anioId: activo.id },
          ].map(paso => <button type="button" key={paso.numero}
            disabled={!siguientePreparado}
            onClick={() => { if (paso.anioId) setSeleccion(paso.anioId); setSeccion(paso.seccion); }}
            className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-left transition-colors enabled:hover:border-emerald-300 enabled:hover:bg-emerald-50 disabled:cursor-default">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">{paso.numero}</span>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{paso.titulo}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">{paso.detalle}</p>
          </button>)}
        </div>
        {!siguientePreparado ? <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={ocupado} className={boton} onClick={() => setCrear(true)}>
            <Plus size={16} className="mr-1 inline" />Crear año escolar {activo.anio + 1}
          </button>
          <span className="text-xs text-slate-500">{activo.anio} seguirá activo hasta que se cierre.</span>
        </div> : <p className="flex items-center gap-2 text-sm text-emerald-800">
          <ArrowRight size={16} />Seleccione una etapa para continuar su preparación.
        </p>}
      </section>}

    {crear && !!activo && <form onSubmit={crearAnio} className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-3">
      <label>Año<input required type="number" name="anio" min="1" max="9999" defaultValue={siguiente} className={campo} /></label>
      <label>Fecha de inicio<input required type="date" name="fecha_inicio" className={campo} /></label>
      <label>Fecha de finalización<input required type="date" name="fecha_fin" className={campo} /></label>
      <label className="md:col-span-3">Observaciones<textarea name="observaciones" className={campo} /></label>
      <div className="flex flex-wrap items-center gap-2 md:col-span-3">
        <button disabled={ocupado} className={boton}>Crear en preparación</button>
        <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={() => setCrear(false)}>Cancelar</button>
      </div>
    </form>}

      {/* Hasta crear un segundo período, las operaciones regulares se hacen desde el menú lateral. */}
      {!primerAnioEnCurso && <>
      <nav className="flex flex-wrap gap-2" aria-label="Secciones del año">
        {[
          ...(origen ? [['continuidad', 'Continuidad de estudiantes']] : []),
          ['matriculas', origen ? 'Matrículas del siguiente año' : 'Matrículas'],
          ['stock', 'Evaluación de sobrantes'],
          ['cierre', anio.estado === 'Activo' ? 'Cierre anual' : 'Revisión y activación'],
        ]
          .filter(([id]) => !soloPreparacion || ['continuidad', 'matriculas'].includes(id))
          .map(([id, etiqueta]) => (
            <button key={id} type="button" onClick={() => setSeccion(id)} className={seccionVisible === id ? boton : campo + ' !w-auto'}>
              {etiqueta}
            </button>
          ))}
      </nav>

      {origen && seccionVisible === 'continuidad' && <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Continuidad hacia {anio.anio}</h2>
        <p className="text-sm text-slate-500">Origen {origen?.anio ?? 'sin año anterior'}. Cada decisión requiere guardado individual y aprobación administrativa.</p>
        <div className="grid gap-2 md:grid-cols-4"><input aria-label="Buscar estudiante" placeholder="Buscar por nombre" className={campo} value={busqueda} onChange={e => setBusqueda(e.target.value)} /><select aria-label="Filtrar nivel" className={campo} value={nivelFiltro} onChange={e => setNivelFiltro(e.target.value)}><option value="">Todos los niveles</option><option>Inicial</option><option>Primaria</option></select><select aria-label="Filtrar grado" className={campo} value={gradoFiltro} onChange={e => setGradoFiltro(e.target.value)}><option value="">Todos los grados</option>{grados.map(g => <option key={g}>{g}</option>)}</select><select aria-label="Filtrar situación" className={campo} value={situacionFiltro} onChange={e => setSituacionFiltro(e.target.value)}><option value="">Todas las situaciones</option>{situaciones.map(s => <option key={s}>{s}</option>)}</select></div>
        {origenMatriculas.filter(m => {
          const estudiante = estudiantes.find(e => e.id === m.estudiante_id);
          const decision = decisiones.find(d => d.destino_id === anio.id && d.estudiante_id === m.estudiante_id);
          return `${estudiante?.nombres} ${estudiante?.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) && (!nivelFiltro || nivelFiltro === m.nivel) && (!gradoFiltro || gradoFiltro === m.grado) && (!situacionFiltro || situacionFiltro === (decision?.situacion ?? 'Pendiente de revisión'));
        }).map(m => {
          const estudiante = estudiantes.find(e => e.id === m.estudiante_id);
          const decision = decisiones.find(d => d.destino_id === anio.id && d.estudiante_id === m.estudiante_id);
          const aprobada = matriculas.some(n => n.anio_id === anio.id && n.estudiante_id === m.estudiante_id);
          return <DecisionEstudiante key={`${anio.id}-${m.id}-${decision?.actualizado_en ?? ''}-${aprobada}`} nombre={`${estudiante?.nombres ?? ''} ${estudiante?.apellidos ?? m.estudiante_id}`} matricula={m} decision={decision} aprobada={aprobada} bloqueada={ocupado || anio.estado !== 'En preparación'} guardar={datos => ejecutar('continuidad', { ...datos, anio_id: anio.id, origen_id: origen.id, estudiante_id: m.estudiante_id })} reabrir={() => ejecutar('reabrir_decision', { anio_id: anio.id, estudiante_id: m.estudiante_id })} />;
        })}
        {origenMatriculas.length === 0 && <p className="text-sm">No hay matrículas del año anterior registradas.</p>}
        {!soloPreparacion && anio.estado === 'En preparación' && <div className="flex flex-wrap gap-3">
          <button className={boton} disabled={ocupado} onClick={() => { if (window.confirm('¿Aprobar las matrículas de las decisiones guardadas de continuidad?')) void ejecutar('aprobar', { anio_id: anio.id, confirmado: true }); }}>Aprobar continuidad revisada</button>
          {origen && <button className={campo + ' !w-auto'} disabled={ocupado} onClick={() => void ejecutar('copiar_listas', { anio_id: anio.id, origen_id: origen.id })}>Copiar listas de {origen.anio}</button>}
        </div>}
      </section>}

      {seccionVisible === 'matriculas' && <><PreparacionMatriculas anioId={anio.id} />{!soloPreparacion && <AsignacionesAnuales anioId={anio.id} />}</>}
      {seccionVisible === 'stock' && <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Inventario físico de {anio.anio}</h2>
        <p className="text-sm text-slate-600">Confirme todas las unidades y documente las comprometidas. Deben resolverse antes del traslado. Un cambio de stock exige volver a revisar la evaluación.</p>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Útil','Contabilizado','Bueno','Deteriorado','Vencido','Inutilizable','Comprometido'].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{(cierre ? detalles.filter(d => d.cierre_id === cierre.id).map(d => d.evaluacion) : evaluacionesActuales).map(e => <tr key={e.util_id} className="border-t"><td className="p-2">{utiles.find(u => u.id === e.util_id)?.nombre ?? e.util_id}</td>{[e.contabilizado,e.bueno,e.deteriorado,e.vencido,e.inutilizable,e.comprometido].map((n, i) => <td key={i} className="p-2">{n}</td>)}</tr>)}</tbody></table></div>
        {(cierre ? detalles.filter(d => d.cierre_id === cierre.id).map(d => d.evaluacion) : evaluacionesActuales).filter(e => e.evidencia).map(e => <div key={e.id} className="text-sm"><span>{utiles.find(u => u.id === e.util_id)?.nombre}</span><EvidenciaAnual ruta={e.evidencia} /></div>)}
        {anio.estado === 'Activo' && <EvaluarStock key={anio.id} ocupado={ocupado} guardar={datos => ejecutar('evaluar', { ...datos, anio_id: anio.id })} />}
        {activo?.id === anio.id && detalles.filter(d => d.deteriorado_pendiente > 0).map(d => <form key={`${d.id}-${d.deteriorado_pendiente}`} className="flex flex-wrap items-end gap-3 rounded-xl bg-amber-50 p-4" onSubmit={e => { e.preventDefault(); const datos = Object.fromEntries(new FormData(e.currentTarget)); void ejecutar('reevaluar', { ...datos, anio_id: anio.id, detalle_id: d.id }); }}>
          <span>{utiles.find(u => u.id === d.util_id)?.nombre} · {d.deteriorado_pendiente} deteriorados en revisión</span>
          <label>Unidades recuperadas<input className={campo} required name="cantidad" type="number" min="1" max={d.deteriorado_pendiente} /></label><label>Evidencia de recuperación<input className={campo} name="observaciones" required /></label><button className={boton} disabled={ocupado}>Confirmar recuperación</button>
        </form>)}
        {anio.estado === 'Activo' && <BajaInventario />}
      </section>}

      {seccionVisible === 'cierre' && <section className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Revisión de {anio.anio}</h2>
        {anio.estado === 'Activo' && <><p>Destino preparado {destino?.anio ?? 'ninguno'}. Estudiantes pendientes {pendientes}. Productos pendientes o con compromisos {productosPendientes}.</p>
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (!destino) return; const datos = Object.fromEntries(new FormData(e.currentTarget)); if (window.confirm(`¿Cerrar definitivamente ${anio.anio} y aprobar el saldo de apertura de ${destino.anio}?`)) void ejecutar('cerrar', { ...datos, anio_id: anio.id, destino_id: destino.id, confirmado: true }); }}>
            <label className="block">Acta y observaciones de cierre<textarea required name="observaciones" className={campo} /></label>
            <label className="flex gap-2"><input type="checkbox" required />Confirmo la revisión física, la segregación de materiales no aptos y las decisiones de continuidad.</label>
            <button className={boton} disabled={ocupado || !destino || pendientes > 0 || productosPendientes > 0}>Aprobar cierre anual</button>
          </form></>}
        {anio.estado === 'En preparación' && <><p>Matrículas aprobadas {matriculas.filter(m => m.anio_id === anio.id).length}. {activo ? `Año activo actual ${activo.anio}.` : 'Sin año activo.'}</p><button className={boton} disabled={ocupado || !!activo} onClick={() => { if (window.confirm(`¿Activar ${anio.anio} para las operaciones del colegio?`)) void ejecutar('activar', { anio_id: anio.id, confirmado: true }); }}>Activar {anio.anio}</button></>}
        <h3 className="font-semibold">Historial de cierres</h3>
        {cierres.map(c => <div key={c.id} className="rounded-xl border p-4 text-sm"><p>{anios.find(a => a.id === c.anio_id)?.anio} → {anios.find(a => a.id === c.destino_id)?.anio} · {new Date(c.creado_en).toLocaleString('es-PE')} · Responsable {c.responsable}</p><p>{c.observaciones}</p>{detalles.filter(d => d.cierre_id === c.id).map(d => <p key={d.id}>{utiles.find(u => u.id === d.util_id)?.nombre ?? d.util_id} · Apertura {d.saldo_apertura} · En revisión {d.deteriorado_pendiente}</p>)}</div>)}
      </section>}
      </>}
    </>}
  </div>;
}

function DecisionEstudiante({ nombre, matricula, decision, aprobada, bloqueada, guardar, reabrir }: { nombre: string; matricula: Matricula; decision?: Continuidad; aprobada: boolean; bloqueada: boolean; guardar: (datos: Record<string, unknown>) => Promise<boolean>; reabrir: () => Promise<boolean> }) {
  const { usuarioActivo } = useApp();
  const [situacion, setSituacion] = useState<Situacion>(decision?.situacion ?? 'Pendiente de revisión');
  const sugerencia = sugerirPromocion(matricula.nivel, matricula.grado);
  const [grado, setGrado] = useState(decision?.grado ?? sugerencia?.grado ?? matricula.grado);
  const continua = situacion === 'Continúa y promociona' || situacion === 'Continúa en el mismo grado';
  return <form className="grid items-end gap-3 rounded-xl border p-4 lg:grid-cols-4" onSubmit={e => { e.preventDefault(); const datos = Object.fromEntries(new FormData(e.currentTarget)); const repeticion = situacion === 'Continúa en el mismo grado'; void guardar({ ...datos, situacion, nivel: continua ? (repeticion ? matricula.nivel : grados.indexOf(grado) < 3 ? 'Inicial' : 'Primaria') : null, grado: continua ? (repeticion ? matricula.grado : grado) : null }); }}>
    <div><p className="font-semibold">{nombre}</p><p className="text-sm text-slate-500">{matricula.nivel} · {matricula.grado}</p><p className="text-xs text-slate-500">Sugerencia {sugerencia?.egresa ? 'Egresa' : sugerencia?.grado ?? 'revisión manual'}</p>{decision && <p className="text-xs text-slate-500">{decision.responsable} · {new Date(decision.actualizado_en).toLocaleString('es-PE')}</p>}</div>
    <label>Situación<select className={campo} value={situacion} disabled={bloqueada || aprobada} onChange={e => setSituacion(e.target.value as Situacion)}>{situaciones.map(s => <option key={s}>{s}</option>)}</select></label>
    {continua && <label>Grado destino<select className={campo} value={situacion === 'Continúa en el mismo grado' ? matricula.grado : grado} disabled={bloqueada || aprobada || situacion === 'Continúa en el mismo grado'} onChange={e => setGrado(e.target.value)}>{grados.map(g => <option key={g}>{g}</option>)}</select></label>}
    <label>Observaciones<input className={campo} name="observaciones" defaultValue={decision?.observaciones} disabled={bloqueada || aprobada} /></label>
    {aprobada ? usuarioActivo.rol === 'Administrador' ? <button type="button" className={campo} disabled={bloqueada} onClick={() => { if (window.confirm('¿Reabrir la revisión y retirar su matrícula preparatoria?')) void reabrir(); }}>Revisar aprobación</button> : <p className="text-sm text-emerald-700">Matrícula aprobada</p> : <button className={boton} disabled={bloqueada}>Guardar decisión</button>}
  </form>;
}

function EvaluarStock({ ocupado, guardar }: { ocupado: boolean; guardar: (datos: Record<string, unknown>) => Promise<boolean> }) {
  const { utiles, cliente } = useApp();
  const [utilId, setUtilId] = useState('');
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const util = utiles.find(u => u.id === utilId);
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError('');
    const form = evento.currentTarget;
    const datos = new FormData(form);
    const cantidades = ['bueno','deteriorado','vencido','inutilizable','comprometido'].map(k => Number(datos.get(k)));
    if (!util || !validarEvaluacion(util.stockActual, cantidades)) { setError('La suma debe coincidir con el stock contabilizado y las cantidades deben ser enteros positivos o cero.'); return; }
    const foto = datos.get('foto') as File;
    let evidencia: string | null = null;
    if (foto?.size) {
      if (!['image/jpeg','image/png','image/webp'].includes(foto.type) || foto.size > 5 * 1024 * 1024) { setError('Use una imagen JPG, PNG o WebP de hasta 5 MB.'); return; }
      setSubiendo(true);
      const ruta = `${crypto.randomUUID()}.${foto.type.split('/')[1]}`;
      const { error: fallo } = await cliente.storage.from('evidencias-anuales').upload(ruta, foto);
      setSubiendo(false);
      if (fallo) { setError(fallo.message); return; }
      evidencia = ruta;
    }
    const resultado = await guardar({ ...Object.fromEntries(datos), foto: undefined, util_id: util.id, contabilizado: util.stockActual, evidencia });
    if (resultado) form.reset();
  }
  return <form onSubmit={enviar} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-3">
    <label>Útil<select required className={campo} value={utilId} onChange={e => setUtilId(e.target.value)}><option value="">Seleccione un útil</option>{utiles.map(u => <option value={u.id} key={u.id}>{u.nombre} · {u.stockActual} unidades</option>)}</select></label>
    {['bueno','deteriorado','vencido','inutilizable','comprometido'].map(k => <label key={k} className="capitalize">{k}<input required className={campo} name={k} type="number" min="0" max={util?.stockActual ?? 0} defaultValue="0" /></label>)}
    <label>Observaciones<input name="observaciones" className={campo} /></label><label>Fotografía opcional<input name="foto" type="file" accept="image/jpeg,image/png,image/webp" className={campo} /></label>
    <label className="flex items-center gap-2"><input required type="checkbox" />Confirmo el conteo físico y las unidades comprometidas.</label>
    {error && <p role="alert" className="text-rose-700 md:col-span-3">{error}</p>}<button className={boton} disabled={ocupado || subiendo}>{subiendo ? 'Subiendo evidencia…' : 'Guardar evaluación física'}</button>
  </form>;
}

export default function ViewAniosEscolares({ soloPreparacion = false }: { soloPreparacion?: boolean }) {
  const { rolSesion } = useApp();
  const administrativo = !!rolSesion && puedeAbrir(rolSesion, 'anios_escolares');

  if (!administrativo && !(soloPreparacion && rolSesion === 'Secretaria')) {
    return <p role="alert" className="p-8 text-rose-700">No tiene permisos para gestionar años escolares.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50">
      <GestionRealAniosEscolares soloPreparacion={soloPreparacion || !administrativo} />
    </div>
  );
}
