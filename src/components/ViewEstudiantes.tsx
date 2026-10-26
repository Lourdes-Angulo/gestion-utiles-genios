

import React, { useState, useRef } from "react";

import { useApp } from "../context/AppContext";

import { supabase } from "../lib/supabaseClient";

import type { Estudiante, ListaUtil, Recepcion } from "../types";

import {

  Search, Plus, Edit2, Trash2, Eye, Filter, X,

  GraduationCap, Check, UserCheck, AlertCircle,

  ArrowRight, PackageCheck

} from "lucide-react";



type Rol = "Administrador" | "Secretaria" | "Profesora" | "Auxiliar";



const GRADOS = {

  Inicial: ["3 años", "4 años", "5 años"],

  Primaria: [

    "1er Grado", "2do Grado", "3er Grado",

    "4to Grado", "5to Grado", "6to Grado"

  ]

};



function ProgresoUtilesAlumno({

  estudiante,

  listas,

  recepciones,

  onVerLista

}: {

  estudiante: Estudiante;

  listas: ListaUtil[];

  recepciones: Recepcion[];

  onVerLista: (estudianteId: string) => void;

}) {



  const lista = listas

    .filter(

      (l) =>

        l.nivel === estudiante.nivel &&

        l.grado === estudiante.grado

    )

    .sort((a, b) =>

      b.anioEscolar.localeCompare(a.anioEscolar, "es", {

        numeric: true

      })

    )[0];



  if (!lista) {

    return (

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <p className="font-bold text-slate-800">

          Entrega de útiles escolares

        </p>

        <p className="mt-2 text-xs text-slate-500">

          Este estudiante todavía no tiene una lista de útiles

          asignada a su nivel y grado.

        </p>

      </div>

    );

  }



  const recepcionesAlumno = recepciones

    .filter((r) => r.estudianteId === estudiante.id)

    .sort((a, b) =>

      b.fechaRecepcion.localeCompare(a.fechaRecepcion)

    );



  // Se utiliza la recepción más reciente como registro

  // acumulado. Debe comprobarse con el flujo de Recepción.

  const recepcion = recepcionesAlumno[0];



  const items = lista.items.map((item) => {

    const requerido = Math.max(

      0,

      Number(item.cantidadRequerida) || 0

    );



    const registro = recepcion?.items.find(

      (r) => r.utilId === item.utilId

    );



    const entregado = Math.min(

      requerido,

      Math.max(

        0,

        Number(registro?.cantidadEntregada) || 0

      )

    );



    return {

      id: item.utilId,

      nombre: item.utilNombre,

      requerido,

      entregado,

      pendiente: requerido - entregado

    };

  });



  const totalRequerido = items.reduce(

    (s, item) => s + item.requerido, 0

  );



  const totalEntregado = items.reduce(

    (s, item) => s + item.entregado, 0

  );



  const totalPendiente = items.reduce(

    (s, item) => s + item.pendiente, 0

  );



  const porcentaje = totalRequerido > 0

    ? Math.round(

        (totalEntregado / totalRequerido) * 100

      )

    : 0;



  return (

    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <PackageCheck className="h-5 w-5 text-emerald-700" />

          <span className="text-xs font-bold text-slate-800">

            Entrega de útiles escolares

          </span>

        </div>



        <span className="text-xl font-black text-emerald-700">

          {porcentaje}%

        </span>

      </div>



      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">

        <div

          className="h-full rounded-full bg-emerald-500 transition-all"

          style={{ width: `${porcentaje}%` }}

        />

      </div>



      <div className="mt-3 grid grid-cols-2 gap-3">

        <div className="rounded-xl bg-white p-3 text-center">

          <p className="text-lg font-black text-emerald-700">

            {totalEntregado}

          </p>

          <p className="text-[10px] text-slate-500">

            Unidades entregadas

          </p>

        </div>



        <div className="rounded-xl bg-white p-3 text-center">

          <p className="text-lg font-black text-amber-700">

            {totalPendiente}

          </p>

          <p className="text-[10px] text-slate-500">

            Unidades pendientes

          </p>

        </div>

      </div>



      <p className="mt-3 text-center text-[11px] text-slate-600">

        {totalEntregado} de {totalRequerido} unidades requeridas

      </p>



      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => onVerLista(estudiante.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <PackageCheck size={15} />
          Ver detalle de útiles
          <ArrowRight size={14} />
        </button>
      </div>

    </div>

  );

}



export default function ViewEstudiantes({
  onVerLista
}: {
  onVerLista: (estudianteId: string) => void;
}) {

  const {

    estudiantes,

    listas,

    recepciones,

    registrarEstudiante,

    editarEstudiante,

    desactivarEstudiante,

    usuarioActivo,

    usuarios

  } = useApp();



  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const [filtroGrado, setFiltroGrado] = useState("");

  const [filtroNivel, setFiltroNivel] = useState("");



  const [mostrarModalRegistro, setMostrarModalRegistro] =

    useState(false);

  const [mostrarModalDetalle, setMostrarModalDetalle] =

    useState(false);



  const [estudianteSeleccionado, setEstudianteSeleccionado] =

    useState<Estudiante | null>(null);



  const [esEdicion, setEsEdicion] = useState(false);

  const [formDni, setFormDni] = useState("");

  const [formNombres, setFormNombres] = useState("");

  const [formApellidos, setFormApellidos] = useState("");

  const [formGrado, setFormGrado] = useState("1er Grado");

  const [formNivel, setFormNivel] =

    useState<"Inicial" | "Primaria">("Primaria");



  const [buscandoDni, setBuscandoDni] = useState(false);

  const [mensajeDni, setMensajeDni] = useState("");

  const [autorizacionDatos, setAutorizacionDatos] =

    useState(false);



  const [mensajeExito, setMensajeExito] = useState("");

  const [guardando, setGuardando] = useState(false);

  const guardandoRef = useRef(false);



  // Permisos institucionales

  const perfil = usuarios.find(

    (u) => u.id === usuarioActivo.id

  ) as

    | (typeof usuarioActivo & {

        rol: Rol;

        nivel_asignado?: string | null;

        aula_asignada?: string | null;

      })

    | undefined;



  const rol: Rol | undefined = perfil?.rol as Rol | undefined;

  const esPersonal =

    rol === "Profesora" || rol === "Auxiliar";



  const nivelAsignado = perfil?.nivel_asignado ?? null;

  const aulaAsignada = perfil?.aula_asignada ?? null;



  const asignacionValida = Boolean(

    nivelAsignado &&

    (rol !== "Profesora" || aulaAsignada)

  );



  const puedeRegistrar = Boolean(

    rol &&

    ["Administrador", "Secretaria", "Profesora", "Auxiliar"]

      .includes(rol) &&

    (!esPersonal || asignacionValida)

  );



  const esAdmin = rol === "Administrador";



  const puedeVerEstudiante = (est: Estudiante) =>

    !esPersonal ||

    (

      asignacionValida &&

      est.nivel === nivelAsignado &&

      (

        rol !== "Profesora" ||

        est.grado === aulaAsignada

      )

    );



  const handleAbrirRegistro = () => {

    if (!puedeRegistrar) return;



    setEsEdicion(false);

    setEstudianteSeleccionado(null);

    setFormDni("");

    setFormNombres("");

    setFormApellidos("");



    const nivel =

      esPersonal && nivelAsignado === "Inicial"

        ? "Inicial"

        : esPersonal && nivelAsignado === "Primaria"

          ? "Primaria"

          : "Primaria";



    setFormNivel(nivel);



    setFormGrado(

      rol === "Profesora"

        ? aulaAsignada ?? ""

        : GRADOS[nivel][0]

    );



    setMensajeDni("");

    setAutorizacionDatos(false);

    setMostrarModalRegistro(true);

  };



  const handleAbrirEdicion = (est: Estudiante) => {

    if (!puedeRegistrar || !puedeVerEstudiante(est)) {

      return;

    }



    setEsEdicion(true);

    setEstudianteSeleccionado(est);

    setFormDni(est.dni || "");

    setFormNombres(est.nombres);

    setFormApellidos(est.apellidos);

    setFormGrado(est.grado);

    setFormNivel(est.nivel);

    setMensajeDni("");

    setAutorizacionDatos(false);

    setMostrarModalRegistro(true);

  };



  const handleVerDetalle = (est: Estudiante) => {

    if (!puedeVerEstudiante(est)) return;

    setEstudianteSeleccionado(est);

    setMostrarModalDetalle(true);

  };



  const handleBuscarDni = async () => {

    if (!autorizacionDatos) {

      setMensajeDni(

        "Confirma primero el cumplimiento de protección de datos."

      );

      return;

    }



    if (!/^\d{8}$/.test(formDni)) {

      setMensajeDni("El DNI debe contener 8 dígitos.");

      return;

    }



    setBuscandoDni(true);

    setMensajeDni("");



    try {

      const { data, error } = await supabase.functions.invoke(

        "consulta-dni",

        { body: { dni: formDni } }

      );



      if (error || data?.error || !data?.nombres) {

        setMensajeDni(

          "No se encontraron datos. Puedes ingresarlos manualmente."

        );

      } else {

        setFormNombres(data.nombres || "");

        setFormApellidos(

          `${data.apellidoPaterno || ""} ${data.apellidoMaterno || ""}`.trim()

        );

        setMensajeDni("Datos encontrados y autocompletados.");

      }

    } catch {

      setMensajeDni(

        "No se pudo consultar el DNI. Ingresa los datos manualmente."

      );

    } finally {

      setBuscandoDni(false);

    }

  };



  const handleGuardar = async (e: React.FormEvent) => {

    e.preventDefault();



    if (guardandoRef.current) return;



    if (!autorizacionDatos) {

      setMensajeDni(

        "Debes confirmar la protección de datos antes de guardar."

      );

      return;

    }



    if (!formNombres.trim() || !formApellidos.trim()) {

      setMensajeDni("Completa nombres y apellidos.");

      return;

    }



    if (

      !puedeRegistrar ||

      (esPersonal &&

        (!asignacionValida ||

          formNivel !== nivelAsignado ||

          (rol === "Profesora" && formGrado !== aulaAsignada)))

    ) {

      setMensajeDni(

        "No tienes permiso para registrar estudiantes en esta asignación."

      );

      return;

    }



    const dniNormalizado = formDni.trim();



    if (!/^\d{8}$/.test(dniNormalizado)) {

      setMensajeDni("Ingresa un DNI válido de 8 dígitos.");

      return;

    }



    if (

      !esEdicion &&

      estudiantes.some(

        (est) => est.dni?.trim() === dniNormalizado

      )

    ) {

      setMensajeDni(

        "Ya existe un estudiante registrado con este DNI."

      );

      return;

    }



    guardandoRef.current = true;

    setGuardando(true);

    setMensajeDni("");



    try {

      if (esEdicion && estudianteSeleccionado) {

        await editarEstudiante({

          ...estudianteSeleccionado,

          dni: dniNormalizado,

          nombres: formNombres.trim(),

          apellidos: formApellidos.trim(),

          nivel: formNivel,

          grado: formGrado

        });



        setMensajeExito("Estudiante actualizado correctamente.");

      } else {

        await registrarEstudiante({

          dni: dniNormalizado,

          nombres: formNombres.trim(),

          apellidos: formApellidos.trim(),

          nivel: formNivel,

          grado: formGrado,

          apoderadoId: "",

          apoderadoNombre: "No asignado",

          estado: "Activo"

        });



        setMensajeExito("Estudiante registrado correctamente.");

      }



      setMostrarModalRegistro(false);



      setTimeout(() => {

        setMensajeExito("");

      }, 4000);

    } catch (err) {

      setMensajeDni(

        err instanceof Error

          ? err.message

          : "No se pudo guardar el estudiante."

      );

    } finally {

      guardandoRef.current = false;

      setGuardando(false);

    }

  };



  const estudiantesFiltrados = estudiantes.filter((est) => {

    const texto = [

      est.nombres,

      est.apellidos,

      est.codigo,

      est.dni || ""

    ].join(" ").toLowerCase();



    return (

      puedeVerEstudiante(est) &&

      texto.includes(filtroBusqueda.toLowerCase()) &&

      (!filtroGrado || est.grado === filtroGrado) &&

      (!filtroNivel || est.nivel === filtroNivel)

    );

  });



  return (

    <div className="flex-1 space-y-6 overflow-y-auto bg-[#f0f4f8] p-5 md:p-8">



      {mensajeExito && (

        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">

          <UserCheck size={18} />

          {mensajeExito}

        </div>

      )}



      {/* BÚSQUEDA Y FILTROS */}



      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">

        <div className="relative min-w-[220px] flex-1">

          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

          <input

            value={filtroBusqueda}

            onChange={(e) => setFiltroBusqueda(e.target.value)}

            placeholder="Buscar nombre, código o DNI..."

            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-emerald-500"

          />

        </div>



        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">

            <Filter size={15} className="text-slate-400" />

            <select

              value={filtroNivel}

              onChange={(e) => {

                setFiltroNivel(e.target.value);

                setFiltroGrado("");

              }}

              className="bg-transparent text-xs outline-none"

            >

              <option value="">Todos los niveles</option>

              <option value="Inicial">Inicial</option>

              <option value="Primaria">Primaria</option>

            </select>

          </div>



          <select

            value={filtroGrado}

            onChange={(e) => setFiltroGrado(e.target.value)}

            className="rounded-xl border bg-slate-50 px-3 py-2 text-xs"

          >

            <option value="">Todos los grados</option>

            {GRADOS.Inicial.concat(GRADOS.Primaria).map(

              (grado) => (

                <option key={grado} value={grado}>

                  {grado}

                </option>

              )

            )}

          </select>



          {puedeRegistrar && (

            <button

              type="button"

              onClick={handleAbrirRegistro}

              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"

            >

              <Plus size={17} />

              Registrar Estudiante

            </button>

          )}

        </div>

      </div>



      {/* TABLA DE ESTUDIANTES */}



      <div className="glass-card overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full border-collapse text-left">

            <thead>

              <tr className="border-b bg-slate-50 text-[11px] font-bold uppercase text-slate-500">

                <th className="p-5">Código</th>

                <th className="p-5">Estudiante</th>

                <th className="p-5">Nivel</th>

                <th className="p-5">Grado</th>

                <th className="p-5 text-center">Estado</th>

                <th className="p-5 text-right">Acciones</th>

              </tr>

            </thead>



            <tbody className="divide-y divide-slate-100 text-xs">

              {estudiantesFiltrados.map((est) => (

                <tr key={est.id} className="hover:bg-slate-50">

                  <td className="p-5 font-mono font-bold text-slate-500">

                    {est.codigo}

                  </td>



                  <td className="p-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">

                        {est.nombres.charAt(0)}

                        {est.apellidos.charAt(0)}

                      </div>



                      <div>

                        <p className="font-bold text-slate-800">

                          {est.nombres} {est.apellidos}

                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">

                          {est.dni || "Sin DNI"}

                        </p>

                      </div>

                    </div>

                  </td>



                  <td className="p-5">{est.nivel}</td>

                  <td className="p-5">{est.grado}</td>



                  <td className="p-5 text-center">

                    <span className={

                      est.estado === "Activo"

                        ? "rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-700"

                        : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"

                    }>

                      {est.estado}

                    </span>

                  </td>



                  <td className="p-5">

                    <div className="flex justify-end gap-2">

                      <button

                        type="button"

                        onClick={() => handleVerDetalle(est)}

                        title="Ver ficha"

                        className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"

                      >

                        <Eye size={17} />

                      </button>



                      {puedeRegistrar && puedeVerEstudiante(est) && (

                        <button

                          type="button"

                          onClick={() => handleAbrirEdicion(est)}

                          title="Editar"

                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"

                        >

                          <Edit2 size={17} />

                        </button>

                      )}



                      {esAdmin && (

                        <button

                          type="button"

                          onClick={() => void desactivarEstudiante(est.id)}

                          title="Cambiar estado"

                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"

                        >

                          <Trash2 size={17} />

                        </button>

                      )}

                    </div>

                  </td>

                </tr>

              ))}



              {estudiantesFiltrados.length === 0 && (

                <tr>

                  <td

                    colSpan={6}

                    className="p-8 text-center text-sm text-slate-400"

                  >

                    No se encontraron estudiantes.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>



      {/* REGISTRAR / EDITAR ESTUDIANTE */}



      {mostrarModalRegistro && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b bg-slate-50 p-6">

              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">

                <GraduationCap size={21} className="text-emerald-600" />

                {esEdicion

                  ? "Editar Ficha de Estudiante"

                  : "Registrar Nuevo Estudiante"}

              </h3>



              <button

                type="button"

                onClick={() => setMostrarModalRegistro(false)}

                disabled={guardando}

              >

                <X size={18} />

              </button>

            </div>



            <form

              onSubmit={handleGuardar}

              className="space-y-4 p-6 text-xs font-semibold"

            >

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <p className="mb-2 flex items-center gap-2 font-bold text-emerald-900">

                  <UserCheck size={17} />

                  Protección de datos personales

                </p>



                <label className="flex items-start gap-3 font-medium leading-relaxed text-slate-700">

                  <input

                    type="checkbox"

                    checked={autorizacionDatos}

                    onChange={(e) =>

                      setAutorizacionDatos(e.target.checked)

                    }

                    className="mt-1"

                  />

                  <span>

                    Confirmo que la institución ha informado

                    sobre la finalidad de gestión escolar y

                    cuenta con autorización o base legal

                    aplicable para tratar los datos personales.

                  </span>

                </label>



                <p className="mt-2 text-[10px] font-normal text-slate-500">

                  Esta confirmación no sustituye el aviso de

                  privacidad ni la autorización correspondiente.

                </p>

              </div>



              <div>

                <label className="mb-2 block uppercase text-slate-500">

                  DNI del estudiante

                </label>



                <div className="flex gap-2">

                  <input

                    value={formDni}

                    inputMode="numeric"

                    maxLength={8}

                    onChange={(e) =>

                      setFormDni(

                        e.target.value.replace(/\D/g, "")

                      )

                    }

                    placeholder="8 dígitos"

                    className="min-w-0 flex-1 rounded-xl border bg-slate-50 p-3"

                  />



                  <button

                    type="button"

                    onClick={() => void handleBuscarDni()}

                    disabled={!autorizacionDatos || buscandoDni}

                    className="rounded-xl bg-emerald-500 px-4 text-white disabled:opacity-50"

                  >

                    {buscandoDni ? "Buscando..." : "Buscar"}

                  </button>

                </div>



                {mensajeDni && (

                  <p className="mt-2 text-xs text-rose-600">

                    {mensajeDni}

                  </p>

                )}

              </div>



              <div className="grid grid-cols-2 gap-4">

                <label className="block">

                  <span className="mb-2 block uppercase text-slate-500">

                    Nombres

                  </span>



                  <input

                    required

                    value={formNombres}

                    onChange={(e) =>

                      setFormNombres(e.target.value)

                    }

                    className="w-full rounded-xl border bg-slate-50 p-3"

                    placeholder="Nombres"

                  />

                </label>



                <label className="block">

                  <span className="mb-2 block uppercase text-slate-500">

                    Apellidos

                  </span>



                  <input

                    required

                    value={formApellidos}

                    onChange={(e) =>

                      setFormApellidos(e.target.value)

                    }

                    className="w-full rounded-xl border bg-slate-50 p-3"

                    placeholder="Apellidos"

                  />

                </label>

              </div>



              <div className="grid grid-cols-2 gap-4">

                <label>

                  <span className="mb-2 block uppercase text-slate-500">

                    Nivel educativo

                  </span>



                  <select

                    value={formNivel}

                    disabled={esPersonal}

                    onChange={(e) => {

                      const nivel = e.target.value as

                        "Inicial" | "Primaria";



                      setFormNivel(nivel);

                      setFormGrado(GRADOS[nivel][0]);

                    }}

                    className="w-full rounded-xl border bg-slate-50 p-3"

                  >

                    <option value="Inicial">Inicial</option>

                    <option value="Primaria">Primaria</option>

                  </select>

                </label>



                <label>

                  <span className="mb-2 block uppercase text-slate-500">

                    Grado académico

                  </span>



                  <select

                    value={formGrado}

                    disabled={rol === "Profesora"}

                    onChange={(e) =>

                      setFormGrado(e.target.value)

                    }

                    className="w-full rounded-xl border bg-slate-50 p-3"

                  >

                    {GRADOS[formNivel].map((grado) => (

                      <option key={grado} value={grado}>

                        {grado}

                      </option>

                    ))}

                  </select>

                </label>

              </div>



              <div className="flex justify-end gap-3 border-t pt-4">

                <button

                  type="button"

                  onClick={() => setMostrarModalRegistro(false)}

                  disabled={guardando}

                  className="rounded-xl border px-4 py-3"

                >

                  Cancelar

                </button>



                <button

                  type="submit"

                  disabled={!autorizacionDatos || guardando}

                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50"

                >

                  <Check size={16} />

                  {guardando

                    ? "Guardando..."

                    : esEdicion

                      ? "Guardar Cambios"

                      : "Completar Registro"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* FICHA OFICIAL DEL ALUMNO */}



      {mostrarModalDetalle && estudianteSeleccionado && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">



            <div className="flex shrink-0 items-center justify-between bg-emerald-950 p-6 text-white">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-emerald-800 p-2 text-emerald-300">

                  <GraduationCap size={23} />

                </div>



                <div>

                  <h3 className="text-sm font-bold">

                    Ficha Oficial del Alumno

                  </h3>

                  <span className="font-mono text-[10px] text-emerald-300">

                    {estudianteSeleccionado.codigo}

                  </span>

                </div>

              </div>



              <button

                type="button"

                onClick={() => setMostrarModalDetalle(false)}

                className="rounded-lg bg-emerald-900 p-2 text-emerald-300"

              >

                <X size={17} />

              </button>

            </div>



            <div className="space-y-5 overflow-y-auto p-6 text-xs font-semibold">



              <div className="border-b pb-5 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-xl font-black text-emerald-800">

                  {estudianteSeleccionado.nombres.charAt(0)}

                  {estudianteSeleccionado.apellidos.charAt(0)}

                </div>



                <h4 className="mt-3 text-sm font-bold text-slate-800">

                  {estudianteSeleccionado.nombres}{" "}

                  {estudianteSeleccionado.apellidos}

                </h4>



                <p className="mt-1 text-[10px] text-slate-400">

                  I.E.P. Genios del Millennium

                </p>

              </div>



              <div className="grid grid-cols-2 gap-4 rounded-2xl border bg-slate-50 p-4">

                <div>

                  <span className="block text-[9px] uppercase text-slate-400">

                    DNI

                  </span>

                  <span className="mt-1 block text-slate-700">

                    {estudianteSeleccionado.dni || "No registrado"}

                  </span>

                </div>



                <div>

                  <span className="block text-[9px] uppercase text-slate-400">

                    Nivel de estudio

                  </span>

                  <span className="mt-1 block text-slate-700">

                    {estudianteSeleccionado.nivel}

                  </span>

                </div>

              </div>



              <div className="grid grid-cols-2 gap-4 rounded-2xl border bg-slate-50 p-4">

                <div>

                  <span className="block text-[9px] uppercase text-slate-400">

                    Grado y sección

                  </span>

                  <span className="mt-1 block text-slate-700">

                    {estudianteSeleccionado.grado}

                  </span>

                </div>



                <div>

                  <span className="block text-[9px] uppercase text-slate-400">

                    Estado

                  </span>

                  <span className="mt-1 block text-slate-700">

                    {estudianteSeleccionado.estado}

                  </span>

                </div>

              </div>



              {/* PORCENTAJE Y DETALLE DE ÚTILES */}

              <ProgresoUtilesAlumno

                key={estudianteSeleccionado.id}

                estudiante={estudianteSeleccionado}

                listas={listas}

                recepciones={recepciones}

                onVerLista={(id) => {
                  setMostrarModalDetalle(false);
                  onVerLista(id);
                }}

              />



              <button

                type="button"

                onClick={() => setMostrarModalDetalle(false)}

                className="w-full rounded-xl bg-slate-800 px-5 py-3 font-bold text-white hover:bg-slate-900"

              >

                Cerrar Ficha

              </button>

            </div>

          </div>

        </div>

      )}



    </div>

  );

}
