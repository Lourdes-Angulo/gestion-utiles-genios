# Demostración de gestión de años escolares

Ingresar como Administrador y abrir Año escolar desde la cabecera. El acceso de gestión se retiró del menú lateral. Seleccionar Modo demostración. El selector de consulta de la cabecera elige qué período mostrar y nunca activa un año ni modifica la configuración institucional.

## Recorrido para Taller Integrador II

1. Crear 2027 en preparación. Las diez etapas muestran el avance y los bloqueos.
2. Consultar 2026 y guardar decisiones individuales. Se incluyen ocho estudiantes ficticios de distintos grados.

| Estudiante ficticio | Grado de 2026 | Ejemplo de decisión |
| --- | --- | --- |
| Ana Torres | Inicial 3 años | Promoción a Inicial 4 años |
| Bruno Salas | Inicial 5 años | Promoción a 1er Grado |
| Carla Ríos | 3er Grado | Promoción a 4to Grado |
| Diego Luna | 2do Grado | Repite 2do Grado |
| Elena Vega | 4to Grado | Se retira |
| Fabio Soto | 5to Grado | Se traslada |
| Gabriela León | 6to Grado | Egresa |
| Hugo Díaz | 1er Grado | Dejar pendiente para demostrar el bloqueo |

Todas las decisiones comienzan pendientes. Las sugerencias de promoción no se guardan automáticamente. Antes de completar el ciclo, resolver también el caso de Hugo, por ejemplo mediante repetición.

3. Seleccionar 2027 y abrir Matrículas. Confirmar individualmente cada matrícula de continuidad. Guardar una promoción por sí sola no crea matrícula. Cambiar una decisión elimina su matrícula preparatoria anterior y exige una nueva confirmación.
4. Preparar las listas de 2027 por cada grado confirmado. Hay ocho materiales y las cantidades son editables. Las listas de 2026 permanecen en su período. Las recepciones anteriores no se copian.
5. Seleccionar 2026 y evaluar cada material. Para los lápices, clasificar 30 unidades en 25 buenas, 3 deterioradas y 2 inutilizables. Para los demás se puede usar total menos 5 buenas, 3 deterioradas y 2 inutilizables. También se puede ensayar la categoría vencidos.
6. Registrar las bajas autorizadas de cada material no apto.
7. Revisar el cierre anual y simular su aprobación administrativa. Las decisiones, matrículas, listas, evaluaciones o bajas pendientes impiden el cierre. Una edición posterior a la revisión exige revisarla nuevamente. La aprobación bloquea modificaciones hasta activar.
8. Activar 2027. El ciclo anterior queda completo y se puede consultar 2026 en todas las secciones como solo lectura.
9. Comparar las matrículas. Carla conserva 3er Grado en 2026 y figura en 4to Grado en 2027. Retirados, trasladados y egresados conservan su matrícula de 2026.
10. Consultar las listas, recepciones, movimientos, evaluaciones, cierre y reporte anual de 2026. Los reportes se calculan desde los registros del período seleccionado.
11. Recargar y seleccionar otra vez Modo demostración para recuperar los avances. Reiniciar simulación elimina únicamente el almacenamiento ficticio de este módulo.

## Inventario por período

Cada año conserva su apertura disponible, apertura segregada, saldo físico previo a evaluar, clasificación y bajas autorizadas. El ejemplo de lápices conserva en 2026 las 30 unidades contabilizadas, los 25 aptos, los 3 deteriorados y las 2 bajas. En 2027 aparecen 25 disponibles y 3 segregados en revisión, con 28 unidades físicas bajo custodia. Las dos bajas completan la conciliación de las 30 unidades originales.

Los traslados de aptos y la custodia segregada se registran en el cierre como continuidad de saldo. La apertura del siguiente período no genera una recepción, compra ni un segundo ingreso físico. Las evaluaciones del siguiente año son independientes de las históricas.

Los registros iniciales incluyen listas, una recepción ficticia desglosada por material y movimientos de recepción conciliados con los saldos. El reporte distingue matriculados, promovidos, repitentes, retirados, trasladados, egresados, pendientes, recibidos, disponibles, aptos trasladados, deteriorados y bajas. Los años abiertos muestran un reporte provisional.

## Persistencia y permisos

