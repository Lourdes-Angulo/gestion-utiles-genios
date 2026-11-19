import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function EvidenciaAnual({ ruta }: { ruta?: string | null }) {
  const { cliente } = useApp();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  if (!ruta) return null;
  async function mostrar() {
    setError('');
    const { data, error } = await cliente.storage.from('evidencias-anuales').createSignedUrl(ruta, 300);
    if (error) { setError(error.message); return; }
    setUrl(data.signedUrl);
  }
  return <div><button type="button" className="text-sm text-emerald-700 underline" onClick={() => url ? setUrl('') : void mostrar()}>{url ? 'Ocultar fotografía' : 'Ver fotografía'}</button>{url && <img src={url} alt="Evidencia de la evaluación física del inventario" className="mt-2 max-h-64 max-w-full rounded-xl object-contain" />}{error && <p role="alert" className="text-rose-700">{error}</p>}</div>;
}
