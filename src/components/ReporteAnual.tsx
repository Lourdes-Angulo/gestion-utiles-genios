import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useConsultaAnual } from '../context/ConsultaAnualContext';
import type { Movimiento, Recepcion } from '../types';
import type { Matricula } from '../lib/aniosEscolares';

type Saldo = { id: string; util_id: string; saldo_apertura: number; evaluacion: { contabilizado: number; bueno: number; deteriorado: number; vencido: number; inutilizable: number } };

export default function ReporteAnual() {
  const { cliente, aniosEscolares, estudiantes, utiles } = useApp();
  const { modo, seleccionado, seleccionar: setSeleccion } = useConsultaAnual();
  const seleccion = seleccionado?.id ?? '';
  const [datos, setDatos] = useState<{ matriculas: Matricula[]; recepciones: Recepcion[]; movimientos: Movimiento[]; saldos: Saldo[] }>({ matriculas: [], recepciones: [], movimientos: [], saldos: [] });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [anioDatos, setAnioDatos] = useState('');

  useEffect(() => {
    let vigente = true;
    if (modo === 'demo' || !aniosEscolares.some(a => a.id === seleccion)) return;
    setCargando(true); setError('');
    async function cargar() {
      const sinPeriodo = seleccion === 'sin_periodo';
      const resultados = await Promise.all([
        sinPeriodo ? Promise.resolve({ data: [], error: null }) : cliente.from('matriculas').select('*').eq('anio_id', seleccion),
        sinPeriodo ? cliente.from('recepciones').select('*').is('anio_id', null) : cliente.from('recepciones').select('*').eq('anio_id', seleccion),
        sinPeriodo ? cliente.from('movimientos').select('*').is('anio_id', null) : cliente.from('movimientos').select('*').eq('anio_id', seleccion),
        sinPeriodo ? Promise.resolve({ data: null, error: null }) : cliente.from('cierres_anuales').select('id').eq('anio_id', seleccion).maybeSingle(),
      ]);
      const fallo = resultados.find(r => r.error);
      if (fallo?.error) throw new Error(fallo.error.message);
      const cierre = resultados[3].data as { id: string } | null;
      const { data: saldos, error } = cierre ? await cliente.from('detalle_cierre_stock').select('*').eq('cierre_id', cierre.id) : { data: [], error: null };
      if (error) throw error;
      if (vigente) {
        setDatos({ matriculas: resultados[0].data as Matricula[], recepciones: resultados[1].data as Recepcion[], movimientos: resultados[2].data as Movimiento[], saldos: saldos as Saldo[] });
        setAnioDatos(seleccion);
      }
    }
    cargar().catch(e => { if (vigente) setError(e.message); }).finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [cliente, seleccion, modo, aniosEscolares]);

  if (!aniosEscolares.length) return null;
  const anio = aniosEscolares.find(a => a.id === seleccion);
  const filas = datos.matriculas.map(m => {
    const estudiante = estudiantes.find(e => e.id === m.estudiante_id);
    const recepcion = datos.recepciones.find(r => (r as Recepcion & { matricula_id?: string }).matricula_id === m.id);
    return [String(anio?.anio), `${estudiante?.apellidos ?? ''} ${estudiante?.nombres ?? m.estudiante_id}`.trim(), m.nivel, m.grado, recepcion?.estado ?? 'Pendiente'];
  });
  function descargar() {
    const csv = [['Año','Estudiante','Nivel','Grado','Recepción'], ...filas].map(f => f.map(c => {
      const seguro = /^[=+@\-\t\r]/.test(c) ? `'${c}` : c;
      return `"${seguro.replaceAll('"', '""')}"`;
    }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a'); enlace.href = url; enlace.download = `Matriculas-${anio?.anio}.csv`; enlace.click(); URL.revokeObjectURL(url);
  }
  return <section className="space-y-4 rounded-2xl border bg-white p-5">
    <label className="font-semibold text-slate-800">Consulta por año escolar<select className="ml-3 rounded-xl border p-2 text-sm" value={seleccion} onChange={e => setSeleccion(e.target.value)}>{aniosEscolares.map(a => <option key={a.id} value={a.id}>{a.anio} · {a.estado}</option>)}</select></label>
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {cargando && <p>Cargando reporte anual…</p>}
    {seleccion && anioDatos === seleccion && modo !== 'demo' && !cargando && !error && <>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Año','Estudiante','Nivel','Grado','Recepción'].map(t => <th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{filas.map((f, i) => <tr className="border-t" key={datos.matriculas[i].id}>{f.map((v, j) => <td className="p-2" key={j}>{v}</td>)}</tr>)}</tbody></table></div>
      <button className="rounded-xl border px-4 py-2 text-sm text-emerald-800" onClick={descargar}>Descargar matrículas CSV</button>
      {datos.saldos.length > 0 && <><h3 className="font-semibold">Inventario al cierre de {anio?.anio}</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Útil','Contabilizado','Apto / apertura','Deteriorado','Vencido','Inutilizable'].map(t => <th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{datos.saldos.map(s => <tr className="border-t" key={s.id}><td className="p-2">{utiles.find(u => u.id === s.util_id)?.nombre ?? s.util_id}</td>{[s.evaluacion.contabilizado,s.saldo_apertura,s.evaluacion.deteriorado,s.evaluacion.vencido,s.evaluacion.inutilizable].map((n, i) => <td className="p-2" key={i}>{n}</td>)}</tr>)}</tbody></table></div></>}
      <details><summary className="cursor-pointer font-semibold">Recepciones registradas · {datos.recepciones.length}</summary><ul className="mt-2 space-y-1 text-sm">{datos.recepciones.map(r => <li key={r.id}>{r.fechaRecepcion} · {r.estudianteNombre} · {r.estado} · {r.id}</li>)}</ul></details>
      <details><summary className="cursor-pointer font-semibold">Movimientos del período seleccionado · {datos.movimientos.length}</summary><ul className="mt-2 space-y-1 text-sm">{datos.movimientos.map(m => <li key={m.id}>{m.fecha} · {m.utilNombre} · {m.tipo} {m.cantidad} · {m.motivo} · {m.id}</li>)}</ul></details>
    </>}
  </section>;
}
