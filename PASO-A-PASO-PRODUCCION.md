# Sitio público: Neon + Render

Vas a crear dos cuentas gratis y a conectarlas.

- **Neon** guarda la base de datos del sitio público.
- **Render** ejecuta el sitio y te da una dirección `https://`.

Tu computador sigue en http://localhost:9002. Los pasos de abajo no reemplazan el archivo `.env`.

Haz los pasos en orden. Cuando un paso diga que copies un texto, pégalo en un bloc de notas temporal y no lo publiques.

## Antes de empezar

Necesitas:

- La cuenta de GitHub donde está el repositorio `jesusorozco0823/Proyecto-SGB`.
- Este proyecto abierto en tu computador.
- Un número de documento y una contraseña nueva, distintos de los de prueba. La contraseña debe tener al menos 10 caracteres y no puede ser `password`.

El plan gratis de Render apaga el sitio cuando nadie entra durante un rato. Al abrirlo de nuevo tarda cerca de un minuto en despertar. Mientras está apagado no sale el recordatorio de media hora. Para una barbería que abre el panel en el día, alcanza para empezar.

## Parte 1. Subir el código

Render solo ve lo que está en GitHub. En la carpeta del proyecto, en PowerShell:

```powershell
git add -- .gitignore .env.example .env.produccion.example render.yaml package.json PASO-A-PASO-DEV.md PASO-A-PASO-PRODUCCION.md scripts
git commit -m "Prepara el despliegue en Neon y Render sin cambiar el entorno local."
git push -u origin cursor/panel-credito-y-citas
```

Si Git pide usuario y contraseña, usa tu usuario de GitHub. La contraseña de GitHub ya no sirve para esto: en GitHub entra a Settings, Developer settings, Personal access tokens, y crea un token con permiso de repositorio. Ese token es la contraseña que te pide Git.

Comprueba en el navegador, en `https://github.com/jesusorozco0823/Proyecto-SGB`, que exista la rama `cursor/panel-credito-y-citas` y, dentro, el archivo `render.yaml`.

## Parte 2. Crear la base en Neon

1. Abre https://neon.tech y entra con **GitHub**. Acepta el acceso.
2. Pulsa **New project**.
3. Nombre del proyecto: `sgb`.
4. Región: `AWS US East 1` si te deja elegir. No importa que estés en Barranquilla.
5. Postgres 16, si pregunta la versión.
6. Crea el proyecto y espera a que diga que está listo.
7. En el panel verás un recuadro **Connection string**.
8. Elige la opción **Direct** o la cadena cuyo servidor **no** lleve la palabra `pooler`. Prisma aplica las tablas con esa dirección.
9. Pulsa copiar. La cadena se parece a esto:

```text
postgresql://usuario:clave@ep-algo.us-east-1.aws.neon.tech/neondb?sslmode=require
```

10. Guárdala en el bloc de notas. Si no termina en `sslmode=require`, agrega al final `?sslmode=require`. Si ya tiene un `?`, agrega `&sslmode=require`.

No pegues esa cadena dentro del archivo `.env`.

## Parte 3. Crear el archivo de producción en tu computador

1. En la carpeta del proyecto, copia `.env.produccion.example` y nombra la copia `.env.produccion`.
2. Ábrelo con el editor. Déjalo así, con tus datos reales:

```text
DATABASE_URL=postgresql://...la cadena de Neon...
ADMIN_DOCUMENT=tu documento, solo números
ADMIN_DISPLAY_NAME=Tu nombre
ADMIN_PASSWORD=una contraseña de al menos 10 caracteres
ADMIN_PHONE=tu celular
```

3. Guarda el archivo.
4. Confirma que `.env` sigue apuntando a tu computador. La línea `DATABASE_URL` de `.env` debe seguir diciendo `localhost`. Si la cambiaste, vuelve a poner la que tenías antes de cerrar el archivo.

`.env.produccion` no se sube a GitHub. No lo agregues con `git add`.

## Parte 4. Crear el sitio en Render

1. Abre https://render.com y entra con **GitHub**. Autoriza a Render a ver el repositorio `Proyecto-SGB`.
2. En el tablero pulsa **New** y luego **Blueprint**.
3. Elige el repositorio `Proyecto-SGB`.
4. Rama: `cursor/panel-credito-y-citas`.
5. Render lee `render.yaml` y propone un servicio llamado `sgb-barberias`. Si no ofrece el plan gratis, elige el plan más bajo y deja el servicio en una sola instancia.
6. Te va a pedir los valores que el archivo no trae:
   - `DATABASE_URL`: pega la cadena de Neon.
   - `AUTH_SECRET`: déjalo en generar solo. Render inventa una clave larga. No escribas `password` ni el texto de ejemplo.
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: déjalo vacío.
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: déjalo vacío.
7. Pulsa **Apply** o **Deploy**.
8. Espera. La primera vez puede tardar varios minutos. Al terminar, el estado queda en **Live** y aparece una dirección como `https://sgb-barberias.onrender.com`.

