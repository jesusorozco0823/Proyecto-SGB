# Plan de seguridad de SGB

Revisión del código al 20 de noviembre de 2026, módulo por módulo. El plan corrige lo que hoy puede filtrar datos, ocupar la agenda o dejar una sesión vigente después de cerrarla. No incluye pasos de ataque.

## Lo que ya está bien

- La cookie `sgb_session` es `httpOnly`, `SameSite=lax` y `secure` en producción.
- La contraseña se guarda con bcrypt (costo 12) y el hash no sale en las respuestas.
- El token solo lleva el id del usuario. El rol se lee de la base en cada petición.
- Las entradas de la API pasan por Zod.
- El precio del pedido sale del inventario, no del cliente.
- El stock baja solo si alcanza, dentro de una transacción.
- Reservar un turno lo marca ocupado en la misma transacción. Cancelar lo devuelve.
- Cancelar una cita y dejar una opinión exige ser el dueño, salvo el administrador en la cancelación.
- Prisma usa consultas parametrizadas.

La protección de pantallas en `src/lib/access.ts` es solo de interfaz. La seguridad real está en cada servicio. Esa parte, en los módulos revisados, sí distingue rol.

## Hallazgos

### Crítico, antes de publicar

1. **Cuentas de demostración.** La semilla crea superadmin, admin, barberos y cliente con documentos fijos y la misma contraseña. Si esa semilla corre en una base alcanzable, esas cuentas quedan abiertas.
2. **Secreto de sesión.** El token se firma con `AUTH_SECRET` (HS256) y dura 7 días. Si el secreto es corto, repetido o el del ejemplo, cualquiera puede fabricar una sesión para un id conocido. No hay lista de sesiones: cerrar sesión solo borra la cookie del navegador.
3. **Sin límite de intentos.** `POST /api/v1/auth/login` y `POST /api/v1/auth/register` aceptan intentos ilimitados. El documento es el usuario.
4. **El build no falla.** `next.config.ts` tiene `typescript.ignoreBuildErrors` y `eslint.ignoreDuringBuilds`. Un error de autorización puede llegar a producción.

### Alto

5. **Datos del barbero.** `GET /api/v1/barbers` devuelve documento, teléfono y `userId` a cualquier usuario autenticado, incluido el cliente.
6. **Agenda.** Cualquier cliente autenticado puede reservar todos los turnos abiertos. No hay tope por persona ni por día.
7. **Inventario.** Un pedido aparta stock sin pago y sin tope de cantidad distinto del stock. Un cliente puede dejar la tienda en cero.
8. **Contraseña.** No hay cambio de contraseña ni restablecimiento por el administrador. Una cuenta comprometida sigue válida hasta que expire el token, y el token robado sigue sirviendo después de cerrar sesión.
9. **Registro.** Si el documento ya existe, la API lo dice. Eso permite comprobar si una persona está registrada.

### Medio

10. **Rutas.** El menú redirige en el navegador. Quien llame la API directo depende solo de los servicios. Hoy esos servicios revisan el rol; la interfaz no debe tratarse como control.
11. **Cabeceras.** No hay CSP, `X-Frame-Options` o equivalente, `Referrer-Policy` ni HSTS.
12. **Opiniones.** El comentario no tiene largo máximo y se envía al analizador de sentimiento. Un texto enorme consume base de datos y la cuota del modelo.
13. **Imágenes.** Foto de perfil, imagen de barbero y producto aceptan cualquier URL.
14. **Stock visible.** El cliente recibe la cantidad exacta de cada producto.
15. **Entre barberos.** Un barbero puede leer servicios y turnos abiertos de otro.
16. **Sesión larga.** Siete días, sin corte por inactividad y sin comprobar el origen de la petición. `SameSite=lax` ya frena el envío de la cookie en un POST desde otro sitio en navegadores actuales.
17. **Sin bitácora.** Crear o borrar administradores, cambiar precios, cancelar citas y mover pedidos no dejan registro de quién lo hizo.

### Bajo

18. **Tiempo de login.** Si el documento no existe, no se ejecuta bcrypt y la respuesta es más rápida.
19. **Disponibilidad vieja.** `GET /api/v1/barbers/:id/availability` sigue publicando huecos ocupados del horario anterior.
20. **Superadmin.** Puede listar citas por API aunque el menú no las muestre. Es un rol de confianza; conviene alinearlo con la interfaz.

