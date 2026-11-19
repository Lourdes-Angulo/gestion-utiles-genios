# Gestión de años escolares

## Estado de la entrega

Implementación local con migraciones preparadas. Las migraciones se ejecutaron en PostgreSQL embebido mediante PGlite con un esquema de prueba derivado de los tipos y consultas del repositorio. La base remota de Supabase, sus políticas actuales, Storage y sus sesiones reales requieren validación al desplegar. No se ejecutaron cambios remotos.

## Análisis del repositorio

- `App.tsx` mantiene autenticación dual. Administrador y Secretaria usan Supabase Auth. Profesora y Auxiliar usan Clerk con `usuarios.clerk_user_id`. El rol Directora no está implementado.
- `permisosRoles.ts` centraliza navegación. `AppContext.tsx` recibe el cliente autenticado desde App. El módulo nuevo utiliza ese cliente.
- `estudiantes` conserva una ficha por persona con `nivel` y `grado` actuales. Antes de este cambio no había un modelo local de matrículas históricas.
- `listas_utiles` ya contiene `anioEscolar`, `nivel`, `grado` e `items` JSON. El catálogo `utiles` es compartido.
- `recepciones` conserva cantidades acumuladas en `items`. La definición remota de `sigue_guardar_recepcion` está ausente. Se añadió una RPC anual independiente para períodos gestionados.
- `utiles.stockActual` es el saldo físico compartido. `movimientos` conserva entradas y salidas con los saldos anterior y resultante. Control de stock obtiene el saldo inicial por diferencia. Por tanto, una entrada de apertura duplicaría las existencias.
- Las alertas automáticas persistidas estaban deshabilitadas en AppContext. Para los períodos gestionados se calculan alertas visibles desde las unidades aptas y el stock mínimo, conservando el historial persistido de alertas resueltas.
- La predicción utiliza movimientos históricos de salida. El contexto entrega movimientos del año activo y excluye las salidas administrativas de bajas y cierre del cálculo de consumo pedagógico. El reporte anual permite consultar otros años por separado.
- Las migraciones anteriores incluyen auditoría y vinculación de `authUserId`. Faltan las definiciones completas de las tablas principales, políticas actuales y RPC de recepción. El diagnóstico adjunto permite verificar sus tipos y triggers reales antes de aplicar estos cambios.

## Funcionalidades

- Menú de años debajo de Inicio para Administrador. Acceso a preparación desde Estudiantes para Secretaría.
- Creación de años en preparación, fechas, observaciones, consulta de años, cierre y activación independientes.
- Un año activo mediante índice único parcial. Un registro por número de año.
- Matrícula única por estudiante y año, conservando la ficha y el historial. Se admiten estudiantes nuevos y retornantes mediante selección explícita de la ficha existente.
- Continuidad individual con seis situaciones, filtros por nombre, nivel, grado y situación, observaciones, responsable y fecha. Las sugerencias no crean matrículas.
- Aprobación administrativa de decisiones explícitas de continuidad. Los pendientes, retirados, trasladados y egresados no generan matrícula. Las aprobaciones preparatorias se pueden reabrir, con auditoría de la modificación.
- Copia explícita de listas como plantillas. Las recepciones del nuevo año permanecen pendientes hasta su registro.
- Selección de año en Listas, lectura de años cerrados y demanda calculada con matrículas del año seleccionado.
- Recepción transaccional por matrícula, control de aula para docentes y auxiliares y movimientos únicamente por la diferencia entregada. Una repetición con las mismas cantidades acumuladas no incrementa stock.
- Evaluación de inventario con cantidades buenas, deterioradas, vencidas, inutilizables y comprometidas. La suma debe coincidir con el stock contabilizado. La confirmación de conteo físico es explícita.
- Desde la evaluación, las operaciones de salida sólo pueden consumir unidades buenas. Entradas y salidas ordinarias ajustan la clasificación buena y el total contabilizado en la misma transacción.
- Baja autorizada por Administrador con motivo, observaciones, evidencia opcional y movimiento atómico.
- Cierre con revisión de todos los productos y estudiantes, acta, instantánea inmutable de la evaluación, segregación de materiales no aptos y saldo de apertura referencial. Se exige resolver los compromisos antes de cerrar.
- Recuperación documentada de deteriorados. El saldo pendiente de recuperación disminuye y una entrada devuelve únicamente las unidades recuperadas al stock apto. La evaluación original permanece conservada.
- Evidencias JPG, PNG o WebP en bucket privado y consulta con enlace firmado de cinco minutos.
- Reportes anuales con matrículas, estado de recepción, CSV, movimientos y fotografía contable de cierre. Consulta adicional de registros previos sin período verificado.
- Asignaciones anuales de profesoras y auxiliares en preparación. Se aplican a sus perfiles al activar el año, conservando las cuentas y el historial de asignaciones.
- Auditoría anual con responsable institucional e identidad textual del JWT. La vista Auditoría incluye los eventos del módulo.

