import { Estudiante, Apoderado, UtilEscolar, ListaUtil, Recepcion, Movimiento, Prediccion, Alerta, Usuario } from "../types";

export const INITIAL_STUDENTS: Estudiante[] = [
  {
    id: "E001",
    codigo: "EST-2026-001",
    nombres: "Mateo Sebastian",
    apellidos: "Mendoza Flores",
    grado: "3er Grado",
    nivel: "Primaria",
    apoderadoId: "A001",
    apoderadoNombre: "Carlos Alberto Mendoza Quispe",
    estado: "Activo"
  },
  {
    id: "E002",
    codigo: "EST-2026-002",
    nombres: "Luciana Valentina",
    apellidos: "Rodriguez Condori",
    grado: "5to Grado",
    nivel: "Primaria",
    apoderadoId: "A002",
    apoderadoNombre: "Sofía Maribel Condori Apaza",
    estado: "Activo"
  },
  {
    id: "E003",
    codigo: "EST-2026-003",
    nombres: "Santiago Andre",
    apellidos: "Sánchez Apaza",
    grado: "4 años",
    nivel: "Inicial",
    apoderadoId: "A003",
    apoderadoNombre: "Felipe Alberto Sánchez Vega",
    estado: "Activo"
  },
  {
    id: "E004",
    codigo: "EST-2026-004",
    nombres: "Camila Belen",
    apellidos: "Quispe Benites",
    grado: "5 años",
    nivel: "Inicial",
    apoderadoId: "A004",
    apoderadoNombre: "María Elena Flores Mamani",
    estado: "Activo"
  },
  {
    id: "E005",
    codigo: "EST-2026-005",
    nombres: "Thiago Nicolas",
    apellidos: "Flores Mendoza",
    grado: "2do Grado",
    nivel: "Primaria",
    apoderadoId: "A001",
    apoderadoNombre: "Carlos Alberto Mendoza Quispe",
    estado: "Activo"
  },
  {
    id: "E006",
    codigo: "EST-2026-006",
    nombres: "Flavia Jimena",
    apellidos: "Huaman Castro",
    grado: "4to Grado",
    nivel: "Primaria",
    apoderadoId: "A005",
    apoderadoNombre: "Patricia Castro Villalobos",
    estado: "Activo"
  },
  {
    id: "E007",
    codigo: "EST-2026-007",
    nombres: "Alvaro Joaquin",
    apellidos: "Diaz Lopez",
    grado: "6to Grado",
    nivel: "Primaria",
    apoderadoId: "A006",
    apoderadoNombre: "Juan Jose Diaz Ramos",
    estado: "Activo"
  }
];

export const INITIAL_GUARDIANS: Apoderado[] = [
  {
    id: "A001",
    nombres: "Carlos Alberto",
    apellidos: "Mendoza Quispe",
    dni: "45893021",
    telefono: "987654321",
    correo: "carlos.mendoza@gmail.com",
    direccion: "Av. Las Flores 450, San Juan de Lurigancho, Lima",
    estudiantesIds: ["E001", "E005"],
    estudiantesNombres: ["Mateo Sebastian Mendoza Flores", "Thiago Nicolas Flores Mendoza"]
  },
  {
    id: "A002",
    nombres: "Sofía Maribel",
    apellidos: "Condori Apaza",
    dni: "47291039",
    telefono: "945123789",
    correo: "sofia.condori@hotmail.com",
    direccion: "Jr. Puno 789, Cercado de Lima",
    estudiantesIds: ["E002"],
    estudiantesNombres: ["Luciana Valentina Rodriguez Condori"]
  },
  {
    id: "A003",
    nombres: "Felipe Alberto",
    apellidos: "Sánchez Vega",
    dni: "09483012",
    telefono: "912345678",
    correo: "felipe.sanchez@outlook.com",
    direccion: "Calle Los Cedros 123, Lince, Lima",
    estudiantesIds: ["E003"],
    estudiantesNombres: ["Santiago Andre Sánchez Apaza"]
  },
  {
    id: "A004",
    nombres: "María Elena",
    apellidos: "Flores Mamani",
    dni: "38920194",
    telefono: "998877665",
    correo: "maria.flores@gmail.com",
    direccion: "Av. Próceres de la Independencia 1120, SJL, Lima",
    estudiantesIds: ["E004"],
    estudiantesNombres: ["Camila Belen Quispe Benites"]
  },
  {
    id: "A005",
    nombres: "Patricia",
    apellidos: "Castro Villalobos",
    dni: "10293847",
    telefono: "933221100",
    correo: "patricia.castro@iepgenios.edu.pe",
    direccion: "Jr. de la Unión 340, San Borja, Lima",
    estudiantesIds: ["E006"],
    estudiantesNombres: ["Flavia Jimena Huaman Castro"]
  },
  {
    id: "A006",
    nombres: "Juan Jose",
    apellidos: "Diaz Ramos",
    dni: "20394857",
    telefono: "976543210",
    correo: "juan.diaz@gmail.com",
    direccion: "Av. Javier Prado Este 2500, San Borja, Lima",
    estudiantesIds: ["E007"],
    estudiantesNombres: ["Alvaro Joaquin Diaz Lopez"]
  }
];

