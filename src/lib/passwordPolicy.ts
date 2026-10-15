export const MINIMO_CONTRASENA = 12;

export function evaluarContrasena(contrasena: string) {
  const reglas = [
    { etiqueta: "Mínimo 12 caracteres", cumple: contrasena.length >= MINIMO_CONTRASENA },
    { etiqueta: "Al menos una mayúscula", cumple: /[A-Z]/.test(contrasena) },
    { etiqueta: "Al menos una minúscula", cumple: /[a-z]/.test(contrasena) },
    { etiqueta: "Al menos un número", cumple: /[0-9]/.test(contrasena) },
    { etiqueta: "Al menos un símbolo", cumple: /[^A-Za-z0-9\s]/.test(contrasena) },
    { etiqueta: "Sin espacios", cumple: !/\s/.test(contrasena) },
  ];

  const esValida = reglas.every((regla) => regla.cumple);
  const nivel = !contrasena
    ? "Sin evaluar"
    : contrasena.length <= 5
      ? "Muy débil"
      : contrasena.length <= 7
        ? "Débil"
        : esValida
          ? "Fuerte"
          : "Media";

  return { reglas, esValida, nivel };
}
