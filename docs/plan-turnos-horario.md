# Planes de acción — Turnos, horario y almuerzo

Segunda parte del trabajo. La primera es la revisión por rol, en `docs/plan-revision-roles.md`. Estos planes describen cómo pasar del horario actual (hora de entrada y salida, huecos de 30 minutos) al modelo acordado. No incluyen implementación.

El código de hoy vive en `src/server/modules/barbers`, `src/server/modules/appointments`, `src/server/modules/catalog` y en las pantallas `src/app/dashboard/schedule` y `src/app/dashboard/book`.

## Reglas cerradas

1. Cada barbero define sus propios servicios: nombre, duración y, en el servicio especial, una descripción opcional que el cliente lee.
2. Un turno contiene un solo servicio. El cliente reserva un solo servicio.
3. La carga del horario puede ser de toda la semana o de un solo día.
4. El administrador define la duración del almuerzo. El barbero solo elige la hora de inicio.
5. El almuerzo completo debe caer entre las 11:00 a. m. y las 2:00 p. m.
6. El cálculo de turnos se hace después de ubicar el almuerzo. La jornada queda en dos tramos: apertura hasta el almuerzo, y fin del almuerzo hasta el cierre. Ningún turno cruza el almuerzo.
7. Los servicios de la misma duración comparten turnos. El sistema no pregunta cuántos de cada uno. El cliente elige el servicio y ve esos turnos, cada uno con su hora.
8. Si hay duraciones distintas, el sistema pregunta cuántos turnos de cada servicio de duración propia y muestra cuántos caben según lo que ya se reservó.
9. El sistema acomoda solo los turnos normales. El barbero elige la hora solo del servicio especial.
10. Si al cierre oficial sobran minutos (2, 5, 10, 20 o cualquier cantidad), el sistema pregunta si agrega un turno extra, para qué servicio, y a qué hora saldría. El turno usa los minutos sobrantes y la salida se corre solo con el tiempo que falte.
11. El hueco que quede antes del almuerzo no se ofrece como turno extra. El turno extra solo existe al final de la hora de cierre.

Ejemplo de lectura. Apertura 8:00 a. m., cierre 5:00 p. m., almuerzo de 60 minutos empezando a las 12:00 m. Tramos útiles: 8:00–12:00 y 13:00–17:00. Si el último turno termina a las 4:50 p. m. y el barbero agrega corte + barba de 35 minutos, ese turno va de 4:50 p. m. a 5:25 p. m. La salida se extiende 25 minutos.

## Plan de acción 1 — Modelo de datos

Objetivo: guardar servicios del barbero, la política de almuerzo, la plantilla del día y los turnos con hora fija.

Acciones:

1. Agregar `LunchPolicy` con un solo registro: `durationMinutes`. Lo escribe el administrador.
2. Agregar `BarberService` ligado al barbero: `name`, `durationMinutes`, `description` opcional, `isSpecial`. Corte + barba y servicio especial son filas de esta tabla, cada una con su duración. No son una combinación de otros servicios en la reserva.
3. Extender la plantilla del día (`BarberSchedule` o un modelo nuevo `DayPlan`) con `openMin`, `closeMin`, `lunchStartMin` y `effectiveCloseMin`. `closeMin` es la hora que el barbero eligió. `effectiveCloseMin` incluye la extensión del turno extra, si existe.
4. Agregar `TurnTemplate` por día de la semana: `startMin`, `endMin`, `durationMinutes`, `serviceId` nulo cuando el turno es de un grupo de igual duración, `serviceId` obligatorio cuando la duración pertenece a un solo servicio, `isExtra` y `placedByBarber` (solo el servicio especial).
5. Materializar `DayTurn` por fecha real al consultar o al reservar, copiando la plantilla de ese día de la semana. Cada `DayTurn` tiene estado `open` o `booked`. Así una reserva del martes 12 no bloquea todos los martes.
6. Cambiar `Appointment` para que guarde un solo `barberServiceId` y el `dayTurnId`. Dejar de usar la lista `serviceIds` en las reservas nuevas.
7. Escribir la migración y actualizar `prisma/seed.ts` con los servicios de ejemplo del barbero (25, 10, 35 y 45 minutos) y una política de almuerzo.

Criterio de salida: una plantilla de lunes guarda tramos, turnos con hora y, si aplica, un cierre efectivo posterior a las 5:00 p. m.

## Plan de acción 2 — Reglas puras de agenda

Objetivo: que el cálculo no dependa de Prisma ni de HTTP. Va en `src/server/modules/barbers/domain/`.

Acciones:

1. Validar el almuerzo: inicio + duración dentro de 11:00–14:00, y el bloque dentro de la jornada.
2. Partir la jornada en tramo de mañana y tramo de tarde.
3. Agrupar los servicios elegidos por duración.
4. Si un grupo tiene más de un servicio, ese grupo es un pool: no recibe cantidades por servicio. Sus turnos salen con `serviceId` vacío y la duración del grupo.
5. Si un servicio es el único con esa duración, pedir la cantidad y crear turnos con ese `serviceId`.
6. Calcular sugerencias con los minutos aún libres: “si dejas N de este servicio, caben hasta M del otro y K turnos del grupo de 25 minutos”.
7. Colocar primero el servicio especial en la hora que indicó el barbero, si cabe en un tramo. El resto lo coloca el sistema dentro de los tramos, sin cruzar el almuerzo.
8. Medir el sobrante contra `closeMin`. Si es mayor que cero, devolver la pregunta del turno extra con el servicio elegido, los minutos de extensión y la nueva hora de salida.
9. Cubrir con pruebas del dominio estos casos: todos a 25 minutos y 10 turnos; mezcla 10, 25, 35 y 45; almuerzo que no cabe; especial fuera de un tramo; extra de 10 minutos que no mueve la salida; extra de 35 minutos que la mueve a las 5:25 p. m.

