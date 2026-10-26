
import type {
  Estudiante,
  ListaUtil,
  Recepcion,
} from "../types";

export function calcularProgresoUtiles(
  estudiante: Estudiante,
  listas: ListaUtil[],
  recepciones: Recepcion[]
) {
  // Buscar la lista correspondiente al grado y nivel.
  const listasDelGrado = listas
    .filter(
      (lista) =>
        lista.nivel === estudiante.nivel &&
        lista.grado === estudiante.grado
    )
    .sort((a, b) =>
      b.anioEscolar.localeCompare(a.anioEscolar, "es", {
        numeric: true,
      })
    );

  const lista = listasDelGrado[0];

  if (!lista) {
    return {
      tieneLista: false,
      porcentaje: 0,
      totalRequerido: 0,
      totalEntregado: 0,
      totalPendiente: 0,
      items: [] as {
        utilId: string;
        nombre: string;
        requerido: number;
        entregado: number;
        pendiente: number;
      }[],
    };
  }

  // La recepción más reciente representa el estado
  // acumulado de las entregas del estudiante.
  const recepcionActual = recepciones
    .filter((r) => r.estudianteId === estudiante.id)
    .sort((a, b) =>
      b.fechaRecepcion.localeCompare(a.fechaRecepcion)
    )[0];

  const items = lista.items.map((item) => {
    const requerido = Math.max(
      0,
      Number(item.cantidadRequerida) || 0
    );

    const registrado = recepcionActual?.items.find(
      (r) => r.utilId === item.utilId
    );

    const entregado = Math.min(
      requerido,
      Math.max(
        0,
        Number(registrado?.cantidadEntregada) || 0
      )
    );

    return {
      utilId: item.utilId,
      nombre: item.utilNombre,
      requerido,
      entregado,
      pendiente: requerido - entregado,
    };
  });

  const totalRequerido = items.reduce(
    (total, item) => total + item.requerido,
    0
  );

  const totalEntregado = items.reduce(
    (total, item) => total + item.entregado,
    0
  );

  const totalPendiente = items.reduce(
    (total, item) => total + item.pendiente,
    0
  );

  const porcentaje =
    totalRequerido > 0
      ? Math.round(
          (totalEntregado / totalRequerido) * 100
        )
      : 0;

  return {
    tieneLista: true,
    porcentaje,
    totalRequerido,
    totalEntregado,
    totalPendiente,
    items,
  };
}