## Plan de corrección

### Fase 1. Publicación

1. Generar `AUTH_SECRET` con al menos 32 bytes aleatorios por entorno. Rechazar el arranque si el secreto es corto o igual al ejemplo.
2. Separar la semilla de demostración. En producción no crear usuarios con contraseña conocida. Rotar cualquier cuenta que ya se haya sembrado.
3. Quitar `ignoreBuildErrors` e `ignoreDuringBuilds` y hacer que el build falle.
4. Limitar login y registro por documento y por IP. Respuesta genérica e igual de lenta si el documento no existe o la contraseña falla.
5. Guardar un identificador de sesión en base de datos. Logout, cambio de contraseña y borrado de usuario invalidan ese identificador. Bajar la vida del token a un día y renovarlo con actividad.

### Fase 2. Datos y abuso

6. Crear un DTO público del barbero: nombre, habilidades, foto y valoración. Documento, teléfono y `userId` solo para admin y para el propio barbero.
7. Limitar citas futuras por cliente (propuesta: 2 activas) y una reserva a la vez por turno, que ya existe.
8. Tope de cantidad por producto en un pedido (propuesta: 5) y un máximo de líneas. El stock exacto puede volverse “disponible” o “últimas unidades”.
9. Cambio de contraseña del propio usuario, comprobando la actual. El superadmin restablece la de un admin y el admin la de un barbero. Cada cambio invalida las sesiones de esa cuenta.
10. El registro, ante un documento repetido, responde lo mismo que ante un alta correcta y no revela si ya existía. El duplicado se resuelve por un canal aparte.

### Fase 3. Endurecer

11. Cabeceras: CSP sin `unsafe-inline` en scripts, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` y HSTS en producción.
12. Límite de 500 caracteres en la opinión, 20 preferencias y 40 caracteres por preferencia.
13. Las imágenes solo aceptan `https` y, si se puede, una lista de dominios.
14. Los turnos de otro barbero los ve el admin. El barbero solo ve los suyos.
15. Comprobar que el `Origin` de las peticiones que cambian datos coincida con la aplicación.
16. Retirar o cerrar el endpoint viejo de disponibilidad cuando la reserva ya use turnos.
17. Tabla de auditoría: actor, acción, recurso, fecha. Consultable por superadmin.

### Fase 4. Cuentas privilegiadas

18. Segundo factor para admin y superadmin.
19. Alinear al superadmin: o se le abre el módulo de citas en la interfaz, o la API deja de devolverlas.

## Orden de trabajo

1. Fase 1 completa antes de exponer el sistema.
2. Fase 2 en el mismo ciclo, porque documento, agenda e inventario son el uso normal.
3. Fase 3 después, sin cambiar reglas de negocio.
4. Fase 4 cuando las cuentas de administración ya tengan restablecimiento de contraseña.

## Qué más conviene agregar

Estas piezas no tapan un hueco de la lista anterior. Encajan con el salón y reducen abuso operativo.

- **Seña o pago para sostener el turno y el pedido.** Sin eso, reservar e comprar siguen siendo gratis y reversibles.
- **Ventana de cancelación e inasistencia.** Por ejemplo, cancelar hasta 2 horas antes. A la tercera inasistencia, el admin puede bloquear reservas.
- **Días libres y festivos del barbero**, sin reescribir los turnos ya reservados.
- **Recordatorio** por correo o WhatsApp el día anterior, con enlace para cancelar.
- **Lista de espera** cuando un turno se libera.
- **Ficha del cliente** para el barbero asignado: preferencias y últimas visitas, sin ver el documento completo.
- **Corte de caja**: servicios completados, productos vendidos y comisión del barbero. Hoy el ingreso semanal suma precios históricos y no el servicio nuevo del barbero.
- **Comprobante** descargable de la cita y del pedido.
- **Bloqueo de cliente** por el admin, con motivo, que impida reservar y comprar.
- **Aviso de stock bajo** al admin cuando un pedido deja un producto por debajo del umbral que ya usa el tablero.
