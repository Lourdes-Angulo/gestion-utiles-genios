/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { Estudiante, UtilEscolar, ListaUtil, Recepcion, Movimiento, Prediccion, Alerta, Usuario } from "../types";

import { supabase as supabaseOriginal } from "../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RolSIGUE } from "../lib/permisosRoles";

import { INITIAL_USERS } from "../data/mockData";
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

  registrarEstudiante: (est: Omit<Estudiante, "id" | "codigo">) => Promise<void>;

  editarEstudiante: (est: Estudiante) => Promise<void>;

  desactivarEstudiante: (id: string) => void;
  registrarUtil: (util: Omit<UtilEscolar, "id">) => Promise<void>;

  editarUtil: (util: UtilEscolar) => Promise<void>;

  desactivarUtil: (id: string) => void;
  guardarListaUtil: (lista: ListaUtil) => Promise<void>;

  eliminarListaUtil: (id: string) => void;
  registrarEntregaRecepcion: (recepId: string, entregados: { [utilId: string]: number }, observaciones: string, recibidoPor: string, entregadoPor?: string) => Promise<void>;

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
const HABILITAR_RECONCILIACION_AUTOMATICA = false;

export const AppProvider = ({ children, cliente, habilitado = false, idUsuario, rolUsuario }: { children: ReactNode; cliente?: SupabaseClient; habilitado?: boolean; idUsuario?: string | null; rolUsuario?: RolSIGUE | null }) => {
  const supabase = cliente ?? supabaseOriginal;

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);

  const [utiles, setUtiles] = useState<UtilEscolar[]>([]);

  const [listas, setListas] = useState<ListaUtil[]>([]);

  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);

  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [datosListos, setDatosListos] = useState(false);

  // La identidad visible proviene exclusivamente del perfil institucional autenticado.
  // Nunca usar INITIAL_USERS como perfil real (ni como fuente de autorización).
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario>(INITIAL_USERS[0]);

  useEffect(() => {
    let vigente = true;
    if (!habilitado || !idUsuario || !rolUsuario) return;

    const cargarPerfilActual = async () => {
      const { data, error } = await supabase.from("usuarios")
        .select("*")
        .eq("id", idUsuario)
        .maybeSingle();
      if (!vigente) return;
      if (error || !data) {
        console.error("No se pudo cargar el perfil institucional autenticado:", error?.message ?? "Sin perfil");
        return;
      }
      if (data.rol !== rolUsuario || data.estado !== "Activo") {
        console.error("El perfil institucional no corresponde a la sesión activa.");
        return;
      }
      setUsuarioActivo(data as Usuario);
    };
    void cargarPerfilActual();
    return () => { vigente = false; };
  }, [supabase, habilitado, idUsuario, rolUsuario]);

  useEffect(() => {
    if (!idUsuario) return;
    const perfil = usuarios.find(u => u.id === idUsuario);
    if (perfil && perfil.estado === "Activo" && perfil.rol === rolUsuario) {
      setUsuarioActivo(perfil);
    }
  }, [usuarios, idUsuario, rolUsuario]);

  const [configuracionColegio, setConfiguracionColegio] = useState({

    nombre: "I.E.P. Genios del Millennium",

    anioEscolar: "2026",

    direccion: "Av. Próceres de la Independencia 1420, San Juan de Lurigancho, Lima, Perú",

    telefono: "(01) 458-9021",

    director: "Dra. Marisol Vargas Diaz"

  });
  // Al iniciar la app, carga los datos desde Supabase (base de datos real)

  useEffect(() => {
    setEstudiantes([]);
    setUsuarios([]);
    setListas([]);
    setRecepciones([]);
    setUtiles([]);
    setMovimientos([]);
    setAlertas([]);
    setDatosListos(false);
    if (!habilitado) return;
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
    // Construye el texto de una alerta según el stock REAL y actual del útil

    const construirTexto = (u: UtilEscolar) => {

      const critico = u.stockActual < u.stockMinimo / 2; // menos de la mitad del mínimo

      return {

        tipo: (critico ? "proximo_agotarse" : "stock_bajo") as Alerta["tipo"],

        prioridad: (critico ? "Alta" : "Media") as Alerta["prioridad"],

        descripcion: u.stockActual === 0

          ? "El producto se encuentra sin stock."

          : `Stock actual (${u.stockActual}) menor al stock mínimo (${u.stockMinimo}).`,

        accionRecomendada: `Adquirir al menos ${Math.max(1, (u.stockMinimo + 5) - u.stockActual)} unidades.`

      };

    };
    // Alertas a resolver (útil recuperado, inactivo o inexistente)

    const aResolver = activas.filter(a => {

      const u = utiles.find(x => x.id === a.utilId);

      return !u || u.estado !== "Activo" || u.stockActual > u.stockMinimo;

    });

    const idsResolver = new Set(aResolver.map(a => a.id));
    // Alertas activas que siguen bajas pero con el texto desactualizado

    const aActualizar: { id: string; nuevo: ReturnType<typeof construirTexto> }[] = [];

    activas.forEach(a => {

      if (idsResolver.has(a.id)) return;

      const u = utiles.find(x => x.id === a.utilId);

      if (!u) return;

      const nuevo = construirTexto(u);

      if (

        a.descripcion !== nuevo.descripcion ||

        a.accionRecomendada !== nuevo.accionRecomendada ||

        a.tipo !== nuevo.tipo ||

        a.prioridad !== nuevo.prioridad

      ) {

        aActualizar.push({ id: a.id, nuevo });

      }

    });
    // Útiles bajos/sin stock que aún no tienen alerta activa -> crear

    const conAlerta = new Set(activas.map(a => a.utilId));

    const utilesBajos = utiles.filter(u =>

      u.estado === "Activo" &&

      u.stockActual <= u.stockMinimo &&

      !conAlerta.has(u.id)

    );
    if (aResolver.length === 0 && aActualizar.length === 0 && utilesBajos.length === 0) return;
    // Resolver en Supabase

    for (const a of aResolver) {

      await supabase.from("alertas").update({ resuelta: true }).eq("id", a.id);

    }
    // Actualizar textos desactualizados en Supabase

    for (const item of aActualizar) {

      await supabase.from("alertas").update(item.nuevo).eq("id", item.id);

    }
    // Crear nuevas en Supabase

    const nuevas: Alerta[] = utilesBajos.map((u, i) => {

      const t = construirTexto(u);

      return {

        id: `AL-${Date.now()}-${i}`,

        tipo: t.tipo,

        prioridad: t.prioridad,

        fecha: new Date().toISOString().split("T")[0],

        utilId: u.id,

        utilNombre: u.nombre,

        descripcion: t.descripcion,

        accionRecomendada: t.accionRecomendada,

        resuelta: false

      };

    });

    if (nuevas.length > 0) {

      await supabase.from("alertas").insert(nuevas);

    }
    // Actualiza el estado local

    const mapaActualizar = new Map(aActualizar.map(x => [x.id, x.nuevo]));

    setAlertas(prev => [

      ...nuevas,

      ...prev.map(a => {

        if (idsResolver.has(a.id)) return { ...a, resuelta: true };

        const upd = mapaActualizar.get(a.id);

        return upd ? { ...a, ...upd } : a;

      })

    ]);

  };
  // Recalcula al cargar y cada vez que cambia el stock (útiles)

  useEffect(() => {

    // Desactivado durante integración Clerk: no realizar escrituras automáticas.
    if (!datosListos || !HABILITAR_RECONCILIACION_AUTOMATICA) return;
    void reconciliarAlertas();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [utiles, datosListos]);
  const cambiarUsuarioActivo = (id: string) => {

    const user = usuarios.find(u => u.id === id);

    if (user) setUsuarioActivo(user);

  };
  const registrarEstudiante = async (est: Omit<Estudiante, "id" | "codigo">) => {
    const dni = (est.dni ?? "").trim();
    if (!/^\d{8}$/.test(dni)) throw new Error("DNI inválido: debe tener 8 dígitos.");

    // Comprobación amistosa; RLS limita a qué alumnos puede consultar cada rol.
    // La garantía ante dos sesiones simultáneas la dará el índice único de PostgreSQL.
    const { data: coincidencias, error: errorDni } = await supabase.from("estudiantes")
      .select("id").eq("dni", dni).limit(1);
    if (errorDni) throw new Error("No se pudo verificar el DNI: " + errorDni.message);
    if (coincidencias?.length) throw new Error("Ya existe un estudiante registrado con este DNI.");

    // Un identificador nuevo para toda la institución, no según los alumnos visibles por RLS.
    const nuevoId = crypto.randomUUID();

    // El código de presentación es distinto de la clave primaria y no depende
    // del recuento filtrado por aula o nivel.
    const nuevoCodigo = `EST-${new Date().getFullYear()}-${nuevoId.slice(0, 8).toUpperCase()}`;

    const nuevoEst: Estudiante = {

      ...est,
      dni,

      id: nuevoId,

      codigo: nuevoCodigo

    };
    // Guarda el estudiante en Supabase (ya NO se crea recepción automática)

    const { error } = await supabase.from("estudiantes").insert(nuevoEst);

    if (error) {
      if (error.code === "23505") throw new Error("Ya existe un estudiante con este DNI. No se creó otro registro.");
      console.error("Error registrando estudiante:", error.message);
      throw new Error("No se pudo guardar el estudiante: " + error.message);
    }

    setEstudiantes(prev => [...prev, nuevoEst]);

  };
  const editarEstudiante = async (est: Estudiante) => {

    // 1. Actualiza el estudiante en Supabase

    const { error } = await supabase.from("estudiantes").update(est).eq("id", est.id);

    if (error) {

      console.error("Error editando estudiante:", error.message);

      throw new Error("No se pudo actualizar el estudiante: " + error.message);

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

    const nuevoId = crypto.randomUUID();

    const nuevoUtil: UtilEscolar = {

      ...util,
      codigo: `UTI-${nuevoId.slice(0, 8).toUpperCase()}`,
      ...(rolUsuario === "Profesora" ? { stockActual: 0 } : {}),
      id: nuevoId

    };
    // Guarda el nuevo útil en Supabase

    const { data: utilCreado, error } = await supabase.from("utiles").insert(nuevoUtil).select("*").single();

    if (error) {

      console.error("Error registrando útil:", error.message);

      throw new Error("No se pudo guardar el útil en la base de datos: " + error.message);

    }
    if (!utilCreado) throw new Error("Supabase no confirmó la creación del producto.");
    setUtiles(prev => [...prev, utilCreado as UtilEscolar]);
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

    const cambios = rolUsuario === "Profesora" ? {
      nombre: util.nombre, categoria: util.categoria,
      unidadMedida: util.unidadMedida, ubicación: util.ubicación,
      stockMinimo: util.stockMinimo
    } : util;
    const { data: utilActualizado, error } = await supabase.from("utiles").update(cambios).eq("id", util.id).select("*").maybeSingle();

    if (error) {

      console.error("Error editando útil:", error.message);

      throw new Error("No se pudo actualizar el útil en la base de datos: " + error.message);

    }
    if (!utilActualizado) throw new Error("La actualización no afectó ningún útil. Comprueba los permisos.");
    setUtiles(prev => prev.map(u => u.id === util.id ? (utilActualizado as UtilEscolar) : u));
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
  const guardarListaUtil = async (lista: ListaUtil): Promise<void> => {
    if (rolUsuario === "Auxiliar") throw new Error("Auxiliar no puede modificar listas.");
    if (rolUsuario === "Profesora") {
      const { data: perfil, error: perfilError } = await supabase.from("usuarios")
        .select("nivel_asignado,aula_asignada,estado")
        .eq("id", idUsuario ?? "").maybeSingle();
      if (perfilError || !perfil || perfil.estado !== "Activo" ||
          lista.nivel !== perfil.nivel_asignado || lista.grado !== perfil.aula_asignada) {
        throw new Error("Solo puedes gestionar la lista de tu aula asignada.");
      }
    }
    const existe = listas.find(l => l.grado === lista.grado && l.nivel === lista.nivel && l.anioEscolar === lista.anioEscolar);
    if (existe) {
      // El UPDATE debe devolver una fila: evita falsos éxitos si RLS no permite escribir.
      const { data, error } = await supabase.from("listas_utiles")
        .update({ items: lista.items })
        .eq("id", existe.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error("No se pudo actualizar la lista: " + error.message);
      if (!data) throw new Error("Supabase no actualizó la lista. Revisa los permisos RLS de UPDATE.");
      setListas(prev => prev.map(l => l.id === existe.id ? data as ListaUtil : l));
    } else {
      const nueva = { ...lista, id: lista.id || crypto.randomUUID() };
      const { data, error } = await supabase.from("listas_utiles")
        .insert(nueva).select("*").single();
      if (error) throw new Error("No se pudo crear la lista: " + error.message);
      setListas(prev => [...prev, data as ListaUtil]);
    }
  };
  const eliminarListaUtil = async (id: string) => {
    if (rolUsuario === "Profesora" || rolUsuario === "Auxiliar") throw new Error("No puedes eliminar listas completas.");

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
    _recibidoPor: string,
    entregadoPor = ""
  ): Promise<void> => {
    const anterior = recepciones.find(r => r.id === recepId);
    if (!anterior) throw new Error("La recepción ya no está disponible. Actualiza la página.");
    const { data, error } = await supabase.rpc("sigue_guardar_recepcion", {
      p_estudiante_id: anterior.estudianteId,
      p_cantidades: entregados,
      p_observaciones: observaciones,
      p_entregado_por: entregadoPor || anterior.entregadoPor || "",
      p_recepcion_id: recepId
    });
    if (error) throw new Error("No se pudo guardar la entrega: " + error.message);
    if (!data) throw new Error("Supabase no confirmó la recepción.");
    setRecepciones(prev => prev.map(r => r.id === recepId ? data as Recepcion : r));
    const { data: productos, error: errorProductos } = await supabase.from("utiles").select("*");
    if (!errorProductos && productos) setUtiles(productos as UtilEscolar[]);
  };
  const registrarNuevaRecepcion = async (recep: Omit<Recepcion, "id">): Promise<Recepcion | null> => {
    const cantidades = Object.fromEntries(recep.items.map(it => [it.utilId, it.cantidadEntregada]));
    const { data, error } = await supabase.rpc("sigue_guardar_recepcion", {
      p_estudiante_id: recep.estudianteId,
      p_cantidades: cantidades,
      p_observaciones: recep.observaciones || "",
      p_entregado_por: recep.entregadoPor || "",
      p_recepcion_id: null
    });
    if (error) throw new Error("No se pudo guardar la recepción: " + error.message);
    if (!data) throw new Error("Supabase no confirmó el registro de recepción.");
    const creada = data as Recepcion;
    setRecepciones(prev => [creada, ...prev]);
    const { data: productos, error: errorProductos } = await supabase.from("utiles").select("*");
    if (!errorProductos && productos) setUtiles(productos as UtilEscolar[]);
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