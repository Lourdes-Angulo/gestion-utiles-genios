# Gestión de Útiles — I.E.P. Genios del Millennium

Sistema de gestión y control de stock de útiles escolares (estudiantes, apoderados,
recepciones, movimientos de almacén, alertas y predicción de stock).

> Prototipo frontend generado inicialmente en Google AI Studio y migrado a este
> repositorio para continuar el desarrollo (backend, autenticación real, etc.).

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Recharts (gráficos) · lucide-react (iconos) · motion (animaciones)

## Requisitos

- Node.js 18+ (o [Bun](https://bun.sh), ya que el repo incluye `bun.lock`)

## Ejecutar en local

```bash
# con npm
npm install
npm run dev

# o con bun
bun install
bun run dev
```

La app se abre en http://localhost:3000

## Variables de entorno

Copia la plantilla y rellena tus valores (el archivo real no se sube al repo):

```bash
cp .env.local.example .env.local
```

| Variable         | Uso                                                      |
| ---------------- | -------------------------------------------------------- |
| `GEMINI_API_KEY` | Solo si implementas la predicción de stock con IA (Gemini) |
| `APP_URL`        | URL base de la app                                       |

## Estado actual del prototipo

- **Datos:** ficticios y en memoria (`src/data/mockData.ts`). Se reinician al recargar.
- **Autenticación:** simulada en el cliente (`src/components/Login.tsx`). **No es segura** — pendiente reemplazar por un backend real.
- **Predicción "con IA":** actualmente son datos precalculados; la integración real con Gemini aún no está implementada.

## Próximos pasos sugeridos

- [ ] Backend + base de datos (persistencia real de estudiantes, útiles, movimientos…)
- [ ] Autenticación real (hash de contraseñas, JWT/sesiones, roles)
- [ ] Conectar la vista de Predicción a la API de Gemini
- [ ] Migrar los datos mock a la base de datos

## Estructura

```
src/
  components/   Vistas y UI (Login, Sidebar, Header, Views…)
  context/      Estado global (AppContext)
  data/         Datos ficticios (mockData.ts)
  types.ts      Modelo de dominio
  main.tsx      Punto de entrada
```