export const INITIAL_SUPPLIES: UtilEscolar[] = [
  {
    id: "U001",
    codigo: "UTI-001",
    nombre: "Cuaderno cuadriculado A4 100 hojas (Loro)",
    categoria: "Cuadernos",
    unidadMedida: "Unidad",
    stockActual: 180,
    stockMinimo: 50,
    ubicación: "Estante A-1",
    estado: "Activo"
  },
  {
    id: "U002",
    codigo: "UTI-002",
    nombre: "Cuaderno triple renglón A4 100 hojas (Stanford)",
    categoria: "Cuadernos",
    unidadMedida: "Unidad",
    stockActual: 120,
    stockMinimo: 40,
    ubicación: "Estante A-2",
    estado: "Activo"
  },
  {
    id: "U003",
    codigo: "UTI-003",
    nombre: "Caja de colores de madera x 12 largo (Faber-Castell)",
    categoria: "Arte y Pintura",
    unidadMedida: "Caja",
    stockActual: 85,
    stockMinimo: 30,
    ubicación: "Estante B-1",
    estado: "Activo"
  },
  {
    id: "U004",
    codigo: "UTI-004",
    nombre: "Lapicero Trilux color Azul (Faber-Castell)",
    categoria: "Escritura",
    unidadMedida: "Unidad",
    stockActual: 320,
    stockMinimo: 100,
    ubicación: "Cajón Escritorio 1",
    estado: "Activo"
  },
  {
    id: "U005",
    codigo: "UTI-005",
    nombre: "Lapicero Trilux color Rojo (Faber-Castell)",
    categoria: "Escritura",
    unidadMedida: "Unidad",
    stockActual: 45,
    stockMinimo: 80, // Note: stock actual < stock minimo -> Trigger Stock Bajo
    ubicación: "Cajón Escritorio 1",
    estado: "Activo"
  },
  {
    id: "U006",
    codigo: "UTI-006",
    nombre: "Silicona líquida botella de 250ml (Artesco)",
    categoria: "Pegamentos",
    unidadMedida: "Unidad",
    stockActual: 15,
    stockMinimo: 25, // Note: stock actual < stock minimo -> Stock Bajo
    ubicación: "Estante C-1",
    estado: "Activo"
  },
  {
    id: "U007",
    codigo: "UTI-007",
    nombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)",
    categoria: "Papelería",
    unidadMedida: "Paquete",
    stockActual: 110,
    stockMinimo: 30,
    ubicación: "Estante C-2",
    estado: "Activo"
  },
  {
    id: "U008",
    codigo: "UTI-008",
    nombre: "Tijera escolar punta roma de 5'' (Artesco)",
    categoria: "Otros",
    unidadMedida: "Unidad",
    stockActual: 0,
    stockMinimo: 20, // Note: stock actual = 0 -> Sin Stock
    ubicación: "Estante B-3",
    estado: "Activo"
  },
  {
    id: "U009",
    codigo: "UTI-009",
    nombre: "Plumones delgados de colores x 12 (Artesco)",
    categoria: "Arte y Pintura",
    unidadMedida: "Caja",
    stockActual: 75,
    stockMinimo: 25,
    ubicación: "Estante B-2",
    estado: "Activo"
  },
  {
    id: "U010",
    codigo: "UTI-010",
    nombre: "Folder de plástico A4 color Azul",
    categoria: "Papelería",
    unidadMedida: "Unidad",
    stockActual: 240,
    stockMinimo: 60,
    ubicación: "Estante C-3",
    estado: "Activo"
  },
  {
    id: "U011",
    codigo: "UTI-011",
    nombre: "Plastilina escolar barra gigante x 10 colores",
    categoria: "Arte y Pintura",
    unidadMedida: "Caja",
    stockActual: 8,
    stockMinimo: 15, // Stock bajo
    ubicación: "Estante D-1",
    estado: "Activo"
  },
  {
    id: "U012",
    codigo: "UTI-012",
    nombre: "Goma escolar en barra 40g (UHU)",
    categoria: "Pegamentos",
    unidadMedida: "Unidad",
    stockActual: 135,
    stockMinimo: 35,
    ubicación: "Estante C-1",
    estado: "Activo"
  }
];

