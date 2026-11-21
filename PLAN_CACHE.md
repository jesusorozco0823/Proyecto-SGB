# Caché de lecturas

La caché vive en la memoria del servidor. No usa Redis ni otro servicio de pago. Sirve una lectura repetida sin volver a la base mientras nadie haya cambiado ese dato. Si la base no responde y ya había una copia buena, se entrega esa copia en lugar de mostrar la pantalla vacía o un error.

## Reglas

- Cada dato privado lleva el id del usuario en la clave. Un barbero no puede recibir la caché de otro.
- Lo compartido (ajustes del salón, inventario) usa una clave común, nunca mezclada con datos de una persona.
- La copia se guarda como JSON. Quien lee no puede modificar la copia de los demás.
- Hay un tope de entradas para no llenar la memoria del hosting gratis.
- Un tiempo máximo (15, 30 o 60 segundos) descarta la copia aunque se nos escape un evento. Es la red de seguridad, no la forma normal de actualizar.
- Si la base falla al conectar y existe copia, se devuelve la copia. Si no existe, el error sigue su curso. Un error de negocio (cita no encontrada, prohibido) no se guarda ni se sustituye por una copia vieja.
- No se cachea login, sesión, contraseñas, doble factor ni la disponibilidad de un turno. Reservar un turno ocupado sería peor que una ida de más a la base.

## Cuándo se recarga

La copia se borra en la misma operación que ya guardó el cambio:

- Cita creada, cancelada, completada, inasistencia o abono: citas, panel y contactos de mensajes.
- Mensaje enviado o marcado leído: mensajes de quien escribe y de quien recibe.
- Ajustes del salón: la clave de ajustes.
- Producto creado, editado o quitado: inventario y panel.
- Opinión nueva: citas, porque la visita muestra la calificación.

## Qué queda cubierto ahora

- Panel de cada rol.
- Lista de citas.
- Ajustes del salón.
- Inventario.
- Mensajes, contactos y avisos sin leer.

Los turnos disponibles y el comprobante siguen leyendo la base en cada pedido.