## Decisiones de implementación

`stockActual` sigue representando unidades físicas en el circuito operativo. Antes del cierre, el stock apto disponible se distingue de los compromisos y materiales no aptos mediante la evaluación. Al cerrar, los no aptos se segregan mediante una salida. Los deteriorados quedan en el registro de revisión. Los vencidos e inutilizables quedan documentados en el acta y su evaluación. El saldo de apertura de destino referencia las unidades buenas que ya existen y no crea una entrada.

Las cantidades comprometidas se registran explícitamente durante el conteo. El repositorio carece de un modelo de reservas. Una cantidad comprometida impide el cierre hasta que se resuelva y se vuelva a confirmar la clasificación.

Las operaciones administrativas se serializan mediante bloqueo transaccional y bloqueos de las filas de stock. Una tabla privada de operaciones guarda la clave de idempotencia y su resultado. El reintento de la misma clave y datos retorna el resultado anterior. Usar una clave con datos diferentes produce un error. El cliente conserva claves pendientes durante la sesión para permitir reintentos tras una respuesta perdida.

Las tablas nuevas tienen RLS y lectura autorizada. La escritura se realiza mediante RPC con comprobación del perfil institucional activo y del rol. Las funciones internas y la tabla de autorización de operaciones de cierre carecen de acceso para los roles de API. Los triggers añadidos a tablas existentes validan períodos y cantidades aptas. Las políticas RLS existentes de esas tablas se conservan. Las políticas de Storage se limitan al bucket nuevo.

Los registros operativos anteriores quedan con período nulo hasta una revisión explícita. Esto evita atribuir un año por el grado actual de un estudiante o por una fecha supuesta. La asignación inicial no vuelve a sumar stock.

## Aplicación de migraciones

1. Ejecutar `supabase/diagnostico_anios.sql` en SQL Editor. Es de sólo lectura.
2. Comparar el resultado con los campos usados en las migraciones. Los identificadores de usuarios, estudiantes, útiles, listas y recepciones se esperan como texto o varchar. Los movimientos deben generar su propio ID y admitir los campos existentes usados por AppContext. Las columnas JSON `items` se esperan como JSONB. Adaptar la migración a los tipos reales si difieren.
3. Revisar las políticas de `usuarios` para que ningún perfil pueda otorgarse roles o cambiar su vínculo de autenticación. Comprobar que el proveedor Clerk ya esté configurado como autenticación de terceros y que sus JWT se validen en Supabase.
4. Revisar todos los triggers de movimientos y útiles. Las RPC nuevas insertan el movimiento y escriben el saldo resultante de forma explícita, siguiendo las columnas existentes. Un trigger remoto que también contabilice movimientos debe armonizarse antes del despliegue para conservar una única contabilización.
5. Revisar la función remota de auditoría. La versión antigua incluida en el repositorio usa `auth.uid()` y exige UUID. Una instalación que conserve esa versión necesita adaptar su auditoría de tablas existentes para aceptar la identidad Clerk, preservando sus campos y comportamiento actuales. `eventos_anios` ya admite ambas identidades.
6. Aplicar en este orden, primero en un entorno de desarrollo con el esquema real.

| Orden | Archivo |
| --- | --- |
| 1 | `20261113_01_anios_escolares.sql` |
| 2 | `20261113_02_operaciones_anuales.sql` |
| 3 | `20261113_03_idempotencia_evidencias.sql` |
| 4 | `20261113_04_asignacion_historica.sql` |
| 5 | `20261113_05_recepcion_anual.sql` |