export const INITIAL_LISTS: ListaUtil[] = [
  {
    id: "L001",
    anioEscolar: "2026",
    nivel: "Inicial",
    grado: "5 años",
    items: [
      { utilId: "U002", utilNombre: "Cuaderno triple renglón A4 100 hojas (Stanford)", cantidadRequerida: 2 },
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadRequerida: 1 },
      { utilId: "U006", utilNombre: "Silicona líquida botella de 250ml (Artesco)", cantidadRequerida: 2 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadRequerida: 1 },
      { utilId: "U008", utilNombre: "Tijera escolar punta roma de 5'' (Artesco)", cantidadRequerida: 1 },
      { utilId: "U011", utilNombre: "Plastilina escolar barra gigante x 10 colores", cantidadRequerida: 2 }
    ]
  },
  {
    id: "L002",
    anioEscolar: "2026",
    nivel: "Primaria",
    grado: "2do Grado",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadRequerida: 6 },
      { utilId: "U002", utilNombre: "Cuaderno triple renglón A4 100 hojas (Stanford)", cantidadRequerida: 4 },
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadRequerida: 1 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadRequerida: 2 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadRequerida: 1 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadRequerida: 1 },
      { utilId: "U008", utilNombre: "Tijera escolar punta roma de 5'' (Artesco)", cantidadRequerida: 1 },
      { utilId: "U012", utilNombre: "Goma escolar en barra 40g (UHU)", cantidadRequerida: 2 }
    ]
  },
  {
    id: "L003",
    anioEscolar: "2026",
    nivel: "Primaria",
    grado: "3er Grado",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadRequerida: 8 },
      { utilId: "U002", utilNombre: "Cuaderno triple renglón A4 100 hojas (Stanford)", cantidadRequerida: 3 },
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadRequerida: 1 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadRequerida: 2 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadRequerida: 1 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadRequerida: 1 },
      { utilId: "U009", utilNombre: "Plumones delgados de colores x 12 (Artesco)", cantidadRequerida: 1 },
      { utilId: "U012", utilNombre: "Goma escolar en barra 40g (UHU)", cantidadRequerida: 1 }
    ]
  },
  {
    id: "L004",
    anioEscolar: "2026",
    nivel: "Inicial",
    grado: "4 años",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadRequerida: 10 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadRequerida: 4 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadRequerida: 2 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadRequerida: 1 },
      { utilId: "U010", utilNombre: "Folder de plástico A4 color Azul", cantidadRequerida: 3 },
      { utilId: "U012", utilNombre: "Goma escolar en barra 40g (UHU)", cantidadRequerida: 1 }
    ]
  }
];

