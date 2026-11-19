import React, { useState } from "react";
import { useSupabaseClerk } from "../lib/useSupabaseClerk";
import { supabase as supabaseAuth } from "../lib/supabaseClient";

import { useApp } from "../context/AppContext";
import { useRolInstitucional } from "../lib/useRolInstitucional";

import { UtilEscolar } from "../types";

import {

  Search,

  Plus,

  Edit2,

  Trash2,

  Package,

  Check,

  X,

  Filter,

  Eye,

  AlertTriangle,

  Info,
  BookOpen,
  FileText,
  Ruler,
  Scissors,
  Pencil,
  MapPin,
  ImagePlus,
  Camera,
  RotateCcw

} from "lucide-react";



export default function ViewUtiles() {
  const { cliente: supabaseClerk, isSignedIn: sesionClerkActiva } = useSupabaseClerk();
  // Se conserva Supabase Auth para las cuentas institucionales sin sesión Clerk.
  const supabaseImagenes = sesionClerkActiva ? supabaseClerk : supabaseAuth;

  const {

    utiles,

    registrarUtil,

    editarUtil,

    desactivarUtil,

    usuarioActivo

  } = useApp();



  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState(""); // "", "normal", "bajo", "vacio"
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);

  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);

  const [esEdicion, setEsEdicion] = useState(false);

  const [utilSeleccionado, setUtilSeleccionado] = useState<UtilEscolar | null>(null);



  // Form states
  const [formNombre, setFormNombre] = useState("");

  const [formCategoria, setFormCategoria] = useState("Escritura");

  const [formUnidadMedida, setFormUnidadMedida] = useState("Unidad");

  const [formStockActual, setFormStockActual] = useState(0);

  const [formStockMinimo, setFormStockMinimo] = useState(10);
  const [guardandoUtil, setGuardandoUtil] = useState(false);
  const [ofrecerGuardarSinFoto, setOfrecerGuardarSinFoto] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");

  const [formUbicacion, setFormUbicacion] = useState("");
  const [formImagen, setFormImagen] = useState<string | null>(null);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [imagenPrevia, setImagenPrevia] = useState<string | null>(null);

  const seleccionarImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      setErrorGuardado('Solo se permiten imágenes JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setErrorGuardado('La imagen no puede superar 2 MB.');
      e.target.value = '';
      return;
    }
    if (imagenPrevia?.startsWith('blob:')) URL.revokeObjectURL(imagenPrevia);
    setArchivoImagen(archivo);
    setImagenPrevia(URL.createObjectURL(archivo));
    setErrorGuardado('');
    setOfrecerGuardarSinFoto(false);
    e.target.value = '';
  };

  const quitarImagen = () => {
    if (imagenPrevia?.startsWith('blob:')) URL.revokeObjectURL(imagenPrevia);
    setArchivoImagen(null);
    setImagenPrevia(null);
    setFormImagen(null);
    setOfrecerGuardarSinFoto(false);
  };

  const subirImagen = async (): Promise<string | null> => {
    if (!archivoImagen) return formImagen;
    const extension = archivoImagen.type === 'image/png' ? 'png' : archivoImagen.type === 'image/webp' ? 'webp' : 'jpg';
    const ruta = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseImagenes.storage.from('utiles-imagenes').upload(ruta, archivoImagen, {
      contentType: archivoImagen.type,
      upsert: false,
    });
    if (error) throw new Error('No se pudo subir la imagen: ' + error.message + '. Revisa las políticas RLS del bucket utiles-imagenes y que tu sesión tenga un usuario institucional activo.');
    return supabaseImagenes.storage.from('utiles-imagenes').getPublicUrl(ruta).data.publicUrl;
  };



  const [mensajeExito, setMensajeExito] = useState("");



  const { rol } = useRolInstitucional();
  const puedeGestionar = ["Administrador", "Secretaria", "Profesora"].includes(rol ?? "");
  const esAdmin = rol === "Administrador";
  const puedeEditar = puedeGestionar;




  const categorias = ["Escritura", "Papelería", "Arte y Pintura", "Pegamentos", "Juegos Lúdicos", "Psicomotricidad", "Otros"];

  const unidades = ["Unidad", "Caja", "Paquete", "Docena", "Millar"];



  const handleAbrirRegistro = () => {
    if (!puedeGestionar) return;

    setEsEdicion(false);

    setFormNombre("");

    setFormCategoria("Escritura");

    setFormUnidadMedida("Unidad");

    setFormStockActual(0);

    setFormStockMinimo(10);

    setFormUbicacion("");
    setArchivoImagen(null);
    setImagenPrevia(null);
    setFormImagen(null);
    setOfrecerGuardarSinFoto(false);

    setMostrarModalRegistro(true);

  };



  const handleAbrirEdicion = (ut: UtilEscolar) => {
    if (!puedeEditar) return;

    setEsEdicion(true);

    setUtilSeleccionado(ut);

    setFormNombre(ut.nombre);

    setFormCategoria(ut.categoria);

    setFormUnidadMedida(ut.unidadMedida);

    setFormStockActual(ut.stockActual);

    setFormStockMinimo(ut.stockMinimo);

    setFormUbicacion(ut.ubicación);
    setArchivoImagen(null);
    setImagenPrevia(null);
    setOfrecerGuardarSinFoto(false);
    setFormImagen(ut.imagen_url ?? null);

    setMostrarModalRegistro(true);

  };



  const handleVerDetalle = (ut: UtilEscolar) => {

    setUtilSeleccionado(ut);

    setMostrarModalDetalle(true);

  };



  const handleGuardar = async (e: React.SyntheticEvent, omitirFoto = false) => {
    e.preventDefault();
    if (!puedeGestionar || guardandoUtil || !formNombre.trim()) return;
    if (!Number.isSafeInteger(formStockMinimo) || formStockMinimo < 0) {
      setErrorGuardado("El stock mínimo debe ser un número entero mayor o igual a cero.");
      return;
    }
    setGuardandoUtil(true);
    setErrorGuardado("");
    setMensajeExito("");
    try {
      let imagenGuardada: string | null;
      try {
        imagenGuardada = omitirFoto ? formImagen : await subirImagen();
      } catch (error) {
        setOfrecerGuardarSinFoto(true);
        throw error;
      }
      if (esEdicion && utilSeleccionado) {
        await editarUtil({
          ...utilSeleccionado,
          nombre: formNombre.trim(),
          categoria: formCategoria,
          unidadMedida: formUnidadMedida,
          stockActual: esAdmin ? formStockActual : utilSeleccionado.stockActual,
          stockMinimo: formStockMinimo,
          ubicación: formUbicacion,
          imagen_url: imagenGuardada,
        });
        setMensajeExito(omitirFoto ? "Cambios guardados SIN subir la fotografía nueva." : "Útil escolar modificado correctamente en Supabase.");
      } else {
        await registrarUtil({
          codigo: "", // AppContext asigna un código único, no basado en registros visibles.
          nombre: formNombre.trim(),
          categoria: formCategoria,
          unidadMedida: formUnidadMedida,
          stockActual: esAdmin ? formStockActual : 0,
          stockMinimo: formStockMinimo,
          ubicación: formUbicacion,
          imagen_url: imagenGuardada,
          estado: "Activo",
        });
        setMensajeExito(omitirFoto ? "Útil registrado SIN subir la fotografía." : "Útil escolar registrado correctamente en Supabase.");
      }
      setMostrarModalRegistro(false);
    } catch (error) {
      setErrorGuardado(error instanceof Error ? error.message : "No se pudo guardar el útil.");
    } finally {
      setGuardandoUtil(false);
    }
  };

  // Filters application
  const utilesFiltrados = utiles.filter(ut => {

    const term = filtroBusqueda.toLowerCase();

    const cumpleBusqueda = ut.nombre.toLowerCase().includes(term) || ut.codigo.toLowerCase().includes(term) || ut.ubicación.toLowerCase().includes(term);

    const cumpleCategoria = filtroCategoria === "" || ut.categoria === filtroCategoria;



    let cumpleDisponibilidad = true;

    if (filtroDisponibilidad === "normal") {

      cumpleDisponibilidad = ut.stockActual > ut.stockMinimo;

    } else if (filtroDisponibilidad === "bajo") {

      cumpleDisponibilidad = ut.stockActual <= ut.stockMinimo && ut.stockActual > 0;

    } else if (filtroDisponibilidad === "vacio") {

      cumpleDisponibilidad = ut.stockActual === 0;

    }



    return cumpleBusqueda && cumpleCategoria && cumpleDisponibilidad;

  });



  return (

    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f0f4f8]">



      {errorGuardado && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">{errorGuardado}</div>}
      {mensajeExito && (

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 shadow-xs animate-fade-in">

          <Package className="w-5 h-5 text-emerald-600" />

          <span className="text-xs font-bold">{mensajeExito}</span>

        </div>

      )}



      {/* Control Panel */}

      <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div className="relative flex-1 max-w-md">

          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />

          <input

            type="text"

            placeholder="Buscar por código, nombre o ubicación..."

            value={filtroBusqueda}

            onChange={(e) => setFiltroBusqueda(e.target.value)}

            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-200"

          />

        </div>



        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">

            <Filter className="w-3.5 h-3.5 text-slate-400" />

            <select

              value={filtroCategoria}

              onChange={(e) => setFiltroCategoria(e.target.value)}

              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"

            >

              <option value="">Todas las categorías</option>

              {categorias.map(cat => (

                <option key={cat} value={cat}>{cat}</option>

              ))}

            </select>

          </div>



          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">

            <select

              value={filtroDisponibilidad}

              onChange={(e) => setFiltroDisponibilidad(e.target.value)}

              className="text-xs font-semibold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer p-0 pr-6"

            >

              <option value="">Cualquier cantidad</option>

              <option value="normal">Stock Normal</option>

              <option value="bajo">Stock Bajo</option>

              <option value="vacio">Sin Stock</option>

            </select>

          </div>



          {puedeGestionar && (

            <button

              onClick={handleAbrirRegistro}

              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"

            >

              <Plus className="w-4.5 h-4.5" />

              Nuevo Útil Escolar

            </button>

          )}

        </div>

      </div>



      {/* Catálogo compacto y adaptable */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {utilesFiltrados.length > 0 ? (
          utilesFiltrados.map((ut) => {
            const esSinStock = ut.stockActual === 0;
            const esStockBajo = ut.stockActual > 0 && ut.stockActual <= ut.stockMinimo;
            const categoria = ut.categoria.toLowerCase();
            const Icono = categoria.includes("cuaderno") ? BookOpen
              : categoria.includes("papel") ? FileText
              : ut.nombre.toLowerCase().includes("regla") ? Ruler
              : ut.nombre.toLowerCase().includes("tijera") ? Scissors
              : Pencil;

            return (
              <article key={ut.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow min-w-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-16 h-16 shrink-0 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center overflow-hidden">
                    {ut.imagen_url ? <img src={ut.imagen_url} alt={`Imagen de ${ut.nombre}`} className="w-full h-full object-cover" loading="lazy" /> : <Icono className="w-7 h-7" aria-label="Ilustración de referencia" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2 items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900 truncate" title={ut.nombre}>{ut.nombre}</h4>
                      <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${esSinStock ? "bg-rose-100 text-rose-700" : esStockBajo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                        {esSinStock ? "Sin stock" : esStockBajo ? "Stock bajo" : "Disponible"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate" title={`${ut.categoria} · ${ut.codigo}`}>
                      {ut.categoria} · {ut.codigo}
                    </p>
                    <p className="text-xs mt-3 text-slate-700">
                      <span className="font-bold">Mínimo para alertas:</span> {ut.stockMinimo} {ut.unidadMedida}(s)
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-100 mt-3 pt-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-slate-600 min-w-0" title={ut.ubicación || "Sin ubicación"}>
                    <MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{ut.ubicación || "Sin ubicación"}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => handleVerDetalle(ut)} title="Ver detalles" aria-label={`Ver detalles de ${ut.nombre}`} className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                    {puedeEditar && <button type="button" onClick={() => handleAbrirEdicion(ut)} title="Editar" aria-label={`Editar ${ut.nombre}`} className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>}
                    {puedeEditar && esAdmin && <button type="button" onClick={() => desactivarUtil(ut.id)} title={ut.estado === "Activo" ? "Desactivar" : "Activar"} aria-label={`${ut.estado === "Activo" ? "Desactivar" : "Activar"} ${ut.nombre}`} className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 font-semibold">
            No se encontraron útiles escolares en el catálogo con los filtros aplicados.
          </div>
        )}
      </div>


      {/* Modal: Registrar / Editar Útil */}

      {mostrarModalRegistro && (

        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-lg w-full overflow-hidden animate-scale-up">

            <div className="p-6 bg-slate-50 border-b border-slate-150 flex items-center justify-between">

              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">

                <Package className="w-5 h-5 text-emerald-600" />

                {esEdicion ? "Modificar Ficha de Material" : "Adicionar Nuevo Útil Escolar"}

              </h3>

              <button

                onClick={() => setMostrarModalRegistro(false)}

                className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg border border-slate-200"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <form onSubmit={handleGuardar} className="p-6 space-y-4 text-xs font-semibold">

              <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[110px_minmax(0,1fr)] gap-3 items-end">
                <div className="relative group">
                  <label title="Subir o cambiar fotografía" className="relative flex h-[72px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-blue-700 hover:bg-emerald-100 focus-within:ring-2 focus-within:ring-emerald-400">
                    {(imagenPrevia || formImagen)
                      ? <img src={imagenPrevia || formImagen || ''} alt="Foto del útil" className="w-full h-full object-contain p-1" />
                      : <Camera className="w-7 h-7" />}
                    <span className="absolute bottom-0 inset-x-0 bg-emerald-800/90 text-center text-[9px] text-white py-0.5">{(imagenPrevia || formImagen) ? 'Cambiar foto' : 'Subir foto'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={seleccionarImagen} className="sr-only" aria-label="Seleccionar fotografía del útil" />
                  </label>
                  {(imagenPrevia || formImagen) && <button type="button" title="Quitar fotografía" aria-label="Quitar fotografía" onClick={quitarImagen} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-rose-600 border border-rose-200 shadow"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="min-w-0">
                  <label htmlFor="nombre-util" className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Descripción del Útil</label>
                  <input
                    id="nombre-util" type="text" required value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Regla de 30 cm"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>
              <p className="text-[10px] font-normal text-slate-500">Fotografía opcional: JPG, PNG o WEBP (máximo 2 MB). Pulsa la imagen para cambiarla.</p>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Categoría</label>

                  <select

                    value={formCategoria}

                    onChange={(e) => setFormCategoria(e.target.value)}

                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"

                  >

                    {categorias.map(cat => (

                      <option key={cat} value={cat}>{cat}</option>

                    ))}

                  </select>

                </div>

                <div>

                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Unidad de Medida</label>

                  <select

                    value={formUnidadMedida}

                    onChange={(e) => setFormUnidadMedida(e.target.value)}

                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"

                  >

                    {unidades.map(un => (

                      <option key={un} value={un}>{un}</option>

                    ))}

                  </select>

                </div>

              </div>



              <div>
                <div>

                  <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Stock Mínimo Alerta</label>

                  <input

                    type="number"

                    required

                    min={1}

                    value={formStockMinimo}

                    onChange={(e) => setFormStockMinimo(Number(e.target.value))}

                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"

                  />

                </div>

              </div>



              <div>

                <label className="block text-slate-500 mb-1.5 uppercase tracking-wide font-bold">Ubicación física en Almacén</label>

                <input

                  type="text"

                  required

                  value={formUbicacion}

                  onChange={(e) => setFormUbicacion(e.target.value)}

                  placeholder="Ej. Estante A-3, Pasillo Central"

                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"

                />

              </div>



              {errorGuardado && <p role="alert" className="text-red-600 text-xs">{errorGuardado}</p>}
              {ofrecerGuardarSinFoto && archivoImagen && (
                <button
                  type="button"
                  disabled={guardandoUtil}
                  onClick={(e) => void handleGuardar(e, true)}
                  className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-amber-900 hover:bg-amber-100"
                >
                  Guardar los demás cambios sin subir esta foto
                </button>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">

                <button

                  type="button"

                  onClick={() => setMostrarModalRegistro(false)}

                  className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold"

                >

                  <Check className="w-4.5 h-4.5" />

                  {guardandoUtil ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Completar Registro"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Modal: Ver Detalle del Útil */}

      {mostrarModalDetalle && utilSeleccionado && (

        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-md w-full overflow-hidden animate-scale-up">

            <div className="p-6 bg-emerald-950 text-white flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="p-2 bg-emerald-850 rounded-xl text-emerald-300">

                  <Package className="w-6 h-6" />

                </div>

                <div>

                  <h3 className="font-bold text-sm tracking-wide">Ficha de Inventario</h3>

                  <span className="text-[10px] text-emerald-300 font-mono font-bold block mt-0.5">{utilSeleccionado.codigo}</span>

                </div>

              </div>

              <button

                onClick={() => setMostrarModalDetalle(false)}

                className="text-emerald-300 hover:text-white p-1 bg-emerald-900/60 rounded-lg border border-emerald-800"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <div className="p-6 space-y-5 text-xs font-semibold">

              <div>

                <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold mb-1">Nombre del Material</span>

                <span className="text-xs font-bold text-slate-800 block">{utilSeleccionado.nombre}</span>

              </div>



              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">

                <div>

                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Categoría</span>

                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.categoria}</span>

                </div>

                <div>

                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Unidad</span>

                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.unidadMedida}</span>

                </div>

              </div>



              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-bold">Mínimo para alertas</span>
                <span className="text-sm font-black text-slate-800 block mt-1">{utilSeleccionado.stockMinimo} {utilSeleccionado.unidadMedida}(s)</span>
              </div>
              {utilSeleccionado.imagen_url && <img src={utilSeleccionado.imagen_url} alt={`Foto de ${utilSeleccionado.nombre}`} className="h-32 w-full object-contain rounded-xl border border-slate-100" />}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">

                <div>

                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Ubicación Física</span>

                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.ubicación}</span>

                </div>

                <div>

                  <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-bold">Habilitado</span>

                  <span className="text-xs text-slate-700 block mt-0.5">{utilSeleccionado.estado}</span>

                </div>

              </div>



              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2 text-emerald-950">

                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                <div>

                  <span className="text-[10px] font-bold block">Historial y Flujo</span>

                  <p className="text-[9px] mt-0.5 leading-relaxed text-slate-600">

                    Las entradas y salidas de este producto quedan registradas automáticamente con la entrega de útiles escolares por parte de las familias o mediante el reabastecimiento general.

                  </p>

                </div>

              </div>



              <div className="pt-2">

                <button

                  type="button"

                  onClick={() => setMostrarModalDetalle(false)}

                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors w-full font-bold"

                >

                  Cerrar Ficha de Inventario

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



    </div>

  );

}