import { CheckCircle2, Circle } from "lucide-react";
import { evaluarContrasena } from "../lib/passwordPolicy";

interface Props { contrasena: string; }

export default function IndicadorSeguridadContrasena({ contrasena }: Props) {
  const { reglas, nivel } = evaluarContrasena(contrasena);
  const total = nivel === "Fuerte" ? 4 : nivel === "Media" ? 3 : nivel === "Débil" ? 2 : nivel === "Muy débil" ? 1 : 0;
  const colores = nivel === "Fuerte" ? "bg-emerald-500" : nivel === "Media" ? "bg-amber-500" : "bg-red-500";
  const texto = nivel === "Fuerte" ? "text-emerald-700" : nivel === "Media" ? "text-amber-700" : nivel === "Sin evaluar" ? "text-slate-500" : "text-red-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Seguridad de la contraseña</span>
        <strong className={texto}>{nivel}</strong>
      </div>
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full ${i < total ? colores : "bg-slate-200"}`} />
        ))}
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {reglas.map((regla) => (
          <li key={regla.etiqueta} className={`flex items-center gap-1.5 text-xs ${regla.cumple ? "text-emerald-700" : "text-slate-500"}`}>
            {regla.cumple ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {regla.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  );
}