Cada archivo se ejecuta en una transacción. Deben aplicarse una vez mediante el historial de migraciones de Supabase o, en SQL Editor, manteniendo un registro de cuáles finalizaron. Los archivos anteriores del repositorio tienen comentarios de revisión previa y un orden de nombres que no representa todas sus dependencias. Si la base ya los tiene aplicados, aplicar solamente las cinco migraciones nuevas.

No se requiere una Edge Function ni una clave privilegiada en el frontend. Se mantienen las variables de entorno existentes. La tercera migración configura `evidencias-anuales` como privado con límite de 5 MB. Verificar que un bucket con ese nombre no tenga previamente otra configuración, pues el script preserva un bucket ya existente.

## Preparación del primer año real

1. Crear el año confirmado por la institución y dejarlo en preparación.
2. Registrar las matrículas verificadas desde Matrículas e historial, seleccionando las fichas existentes y su grado real para ese período.
3. Revisar qué recepciones y movimientos previos pertenecen a ese año. Los IDs están disponibles en Reportes, en la consulta de registros sin período.
4. Desde un cliente autenticado como Administrador, invocar la asignación con los IDs revisados. Los nombres del ejemplo representan variables obtenidas de esa revisión.

```ts
await cliente.rpc('sigue_asignar_historico', {
  p_anio: idAnioVerificado,
  p_recepciones: idsRecepcionesRevisadas,
  p_movimientos: idsMovimientosRevisados,
});
```

La función exige que las recepciones tengan matrícula revisada. El índice de recepción por matrícula detecta consolidaciones duplicadas. Si hay varias recepciones históricas del mismo estudiante que deban pertenecer al mismo año, revisar su modelo de entregas antes de asignarlas. Los registros originales se conservan.

5. Verificar las listas existentes para ese año y preparar las asignaciones del personal.
6. Activar el primer año. La asignación inicial se cierra al existir un año activo o cerrado. Los registros sin revisar siguen conservados y consultables por separado.

## Comandos y resultados

Se añadió PGlite como dependencia de desarrollo para probar PostgreSQL y las políticas con roles locales. `npm test` usa el soporte nativo de TypeScript de Node.js 22.18 o superior. La ejecución se verificó con Node.js 24.

