import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { grados, operarAnio } from '../lib/aniosEscolares';

export default function AsignacionesAnuales({ anioId }: { anioId: string }) {
  const { cliente, usuarios, aniosEscolares } = useApp();
  const [grado, setGrado] = useState(grados[0]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [asignaciones, setAsignaciones] = useState<{ id: string; usuario_id: string; nivel: string; grado: string }[]>([]);
  useEffect(() => {
    let vigente = true;
    cliente.from('asignaciones_personal_anuales').select('*').eq('anio_id', anioId).then(({ data, error }) => {
      if (vigente) { setAsignaciones(data ?? []); if (error) setError(error.message); }
    });
    return () => { vigente = false; };
  }, [cliente, anioId, mensaje]);

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setMensaje(''); setOcupado(true);
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await operarAnio(cliente, 'asignar_personal', { ...datos, anio_id: anioId, grado, nivel: grados.indexOf(grado) < 3 ? 'Inicial' : 'Primaria' });
      setMensaje('Asignación guardada. Se aplicará al activar el año.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setOcupado(false); }
  }
  return <section className="space-y-3 rounded-2xl border bg-white p-5">
    <h2 className="font-bold">Asignaciones de profesoras y auxiliares</h2>
    {aniosEscolares.find(a => a.id === anioId)?.estado === 'En preparación' && <form className="flex flex-wrap items-end gap-3" onSubmit={guardar}>
      <label>Usuario<select name="usuario_id" required className="block rounded-xl border p-2"><option value="">Seleccione</option>{usuarios.filter(u => ['Profesora','Auxiliar'].includes(u.rol) && u.estado === 'Activo').map(u => <option key={u.id} value={u.id}>{u.nombre} · {u.rol}</option>)}</select></label>
      <label>Grado<select value={grado} onChange={e => setGrado(e.target.value)} className="block rounded-xl border p-2">{grados.map(g => <option key={g}>{g}</option>)}</select></label>
      <button disabled={ocupado} className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">Guardar asignación</button>
    </form>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}{mensaje && <p role="status" className="text-emerald-700">{mensaje}</p>}
    <ul className="text-sm">{asignaciones.map(a => <li key={a.id}>{usuarios.find(u => u.id === a.usuario_id)?.nombre ?? a.usuario_id} · {a.nivel} · {a.grado}</li>)}</ul>
  </section>;
}
