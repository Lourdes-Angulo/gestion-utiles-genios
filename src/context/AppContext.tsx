/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Estudiante, Apoderado, UtilEscolar, ListaUtil, Recepcion, Movimiento, Prediccion, Alerta, Usuario } from "../types";
import { supabase } from "../lib/supabaseClient";
import {
  INITIAL_STUDENTS,
  INITIAL_GUARDIANS,
  INITIAL_SUPPLIES,
  INITIAL_LISTS,
  INITIAL_RECEIPTS,
  INITIAL_MOVEMENTS,
  INITIAL_PREDICTIONS,
  INITIAL_ALERTS,
  INITIAL_USERS
} from "../data/mockData";

interface AppContextType {
  estudiantes: Estudiante[];
  apoderados: Apoderado[];
  utiles: UtilEscolar[];
  listas: ListaUtil[];
  recepciones: Recepcion[];
  movimientos: Movimiento[];
  predicciones: Prediccion[];
  alertas: Alerta[];
  usuarios: Usuario[];
  usuarioActivo: Usuario;
  cambiarUsuarioActivo: (id: string) => void;

  // Acciones
  registrarEstudiante: (est: Omit<Estudiante, "id" | "codigo">) => void;
  editarEstudiante: (est: Estudiante) => void;
  desactivarEstudiante: (id: string) => void;

  registrarApoderado: (apod: Omit<Apoderado, "id">) => void;
  editarApoderado: (apod: Apoderado) => void;

  registrarUtil: (util: Omit<UtilEscolar, "id">) => void;
  editarUtil: (util: UtilEscolar) => void;
  desactivarUtil: (id: string) => void;

  guardarListaUtil: (lista: ListaUtil) => void;
  eliminarListaUtil: (id: string) => void;

  registrarEntregaRecepcion: (recepId: string, entregados: { [utilId: string]: number }, observaciones: string, recibidoPor: string) => void;
  registrarNuevaRecepcion: (recep: Omit<Recepcion, "id">) => void;

  registrarNuevoMovimiento: (mov: Omit<Movimiento, "id" | "fecha">) => void;
  resolverAlerta: (alertaId: string) => void;
  crearAlerta: (alerta: Omit<Alerta, "id" | "fecha" | "resuelta">) => void;

  configuracionColegio: {
    nombre: string;
    anioEscolar: string;
    direccion: string;
    telefono: string;
    director: string;
  };
  actualizarConfiguracion: (config: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(INITIAL_STUDENTS);
  const [apoderados, setApoderados] = useState<Apoderado[]>(INITIAL_GUARDIANS);
  const [utiles, setUtiles] = useState<UtilEscolar[]>(INITIAL_SUPPLIES);
  const [listas, setListas] = useState<ListaUtil[]>(INITIAL_LISTS);
  const [recepciones, setRecepciones] = useState<Recepcion[]>(INITIAL_RECEIPTS);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(INITIAL_MOVEMENTS);
  const [predicciones, setPredicciones] = useState<Prediccion[]>(INITIAL_PREDICTIONS);
  const [alertas, setAlertas] = useState<Alerta[]>(INITIAL_ALERTS);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USERS);
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario>(() => {
    const cachedId = typeof window !== "undefined" ? localStorage.getItem("sesion_colegio_usuario_id") : null;
    if (cachedId) {
      const user = INITIAL_USERS.find(u => u.id === cachedId);
      if (user) return user;
    }
    return INITIAL_USERS[0];
  });

  const [configuracionColegio, setConfiguracionColegio] = useState({
    nombre: "I.E.P. Genios del Millennium",
    anioEscolar: "2026",
    direccion: "Av. Próceres de la Independencia 1420, San Juan de Lurigancho, Lima, Perú",
    telefono: "(01) 458-9021",
    director: "Dra. Marisol Vargas Diaz"
  });

  // Al iniciar la app, carga los útiles desde Supabase (base de datos real)
  useEffect(() => {
    const cargarUtiles = async () => {
      const { data, error } = await supabase.from("utiles").select("*").order("id");
      if (error) {
        console.error("Error cargando útiles desde Supabase:", error.message);
        return;
      }
      if (data) setUtiles(data as UtilEscolar[]);
    };
    cargarUtiles();
  }, []);

