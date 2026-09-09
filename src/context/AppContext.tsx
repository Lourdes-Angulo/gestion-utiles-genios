/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Estudiante, UtilEscolar, ListaUtil, Recepcion, Movimiento, Prediccion, Alerta, Usuario } from "../types";
import { supabase } from "../lib/supabaseClient";
import {
  INITIAL_STUDENTS,
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

  registrarUtil: (util: Omit<UtilEscolar, "id">) => void;
  editarUtil: (util: UtilEscolar) => void;
  desactivarUtil: (id: string) => void;

  guardarListaUtil: (lista: ListaUtil) => void;
  eliminarListaUtil: (id: string) => void;

  registrarEntregaRecepcion: (recepId: string, entregados: { [utilId: string]: number }, observaciones: string, recibidoPor: string) => void;
  registrarNuevaRecepcion: (recep: Omit<Recepcion, "id">) => Promise<Recepcion | null>;

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
  const [utiles, setUtiles] = useState<UtilEscolar[]>(INITIAL_SUPPLIES);
  const [listas, setListas] = useState<ListaUtil[]>(INITIAL_LISTS);
  const [recepciones, setRecepciones] = useState<Recepcion[]>(INITIAL_RECEIPTS);
  const [movimientos, setMovimientos] = useState<Movimiento[]>(INITIAL_MOVEMENTS);
  const [predicciones, setPredicciones] = useState<Prediccion[]>(INITIAL_PREDICTIONS);
  const [alertas, setAlertas] = useState<Alerta[]>(INITIAL_ALERTS);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USERS);
  const [datosListos, setDatosListos] = useState(false);
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

  // Al iniciar la app, carga los datos desde Supabase (base de datos real)
  useEffect(() => {
    const cargarDatos = async () => {
      // Útiles
      const { data: utilesData, error: utilesError } = await supabase.from("utiles").select("*").order("id");
      if (utilesError) {
        console.error("Error cargando útiles desde Supabase:", utilesError.message);
      } else if (utilesData) {
        setUtiles(utilesData as UtilEscolar[]);
      }

      // Estudiantes
      const { data: estudiantesData, error: estudiantesError } = await supabase.from("estudiantes").select("*").order("id");
      if (estudiantesError) {
        console.error("Error cargando estudiantes desde Supabase:", estudiantesError.message);
      } else if (estudiantesData) {
        setEstudiantes(estudiantesData as Estudiante[]);
      }

      // Usuarios (perfiles: nombre, rol, permisos)
      const { data: usuariosData, error: usuariosError } = await supabase.from("usuarios").select("*").order("id");
      if (usuariosError) {
        console.error("Error cargando usuarios desde Supabase:", usuariosError.message);
      } else if (usuariosData) {
        setUsuarios(usuariosData as Usuario[]);
      }

      // Listas de útiles
      const { data: listasData, error: listasError } = await supabase.from("listas_utiles").select("*").order("id");
      if (listasError) {
        console.error("Error cargando listas desde Supabase:", listasError.message);
      } else if (listasData) {
        setListas(listasData as ListaUtil[]);
      }

      // Movimientos (ordenados por fecha, más reciente primero)
      const { data: movimientosData, error: movimientosError } = await supabase.from("movimientos").select("*").order("fecha", { ascending: false });
      if (movimientosError) {
        console.error("Error cargando movimientos desde Supabase:", movimientosError.message);
      } else if (movimientosData) {
        setMovimientos(movimientosData as Movimiento[]);
      }

      // Alertas
      const { data: alertasData, error: alertasError } = await supabase.from("alertas").select("*").order("id", { ascending: false });
      if (alertasError) {
        console.error("Error cargando alertas desde Supabase:", alertasError.message);
      } else if (alertasData) {
        setAlertas(alertasData as Alerta[]);
      }

      // Recepciones
      const { data: recepcionesData, error: recepcionesError } = await supabase.from("recepciones").select("*").order("id");
      if (recepcionesError) {
        console.error("Error cargando recepciones desde Supabase:", recepcionesError.message);
      } else if (recepcionesData) {
        setRecepciones(recepcionesData as Recepcion[]);
      }

      // Todos los datos cargados: habilita el recálculo automático de alertas
      setDatosListos(true);
    };
    cargarDatos();
  }, []);

  // Recalcula las alertas automáticamente según el stock real
  const reconciliarAlertas = async () => {
    const activas = alertas.filter(a => !a.resuelta);

    // Alertas cuyo útil ya se recuperó (o fue desactivado / no existe) -> resolver
    const aResolver = activas.filter(a => {
      const u = utiles.find(x => x.id === a.utilId);
      return !u || u.estado !== "Activo" || u.stockActual > u.stockMinimo;
    });

    // Útiles bajos/sin stock que aún no tienen alerta activa -> crear
    const conAlerta = new Set(activas.map(a => a.utilId));
    const utilesBajos = utiles.filter(u =>
      u.estado === "Activo" &&
      u.stockActual <= u.stockMinimo &&
      !conAlerta.has(u.id)
    );

    if (aResolver.length === 0 && utilesBajos.length === 0) return;

    // Resolver en Supabase
    for (const a of aResolver) {
      await supabase.from("alertas").update({ resuelta: true }).eq("id", a.id);
    }

    // Crear en Supabase
    const nuevas: Alerta[] = utilesBajos.map((u, i) => ({
      id: `AL-${Date.now()}-${i}`,
      tipo: u.stockActual === 0 ? "proximo_agotarse" : "stock_bajo",
      prioridad: u.stockActual === 0 ? "Alta" : "Media",
      fecha: new Date().toISOString().split("T")[0],
      utilId: u.id,
      utilNombre: u.nombre,
      descripcion: u.stockActual === 0
        ? "El producto se encuentra sin stock."
        : `Stock actual (${u.stockActual}) menor al stock mínimo (${u.stockMinimo}).`,
      accionRecomendada: `Adquirir al menos ${u.stockMinimo * 2} unidades.`,
      resuelta: false
    }));
    if (nuevas.length > 0) {
      await supabase.from("alertas").insert(nuevas);
    }

    // Actualiza el estado local
    const idsResueltas = new Set(aResolver.map(a => a.id));
    setAlertas(prev => [
      ...nuevas,
      ...prev.map(a => idsResueltas.has(a.id) ? { ...a, resuelta: true } : a)
    ]);
  };

  // Recalcula al cargar y cada vez que cambia el stock (útiles)
  useEffect(() => {
    if (!datosListos) return;
    reconciliarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utiles, datosListos]);

  const cambiarUsuarioActivo = (id: string) => {
    const user = usuarios.find(u => u.id === id);
    if (user) setUsuarioActivo(user);
  };

  const registrarEstudiante = async (est: Omit<Estudiante, "id" | "codigo">) => {
    const nuevoId = `E${String(estudiantes.length + 1).padStart(3, "0")}`;
    const nuevoCodigo = `EST-2026-${String(estudiantes.length + 1).padStart(3, "0")}`;
    const nuevoEst: Estudiante = {
      ...est,
      id: nuevoId,
      codigo: nuevoCodigo
    };

    // Guarda el estudiante en Supabase (ya NO se crea recepción automática)
    const { error } = await supabase.from("estudiantes").insert(nuevoEst);
    if (error) {
      console.error("Error registrando estudiante:", error.message);
      alert("No se pudo guardar el estudiante en la base de datos: " + error.message);
      return;
    }
    setEstudiantes(prev => [...prev, nuevoEst]);
  };

  const editarEstudiante = async (est: Estudiante) => {
    // 1. Actualiza el estudiante en Supabase
    const { error } = await supabase.from("estudiantes").update(est).eq("id", est.id);
    if (error) {
      console.error("Error editando estudiante:", error.message);
      alert("No se pudo actualizar el estudiante en la base de datos: " + error.message);
      return;
    }
    setEstudiantes(prev => prev.map(e => e.id === est.id ? est : e));
  };

  const desactivarEstudiante = async (id: string) => {
    const target = estudiantes.find(e => e.id === id);
    if (!target) return;
    const nuevoEstado = target.estado === "Activo" ? "Inactivo" : "Activo";

    const { error } = await supabase.from("estudiantes").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      console.error("Error cambiando estado del estudiante:", error.message);
      alert("No se pudo cambiar el estado del estudiante: " + error.message);
      return;
    }
    setEstudiantes(prev => prev.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e));
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

  const guardarListaUtil = async (lista: ListaUtil) => {
    const existe = listas.find(l => l.grado === lista.grado && l.nivel === lista.nivel);
    if (existe) {
      // Ya hay una lista para ese grado/nivel: la actualizamos
      const actualizada = { ...lista, id: existe.id };
      const { error } = await supabase.from("listas_utiles").update(actualizada).eq("id", existe.id);
      if (error) {
        console.error("Error actualizando lista:", error.message);
        alert("No se pudo actualizar la lista en la base de datos: " + error.message);
        return;
      }
      setListas(prev => prev.map(l => l.id === existe.id ? actualizada : l));
    } else {
      // Lista nueva
      const nuevoId = `L${String(listas.length + 1).padStart(3, "0")}`;
      const nueva = { ...lista, id: nuevoId };
      const { error } = await supabase.from("listas_utiles").insert(nueva);
      if (error) {
        console.error("Error guardando lista:", error.message);
        alert("No se pudo guardar la lista en la base de datos: " + error.message);
        return;
      }
      setListas(prev => [...prev, nueva]);
    }
  };

  const eliminarListaUtil = async (id: string) => {
    const { error } = await supabase.from("listas_utiles").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando lista:", error.message);
      alert("No se pudo eliminar la lista de la base de datos: " + error.message);
      return;
    }
    setListas(prev => prev.filter(l => l.id !== id));
  };

  const registrarEntregaRecepcion = async (
    recepId: string,
    entregados: { [utilId: string]: number },
    observaciones: string,
    recibidoPor: string
  ) => {
    const rc = recepciones.find(r => r.id === recepId);
    if (!rc) return;

    const hoyStr = new Date().toISOString().split("T")[0];
    const horaStr = new Date().toTimeString().split(" ")[0].substring(0, 5);

    // Calcula los nuevos items entregados
    const nuevosItems = rc.items.map(item => ({
      ...item,
      cantidadEntregada: entregados[item.utilId] ?? item.cantidadEntregada
    }));

    const completo = nuevosItems.every(it => it.cantidadEntregada >= it.cantidadEsperada);
    const vacio = nuevosItems.every(it => it.cantidadEntregada === 0);
    const estado = completo ? "Completo" : (vacio ? "Pendiente" : "Incompleto");

    // Prepara actualizaciones de stock y nuevos movimientos por lo recién entregado
    // (los movimientos van SIN id: Supabase se lo asigna solo)
    const stockUpdates: { utilId: string; nuevoStock: number }[] = [];
    const nuevosMovs: Omit<Movimiento, "id">[] = [];

    nuevosItems.forEach((item) => {
      const anterior = rc.items.find(it => it.utilId === item.utilId)?.cantidadEntregada ?? 0;
      const diferencia = item.cantidadEntregada - anterior;
      if (diferencia > 0) {
        const utilObj = utiles.find(u => u.id === item.utilId);
        if (utilObj) {
          const stockAnt = utilObj.stockActual;
          const stockRes = stockAnt + diferencia;
          stockUpdates.push({ utilId: item.utilId, nuevoStock: stockRes });
          nuevosMovs.push({
            tipo: "Entrada",
            utilId: item.utilId,
            utilNombre: item.utilNombre,
            cantidad: diferencia,
            fecha: `${hoyStr} ${horaStr}`,
            responsable: recibidoPor,
            motivo: `Entrega de útiles - Estudiante ${rc.estudianteNombre}`,
            stockAnterior: stockAnt,
            stockResultante: stockRes
          });
        }
      }
    });

    const nuevoNumeroEntregas = (rc.numeroEntregas ?? 0) + 1;
    const recepActualizada: Recepcion = {
      ...rc,
      items: nuevosItems,
      estado,
      observaciones,
      fechaRecepcion: hoyStr,
      recibidoPor,
      numeroEntregas: nuevoNumeroEntregas
    };

    // 1. Actualiza la recepción en Supabase
    const { error: recErr } = await supabase.from("recepciones")
      .update({ items: nuevosItems, estado, observaciones, fechaRecepcion: hoyStr, recibidoPor, numeroEntregas: nuevoNumeroEntregas })
      .eq("id", recepId);
    if (recErr) {
      console.error("Error actualizando recepción:", recErr.message);
      alert("No se pudo guardar la entrega en la base de datos: " + recErr.message);
      return;
    }

    // 2. Guarda los movimientos generados (Supabase asigna los IDs y nos los devuelve)
    let movsCreados: Movimiento[] = [];
    if (nuevosMovs.length > 0) {
      const { data: movData, error: movErr } = await supabase.from("movimientos").insert(nuevosMovs).select();
      if (movErr) {
        console.error("Error guardando movimientos de la entrega:", movErr.message);
      } else if (movData) {
        movsCreados = movData as Movimiento[];
      }
    }

    // 3. Actualiza el stock de cada útil afectado
    for (const su of stockUpdates) {
      const { error: uErr } = await supabase.from("utiles")
        .update({ stockActual: su.nuevoStock })
        .eq("id", su.utilId);
      if (uErr) {
        console.error("Error actualizando stock del útil:", uErr.message);
      }
    }

    // Actualiza el estado local
    setRecepciones(prev => prev.map(r => r.id === recepId ? recepActualizada : r));
    if (movsCreados.length > 0) {
      setMovimientos(prev => [...movsCreados, ...prev]);
    }
    setUtiles(prev => prev.map(u => {
      const su = stockUpdates.find(s => s.utilId === u.id);
      return su ? { ...u, stockActual: su.nuevoStock } : u;
    }));
  };

  const registrarNuevaRecepcion = async (recep: Omit<Recepcion, "id">): Promise<Recepcion | null> => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const horaStr = new Date().toTimeString().split(" ")[0].substring(0, 5);

    // 1. Inserta la recepción (Supabase genera el id único)
    const { data, error } = await supabase.from("recepciones").insert(recep).select().single();
    if (error) {
      console.error("Error registrando recepción:", error.message);
      alert("No se pudo guardar la recepción en la base de datos: " + error.message);
      return null;
    }
    const creada = data as Recepcion;
    setRecepciones(prev => [creada, ...prev]);

    // 2. Por cada útil entregado (> 0): genera movimiento de entrada y suma al stock
    const stockUpdates: { utilId: string; nuevoStock: number }[] = [];
    const nuevosMovs: Omit<Movimiento, "id">[] = [];

    creada.items.forEach((item) => {
      if (item.cantidadEntregada > 0) {
        const utilObj = utiles.find(u => u.id === item.utilId);
        if (utilObj) {
          const stockAnt = utilObj.stockActual;
          const stockRes = stockAnt + item.cantidadEntregada;
          stockUpdates.push({ utilId: item.utilId, nuevoStock: stockRes });
          nuevosMovs.push({
            tipo: "Entrada",
            utilId: item.utilId,
            utilNombre: item.utilNombre,
            cantidad: item.cantidadEntregada,
            fecha: `${hoyStr} ${horaStr}`,
            responsable: creada.recibidoPor,
            motivo: `Entrega de útiles - Estudiante ${creada.estudianteNombre}`,
            stockAnterior: stockAnt,
            stockResultante: stockRes
          });
        }
      }
    });

    // Guarda los movimientos generados (Supabase asigna los IDs)
    if (nuevosMovs.length > 0) {
      const { data: movData, error: movErr } = await supabase.from("movimientos").insert(nuevosMovs).select();
      if (movErr) {
        console.error("Error guardando movimientos de la recepción:", movErr.message);
      } else if (movData) {
        setMovimientos(prev => [...(movData as Movimiento[]), ...prev]);
      }
    }

    // Actualiza el stock de cada útil afectado
    for (const su of stockUpdates) {
      const { error: uErr } = await supabase.from("utiles")
        .update({ stockActual: su.nuevoStock })
        .eq("id", su.utilId);
      if (uErr) {
        console.error("Error actualizando stock del útil:", uErr.message);
      }
    }
    if (stockUpdates.length > 0) {
      setUtiles(prev => prev.map(u => {
        const su = stockUpdates.find(s => s.utilId === u.id);
        return su ? { ...u, stockActual: su.nuevoStock } : u;
      }));
    }

    return creada;
  };

  const registrarNuevoMovimiento = async (mov: Omit<Movimiento, "id" | "fecha">) => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const horaStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
    const movConFecha = { ...mov, fecha: `${hoyStr} ${horaStr}` };

    // 1. Guarda el movimiento en Supabase (el ID lo genera la base)
    const { data, error } = await supabase.from("movimientos").insert(movConFecha).select().single();
    if (error) {
      console.error("Error registrando movimiento:", error.message);
      alert("No se pudo guardar el movimiento en la base de datos: " + error.message);
      return;
    }
    if (data) setMovimientos(prev => [data as Movimiento, ...prev]);

    // 2. Actualiza el stock del útil afectado (también en Supabase)
    const { error: uErr } = await supabase.from("utiles")
      .update({ stockActual: mov.stockResultante })
      .eq("id", mov.utilId);
    if (uErr) {
      console.error("Error actualizando stock del útil:", uErr.message);
    }
    setUtiles(prev => prev.map(u => u.id === mov.utilId
      ? { ...u, stockActual: mov.stockResultante }
      : u));
  };

  const resolverAlerta = async (alertaId: string) => {
    const { error } = await supabase.from("alertas").update({ resuelta: true }).eq("id", alertaId);
    if (error) {
      console.error("Error resolviendo alerta:", error.message);
      alert("No se pudo actualizar la alerta: " + error.message);
      return;
    }
    setAlertas(prev => prev.map(al => al.id === alertaId ? { ...al, resuelta: true } : al));
  };

  const crearAlerta = async (al: Omit<Alerta, "id" | "fecha" | "resuelta">) => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const nuevoId = `AL${String(alertas.length + 1).padStart(3, "0")}`;
    const nuevaAlerta: Alerta = {
      ...al,
      id: nuevoId,
      fecha: hoyStr,
      resuelta: false
    };

    const { error } = await supabase.from("alertas").insert(nuevaAlerta);
    if (error) {
      console.error("Error creando alerta:", error.message);
      return;
    }
    setAlertas(prev => [nuevaAlerta, ...prev]);
  };

  const actualizarConfiguracion = (config: any) => {
    setConfiguracionColegio(prev => ({ ...prev, ...config }));
  };

  return (
    <AppContext.Provider
      value={{
        estudiantes,
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