export const INITIAL_RECEIPTS: Recepcion[] = [
  {
    id: "R001",
    estudianteId: "E001",
    estudianteNombre: "Mateo Sebastian Mendoza Flores",
    apoderadoId: "A001",
    apoderadoNombre: "Carlos Alberto Mendoza Quispe",
    grado: "3er Grado",
    nivel: "Primaria",
    fechaRecepcion: "2026-03-02",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadEsperada: 8, cantidadEntregada: 8 },
      { utilId: "U002", utilNombre: "Cuaderno triple renglón A4 100 hojas (Stanford)", cantidadEsperada: 3, cantidadEntregada: 3 },
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadEsperada: 2, cantidadEntregada: 2 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U009", utilNombre: "Plumones delgados de colores x 12 (Artesco)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U012", utilNombre: "Goma escolar en barra 40g (UHU)", cantidadEsperada: 1, cantidadEntregada: 1 }
    ],
    estado: "Completo",
    observaciones: "Entrega completa en perfecto estado.",
    recibidoPor: "Liliana Soto (Secretaria)"
  },
  {
    id: "R002",
    estudianteId: "E002",
    estudianteNombre: "Luciana Valentina Rodriguez Condori",
    apoderadoId: "A002",
    apoderadoNombre: "Sofía Maribel Condori Apaza",
    grado: "5to Grado",
    nivel: "Primaria",
    fechaRecepcion: "2026-03-05",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadEsperada: 8, cantidadEntregada: 5 }, // 3 missing
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadEsperada: 3, cantidadEntregada: 3 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadEsperada: 2, cantidadEntregada: 0 }, // 2 missing
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U010", utilNombre: "Folder de plástico A4 color Azul", cantidadEsperada: 2, cantidadEntregada: 2 }
    ],
    estado: "Incompleto",
    observaciones: "Faltan 3 cuadernos cuadriculados y 2 lapiceros rojos Faber-Castell. El apoderado se compromete a entregarlos la próxima semana.",
    recibidoPor: "Liliana Soto (Secretaria)"
  },
  {
    id: "R003",
    estudianteId: "E003",
    estudianteNombre: "Santiago Andre Sánchez Apaza",
    apoderadoId: "A003",
    apoderadoNombre: "Felipe Alberto Sánchez Vega",
    grado: "4 años",
    nivel: "Inicial",
    fechaRecepcion: "2026-03-10",
    items: [
      { utilId: "U001", utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)", cantidadEsperada: 10, cantidadEntregada: 0 },
      { utilId: "U004", utilNombre: "Lapicero Trilux color Azul (Faber-Castell)", cantidadEsperada: 4, cantidadEntregada: 0 },
      { utilId: "U005", utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)", cantidadEsperada: 2, cantidadEntregada: 0 },
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadEsperada: 1, cantidadEntregada: 0 },
      { utilId: "U010", utilNombre: "Folder de plástico A4 color Azul", cantidadEsperada: 3, cantidadEntregada: 0 },
      { utilId: "U012", utilNombre: "Goma escolar en barra 40g (UHU)", cantidadEsperada: 1, cantidadEntregada: 0 }
    ],
    estado: "Pendiente",
    observaciones: "Aún no ha realizado la entrega.",
    recibidoPor: "-"
  },
  {
    id: "R004",
    estudianteId: "E004",
    estudianteNombre: "Camila Belen Quispe Benites",
    apoderadoId: "A004",
    apoderadoNombre: "María Elena Flores Mamani",
    grado: "5 años",
    nivel: "Inicial",
    fechaRecepcion: "2026-03-03",
    items: [
      { utilId: "U002", utilNombre: "Cuaderno triple renglón A4 100 hojas (Stanford)", cantidadEsperada: 2, cantidadEntregada: 2 },
      { utilId: "U003", utilNombre: "Caja de colores de madera x 12 largo (Faber-Castell)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U006", utilNombre: "Silicona líquida botella de 250ml (Artesco)", cantidadEsperada: 2, cantidadEntregada: 1 }, // 1 missing
      { utilId: "U007", utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U008", utilNombre: "Tijera escolar punta roma de 5'' (Artesco)", cantidadEsperada: 1, cantidadEntregada: 1 },
      { utilId: "U011", utilNombre: "Plastilina escolar barra gigante x 10 colores", cantidadEsperada: 2, cantidadEntregada: 2 }
    ],
    estado: "Incompleto",
    observaciones: "Falta una silicona líquida.",
    recibidoPor: "Marisol Vargas (Directora)"
  }
];

