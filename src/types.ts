/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Estudiante {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  grado: string; // e.g. "3 años", "1er Grado"
  nivel: "Primaria" | "Inicial";
  apoderadoId: string;
  apoderadoNombre: string;
  apoderadoSecundarioId?: string;
  apoderadoSecundarioNombre?: string;
  estado: "Activo" | "Inactivo";
}

export interface Apoderado {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  estudiantesIds: string[];
  estudiantesNombres: string[];
}

export interface UtilEscolar {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string; // e.g. "Cuadernos", "Escritura", "Papelería", "Arte", "Otros"
  unidadMedida: string; // e.g. "Unidad", "Caja", "Paquete", "Docena"
  stockActual: number;
  stockMinimo: number;
  ubicación: string; // e.g. "Estante A-1", "Caja 3"
  estado: "Activo" | "Inactivo";
}

export interface ListaUtil {
  id: string;
  anioEscolar: string; // e.g. "2026"
  nivel: "Inicial" | "Primaria";
  grado: string;
  items: {
    utilId: string;
    utilNombre: string;
    cantidadRequerida: number;
  }[];
}

export interface Recepcion {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  apoderadoId: string;
  apoderadoNombre: string;
  grado: string;
  nivel: string;
  fechaRecepcion: string;
  items: {
    utilId: string;
    utilNombre: string;
    cantidadEsperada: number;
    cantidadEntregada: number;
  }[];
  estado: "Completo" | "Incompleto" | "Pendiente";
  observaciones?: string;
  recibidoPor: string;
}

export interface ControlStockItem {
  utilId: string;
  nombre: string;
  categoria: string;
  stockInicial: number;
  entradas: number;
  salidas: number;
  stockActual: number;
  stockMinimo: number;
  estado: "Normal" | "Bajo" | "Sin stock";
}

export interface Movimiento {
  id: string;
  tipo: "Entrada" | "Salida";
  utilId: string;
  utilNombre: string;
  cantidad: number;
  fecha: string;
  responsable: string;
  motivo: string; // e.g. "Recepción inicial", "Uso pedagógico", "Pérdida", "Donación"
  stockAnterior: number;
  stockResultante: number;
}

export interface Prediccion {
  id: string;
  utilId: string;
  utilNombre: string;
  stockActual: number;
  consumoHistorico: number[]; // Last 6 months
  demandaEstimada: number; // Next month
  stockProyectado: number; // For end of year
  fechaProbableAgotamiento: string; // e.g. "2026-10-15"
  cantidadRecomendadaReposicion: number;
  nivelConfianza: number; // percentage, e.g. 95
}

export interface Alerta {
  id: string;
  tipo: "stock_bajo" | "proximo_agotarse" | "incremento_consumo" | "sin_movimiento" | "reposicion_recomendada";
  prioridad: "Alta" | "Media" | "Baja";
  fecha: string;
  utilId: string;
  utilNombre: string;
  descripcion: string;
  accionRecomendada: string;
  resuelta: boolean;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: "Administrador" | "Secretaria";
  permisos: string[];
  estado: "Activo" | "Inactivo";
  avatar: string;
}
