# Plan de revisión por rol

Primera parte del trabajo. Confirma dos cosas, en este orden:

1. Cada módulo abre solo con el rol que le corresponde. Una ruta ajena vuelve al panel.
2. Cada botón visible de cada página hace su acción. Un botón que se puede pulsar y no hace nada es una falla. La única excepción es Google en el inicio, que debe seguir desactivado.

La segunda parte, el cambio de turnos, está en `docs/plan-turnos-horario.md`. Esta revisión no cambia la agenda.

La guarda de rutas vive en `src/lib/access.ts` y se aplica en `src/hooks/use-auth.tsx`. El menú vive en `src/components/layout/sidebar-content.tsx`.

## Cómo revisar

1. Tener la base migrada y con semilla. Usuarios de prueba, contraseña `password`:

| Documento | Rol |
| --- | --- |
| 00000000 | superadmin |
| 11111111 | admin |
| 22222222 | barber |
| 33333333 | client |

2. Entrar en `http://localhost:9002`.
3. Cerrar sesión antes de cambiar de rol.
4. En cada fila anotar pasa o falla. Falla si la pantalla no carga, si el menú muestra un módulo de otro rol, si una URL prohibida se queda abierta, o si un botón no ejecuta la acción de su fila.

## Plan de acción 1 — Sesión y botones de entrada

Pantalla `/`.

| Control | Acción esperada |
| --- | --- |
| Ingresar | Con documento y contraseña válidos entra a `/dashboard`. Con datos inválidos muestra el error y se queda en `/`. |
| Crear Cuenta | Crea un cliente y entra a `/dashboard`. Si falta un campo o el documento ya existe, muestra el error. |
| Iniciar sesión con Google | Permanece desactivado y no navega. |
| Registrarse con Google | Permanece desactivado y no navega. |
| Abrir `/dashboard` sin sesión | Vuelve a `/`. |
| Cerrar sesión | Vuelve a `/` y `/dashboard` ya no abre. |

En el encabezado, con cualquier rol ya autenticado:

| Control | Acción esperada |
| --- | --- |
| Menú (solo móvil) | Abre el menú lateral de ese rol. |
| Avatar | Abre el menú de la cuenta. |
| Perfil | Lleva a `/dashboard/profile`. Hoy no tiene acción: la revisión lo anota como falla. |
| Cerrar sesión | Cierra la sesión y vuelve a `/`. |

## Plan de acción 2 — Superadmin (`00000000`)

Menú que debe abrir:

| Módulo | Ruta |
| --- | --- |
| Panel | `/dashboard` |
| Gestionar Admins | `/dashboard/admins` |

Rutas que debe devolver a `/dashboard`:

- `/dashboard/appointments`
- `/dashboard/barbers`
- `/dashboard/inventory`
- `/dashboard/orders`
- `/dashboard/feedback`
- `/dashboard/schedule`
- `/dashboard/book`
- `/dashboard/products`

Botones del panel:

| Botón | Acción esperada |
| --- | --- |
| Gestionar Administradores | Abre `/dashboard/admins`. |

Botones de Gestionar Admins:

| Botón | Acción esperada |
| --- | --- |
| Añadir Administrador | Abre el diálogo. |
| Crear Administrador | Guarda el admin y lo muestra en la tabla. Cancelar cierra sin guardar. |
| Menú de fila → Editar | Abre el diálogo con los datos. Guardar actualiza la fila. Cancelar no cambia nada. |
| Menú de fila → Eliminar | Pide confirmación. Confirmar lo quita de la tabla. Cancelar lo deja. |

`/dashboard/profile` está permitido por la guarda aunque no está en el menú. Si se abre, revisar también los botones de perfil del plan 5.

## Plan de acción 3 — Admin (`11111111`)

Menú que debe abrir:

| Módulo | Ruta |
| --- | --- |
| Panel | `/dashboard` |
| Todas las Citas | `/dashboard/appointments` |
| Barberos | `/dashboard/barbers` |
| Inventario | `/dashboard/inventory` |
| Pedidos | `/dashboard/orders` |
| Opiniones | `/dashboard/feedback` |

Rutas que debe devolver a `/dashboard`:

- `/dashboard/admins`
- `/dashboard/schedule`
- `/dashboard/book`
- `/dashboard/products`

Botones del panel:

| Botón | Acción esperada |
| --- | --- |
| Ver Todas las Citas | Abre `/dashboard/appointments`. |
| Gestionar Inventario | Abre `/dashboard/inventory`. |
| Actualizar Horarios | Abre `/dashboard/barbers`. |

Botones de Todas las Citas:

| Botón | Acción esperada |
| --- | --- |
| Menú de fila → Ver Detalles | Abre el resumen. Cerrar lo cierra. |
| Menú de fila → Marcar completada | Solo en una cita programada. Pasa la cita a completada y se conserva al recargar. |

Botones de Barberos:

| Botón | Acción esperada |
| --- | --- |
| Añadir Barbero | Abre el diálogo. Crear lo agrega a la lista. Cancelar no guarda. |
| Editar Horario y Perfil | Abre el diálogo. Guardar actualiza nombre, documento, teléfono, habilidades e imagen. Cancelar no cambia nada. |

Botones de Inventario:

| Botón | Acción esperada |
| --- | --- |
| Añadir Producto | Abre el diálogo. Crear agrega la fila. Cancelar no guarda. |
| Menú de fila → Editar | Guarda los cambios en la fila. Cancelar no cambia nada. |
| Menú de fila → Eliminar | Pide confirmación. Confirmar quita el producto. Cancelar lo deja. |

Botones de Pedidos:

