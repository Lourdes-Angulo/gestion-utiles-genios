
import React, { useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  Download,
  History,
  FileClock,
} from "lucide-react";

interface RegistroAuditoria {
  id: string;
  usuario: string;
  accion: "Creación" | "Modificación" | "Eliminación";
  modulo: string;
  descripcion: string;
  fecha: string;
}

const registrosDemo: RegistroAuditoria[] = [
  {
    id: "AUD-001",
    usuario: "Administrador (demo)",
    accion: "Creación",
    modulo: "Usuarios",
    descripcion: "Creó una cuenta de usuario de prueba",
    fecha: "2026-10-11T09:15:00",
  },
  {
    id: "AUD-002",
    usuario: "Secretaría (demo)",
    accion: "Modificación",
    modulo: "Estudiantes",
    descripcion: "Actualizó datos del estudiante E012",
    fecha: "2026-10-11T10:20:00",
  },
  {
    id: "AUD-003",
    usuario: "Administrador (demo)",
    accion: "Eliminación",
    modulo: "Listas de útiles",
    descripcion: "Eliminó una lista de prueba",
    fecha: "2026-10-11T11:32:00",
  },
];

export default function ViewAuditoria() {
  const [busqueda, setBusqueda] = useState("");
  const [accion, setAccion] = useState("Todas");

  const registrosFiltrados = useMemo(() => {
    return registrosDemo.filter((registro) => {
      const coincideBusqueda = [
        registro.usuario,
        registro.modulo,
        registro.descripcion,
      ]
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase());

      const coincideAccion =
        accion === "Todas" || registro.accion === accion;

      return coincideBusqueda && coincideAccion;
    });
  }, [busqueda, accion]);

  const exportarCSV = () => {
    const cabeceras = [
      "ID",
      "Usuario",
      "Accion",
      "Modulo",
      "Descripcion",
      "Fecha",
    ];

    const filas = registrosFiltrados.map((r) => [
      r.id,
      r.usuario,
      r.accion,
      r.modulo,
      r.descripcion,
      r.fecha,
    ]);

    const escapar = (valor: string) => {
      const seguro = /^[=+\-@\t\r]/.test(valor) ? "'" + valor : valor;
      return '"' + seguro.replace(/"/g, '""') + '"';
    };

    const csv = [cabeceras, ...filas]
      .map((fila) => fila.map(escapar).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "auditoria_SIGUE_DEMO.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-800">
              <ShieldCheck className="text-emerald-600" />
              Historial de Auditoría
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vista de demostración. Los registros no son reales.
            </p>
          </div>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Download size={18} />
            Exportar CSV (demo)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              titulo: "Total de actividades",
              valor: registrosDemo.length,
              icono: History,
            },
            {
              titulo: "Modificaciones",
              valor: registrosDemo.filter(
                (r) => r.accion === "Modificación"
              ).length,
              icono: FileClock,
            },
            {
              titulo: "Eliminaciones",
              valor: registrosDemo.filter(
                (r) => r.accion === "Eliminación"
              ).length,
              icono: ShieldCheck,
            },
          ].map((tarjeta) => (
            <div
              key={tarjeta.titulo}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <tarjeta.icono
                className="mb-3 text-emerald-600"
                size={24}
              />
              <p className="text-sm text-slate-500">
                {tarjeta.titulo}
              </p>
              <p className="text-3xl font-bold text-slate-800">
                {tarjeta.valor}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar usuario, módulo o actividad..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
              />
            </div>

            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <option>Todas</option>
              <option>Creación</option>
              <option>Modificación</option>
              <option>Eliminación</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Fecha y hora</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Acción</th>
                  <th className="p-3">Módulo</th>
                  <th className="p-3">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((registro) => (
                  <tr
                    key={registro.id}
                    className="border-b border-slate-100"
                  >
                    <td className="whitespace-nowrap p-3">
                      {new Date(registro.fecha).toLocaleString("es-PE")}
                    </td>
                    <td className="p-3">{registro.usuario}</td>
                    <td className="p-3">{registro.accion}</td>
                    <td className="p-3">{registro.modulo}</td>
                    <td className="p-3">{registro.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {registrosFiltrados.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No se encontraron registros.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