Criterio de salida: las pruebas del dominio pasan sin base de datos.

## Plan de acción 3 — API del horario

Objetivo: exponer el flujo en el módulo `barbers`, con puerto, servicio, controlador y rutas delgadas.

Acciones:

1. `GET /api/v1/lunch-policy` para cualquier usuario autenticado. `PUT /api/v1/lunch-policy` solo para el administrador.
2. CRUD de servicios del barbero en `/api/v1/barbers/me/services`. El administrador puede leerlos. El servicio especial acepta descripción vacía.
3. `POST /api/v1/barbers/me/schedule/preview` recibe jornada, hora de almuerzo, servicios y cantidades parciales. Responde sugerencias, agenda propuesta y el sobrante del cierre. No guarda.
4. `PUT /api/v1/barbers/me/schedule` guarda un día o, si el cuerpo trae varios días, la semana completa con la misma jornada. Cada día puede después editarse solo.
5. Al guardar, regenerar `TurnTemplate` de esos días y los `DayTurn` futuros que sigan `open`. No reescribir un `DayTurn` ya reservado.
6. `GET /api/v1/barbers/:id/turns?date=&serviceId=` devuelve solo los turnos abiertos de ese servicio: los de su `serviceId`, o los del pool si comparte duración con otros.
7. Mantener la autorización actual: el barbero edita su horario, el cliente solo lee turnos para reservar.

Criterio de salida: el preview y el guardado de un día y de la semana responden sin tocar la pantalla.

## Plan de acción 4 — Pantalla del barbero

Objetivo: cambiar `src/app/dashboard/schedule` al flujo acordado.

Acciones:

1. Preguntar si la carga es de toda la semana o de un día.
2. Pedir hora de apertura y hora de cierre.
3. Mostrar la duración del almuerzo que fijó el administrador y pedir solo la hora de inicio, limitada al rango válido.
4. Listar los servicios del barbero y dejar marcar los de ese día. Desde aquí también puede crear un servicio, incluido el especial con descripción opcional.
5. Después del almuerzo, mostrar el cálculo. Si hay duraciones distintas, preguntar cantidades y actualizar la sugerencia en cada cambio. Si todos duran igual, no preguntar cantidades: mostrar los turnos con su hora.
6. Si hay servicio especial, pedir la hora de ese turno y mostrar el resto ya colocado.
7. Si sobran minutos al cierre, preguntar si agrega un turno extra, para qué servicio, y mostrar la nueva hora de salida antes de confirmar.
8. Guardar por el endpoint del plan 3.

Criterio de salida: un barbero configura el lunes, ve las horas de cada turno y, si acepta el extra, ve la salida corrida antes de guardar.

## Plan de acción 5 — Reserva del cliente

Objetivo: que `src/app/dashboard/book` reserve un solo servicio y solo en turnos de ese servicio.

Acciones:

1. Cambiar el orden del asistente: barbero, un servicio, día y hora, confirmación.
2. Quitar la selección múltiple de servicios.
3. Al elegir día, pedir `GET /api/v1/barbers/:id/turns` con el servicio elegido y pintar solo esas horas.
4. Confirmar con `POST /api/v1/appointments` enviando un `dayTurnId` y un solo servicio.
5. En el servidor, rechazar la reserva si el turno no corresponde a ese servicio o a su grupo de duración, si está ocupado o si la fecha no cae en el día de la plantilla.
6. Marcar el `DayTurn` como `booked` en la misma transacción que crea la cita. Cancelar la cita lo devuelve a `open`.
7. Ajustar el detalle de la cita para mostrar un solo servicio.

Criterio de salida: el cliente que elige corte + barba solo ve los turnos de 35 minutos de ese servicio. El cliente que elige corte clásico ve los turnos del grupo de 25 minutos y puede usarlos también para degradado, toalla o corte para niños.

## Plan de acción 6 — Duración del almuerzo

Objetivo: que el administrador fije un solo dato y el barbero lo use al armar el día.

Acciones:

1. Agregar en el panel del administrador el campo de minutos de almuerzo y guardarlo con `PUT /api/v1/lunch-policy`.
2. En el horario del barbero, mostrar ese valor como dato fijo.
3. Si el administrador cambia la duración, las plantillas ya guardadas siguen vigentes hasta que el barbero vuelva a abrir ese día. Al abrirlo, el sistema vuelve a validar que el almuerzo quepa entre las 11:00 a. m. y las 2:00 p. m.

Criterio de salida: con una duración nueva que ya no cabe en el rango, el barbero no puede reutilizar la hora de almuerzo anterior sin elegir otra.

## Orden de ejecución

1. Plan 1, modelo y semilla.
2. Plan 2, reglas y pruebas.
3. Plan 3, API.
4. Plan 6, dato del administrador, porque el plan 4 lo muestra.
5. Plan 4, pantalla del barbero.
6. Plan 5, reserva del cliente.

## Fuera de estos planes

- Cobro del turno y pasarela de pago.
- Excepciones de un festivo o de un día suelto distinto a la plantilla semanal.
- Varios servicios dentro de una misma cita.
- Turno extra antes del almuerzo.