| Botón | Acción esperada |
| --- | --- |
| Menú de fila → Ver Detalles del Pedido | Abre el detalle con cliente y productos. Cerrar lo cierra. |
| Cambiar estado | Aplica pendiente, enviado, entregado o cancelado cuando la transición es válida. Si no es válida, muestra el error y el estado anterior se mantiene. |

Opiniones no tiene botones de acción. La página debe listar las opiniones guardadas.

## Plan de acción 4 — Barbero (`22222222`)

Menú que debe abrir:

| Módulo | Ruta |
| --- | --- |
| Panel | `/dashboard` |
| Mis Citas | `/dashboard/appointments` |
| Mi Horario | `/dashboard/schedule` |
| Mi Perfil | `/dashboard/profile` |

Rutas que debe devolver a `/dashboard`:

- `/dashboard/admins`
- `/dashboard/barbers`
- `/dashboard/inventory`
- `/dashboard/orders`
- `/dashboard/feedback`
- `/dashboard/book`
- `/dashboard/products`

Botones del panel:

| Botón | Acción esperada |
| --- | --- |
| Ver Mis Citas | Abre `/dashboard/appointments` y la lista es solo la suya. |
| Gestionar Mi Horario | Abre `/dashboard/schedule`. |

Botones de Mis Citas:

| Botón | Acción esperada |
| --- | --- |
| Menú de fila → Ver Detalles | Abre el resumen de esa cita. Cerrar lo cierra. |
| Menú de fila → Marcar completada | Solo en una cita programada suya. Queda completada al recargar. |

Botones de Mi Horario:

| Botón | Acción esperada |
| --- | --- |
| Interruptor de cada día | Activa o desactiva ese día. |
| Inicio y Fin | Cambian la hora del día activo. |
| Guardar Cambios | Persiste la jornada. Al recargar se ven las mismas horas. |

Botones de Mi Perfil: los del plan 5.

## Plan de acción 5 — Cliente (`33333333`)

Menú que debe abrir:

| Módulo | Ruta |
| --- | --- |
| Reservar Cita | `/dashboard/book` |
| Mis Citas | `/dashboard/appointments` |
| Productos | `/dashboard/products` |
| Mi Perfil | `/dashboard/profile` |

El logo abre `/dashboard`, el panel del cliente.

Rutas que debe devolver a `/dashboard`:

- `/dashboard/admins`
- `/dashboard/barbers`
- `/dashboard/inventory`
- `/dashboard/orders`
- `/dashboard/feedback`
- `/dashboard/schedule`

Botones del panel:

| Botón | Acción esperada |
| --- | --- |
| Reservar Ahora | Abre `/dashboard/book`. |
| Gestionar Cita | Abre `/dashboard/appointments`. |
| Re-reservar | Abre `/dashboard/book`. |
| Ver todo el historial | Abre `/dashboard/appointments`. |

Botones de Reservar Cita:

| Botón | Acción esperada |
| --- | --- |
| Cada servicio | Lo marca o lo desmarca. Siguiente sigue desactivado si no hay ninguno. |
| Cada barbero | Lo selecciona. |
| Cada hora | La selecciona. |
| Atrás | Vuelve al paso anterior sin perder lo ya elegido. |
| Siguiente | Avanza solo si el paso actual está completo. |
| Confirmar Reserva | Crea la cita. Aparece en Mis Citas después de recargar. |

Botones de Mis Citas. La lista es solo la suya.

| Botón | Acción esperada |
| --- | --- |
| Menú de fila → Ver Detalles | Abre el resumen. Cerrar lo cierra. |
| Menú de fila → Cancelar | Solo en una cita programada. Las sugerencias de motivo rellenan el texto. Confirmar la deja cancelada. No, mantener cita no cambia el estado. |
| Menú de fila → Dejar Opinión | Solo en una cita completada sin opinión. Las estrellas y las sugerencias arman el comentario. Enviar guarda la opinión. Cancelar no guarda. |

Botones de Productos y del carrito:

| Botón | Acción esperada |
| --- | --- |
| Añadir al Carrito | Suma una unidad y muestra el aviso. |
| Botón flotante del carrito | Abre el carrito con esas unidades. |
| Menos | Baja la cantidad. En cero, quita el producto. |
| Más | Sube la cantidad. |
| Quitar | Saca el producto del carrito. |
| Proceder al Pago | Crea el pedido, vacía el carrito y descuenta el stock. Si no hay stock, muestra el error y no vacía el carrito. |

Botones de Mi Perfil, también para barbero, admin y superadmin si entran a la ruta:

| Botón | Acción esperada |
| --- | --- |
| Guardar Cambios | Guarda nombre, teléfono y preferencias. Al recargar siguen los valores nuevos. |
| Cambiar Foto | Hoy no tiene acción. La revisión lo anota como falla. |

## Plan de acción 6 — La API responde igual que la pantalla

| Rol | Petición que debe responder 200 | Petición que debe responder 403 |
| --- | --- | --- |
| superadmin | `GET /api/v1/admins` | `GET /api/v1/inventory` |
| admin | `GET /api/v1/orders` | `GET /api/v1/admins` |
| barber | `GET /api/v1/barbers/me` | `GET /api/v1/orders` |
| client | `GET /api/v1/inventory` | `GET /api/v1/admins` |
| sin cookie | ninguna | `GET /api/v1/auth/me` responde 401 |

## Cierre

La revisión termina cuando cada ruta y cada botón de las tablas está marcado. Dos botones ya se anticipan como falla porque no tienen acción: Perfil en el encabezado y Cambiar Foto. El resto debe ejecutar lo que dice su fila. Con la revisión cerrada se puede empezar `docs/plan-turnos-horario.md`.