  const cambiarUsuarioActivo = (id: string) => {
    const user = usuarios.find(u => u.id === id);
    if (user) setUsuarioActivo(user);
  };

  const registrarEstudiante = (est: Omit<Estudiante, "id" | "codigo">) => {
    const nuevoId = `E${String(estudiantes.length + 1).padStart(3, "0")}`;
    const nuevoCodigo = `EST-2026-${String(estudiantes.length + 1).padStart(3, "0")}`;
    const nuevoEst: Estudiante = {
      ...est,
      id: nuevoId,
      codigo: nuevoCodigo
    };

    // Add to students list
    setEstudiantes(prev => [...prev, nuevoEst]);

    // Link to guardian
    setApoderados(prev => prev.map(ap => {
      if (ap.id === est.apoderadoId) {
        return {
          ...ap,
          estudiantesIds: [...ap.estudiantesIds, nuevoId],
          estudiantesNombres: [...ap.estudiantesNombres, `${est.nombres} ${est.apellidos}`]
        };
      }
      return ap;
    }));

    // Generate pending reception for the student if list exists
    const listaGrado = listas.find(l => l.grado === est.grado);
    if (listaGrado) {
      const nuevaRecepcion: Recepcion = {
        id: `R${String(recepciones.length + 1).padStart(3, "0")}`,
        estudianteId: nuevoId,
        estudianteNombre: `${est.nombres} ${est.apellidos}`,
        apoderadoId: est.apoderadoId,
        apoderadoNombre: est.apoderadoNombre,
        grado: est.grado,
        nivel: est.nivel,
        fechaRecepcion: "-",
        items: listaGrado.items.map(it => ({
          utilId: it.utilId,
          utilNombre: it.utilNombre,
          cantidadEsperada: it.cantidadRequerida,
          cantidadEntregada: 0
        })),
        estado: "Pendiente",
        recibidoPor: "-"
      };
      setRecepciones(prev => [...prev, nuevaRecepcion]);
    }
  };

  const editarEstudiante = (est: Estudiante) => {
    setEstudiantes(prev => prev.map(e => e.id === est.id ? est : e));
    // Update guardian cache if changed
    setApoderados(prev => prev.map(ap => {
      if (ap.id === est.apoderadoId) {
        const index = ap.estudiantesIds.indexOf(est.id);
        if (index === -1) {
          return {
            ...ap,
            estudiantesIds: [...ap.estudiantesIds, est.id],
            estudiantesNombres: [...ap.estudiantesNombres, `${est.nombres} ${est.apellidos}`]
          };
        } else {
          const updatedNombres = [...ap.estudiantesNombres];
          updatedNombres[index] = `${est.nombres} ${est.apellidos}`;
          return {
            ...ap,
            estudiantesNombres: updatedNombres
          };
        }
      }
      return ap;
    }));
  };

  const desactivarEstudiante = (id: string) => {
    setEstudiantes(prev => prev.map(e => e.id === id ? { ...e, estado: e.estado === "Activo" ? "Inactivo" : "Activo" } : e));
  };

  const registrarApoderado = (apod: Omit<Apoderado, "id">) => {
    const nuevoId = `A${String(apoderados.length + 1).padStart(3, "0")}`;
    const nuevoApod: Apoderado = {
      ...apod,
      id: nuevoId
    };
    setApoderados(prev => [...prev, nuevoApod]);
  };

  const editarApoderado = (apod: Apoderado) => {
    setApoderados(prev => prev.map(a => a.id === apod.id ? apod : a));
    // Sync with students
    setEstudiantes(prev => prev.map(e => {
      if (e.apoderadoId === apod.id) {
        return {
          ...e,
          apoderadoNombre: `${apod.nombres} ${apod.apellidos}`
        };
      }
      return e;
    }));
  };