Se utiliza exclusivamente la clave local sigue:demostracion:anios-escolares:v2 con versión de formato 2 y vencimiento a las 48 horas desde el último guardado. Guarda objetos ficticios por período. No contiene contraseñas, tokens, identificadores de sesión ni registros institucionales. Los formatos corruptos, vencidos o incompatibles se descartan con un aviso. Si el navegador impide guardar, la interfaz informa que los avances quedan en memoria.

El reinicio reemplaza los avances de esa clave por la simulación inicial de 2026 y conserva la elección de modo demostración. La limpieza del estado de sesión existente elimina esa clave, incluyendo cierre manual, expiración de sesión e inactividad. La recarga de una sesión autenticada conserva la demostración. Cambiar a Modo real o abandonar el módulo conserva temporalmente los avances ficticios para la exposición.

Administrador puede ejecutar el ciclo. Secretaria conserva su acceso a preparación desde Estudiantes y puede guardar decisiones individuales. Las acciones administrativas y el reinicio requieren Administrador. Profesora y Auxiliar carecen de acceso al módulo. El rol Directora no existe en la definición actual de roles. La autorización se obtiene del rol de sesión validado, independientemente del contenido guardado localmente.

## Archivos ajustados en esta mejora

- src/lib/demoAniosEscolares.ts amplía el motor previo con datos por período, matrícula explícita, catálogo, reportes calculados y etapas.
- src/components/DemoAniosEscolares.tsx amplía la interfaz previa con consulta anual, secciones históricas, confirmaciones y persistencia.
- src/lib/demoAniosStorage.ts incorpora almacenamiento local aislado, validación, versión, caducidad y limpieza.
- src/App.tsx añade una importación y una llamada a limpiarDemo dentro de limpiarEstado, reutilizando el ciclo de cierre existente.
- tests/demoAniosEscolares.test.ts actualiza las pruebas para el historial y persistencia.
- docs/demo-anios-escolares.md actualiza el recorrido de exposición.

La implementación conserva el selector explícito entre modo real y demostración, el botón de cabecera, los servicios y las migraciones existentes. Esta mejora desarrolla el historial de la simulación. La operación institucional real conserva sus servicios, referencias anuales y controles RLS existentes. Las migraciones se revisan como código y se prueban en la base local de pruebas, sin ejecutarlas remotamente.

## Validación

- npx.cmd tsc --noEmit verifica los tipos.
- npm.cmd run build genera la compilación de producción. Vite informa el aviso de paquetes mayores a 500 kB.
- npm.cmd test ejecuta las 22 pruebas existentes con PostgreSQL local PGlite, RLS y transacciones.
- node --test tests/demoAniosEscolares.test.ts ejecuta 10 pruebas del historial, matrículas, inventario, reportes, bloqueos, permisos, persistencia y aislamiento de red.

La persistencia se comprueba guardando y recuperando el mismo formato a través de un almacenamiento con la interfaz de localStorage. El escenario conserva el reporte y los grados de 2026 después de activar y recuperar 2027. La inspección automatizada también verifica que la simulación y su almacenamiento carecen de funciones de acceso a red.

La interacción visual con navegador no pudo completarse porque el servicio de acceso al navegador informó que su host no está disponible. La validación de recarga corresponde al almacenamiento y al flujo de datos, sin una recarga de navegador autenticado.

## Ajuste de navegación y consulta compartida

El orden de los controles de cabecera es campana, botón verde Año escolar, selector de consulta y Mi perfil. La cabecera admite varias líneas en pantallas pequeñas. El selector muestra únicamente los períodos devueltos por los permisos de Supabase o los períodos existentes en el estado de demostración. Una lista vacía muestra Sin períodos. Los errores reales se informan y nunca seleccionan datos ficticios.

El botón administrativo mantiene la ruta interna anios_escolares y el permiso existente. El acceso visible del Sidebar se eliminó. Todos los roles institucionales existentes pueden seleccionar los períodos permitidos por RLS. La administración continúa restringida al Administrador y Directora sigue sin existir en la definición de roles.

ConsultaAnualProvider comparte el modo y la selección, conservando selecciones independientes para real y demostración. El estado ficticio se elevó desde el componente existente a este proveedor para compartirlo al navegar. La cabecera, el selector interno de gestión, listas y reportes usan la misma selección. Seleccionar un período no llama RPC ni modifica tablas o la configuración del año activo.

