import { Estudiante, Apoderado, UtilEscolar, ListaUtil, Recepcion, Movimiento, Prediccion, Alerta, Usuario } from "../types";

// Datos vaciados: el sistema arranca sin registros reales.
// Se conservan únicamente los 2 usuarios de prueba para poder iniciar sesión.

export const INITIAL_STUDENTS: Estudiante[] = [];

export const INITIAL_GUARDIANS: Apoderado[] = [];

export const INITIAL_SUPPLIES: UtilEscolar[] = [];

export const INITIAL_LISTS: ListaUtil[] = [];

export const INITIAL_RECEIPTS: Recepcion[] = [];

export const INITIAL_MOVEMENTS: Movimiento[] = [];

export const INITIAL_PREDICTIONS: Prediccion[] = [];

export const INITIAL_ALERTS: Alerta[] = [];

export const INITIAL_USERS: Usuario[] = [
  {
    id: "U_ADMIN",
    nombre: "Ing. Alejandro Mendoza",
    correo: "Admin1@ejemplo.com",
    rol: "Administrador",
    permisos: [
      "Ver todo",
      "Registrar estudiantes",
      "Editar estudiantes",
      "Registrar apoderados",
      "Gestionar útiles",
      "Crear listas de útiles",
      "Registrar recepción",
      "Control de stock",
      "Ver predicciones",
      "Gestionar alertas",
      "Exportar reportes",
      "Configurar sistema",
      "Gestionar usuarios"
    ],
    estado: "Activo",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
  },
  {
    id: "U_SECRETARIA",
    nombre: "Sra. Liliana Soto Lopez",
    correo: "secretaria@ejemplo.com",
    rol: "Secretaria",
    permisos: [
      "Ver todo",
      "Registrar estudiantes",
      "Registrar apoderados",
      "Registrar recepción",
      "Imprimir constancias",
      "Control de stock",
      "Gestionar útiles"
    ],
    estado: "Activo",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80"
  }
];