  const registrarUtil = async (util: Omit<UtilEscolar, "id">) => {
    const nuevoId = `U${String(utiles.length + 1).padStart(3, "0")}`;
    const nuevoUtil: UtilEscolar = {
      ...util,
      id: nuevoId
    };

    // Guarda el nuevo útil en Supabase
    const { error } = await supabase.from("utiles").insert(nuevoUtil);
    if (error) {
      console.error("Error registrando útil:", error.message);
      alert("No se pudo guardar el útil en la base de datos: " + error.message);
      return;
    }

    setUtiles(prev => [...prev, nuevoUtil]);

    // Create automatic prediction entry
    const nuevaPred: Prediccion = {
      id: `P${String(predicciones.length + 1).padStart(3, "0")}`,
      utilId: nuevoId,
      utilNombre: util.nombre,
      stockActual: util.stockActual,
      consumoHistorico: [10, 15, 12, 18, 22, 25],
      demandaEstimada: Math.round(util.stockMinimo * 1.2),
      stockProyectado: util.stockActual - Math.round(util.stockMinimo * 0.8),
      fechaProbableAgotamiento: "2026-11-20",
      cantidadRecomendadaReposicion: util.stockMinimo * 2,
      nivelConfianza: 85
    };
    setPredicciones(prev => [...prev, nuevaPred]);

    // Check stock level for alerts
    if (util.stockActual <= util.stockMinimo) {
      crearAlerta({
        tipo: util.stockActual === 0 ? "proximo_agotarse" : "stock_bajo",
        prioridad: util.stockActual === 0 ? "Alta" : "Media",
        utilId: nuevoId,
        utilNombre: util.nombre,
        descripcion: util.stockActual === 0
          ? "El producto se encuentra sin stock."
          : `Stock actual (${util.stockActual}) menor al stock mínimo (${util.stockMinimo}).`,
        accionRecomendada: `Adquirir al menos ${util.stockMinimo * 2} unidades.`
      });
    }
  };

  const editarUtil = async (util: UtilEscolar) => {
    // Actualiza el útil en Supabase
    const { error } = await supabase.from("utiles").update(util).eq("id", util.id);
    if (error) {
      console.error("Error editando útil:", error.message);
      alert("No se pudo actualizar el útil en la base de datos: " + error.message);
      return;
    }

    setUtiles(prev => prev.map(u => u.id === util.id ? util : u));

    // Check stock level for alerts
    if (util.stockActual <= util.stockMinimo) {
      const existeAlerta = alertas.find(al => al.utilId === util.id && !al.resuelta);
      if (!existeAlerta) {
        crearAlerta({
          tipo: util.stockActual === 0 ? "proximo_agotarse" : "stock_bajo",
          prioridad: "Alta",
          utilId: util.id,
          utilNombre: util.nombre,
          descripcion: util.stockActual === 0
            ? "El producto se encuentra sin stock."
            : `Stock actual (${util.stockActual}) menor al stock mínimo (${util.stockMinimo}).`,
          accionRecomendada: `Adquirir al menos ${util.stockMinimo * 2} unidades.`
        });
      }
    }
  };

  const desactivarUtil = async (id: string) => {
    const target = utiles.find(u => u.id === id);
    if (!target) return;
    const nuevoEstado = target.estado === "Activo" ? "Inactivo" : "Activo";

    // Actualiza el estado en Supabase
    const { error } = await supabase.from("utiles").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      console.error("Error cambiando estado del útil:", error.message);
      alert("No se pudo cambiar el estado del útil: " + error.message);
      return;
    }

