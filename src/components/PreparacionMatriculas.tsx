import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { grados, operarAnio, type Matricula } from '../lib/aniosEscolares';

export default function PreparacionMatriculas({ anioId }: { anioId?: string }) {
  const { cliente, aniosEscolares, estudiantes, recargarDatos, usuarioActivo } = useApp();
  const [seleccion, setSeleccion] = useState(anioId ?? '');
  const [estudianteId, setEstudianteId] = useState('');
  const [grado, setGrado] = useState(grados[0]);
  const [historial, setHistorial] = useState<Matricula[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const anio = aniosEscolares.find(a => a.id === (anioId ?? seleccion));
  const permitido = ['Administrador', 'Secretaria'].includes(usuarioActivo.rol);

  useEffect(() => {
    let vigente = true;
    cliente.from('matriculas').select('*').eq('estudiante_id', estudianteId).then(({ data, error }) => {
      if (!vigente) return;
      setHistorial((data ?? []) as Matricula[]);
      if (error) setError(error.message);
    });
    return () => { vigente = false; };
  }, [cliente, estudianteId, mensaje]);

  async function guardar(e: FormEvent) {
    e.preventDefault(); setError(''); setMensaje(''); setOcupado(true);
    try {
      await operarAnio(cliente, 'matricular', { anio_id: anio?.id, estudiante_id: estudianteId, grado, nivel: grados.indexOf(grado) < 3 ? 'Inicial' : 'Primaria' });
      setMensaje('Matrícula registrada. Las recepciones se registran durante el año activo.'); recargarDatos();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo matricular.'); }
    finally { setOcupado(false); }
  }

  if (!permitido) return null;
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
    <h2 className="font-bold text-slate-800">Matrículas e historial académico</h2>
    <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
      {!anioId && <label>Año escolar<select required className="block rounded-xl border p-2" value={seleccion} onChange={e => setSeleccion(e.target.value)}><option value="">Seleccione</option>{aniosEscolares.map(a => <option key={a.id} value={a.id}>{a.anio} · {a.estado}</option>)}</select></label>}
      <label>Estudiante<select required className="block max-w-full rounded-xl border p-2" value={estudianteId} onChange={e => { setEstudianteId(e.target.value); setError(''); }}><option value="">Seleccione</option>{estudiantes.map(e => <option key={e.id} value={e.id}>{e.apellidos}, {e.nombres} · {e.codigo}</option>)}</select></label>
      <label>Grado<select className="block rounded-xl border p-2" value={grado} onChange={e => setGrado(e.target.value)}>{grados.map(g => <option key={g}>{g}</option>)}</select></label>
      <button disabled={ocupado || !anio || anio.estado === 'Cerrado'} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Registrar matrícula</button>
    </form>
    {mensaje && <p role="status" className="text-sm text-emerald-700">{mensaje}</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {estudianteId && <ul className="space-y-1 text-sm">{historial.map(m => <li key={m.id}>{aniosEscolares.find(a => a.id === m.anio_id)?.anio} · {m.nivel} · {m.grado}</li>)}{historial.length === 0 && <li>Sin matrículas registradas.</li>}</ul>}
  </section>;
}
