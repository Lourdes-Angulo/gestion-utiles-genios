import {useEffect,useState,type MouseEvent} from 'react';
import {LogOut,ShieldCheck,Home,Users,Package,ClipboardList,ClipboardCheck,BarChart3} from 'lucide-react';
import {DemoDataProvider} from './demo/demoContext';
import ViewInicio from './demo/ViewInicio';
import ViewEstudiantes from './demo/ViewEstudiantes';
import ViewUtiles from './demo/ViewUtiles';
import ViewListasUtiles from './demo/ViewListasUtiles';
import ViewRecepcion from './demo/ViewRecepcion';
import ViewControlStock from './demo/ViewControlStock';
import ViewMovimientos from './demo/ViewMovimientos';
import ViewPrediccion from './demo/ViewPrediccion';
import ViewAlertas from './demo/ViewAlertas';
import ViewReportes from './demo/ViewReportes';
import ViewUsuarios from './demo/ViewUsuarios';
import ViewAuditoria from './demo/ViewAuditoria';
import ViewMiPerfil from './demo/ViewMiPerfil';
const VISTAS=[['inicio','Inicio'],['estudiantes','Estudiantes'],['utiles','Útiles escolares'],['listas','Listas de útiles'],['recepcion','Recepción de útiles'],['control_stock','Control de stock'],['movimientos','Movimientos'],['prediccion','Predicción de stock'],['alertas','Alertas'],['reportes','Reportes'],['usuarios','Usuarios'],['auditoria','Auditoría'],['mi_perfil','Mi perfil']] as const;
type Vista=typeof VISTAS[number][0];
const ICONOS=[Home,Users,Package,ClipboardList,ClipboardCheck,BarChart3];
export default function DemoJaime({onLogout}:{onLogout:()=>void}) {
 const [vista,setVista]=useState<Vista>(()=>{const anterior=sessionStorage.getItem('sigue:demo:vista');return VISTAS.some(([id])=>id===anterior)?anterior as Vista:'inicio';});
 const [mensaje,setMensaje]=useState('');
 useEffect(()=>{sessionStorage.setItem('sigue:demo:vista',vista);setMensaje('');},[vista]);
 const denegar=(event:MouseEvent<HTMLElement>)=>{
  const boton=(event.target as HTMLElement).closest('button');if(!boton)return;
  const nombre=[boton.textContent,boton.getAttribute('title'),boton.getAttribute('aria-label')].join(' ').trim().toLowerCase();
  // La consulta, navegación y filtros siguen funcionando. Las acciones de escritura se rechazan ANTES de abrir sus formularios.
  const restringido=/registrar|nuevo |nueva |adicionar|crear|editar|modificar|eliminar|borrar|desactivar|activar|guardar|recepcionar|entrega|cambiar estado|añadir|agregar|quitar|restablecer|actualizar stock|resolver alerta|resetear/i.test(nombre);
  if(restringido){event.preventDefault();event.stopPropagation();setMensaje('No tienes permiso para realizar esta acción. La cuenta ING-0001 es de solo lectura.');}
 };
 const etiqueta=VISTAS.find(([id])=>id===vista)?.[1]??'Inicio';
 return <DemoDataProvider><div className="flex h-screen w-screen overflow-hidden bg-[#f0f4f8] font-sans text-slate-800">
  <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white"><div className="border-b border-slate-100 p-6"><h1 className="font-black text-emerald-700">GENIOS DEL MILLENNIUM</h1><p className="mt-1 text-xs text-slate-500">SIGUE · Gestión Inteligente</p><span className="mt-3 inline-flex rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">ING-0001 · Jaime · DEMO</span></div><p className="px-6 pt-6 pb-2 text-xs font-bold uppercase text-slate-400">Módulos del sistema</p><nav className="flex-1 space-y-1 overflow-y-auto p-3">{VISTAS.map(([id,nombre],i)=>{const Icon=ICONOS[i%ICONOS.length];return <button key={id} type="button" onClick={()=>setVista(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${vista===id?'bg-emerald-100 font-bold text-emerald-800':'hover:bg-slate-100'}`}><Icon size={18}/>{nombre}</button>;})}</nav><button type="button" onClick={onLogout} className="m-4 flex justify-center gap-2 rounded-xl bg-rose-50 p-3 font-semibold text-rose-700"><LogOut size={18}/> Cerrar sesión</button></aside>
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5"><div><p className="text-[10px] font-bold tracking-widest text-slate-400">I.E.P. GENIOS DEL MILLENNIUM · GESTIÓN ESCOLAR</p><h2 className="text-xl font-black">{vista==='inicio'?'Panel de Control General':etiqueta}</h2><p className="text-xs text-slate-400">Vista de Administrador · Datos de ejemplo</p></div><div className="flex gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800"><ShieldCheck size={16}/> Modo demostración</div></header>
  <main className="flex-1 overflow-y-auto" onClickCapture={denegar}>{mensaje&&<div role="alert" className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{mensaje}</div>}
  {vista==='inicio'&&<ViewInicio setVistaActiva={v=>setVista(VISTAS.some(([id])=>id===v)?v as Vista:'inicio')}/>}
  {vista==='estudiantes'&&<ViewEstudiantes/>}
  {vista==='utiles'&&<ViewUtiles/>}
  {vista==='listas'&&<ViewListasUtiles/>}
  {vista==='recepcion'&&<ViewRecepcion/>}
  {vista==='control_stock'&&<ViewControlStock/>}
  {vista==='movimientos'&&<ViewMovimientos/>}
  {vista==='prediccion'&&<ViewPrediccion/>}
  {vista==='alertas'&&<ViewAlertas/>}
  {vista==='reportes'&&<ViewReportes/>}
  {vista==='usuarios'&&<ViewUsuarios/>}
  {vista==='auditoria'&&<ViewAuditoria/>}
  {vista==='mi_perfil'&&<ViewMiPerfil/>}

  </main></div></div></DemoDataProvider>;
}