En demostración, Estudiantes, Listas, Recepción, Control de stock, Movimientos y Reportes consultan el mismo período ficticio en modo de lectura. La edición del ciclo permanece en Año escolar. Inicio, Catálogo y Predicción muestran su integración pendiente cuando se consulta la simulación.

En modo real, los períodos históricos y en preparación utilizan consultas de lectura. Se reutiliza ReporteAnual para matrículas, recepciones, movimientos y saldos de cierre. Las listas históricas se filtran por año y conservan las restricciones adicionales de nivel y aula del rol. La gestión de un año cerrado muestra el reporte de lectura. En el período activo se mantienen las pantallas operativas existentes. Estudiantes muestra las matrículas y grados del período activo, y Listas utiliza la selección compartida.

Las pantallas operativas visitadas permanecen montadas y ocultas mediante display none al navegar o consultar un año histórico. Esto conserva su estado local y los formularios abiertos al volver al período activo. Los componentes que dejan de estar autorizados por el rol se retiran. La persistencia de formularios durante recargas sigue dependiendo del comportamiento existente de cada formulario.

Cuando no hay infraestructura anual disponible, los módulos existentes siguen mostrando sus registros operativos con un aviso de período sin verificar. No se les asigna un año ficticio. Inicio, Catálogo y Predicción muestran integración anual pendiente al consultar un período distinto al activo. Los reportes históricos reales se presentan mediante la vista anual común, sin reproducir todavía todos los filtros y gráficos de cada módulo operativo. El inventario anual real utiliza los cierres existentes; los períodos en preparación sin cierre todavía no tienen un saldo de apertura aprobado.

Los datos ficticios sobreviven al cambio de pantalla y modo. El guardado versionado, los permisos del motor y la limpieza al cerrar sesión se conservan.

Archivos de este ajuste

- src/components/Sidebar.tsx
- src/components/Header.tsx
- src/context/ConsultaAnualContext.tsx
- src/context/AppContext.tsx
- src/lib/consultaAnual.ts
- src/App.tsx
- src/components/ConsultaPeriodo.tsx
- src/components/DemoAniosEscolares.tsx
- src/components/ViewAniosEscolares.tsx
- src/components/ViewEstudiantes.tsx
- src/components/ViewListasUtiles.tsx
- src/components/ReporteAnual.tsx
- tests/consultaAnual.test.ts
- tests/demoAniosEscolares.test.ts
- docs/demo-anios-escolares.md

Se agregaron cuatro pruebas de selección, ruta, permisos de navegación, aislamiento y política de consulta de períodos. Se mantienen las diez pruebas del ciclo ficticio y las veintidós pruebas de PostgreSQL local. La conservación de formularios se verifica estructuralmente mediante el montaje estable y la ocultación, y requiere además una comprobación interactiva en navegador.

## Corrección de restauración del selector superior

Al elegir explícitamente Modo demostración se guarda también esa elección dentro del mismo registro local versionado de la simulación. La elección se restaura con el estado ficticio al recargar, dentro de su plazo de 48 horas. Cambiar explícitamente a Modo real conserva esa preferencia sin extender la caducidad de los avances ficticios. Los registros locales anteriores que carecen de preferencia conservan sus datos y requieren elegir el modo una vez.

La cabecera y la simulación obtienen sus opciones mediante periodosParaConsulta desde demo.anios. Una demostración nueva muestra 2026 — Activo. Al crear 2027 aparecen ambos años. Tras revisar continuidad, confirmar matrículas, preparar listas, evaluar sobrantes, registrar bajas, revisar y aprobar el cierre y activar 2027, aparecen 2026 — Cerrado y 2027 — Activo. Seleccionar 2026 permite consultar su historial de lectura y seleccionar 2027 permite consultar sus matrículas, listas y apertura. La selección no ejecuta las operaciones de cierre ni activación.

Para reproducir desde cero, abrir Año escolar, elegir Modo demostración y usar Reiniciar simulación si existen avances anteriores. Crear 2027, completar el ciclo y comparar las etiquetas y datos desde la cabecera. Recargar conserva la elección de demostración y los avances guardados. En Modo real se muestran únicamente los períodos existentes y los errores de configuración aparecen en la cabecera.

Las pruebas adicionales verifican la proyección del estado compartido, la preferencia de modo, su caducidad y la compatibilidad con avances anteriores. Se ejecutaron 16 pruebas de consulta y simulación.