    setUtiles(prev => prev.map(u => u.id === id ? { ...u, estado: nuevoEstado } : u));
  };

  const guardarListaUtil = (lista: ListaUtil) => {
    const existe = listas.find(l => l.grado === lista.grado && l.nivel === lista.nivel);
    if (existe) {
      setListas(prev => prev.map(l => l.id === existe.id ? { ...lista, id: existe.id } : l));
    } else {
      const nuevoId = `L${String(listas.length + 1).padStart(3, "0")}`;
      setListas(prev => [...prev, { ...lista, id: nuevoId }]);
    }
  };

  const eliminarListaUtil = (id: string) => {
    setListas(prev => prev.filter(l => l.id !== id));
  };

  const registrarEntregaRecepcion = (
    recepId: string,
    entregados: { [utilId: string]: number },
    observaciones: string,
    recibidoPor: string
  ) => {
    const hoyStr = new Date().toISOString().split("T")[0];

    setRecepciones(prev => prev.map(rc => {
      if (rc.id !== recepId) return rc;

      const nuevosItems = rc.items.map(item => {
        const entregadoAhora = entregados[item.utilId] ?? item.cantidadEntregada;
        return {
          ...item,
          cantidadEntregada: entregadoAhora
        };
      });

      // Determine state
      const completo = nuevosItems.every(it => it.cantidadEntregada >= it.cantidadEsperada);
      const vacio = nuevosItems.every(it => it.cantidadEntregada === 0);
      const estado = completo ? "Completo" : (vacio ? "Pendiente" : "Incompleto");

      // Add inventory movements for the newly received supplies!
      nuevosItems.forEach(item => {
        const anteriorEntregado = rc.items.find(it => it.utilId === item.utilId)?.cantidadEntregada ?? 0;
        const diferencia = item.cantidadEntregada - anteriorEntregado;
        if (diferencia > 0) {
          // Find supply
          const utilObj = utiles.find(u => u.id === item.utilId);
          if (utilObj) {
            const stockAnt = utilObj.stockActual;
            const stockRes = stockAnt + diferencia;

            // Update stock
            setUtiles(uPrev => uPrev.map(u => u.id === item.utilId ? { ...u, stockActual: stockRes } : u));

            // Log Movement
            const nuevoMov: Movimiento = {
              id: `M${String(movimientos.length + Math.random()).substring(2, 6)}`,
              tipo: "Entrada",
              utilId: item.utilId,
              utilNombre: item.utilNombre,
              cantidad: diferencia,
              fecha: `${hoyStr} ${new Date().toTimeString().split(" ")[0].substring(0, 5)}`,
              responsable: recibidoPor,
              motivo: `Entrega de útiles - Estudiante ${rc.estudianteNombre}`,
              stockAnterior: stockAnt,
              stockResultante: stockRes
            };
            setMovimientos(mPrev => [nuevoMov, ...mPrev]);
          }
        }
      });

      return {
        ...rc,
        items: nuevosItems,
        estado,
        observaciones,
        fechaRecepcion: hoyStr,
        recibidoPor
      };
    }));
  };

  const registrarNuevaRecepcion = (recep: Omit<Recepcion, "id">) => {
    const nuevoId = `R${String(recepciones.length + 1).padStart(3, "0")}`;
    const nuevaRecep: Recepcion = {
      ...recep,
      id: nuevoId
    };
    setRecepciones(prev => [nuevaRecep, ...prev]);
  };

  const registrarNuevoMovimiento = (mov: Omit<Movimiento, "id" | "fecha">) => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const horaStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
    const nuevoId = `M${String(movimientos.length + 1).padStart(3, "0")}`;

    // Update supply stock
    setUtiles(prev => prev.map(u => {
      if (u.id === mov.utilId) {
        return {
          ...u,
          stockActual: mov.stockResultante
        };
      }
      return u;
    }));

    const nuevoMov: Movimiento = {
      ...mov,
      id: nuevoId,
      fecha: `${hoyStr} ${horaStr}`
    };

    setMovimientos(prev => [nuevoMov, ...prev]);
  };

  const resolverAlerta = (alertaId: string) => {
    setAlertas(prev => prev.map(al => al.id === alertaId ? { ...al, resuelta: true } : al));
  };

  const crearAlerta = (al: Omit<Alerta, "id" | "fecha" | "resuelta">) => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const nuevoId = `AL${String(alertas.length + 1).padStart(3, "0")}`;
    const nuevaAlerta: Alerta = {
      ...al,
      id: nuevoId,
      fecha: hoyStr,
      resuelta: false
    };
    setAlertas(prev => [nuevaAlerta, ...prev]);
  };

  const actualizarConfiguracion = (config: any) => {
    setConfiguracionColegio(prev => ({ ...prev, ...config }));
  };

  return (
    <AppContext.Provider
      value={{
        estudiantes,
        apoderados,
        utiles,
        listas,
        recepciones,
        movimientos,
        predicciones,
        alertas,
        usuarios,
        usuarioActivo,
        cambiarUsuarioActivo,

        registrarEstudiante,
        editarEstudiante,
        desactivarEstudiante,

        registrarApoderado,
        editarApoderado,

        registrarUtil,
        editarUtil,
        desactivarUtil,

        guardarListaUtil,
        eliminarListaUtil,

        registrarEntregaRecepcion,
        registrarNuevaRecepcion,

        registrarNuevoMovimiento,
        resolverAlerta,
        crearAlerta,

        configuracionColegio,
        actualizarConfiguracion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};