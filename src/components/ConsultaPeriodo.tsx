import { useConsultaAnual } from '../context/ConsultaAnualContext';
import { ConsultaDemoPeriodo } from './DemoAniosEscolares';
import ReporteAnual from './ReporteAnual';
import { useApp } from '../context/AppContext';
import { useRolInstitucional } from '../lib/useRolInstitucional';

export default function ConsultaPeriodo({ vista }: { vista: string }) {
  const { modo, seleccionado, errorPeriodos } = useConsultaAnual();
  const { listas, utiles } = useApp();
  const { rol, nivelAsignado, aulaAsignada } = useRolInstitucional();
  if (modo === 'demo') return <ConsultaDemoPeriodo vista={vista} />;
  if (!seleccionado) return <p role="status" className="p-8 text-slate-600">{errorPeriodos || 'Consulta anual pendiente de integración. No hay períodos registrados disponibles.'}</p>;
  if (['inicio', 'utiles', 'prediccion'].includes(vista)) return <p role="status" className="p-8 text-slate-600">{seleccionado.anio} — {seleccionado.estado}. La consulta anual de este módulo está pendiente de integración.</p>;
  const listasAutorizadas = listas.filter(l => l.anioEscolar === String(seleccionado.anio)
    && (rol !== 'Profesora' || l.nivel === nivelAsignado && l.grado === aulaAsignada)
    && (rol !== 'Auxiliar' || l.nivel === nivelAsignado));
  return <div className="space-y-4 overflow-y-auto bg-slate-50 p-4 md:p-8">
    <p className="rounded-xl border bg-white p-4 text-sm text-slate-600">Modo real · {seleccionado.anio} — {seleccionado.estado} · Consulta anual de solo lectura</p>
    {vista === 'listas'
      ? <section className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="font-bold">Listas de {seleccionado.anio}</h2>
          {listasAutorizadas.map(l => <div key={l.id} className="rounded-xl border p-3 text-sm"><p className="font-semibold">{l.nivel} · {l.grado}</p>{l.items.map(i => <p key={i.utilId}>{utiles.find(u => u.id === i.utilId)?.nombre ?? i.utilId} · {i.cantidadRequerida}</p>)}</div>)}
          {!listasAutorizadas.length && <p>Sin listas autorizadas en este período.</p>}
        </section>
      : <ReporteAnual key={seleccionado.id} />}
  </div>;
}
