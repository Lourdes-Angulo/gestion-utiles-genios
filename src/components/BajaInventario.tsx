import { useRef, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { operarAnio } from '../lib/aniosEscolares';

export default function BajaInventario() {
  const { cliente, utiles, aniosEscolares, usuarioActivo, recargarDatos } = useApp();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const operacion = useRef(crypto.randomUUID());
  const evidenciaSubida = useRef<string | null>(null);
  const activo = aniosEscolares.find(a => a.estado === 'Activo');
  if (usuarioActivo.rol !== 'Administrador' || !activo) return null;

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setError(''); setMensaje('');
    if (!window.confirm('¿Autorizar esta baja y descontar las unidades del inventario disponible?')) return;
    setOcupado(true);
    const datos = new FormData(evento.currentTarget);
    try {
      let evidencia: string | null = evidenciaSubida.current;
      const foto = datos.get('foto') as File;
      if (foto?.size && !evidencia) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || foto.size > 5 * 1024 * 1024) throw new Error('Use JPG, PNG o WebP de hasta 5 MB.');
        evidencia = `${crypto.randomUUID()}.${foto.type.split('/')[1]}`;
        const { error } = await cliente.storage.from('evidencias-anuales').upload(evidencia, foto);
        if (error) throw error;
        evidenciaSubida.current = evidencia;
      }
      await operarAnio(cliente, 'baja', { ...Object.fromEntries(datos), foto: undefined, anio_id: activo.id, operacion_id: operacion.current, evidencia });
      operacion.current = crypto.randomUUID(); evidenciaSubida.current = null; setAbierto(false); setMensaje('Baja autorizada y registrada.'); recargarDatos();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la baja.'); }
    finally { setOcupado(false); }
  }

  return <section className="space-y-3 rounded-2xl border bg-white p-4">
    <button className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" onClick={() => setAbierto(!abierto)}>Baja de inventario</button>
    {mensaje && <p role="status" className="text-emerald-700">{mensaje}</p>}{error && <p role="alert" className="text-rose-700">{error}</p>}
    {abierto && <form onSubmit={guardar} className="grid gap-3 text-sm md:grid-cols-3">
      <label>Útil<select name="util_id" required className="block w-full rounded-xl border p-2"><option value="">Seleccione</option>{utiles.map(u => <option key={u.id} value={u.id}>{u.nombre} · {u.stockActual} disponibles</option>)}</select></label>
      <label>Cantidad<input name="cantidad" required type="number" min="1" className="block w-full rounded-xl border p-2" /></label>
      <label>Motivo<select name="motivo" className="block w-full rounded-xl border p-2">{['Deterioro','Vencimiento','Rotura','Pérdida','Otro'].map(m => <option key={m}>{m}</option>)}</select></label>
      <label>Observaciones<input name="observaciones" required className="block w-full rounded-xl border p-2" /></label>
      <label>Fotografía opcional<input type="file" name="foto" accept="image/jpeg,image/png,image/webp" /></label>
      <button disabled={ocupado} className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Autorizar y registrar baja</button>
    </form>}
  </section>;
}