export const INITIAL_MOVEMENTS: Movimiento[] = [
  {
    id: "M001",
    tipo: "Entrada",
    utilId: "U001",
    utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)",
    cantidad: 150,
    fecha: "2026-02-15 09:30",
    responsable: "Tomas Medina (Almacenero)",
    motivo: "Reabastecimiento de inicio de año",
    stockAnterior: 30,
    stockResultante: 180
  },
  {
    id: "M002",
    tipo: "Salida",
    utilId: "U001",
    utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)",
    cantidad: 8,
    fecha: "2026-03-02 11:15",
    responsable: "Liliana Soto (Secretaria)",
    motivo: "Entrega a estudiante Mateo Mendoza",
    stockAnterior: 180,
    stockResultante: 172
  },
  {
    id: "M003",
    tipo: "Salida",
    utilId: "U005",
    utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)",
    cantidad: 35,
    fecha: "2026-03-04 14:00",
    responsable: "Tomas Medina (Almacenero)",
    motivo: "Distribución a profesores para corrección de exámenes",
    stockAnterior: 80,
    stockResultante: 45
  },
  {
    id: "M004",
    tipo: "Entrada",
    utilId: "U004",
    utilNombre: "Lapicero Trilux color Azul (Faber-Castell)",
    cantidad: 200,
    fecha: "2026-02-18 10:00",
    responsable: "Tomas Medina (Almacenero)",
    motivo: "Donación de la Asociación de Apoderados",
    stockAnterior: 120,
    stockResultante: 320
  },
  {
    id: "M005",
    tipo: "Salida",
    utilId: "U008",
    utilNombre: "Tijera escolar punta roma de 5'' (Artesco)",
    cantidad: 20,
    fecha: "2026-03-10 08:30",
    responsable: "Tomas Medina (Almacenero)",
    motivo: "Uso pedagógico en aulas de nivel Inicial",
    stockAnterior: 20,
    stockResultante: 0
  },
  {
    id: "M006",
    tipo: "Entrada",
    utilId: "U007",
    utilNombre: "Paquete de Papel Bond A4 80g (Report - 500 hojas)",
    cantidad: 50,
    fecha: "2026-03-01 12:45",
    responsable: "Tomas Medina (Almacenero)",
    motivo: "Adquisición directa de útiles",
    stockAnterior: 60,
    stockResultante: 110
  }
];

