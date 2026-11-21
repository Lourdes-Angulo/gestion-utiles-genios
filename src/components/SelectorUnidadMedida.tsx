
import { useEffect, useId, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Props = {
  supabase: SupabaseClient;
  value: string;
  onChange: (value: string) => void;
  canCreate: boolean;
  disabled?: boolean;
  onGuardandoChange: (guardando: boolean) => void;
};

const OPCION_NUEVA = "__nueva_unidad__";

const CLASE_LABEL =
  "block text-slate-500 mb-1.5 uppercase tracking-wide font-bold";

const CLASE_CAMPO =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white";

const limpiarNombre = (nombre: string) =>
  nombre.trim().replace(/\s+/g, " ");

const claveNombre = (nombre: string) =>
  limpiarNombre(nombre).toLocaleLowerCase("es");

function esErrorPermisos(codigo: string, estado: number) {
  return codigo === "42501" || estado === 401 || estado === 403;
}

export default function SelectorUnidadMedida({
  supabase,
  value,
  onChange,
  canCreate,
  disabled = false,
  onGuardandoChange,
}: Props) {
  const id = useId();

  const [unidades, setUnidades] = useState<string[]>([]);
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let vigente = true;

    setCargando(true);
    setErrorConsulta("");
    setUnidades([]);

    async function cargarUnidades() {
      const nombres: string[] = [];
      const porPagina = 500;

      for (let inicio = 0; vigente; inicio += porPagina) {
        const { data, error, status } = await supabase
          .from("unidades_medida")
          .select("nombre")
          .order("nombre")
          .range(inicio, inicio + porPagina - 1);

        if (!vigente) return;

        if (error) {
          setErrorConsulta(
            esErrorPermisos(error.code ?? "", status)
              ? "Tu cuenta no tiene permiso para consultar las unidades de medida."
              : "No se pudieron cargar las unidades de medida desde Supabase."
          );

          setCargando(false);
          return;
        }

        nombres.push(...(data ?? []).map((unidad) => unidad.nombre));

        if (!data || data.length < porPagina) {
          break;
        }
      }

      if (!vigente) return;

      const opciones = new Map<string, string>();

      for (const unidad of nombres) {
        const clave = claveNombre(unidad);

        if (clave && !opciones.has(clave)) {
          opciones.set(clave, unidad);
        }
      }

      setUnidades(
        [...opciones.values()].sort((a, b) =>
          a.localeCompare(b, "es")
        )
      );

      setCargando(false);
    }

    void cargarUnidades();

    return () => {
      vigente = false;
    };
  }, [supabase]);

  // Las opciones disponibles provienen únicamente de Supabase.
  const nombres = [...unidades];

  // Permite mostrar la unidad histórica de un útil existente,
  // aunque haya sido eliminada del catálogo de unidades.
  const unidadHistorica =
    value &&
    !nombres.some(
      (unidad) => claveNombre(unidad) === claveNombre(value)
    );

  if (unidadHistorica) {
    nombres.push(value);
  }

  function cerrarAlta() {
    setAgregando(false);
    setNombre("");
    setError("");
  }

  async function guardarUnidad() {
    if (!canCreate || disabled || cargando || guardando) {
      return;
    }

    const nombreLimpio = limpiarNombre(nombre);

    if (nombreLimpio.length < 2 || nombreLimpio.length > 60) {
      setError(
        "El nombre debe tener entre 2 y 60 caracteres."
      );
      return;
    }

    if (
      nombres.some(
        (unidad) =>
          claveNombre(unidad) === claveNombre(nombreLimpio)
      )
    ) {
      setError("Esta unidad de medida ya existe.");
      return;
    }

    setGuardando(true);
    onGuardandoChange(true);
    setError("");
    setMensaje("");

    try {
      const {
        data,
        error: errorInsert,
        status,
      } = await supabase
        .from("unidades_medida")
        .insert({ nombre: nombreLimpio })
        .select("nombre")
        .single();

      if (errorInsert) {
        if (errorInsert.code === "23505") {
          setError("Esta unidad de medida ya existe.");
        } else if (
          esErrorPermisos(errorInsert.code ?? "", status)
        ) {
          setError(
            "Supabase rechazó la operación. Tu cuenta no tiene permiso para agregar unidades de medida."
          );
        } else {
          setError(
            "No se pudo guardar la unidad de medida. Intenta nuevamente."
          );
        }

        return;
      }

      if (!data) {
        setError("No se recibió la unidad registrada.");
        return;
      }

      setUnidades((actuales) => {
        const mapa = new Map<string, string>();

        for (const unidad of [...actuales, data.nombre]) {
          const clave = claveNombre(unidad);

          if (clave && !mapa.has(clave)) {
            mapa.set(clave, unidad);
          }
        }

        return [...mapa.values()].sort((a, b) =>
          a.localeCompare(b, "es")
        );
      });

      onChange(data.nombre);
      cerrarAlta();
      setMensaje("Unidad de medida agregada correctamente.");
    } catch {
      setError(
        "Ocurrió un error al guardar la unidad de medida."
      );
    } finally {
      setGuardando(false);
      onGuardandoChange(false);
    }
  }

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={CLASE_LABEL}>
        Unidad de Medida
      </label>

      <select
        id={id}
        value={
          agregando && canCreate
            ? OPCION_NUEVA
            : `unidad:${value}`
        }
        disabled={disabled || guardando || cargando || !!errorConsulta}
        onChange={(event) => {
          const seleccion = event.target.value;

          setMensaje("");
          setError("");

          if (seleccion === OPCION_NUEVA) {
            setAgregando(true);
          } else {
            onChange(seleccion.slice("unidad:".length));
            cerrarAlta();
          }
        }}
        className={CLASE_CAMPO}
      >
        {!value && (
          <option value="unidad:" disabled>
            {cargando
              ? "Cargando unidades..."
              : "Seleccionar unidad"}
          </option>
        )}

        {nombres.map((unidad) => (
          <option
            key={unidad}
            value={`unidad:${unidad}`}
          >
            {unidad}
          </option>
        ))}

        {canCreate && (
          <option
            value={OPCION_NUEVA}
            disabled={cargando || !!errorConsulta}
          >
            + Agregar nueva unidad de medida
          </option>
        )}
      </select>

      {agregando && canCreate && (
        <div className="mt-2 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <label
            htmlFor={`${id}-nombre`}
            className={CLASE_LABEL}
          >
            Nueva unidad de medida
          </label>

          <input
            id={`${id}-nombre`}
            type="text"
            value={nombre}
            maxLength={60}
            placeholder="Ej. Galón"
            disabled={disabled || guardando}
            onChange={(event) => {
              setNombre(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void guardarUnidad();
              }
            }}
            className={CLASE_CAMPO}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || guardando}
              onClick={cerrarAlta}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={disabled || cargando || guardando}
              onClick={() => void guardarUnidad()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-white"
            >
              {guardando ? "Guardando..." : "Agregar"}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-rose-700">
              {error}
            </p>
          )}
        </div>
      )}

      {errorConsulta && (
        <p role="alert" className="mt-1.5 text-rose-700">
          {errorConsulta}
        </p>
      )}

      {mensaje && (
        <p role="status" className="mt-1.5 text-emerald-700">
          {mensaje}
        </p>
      )}
    </div>
  );
}
