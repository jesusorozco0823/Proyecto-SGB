# Plan — Vista de celular y horario por pasos

El panel ya tiene menú lateral que en pantallas chicas se abre con el botón de hamburguesa. El contenido, los diálogos y el formulario de horario siguen pensados para escritorio: el texto no se contiene, las tablas se salen y «Mi horario» pide jornada, servicios, cantidades, hora especial, turno extra y día libre en la misma pantalla.

## Reglas

1. La aplicación se ve dentro del ancho del celular. El texto parte en varias líneas, los diálogos caben en la pantalla y las listas largas se pueden recorrer sin recortar botones.
2. El barbero arma el horario en pasos. Cada paso muestra una sola decisión y un botón para seguir o volver.
3. El orden de los pasos es: jornada, servicios, cantidades (solo si hay duraciones distintas), hora de los servicios especiales (solo si hay alguno) y revisión.
4. El día libre queda aparte del asistente, en un bloque corto, porque no forma parte del cálculo de turnos.
5. Si hay más de un turno de servicio especial, el barbero elige la hora del primero. El siguiente empieza por defecto cuando termina ese primero. Si el almuerzo corta ese hueco, el siguiente pasa al primer espacio libre de después.
6. Si hay varios servicios especiales distintos, solo el primero pide la hora. Cada uno de los demás propone, por defecto, el inicio justo después del especial anterior. El barbero puede cambiar esa hora.
7. Los turnos normales siguen colocándose solos. El hueco de antes del almuerzo no se vuelve un turno extra.

## Pasos del horario

1. Jornada. Semana completa (lunes a sábado) o un día, apertura, cierre e inicio del almuerzo.
2. Servicios. Lista para marcar y, si hace falta, alta de un servicio nuevo en el mismo paso.
3. Cantidades. Una pregunta por cada servicio de duración propia. Si todos duran lo mismo, este paso no aparece.
4. Especiales. Hora del primer servicio especial. Debajo, la hora propuesta de cada especial siguiente, editable.
5. Revisión. Lista de turnos, sobrante al cierre y guardado.

## Acciones

1. Contener la app al ancho de la pantalla: viewport, área segura, encabezado que parte el título y diálogos con scroll interno.
2. En citas, mostrar tarjetas en el celular y dejar la tabla para pantallas anchas.
3. Reemplazar el formulario único de `src/app/dashboard/schedule/page.tsx` por el asistente de cinco pasos como máximo.
4. Encadenar los servicios especiales en `src/server/modules/barbers/domain/turn-planner.ts`. La hora elegida sigue llegando como `specialStart`. Las horas corregidas de los demás viajan en `specialStarts`.
5. Cubrir con la prueba de dominio que el segundo turno especial queda después del primero, y que un segundo servicio especial distinto usa esa misma regla salvo que el barbero fije otra hora.