export const INITIAL_PREDICTIONS: Prediccion[] = [
  {
    id: "P001",
    utilId: "U001",
    utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)",
    stockActual: 180,
    consumoHistorico: [45, 52, 60, 48, 72, 85], // Last 6 months (Jan-Jun)
    demandaEstimada: 95, // Next month
    stockProyectado: 85, // for August
    fechaProbableAgotamiento: "2026-10-12",
    cantidadRecomendadaReposicion: 150,
    nivelConfianza: 94
  },
  {
    id: "P002",
    utilId: "U005",
    utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)",
    stockActual: 45,
    consumoHistorico: [15, 12, 28, 30, 42, 35],
    demandaEstimada: 40,
    stockProyectado: 5,
    fechaProbableAgotamiento: "2026-08-01",
    cantidadRecomendadaReposicion: 100,
    nivelConfianza: 89
  },
  {
    id: "P003",
    utilId: "U006",
    utilNombre: "Silicona líquida botella de 250ml (Artesco)",
    stockActual: 15,
    consumoHistorico: [5, 8, 12, 10, 14, 18],
    demandaEstimada: 20,
    stockProyectado: -5,
    fechaProbableAgotamiento: "2026-07-28", // Very soon!
    cantidadRecomendadaReposicion: 50,
    nivelConfianza: 91
  },
  {
    id: "P004",
    utilId: "U008",
    utilNombre: "Tijera escolar punta roma de 5'' (Artesco)",
    stockActual: 0,
    consumoHistorico: [8, 10, 6, 12, 15, 18],
    demandaEstimada: 15,
    stockProyectado: -15,
    fechaProbableAgotamiento: "Agotado",
    cantidadRecomendadaReposicion: 40,
    nivelConfianza: 95
  },
  {
    id: "P005",
    utilId: "U011",
    utilNombre: "Plastilina escolar barra gigante x 10 colores",
    stockActual: 8,
    consumoHistorico: [4, 6, 8, 5, 11, 9],
    demandaEstimada: 12,
    stockProyectado: -4,
    fechaProbableAgotamiento: "2026-07-30",
    cantidadRecomendadaReposicion: 30,
    nivelConfianza: 86
  }
];

export const INITIAL_ALERTS: Alerta[] = [
  {
    id: "AL001",
    tipo: "stock_bajo",
    prioridad: "Alta",
    fecha: "2026-07-14",
    utilId: "U005",
    utilNombre: "Lapicero Trilux color Rojo (Faber-Castell)",
    descripcion: "El stock actual es de 45 unidades, lo cual es inferior al stock mínimo requerido de 80 unidades.",
    accionRecomendada: "Realizar una orden de reposición urgente por 100 unidades.",
    resuelta: false
  },
  {
    id: "AL002",
    tipo: "proximo_agotarse",
    prioridad: "Alta",
    fecha: "2026-07-15",
    utilId: "U006",
    utilNombre: "Silicona líquida botella de 250ml (Artesco)",
    descripcion: "La velocidad de consumo estimada indica que el producto se agotará por completo el 2026-07-28.",
    accionRecomendada: "Adquirir 50 botellas inmediatamente para cubrir la demanda estimada.",
    resuelta: false
  },
  {
    id: "AL003",
    tipo: "proximo_agotarse",
    prioridad: "Alta",
    fecha: "2026-07-10",
    utilId: "U008",
    utilNombre: "Tijera escolar punta roma de 5'' (Artesco)",
    descripcion: "El producto se encuentra actualmente SIN STOCK (0 unidades disponibles).",
    accionRecomendada: "Adquirir 40 unidades para habilitar el despacho a las aulas de Inicial.",
    resuelta: false
  },
  {
    id: "AL004",
    tipo: "incremento_consumo",
    prioridad: "Media",
    fecha: "2026-07-12",
    utilId: "U001",
    utilNombre: "Cuaderno cuadriculado A4 100 hojas (Loro)",
    descripcion: "Se detectó un incremento inusual del 25% en el consumo del último mes en comparación con el histórico.",
    accionRecomendada: "Monitorear la entrega de este cuaderno en Primaria y verificar justificaciones.",
    resuelta: false
  },
  {
    id: "AL005",
    tipo: "sin_movimiento",
    prioridad: "Baja",
    fecha: "2026-07-01",
    utilId: "U010",
    utilNombre: "Folder de plástico A4 color Azul",
    descripcion: "El producto no registra movimientos de salida en los últimos 45 días.",
    accionRecomendada: "Verificar si es requerido para las actividades del siguiente bimestre.",
    resuelta: false
  }
];

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