```powershell
npm.cmd install
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

En una terminal que admita los lanzadores de PowerShell se pueden usar `npm` y `npx`. En este equipo, la política de ejecución exige `npm.cmd` y `npx.cmd`.

Las pruebas automáticas cubren la creación simultánea de años en distintos estados, duplicados, índice de año activo, selección individual, repetición, retiro, traslado, egreso, aprobación, correcciones, matrícula de nuevos y retornantes, copia idempotente de listas, recepción incremental, evaluación, bajas, compromisos, cierre repetido, apertura sin duplicar stock, recuperación, lectura histórica, asignaciones, RLS, funciones internas y migración inicial explícita.

Resultados de la ejecución local del 13 de noviembre de 2026.

| Comando | Resultado |
| --- | --- |
| `npx.cmd tsc --noEmit` | Correcto, sin errores. |
| `npm.cmd test` | 22 pruebas aprobadas, cero fallos. |
| `npm.cmd run build` | Correcto. Advertencia de bundle superior a 500 kB. |

La primera ejecución de build quedó bloqueada por permisos del aislamiento al resolver `vite.config.ts`. La ejecución autorizada fuera del aislamiento finalizó correctamente. La instalación de dependencias informó seis vulnerabilidades en el árbol instalado. Su análisis y corrección requieren una revisión de dependencias adicional.

La prueba de sesión comprueba el código del temporizador y la ubicación estable de MainLayout. La conservación real de formularios al cambiar de pestaña y el cierre tras diez minutos requieren las comprobaciones de navegador descritas a continuación.

## Validación de aceptación en Supabase y navegador

| Solicitud | Cobertura local y comprobación de despliegue |
| --- | --- |
| Crear 2027 con 2026 activo | PostgreSQL local. Confirmar también en la UI con los años reales de prueba. |
| Impedir dos activos y años duplicados | RPC e índice único probados. |
| Promoción selectiva, repetición, retiro y egreso | Probados con decisiones independientes y aprobación. |
| Nuevas matrículas sin duplicar personas | Probado mediante referencias a fichas existentes. |
| Copia de listas sin entregas | Probada. Revisar edición de la plantilla en Listas. |
| Evaluación y recuperación de deteriorados | Probadas. Validar adjunto y consulta de fotos en Storage remoto. |
| Bajas | Probadas con reintento y fallo transaccional. |
| Traslado sin duplicar stock | Probado con instantánea, salida de segregación y apertura referencial. |
| Bloqueo de períodos cerrados | Probado en recepciones, movimientos, listas y stock. |
| Reportes históricos | Consultas PostgreSQL probadas. Verificar tablas y descarga CSV en navegador. |
| Administrador y Secretaría | Probados con identidades y roles diferenciados. |
| Profesora y Auxiliar | Denegación administrativa y control de aula probados. Verificar JWT reales de Clerk. |
| Formularios al cambiar de pestaña | Abrir formularios de Mi perfil, Usuarios, Catálogo y años. Cambiar de pestaña, volver y provocar renovación de token. Confirmar que siguen abiertos y con su contenido. Pendiente de QA autenticada. |
| Diez minutos de inactividad | Comprobación estática del valor. Dejar la sesión real inactiva diez minutos y confirmar cierre, incluyendo otra pestaña del sistema. Pendiente de QA autenticada. |
| Repetición de cierre | Probada con nuevas solicitudes y misma clave de operación. |
| RLS y privilegios | Probados en tablas nuevas, funciones internas y roles anónimos. Repetir contra las políticas remotas existentes. |

## Archivos

### Creados

- `src/lib/aniosEscolares.ts`
- `src/components/ViewAniosEscolares.tsx`
- `src/components/PreparacionMatriculas.tsx`
- `src/components/AsignacionesAnuales.tsx`
- `src/components/BajaInventario.tsx`
- `src/components/EvidenciaAnual.tsx`
- `src/components/ReporteAnual.tsx`
- Cinco migraciones `supabase/migrations/20261113_*.sql`
- `supabase/diagnostico_anios.sql`
- `tests/aniosEscolares.test.ts`
- `docs/ANIOS_ESCOLARES.md`

### Modificados para el módulo

- `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/Header.tsx` y `src/lib/permisosRoles.ts`, para navegación y acceso.
- `src/context/AppContext.tsx` y `src/types.ts`, para períodos, matrículas, stock apto y operaciones anuales.
- `src/components/ViewEstudiantes.tsx`, `ViewListasUtiles.tsx` y `ViewRecepcion.tsx`, para preparación y separación por período.
- `src/components/ViewControlStock.tsx`, `ViewMovimientos.tsx`, `ViewPrediccion.tsx`, `ViewInicio.tsx`, `ViewAlertas.tsx` y `ViewReportes.tsx`, para inventario apto y consultas anuales.
- `src/components/ViewAuditoria.tsx`, para eventos del módulo.
- `package.json` y `package-lock.json`, para la ejecución de pruebas PostgreSQL.

El árbol de trabajo ya contenía cambios en App, Sidebar, Mi perfil, Usuarios, Catálogo, su versión demo, permisos y tipos antes de esta implementación. La entrega se realizó sobre ese estado local. El diff total contra Git incluye esos cambios previos.

## Pendientes y compatibilidad

- Aplicación y verificación de migraciones en el esquema remoto real, incluyendo sus triggers y RLS.
- QA de autenticación real, formularios, expiración de sesión, diseño responsive y Storage. Las pruebas embebidas usan tablas de prueba compatibles con las consultas locales y no certifican la configuración remota.
- La predicción actual sigue siendo el cálculo existente por año activo. El acceso a los años anteriores está disponible en Reportes. Un entrenamiento predictivo multianual requiere definir y validar el modelo de predicción del proyecto.
- Las reservas se declaran durante el conteo físico. Una integración automática con compromisos externos requiere un modelo de reservas real.
- El script inicial conserva registros sin período. Su clasificación depende de la revisión institucional y no se automatiza.
- Los adjuntos se suben antes de confirmar la transacción SQL. Si la operación falla puede quedar una evidencia sin referencia. Su revisión debe hacerse sobre el bucket privado.
- Vite informa del tamaño del bundle principal. La optimización de carga queda fuera del módulo solicitado.

No se alteró la lógica de autenticación, recuperación, verificación, sesión por inactividad ni el montaje de MainLayout. En App sólo se añadió la importación y la ruta interna de la vista nueva.
