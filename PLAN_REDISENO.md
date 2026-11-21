# Plan de rediseño visual — SGB Barberías

La lógica de negocio, el estado, las rutas y las llamadas al backend se mantienen. Este plan cubre solo la interfaz.

## Auditoría

- Vistas: inicio de sesión, panel por rol, reservar cita, citas, horario, turnos, recordatorios, perfil, productos, pedidos, inventario, barberos, opiniones, administradores y bitácora.
- `lucide-react` ya está instalado y es la librería de íconos de la navegación. El inicio de sesión todavía usa un SVG propio para Google.
- La paleta vive en `src/app/globals.css`: morado `275` / lavanda `277` y un acento `285` saturado. El panel usa además `text-purple-500`, `text-blue-500`, `text-green-500` y `text-red-500`.
- El layout es sidebar + header + contenido. El sidebar no es fijo. El header ya tiene un menú con avatar, iniciales y acciones de Lucide.
- Reservar cita ya es un asistente con cápsula de pasos, tarjeta y pie. Mi horario es otro asistente, con otra barra de progreso.
- Turnos disponibles apila todos los días en una columna. Agregar un turno está al final de esa columna.
- Las confirmaciones (cancelar cita, quitar producto, quitar admin) ya usan diálogos. El fondo del diálogo es un negro al 80 %, sin desenfoque suave.

## Fase 1 — Base visual

- [x] Confirmar `lucide-react` y quitar el SVG suelto del botón de Google.
- [x] Sustituir la paleta morada por tonos mate de barbería en las variables globales (papel cálido, espresso, nogal, ladrillo suave).
- [x] Suavizar el overlay de los diálogos existentes para que hereden el mismo fondo.
- [x] Quitar los colores chillones del panel (`purple`, `blue`, `green`, `red` de Tailwind).

## Fase 2 — Componentes reutilizables

- [x] `StatusBadge`: color + ícono de Lucide + texto, para cita, seña, turno extra y servicio.
- [x] `Modal`: diálogo centrado, fondo difuminado, cierre con `X` y con Escape.
- [x] `StepWizard`: cápsula `rounded-full`, íconos circulares, `ChevronRight`, estado pendiente / activo / completado, tarjeta `rounded-2xl` y pie con Anterior y Siguiente.

## Fase 3 — Layout

- [x] Sidebar fijo (`sticky top-0 h-screen`) en escritorio. En teléfono sigue el menú lateral.
- [x] Avatar del header con ícono `User` de Lucide, nombre visible y las mismas acciones (perfil y cerrar sesión).

## Fase 4 — Listados

- [x] Turnos disponibles: pestañas por día con contador y grilla `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- [x] Quitar un turno abre `Modal` de confirmación. Agregar un turno abre `Modal` de tres campos.
- [x] Mis citas: tarjetas en grilla y `StatusBadge` en lugar de la insignia genérica. Las acciones se conservan.
- [x] Opiniones: el sentimiento muestra ícono y texto, con los mismos tonos mate.

## Fase 5 — Formularios

- [x] Reservar cita usa `StepWizard` sin cambiar el flujo ni las llamadas.
- [x] Mi horario, cuando la semana no está cargada, usa `StepWizard`. Si ya está cargada, el formulario sigue cerrado.
- [x] El día libre sale del cuerpo de la página y pasa a un `Modal` de dos campos.
- [x] La foto de perfil se abre en `Modal`.
