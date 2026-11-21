# Tu computador: no lo cambies

Este archivo es la configuración que ya funciona. El sitio público usa otro archivo: `PASO-A-PASO-PRODUCCION.md`.

## Qué es cada cosa

| Nombre | Dónde vive | Para qué |
|---|---|---|
| El sitio de desarrollo | http://localhost:9002 | Probar en tu computador |
| El archivo `.env` | La carpeta del proyecto, no se sube a GitHub | Le dice al sitio local cuál es su base y su clave |
| Docker | Tu computador, base `sgb` | Guarda los usuarios, citas y mensajes de prueba |
| El sitio público | Una dirección `https://` de Render | Lo que van a abrir el barbero y los clientes |

Los datos de Alex, Javier y las citas de prueba se quedan en Docker. El sitio público empieza vacío.

## Cómo seguir trabajando aquí

1. Abre una terminal en la carpeta del proyecto.
2. Si la base no está encendida, ejecuta:

```powershell
npm run db:up
```

3. Para abrir el sitio local:

```powershell
npm run dev
```

4. Entra a http://localhost:9002

No hace falta volver a sembrar la base. `npm run db:seed` borra los datos de prueba y los crea de nuevo. Úsalo solo cuando quieras empezar de cero en tu computador.

## Lo que no debes hacer

- No borres ni reemplaces el archivo `.env`.
- No pegues ahí la dirección de Neon.
- No ejecutes `npm run db:seed` pensando que llena el sitio público. Ese comando solo habla con la base de tu computador y, además, la vacía primero.
- No apagues Docker para desplegar. El sitio público tiene su propia base.
- No cambies `npm run dev` ni el puerto 9002.

## Archivos nuevos que no afectan este sitio

Estos archivos son solo para el sitio público. Puedes dejarlos en la carpeta. El sitio de http://localhost:9002 no los lee.

- `render.yaml`: instrucciones para Render.
- `.env.produccion.example`: plantilla vacía.
- `.env.produccion`: lo creas tú en el otro paso a paso. Git lo ignora. Si todavía no existe, el sitio local sigue igual.
- `scripts/create-first-admin.ts`: crea el primer usuario del sitio público. Se niega a conectarse a `localhost`, así que no puede modificar la base de Docker.

## Cómo comprobar que el local sigue bien

1. Abre http://localhost:9002
2. Entra con el documento `33333333` y la contraseña de desarrollo.
3. Si ves el panel del cliente, esta configuración sigue intacta.
