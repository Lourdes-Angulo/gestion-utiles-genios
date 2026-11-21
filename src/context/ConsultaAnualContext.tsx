import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AnioEscolar } from '../lib/aniosEscolares';
import { iniciarDemo, type DemoEstado } from '../lib/demoAniosEscolares';
import { cargarDemo, guardarModoConsulta } from '../lib/demoAniosStorage';
import type { RolSIGUE } from '../lib/permisosRoles';
import { periodosParaConsulta, resolverPeriodo, type PeriodoConsulta } from '../lib/consultaAnual';

type ConsultaAnual = {
  modo: 'real' | 'demo' | null;
  cambiarModo: (modo: 'real' | 'demo') => void;
  periodos: PeriodoConsulta[];
  seleccionado: PeriodoConsulta | null;
  seleccionar: (id: string) => void;
  demo: DemoEstado;
  setDemo: (estado: DemoEstado) => void;
  avisoDemo: string;
  errorPeriodos: string;
};
const Contexto = createContext<ConsultaAnual | null>(null);

export function ConsultaAnualProvider({ children, anios, rol, errorPeriodos }: {
  children: ReactNode; anios: AnioEscolar[]; rol: RolSIGUE | null; errorPeriodos: string;
}) {
  const [modo, setModo] = useState<'real' | 'demo' | null>(null);
  const [demo, setDemo] = useState(iniciarDemo);
  const [demoCargado, setDemoCargado] = useState(false);
  const [avisoDemo, setAvisoDemo] = useState('');
  const [seleccionReal, setSeleccionReal] = useState('');
  const [seleccionDemo, setSeleccionDemo] = useState('');
  const puedeDemo = rol === 'Administrador' || rol === 'Secretaria';
  const modoAutorizado = modo === 'demo' && !puedeDemo ? null : modo;
  const enDemo = modoAutorizado === 'demo';
  const periodos = periodosParaConsulta(modoAutorizado, demo, anios);
  const seleccionado = resolverPeriodo(periodos, enDemo ? seleccionDemo : seleccionReal);

  useEffect(() => {
    if (!puedeDemo || demoCargado) return;
    try {
      const guardado = cargarDemo(window.localStorage);
      setDemo(guardado.estado);
      setAvisoDemo(guardado.aviso);
      setModo(guardado.modo);
    } catch { setAvisoDemo('Almacenamiento local no disponible. Los avances permanecen en memoria.'); }
    setDemoCargado(true);
  }, [puedeDemo, demoCargado]);

  function cambiarModo(valor: 'real' | 'demo') {
    if (valor === 'demo' && !puedeDemo) return;
    let estadoDemo = demo;
    if (valor === 'demo' && !demoCargado) {
      try {
        const guardado = cargarDemo(window.localStorage);
        estadoDemo = guardado.estado;
        setDemo(guardado.estado); setAvisoDemo(guardado.aviso);
      } catch { setAvisoDemo('Almacenamiento local no disponible. Los avances permanecen en memoria.'); }
      setDemoCargado(true);
    }
    try { guardarModoConsulta(window.localStorage, valor, estadoDemo); }
    catch { setAvisoDemo('El navegador no permitió guardar la elección de modo. Se conserva durante esta sesión.'); }
    setModo(valor);
  }
  function seleccionar(id: string) {
    if (!periodos.some(p => p.id === id)) return;
    if (enDemo) setSeleccionDemo(id);
    else setSeleccionReal(id);
  }
  function actualizarDemo(siguiente: DemoEstado) {
    const nuevo = siguiente.anios.find(p => !demo.anios.some(a => a.anio === p.anio));
    const activo = siguiente.anios.find(p => p.estado === 'Activo');
    if (nuevo) setSeleccionDemo(String(nuevo.anio));
    else if (activo?.anio !== demo.anios.find(p => p.estado === 'Activo')?.anio) setSeleccionDemo(String(activo?.anio ?? ''));
    setDemo(siguiente);
  }
  return <Contexto.Provider value={{ modo: modoAutorizado, cambiarModo, periodos, seleccionado, seleccionar, demo, setDemo: actualizarDemo, avisoDemo, errorPeriodos: enDemo ? '' : errorPeriodos }}>{children}</Contexto.Provider>;
}

export function useConsultaAnual() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('La consulta anual requiere su proveedor.');
  return valor;
}
