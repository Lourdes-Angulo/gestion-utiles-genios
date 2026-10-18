import { createContext, useContext, type ReactNode } from 'react';
import type { Estudiante, UtilEscolar, ListaUtil, Recepcion, Movimiento, Alerta, Prediccion, Usuario } from '../../types';

const estudiantes: Estudiante[] = [
 {id:'demo-e1',codigo:'EST-DEMO-001',dni:'00000001',nombres:'Lucía',apellidos:'Ramírez (Ejemplo)',grado:'3 años',nivel:'Inicial',apoderadoId:'demo-p1',apoderadoNombre:'Tutor de ejemplo',estado:'Activo'},
 {id:'demo-e2',codigo:'EST-DEMO-002',dni:'00000002',nombres:'Mateo',apellidos:'Vega (Ejemplo)',grado:'4 años',nivel:'Inicial',apoderadoId:'demo-p2',apoderadoNombre:'Tutor de ejemplo',estado:'Activo'},
 {id:'demo-e3',codigo:'EST-DEMO-003',dni:'00000003',nombres:'Valentina',apellidos:'Pérez (Ejemplo)',grado:'5 años',nivel:'Inicial',apoderadoId:'demo-p3',apoderadoNombre:'Tutor de ejemplo',estado:'Activo'},
 {id:'demo-e4',codigo:'EST-DEMO-004',dni:'00000004',nombres:'Diego',apellidos:'Flores (Ejemplo)',grado:'1er Grado',nivel:'Primaria',apoderadoId:'demo-p4',apoderadoNombre:'Tutor de ejemplo',estado:'Activo'},
];
const utiles: UtilEscolar[] = [
 {id:'demo-u1',codigo:'UTI-DEMO-001',nombre:'Cuaderno A4 (Ejemplo)',categoria:'Cuadernos',unidadMedida:'Unidad',stockActual:25,stockMinimo:10,ubicación:'Estante A-3',estado:'Activo'},
 {id:'demo-u2',codigo:'UTI-DEMO-002',nombre:'Lápiz grafito (Ejemplo)',categoria:'Escritura',unidadMedida:'Unidad',stockActual:4,stockMinimo:10,ubicación:'C4',estado:'Activo'},
 {id:'demo-u3',codigo:'UTI-DEMO-003',nombre:'Tijera escolar (Ejemplo)',categoria:'Papelería',unidadMedida:'Unidad',stockActual:0,stockMinimo:5,ubicación:'B1',estado:'Activo'},
];
const listas: ListaUtil[] = [
 {id:'demo-l1',anioEscolar:'2026',nivel:'Inicial',grado:'3 años',items:[{utilId:'demo-u1',utilNombre:utiles[0].nombre,cantidadRequerida:1},{utilId:'demo-u2',utilNombre:utiles[1].nombre,cantidadRequerida:2}]},
 {id:'demo-l2',anioEscolar:'2026',nivel:'Inicial',grado:'4 años',items:[{utilId:'demo-u1',utilNombre:utiles[0].nombre,cantidadRequerida:2},{utilId:'demo-u3',utilNombre:utiles[2].nombre,cantidadRequerida:1}]},
];
const recepciones: Recepcion[] = [
 {id:'demo-r1',estudianteId:'demo-e1',estudianteNombre:'Lucía Ramírez (Ejemplo)',apoderadoId:'demo-p1',apoderadoNombre:'Tutor de ejemplo',grado:'3 años',nivel:'Inicial',fechaRecepcion:'2026-10-15',items:[{utilId:'demo-u1',utilNombre:utiles[0].nombre,cantidadEsperada:1,cantidadEntregada:1},{utilId:'demo-u2',utilNombre:utiles[1].nombre,cantidadEsperada:2,cantidadEntregada:2}],estado:'Completo',recibidoPor:'Usuario de ejemplo',entregadoPor:'Tutor de ejemplo',numeroEntregas:1},
 {id:'demo-r2',estudianteId:'demo-e2',estudianteNombre:'Mateo Vega (Ejemplo)',apoderadoId:'demo-p2',apoderadoNombre:'Tutor de ejemplo',grado:'4 años',nivel:'Inicial',fechaRecepcion:'2026-10-16',items:[{utilId:'demo-u1',utilNombre:utiles[0].nombre,cantidadEsperada:2,cantidadEntregada:1}],estado:'Incompleto',recibidoPor:'Usuario de ejemplo',entregadoPor:'Tutor de ejemplo',numeroEntregas:1},
];
const movimientos:Movimiento[]=[{id:'demo-m1',tipo:'Entrada',utilId:'demo-u1',utilNombre:utiles[0].nombre,cantidad:10,fecha:'2026-10-11',responsable:'Ejemplo',motivo:'Simulación',stockAnterior:15,stockResultante:25}];
const usuarioActivo={id:'demo-jaime',nombre:'Jaime',correo:'',rol:'Administrador',permisos:[],estado:'Activo',avatar:'J'} as Usuario;
const usuarios:Usuario[]=[usuarioActivo];
const negar=async ():Promise<never>=>{ throw new Error('No tienes permiso para realizar esta acción. Cuenta ING-0001 de solo lectura.'); };
const aviso=()=>{window.alert('No tienes permiso para realizar esta acción. Cuenta ING-0001 de solo lectura.');};
const demo={estudiantes,utiles,listas,recepciones,movimientos,predicciones:[] as Prediccion[],alertas:[{id:'demo-a1',utilId:'demo-u2',utilNombre:'Lápiz grafito (Ejemplo)',tipo:'stock_bajo',prioridad:'Alta',fecha:'2026-10-18',descripcion:'Stock por debajo del mínimo establecido.',accionRecomendada:'Evaluar reposición.',resuelta:false},{id:'demo-a2',utilId:'demo-u3',utilNombre:'Tijera escolar (Ejemplo)',tipo:'sin_movimiento',prioridad:'Baja',fecha:'2026-10-17',descripcion:'Sin movimientos recientes.',accionRecomendada:'Verificar inventario.',resuelta:true}] as Alerta[],usuarios,usuarioActivo,
 cambiarUsuarioActivo:aviso,registrarEstudiante:negar,editarEstudiante:negar,desactivarEstudiante:aviso,registrarUtil:negar,editarUtil:negar,desactivarUtil:aviso,guardarListaUtil:negar,eliminarListaUtil:aviso,registrarEntregaRecepcion:negar,registrarNuevaRecepcion:negar,registrarNuevoMovimiento:aviso,resolverAlerta:aviso,crearAlerta:aviso,
 configuracionColegio:{nombre:'I.E.P. Genios del Millennium (DEMO)',anioEscolar:'2026',direccion:'Dirección ficticia',telefono:'000000000',director:'Usuario de demostración'},actualizarConfiguracion:aviso};
const Context=createContext(demo);
export function DemoDataProvider({children}:{children:ReactNode}){return <Context.Provider value={demo}>{children}</Context.Provider>;}
export function useApp(): ReturnType<typeof import('../../context/AppContext')['useApp']>{return useContext(Context) as unknown as ReturnType<typeof import('../../context/AppContext')['useApp']>;}
export function useRolInstitucional(){return {rol:'Administrador' as string,nivelAsignado:null,aulaAsignada:null};}