Si el despliegue falla, abre el registro (**Logs**) y busca la primera línea en rojo.

- Si dice que falta `DATABASE_URL`, vuelve a Environment, pega la cadena de Neon y pulsa **Manual Deploy**.
- Si dice que `AUTH_SECRET` es corta, bórrala, deja que Render genere otra y vuelve a desplegar.
- No pulses **Scale** ni subas el número de instancias. Tiene que quedar en una.

La primera visita después de un rato sin uso tarda. Espera un minuto y recarga. Debes ver la pantalla de SalonFlow, con Iniciar sesión.

## Parte 5. Crear tu usuario en el sitio público

El registro de la página solo crea clientes. El primer superadministrador se crea desde tu computador, contra Neon, sin tocar Docker.

1. Para el sitio local si quieres, o déjalo abierto. Este comando no lo usa.
2. En PowerShell, dentro de la carpeta del proyecto:

```powershell
npm run admin:first
```

3. Si todo sale bien verás: `Listo. Superadministrador creado en ep-.... Entra con el documento ...`
4. Si dice que la dirección es la de tu computador, abriste el `.env` equivocado. La `DATABASE_URL` tiene que ser la de Neon, dentro de `.env.produccion`.
5. Si dice que el documento ya existe, no pasó nada. Puedes entrar con ese documento.

Ese comando no borra citas ni usuarios. Si lo ejecutas otra vez con el mismo documento, se detiene.

## Parte 6. Entrar y dejar el local listo

1. Abre la dirección `https://` de Render. Tiene que ser `https`, no `http`. Si entras por `http`, el sitio no guarda la sesión.
2. Inicia sesión con `ADMIN_DOCUMENT` y `ADMIN_PASSWORD` de `.env.produccion`.
3. La primera vez te pide el código QR del doble factor.
   - En el celular abre Google Authenticator o la app equivalente.
   - Escanea el QR.
   - Escribe el código de 6 dígitos y confirma.
   - Guarda el celular a mano. Cada vez que entres como superadministrador te lo va a pedir.
4. Entra a **Gestionar Admins** y crea el administrador del local, con el documento y la contraseña de esa persona.
5. Cierra sesión y entra con ese administrador. También le toca escanear su QR la primera vez.
6. Con el administrador, crea el barbero en **Barberos**: nombre, documento, teléfono y servicios con precio en pesos.
7. Entra con el barbero y arma el horario de la semana en **Mi horario**.

Los clientes se registran solos en la pestaña Registrarse del sitio público. No uses los documentos `00000000`, `11111111`, `22222222` ni `33333333`. Esos solo existen en tu computador.

## Parte 7. Cuando cambies el código

1. En tu computador pruebas con `npm run dev`.
2. Subes la rama:

```powershell
git push
```

3. Render vuelve a construir solo. La base de Neon no se borra. El comando de arranque solo aplica las tablas nuevas que falten.

## Fotos, cuando quieras

El sitio funciona sin fotos de Cloudinary. El botón de imagen dice que faltan el nombre y el preset hasta que hagas esto.

1. Entra a https://cloudinary.com y crea una cuenta gratis.
2. Copia el **Cloud name**.
3. En Settings, Upload, Add upload preset:
   - Signing mode: **Unsigned**.
   - Folder: `sgb`.
   - Formatos: jpg, png y webp.
   - Tamaño máximo: 1 MB.
4. Copia el nombre del preset.
5. En Render, abre el servicio, **Environment**, y llena:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
6. Guarda. Render vuelve a desplegar. No pongas el API Secret de Cloudinary en ningún archivo.

## Si algo no cuadra

| Lo que ves | Qué hacer |
|---|---|
| http://localhost:9002 dejó de abrir | Vuelve a `PASO-A-PASO-DEV.md`. No hace falta tocar Neon. |
| El sitio público tarda y luego carga | Es el plan gratis despertando. Espera y recarga. |
| Entras y te devuelve al inicio | Estás en `http://` o la clave `AUTH_SECRET` cambió. Usa `https://` y no regeneres `AUTH_SECRET` si ya tenías sesión. |
| El barbero no ve turnos | Falta el horario. Entra como ese barbero a **Mi horario** y carga la semana. |
| Quieres borrar el sitio público | En Render elimina el servicio y en Neon elimina el proyecto. Tu Docker local no se entera. |
