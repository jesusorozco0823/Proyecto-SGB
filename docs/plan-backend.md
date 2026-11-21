# Plan de backend — SGB Barberías (SalonFlow)

## 1. Qué es el proyecto hoy

SGB es un sistema de gestión de barbería. El producto visible se llama **SalonFlow** y la marca en el menú es **SGB Barberías**.

Hoy es un **frontend Next.js 15 (App Router)** con React 18 y TypeScript. Todas las pantallas del dashboard son componentes de cliente (`"use client"`). La interfaz usa Tailwind y shadcn/ui. Los flujos de IA (Genkit + Gemini) ya corren en el servidor como server actions.

No hay base de datos, no hay rutas `/api`, y la autenticación no valida contraseña. Los datos salen de `src/lib/mock-data.ts` y, en el caso de usuarios, de `localStorage` (`src/lib/user-store.ts`). Recargar el navegador o cambiar de dispositivo pierde citas, inventario, pedidos y barberos. Firebase está en `package.json` y existe `apphosting.yaml`, pero Auth y Firestore no están conectados.

## 2. Arquitectura actual

```
Navegador
  └─ Next.js 15 (puerto 9002)
       ├─ src/app/page.tsx                 login y registro (simulado)
       ├─ src/app/dashboard/**             pantallas por rol
       ├─ src/hooks/use-auth.tsx           sesión = documentNumber en localStorage
       ├─ src/lib/user-store.ts            CRUD de usuarios en localStorage
       ├─ src/lib/mock-data.ts             barberos, servicios, citas, stock, pedidos, opiniones
       ├─ src/lib/types.ts                 contrato de dominio (fuente de verdad del frontend)
       └─ src/ai/flows/**                  Genkit (sentimiento, recomendaciones, textos)
```

Capas que faltan: persistencia, autenticación real, autorización en servidor, reglas de negocio (solapes de cita, stock, totales) y una API que el frontend pueda consumir.

### Módulos de pantalla y de quién son

| Rol | Rutas | Qué hace hoy |
| --- | --- | --- |
| Público | `/` | Login por documento y registro de cliente. El botón de Google no hace nada. La contraseña se ignora. |
| `client` | `/dashboard/book`, `/dashboard/appointments`, `/dashboard/products`, `/dashboard/profile` | Reserva en 4 pasos (servicio, barbero, fecha/hora, confirmación). El carrito de productos no crea pedido. |
| `barber` | `/dashboard`, `/dashboard/appointments`, `/dashboard/schedule`, `/dashboard/profile` | Ve sus citas y edita horario solo en el estado local. |
| `admin` | `/dashboard`, `/dashboard/appointments`, `/dashboard/barbers`, `/dashboard/inventory`, `/dashboard/orders`, `/dashboard/feedback` | CRUD visual de barberos e inventario, cambio de estado de pedidos, listado de opiniones. Las métricas del panel están fijas (12 citas, $3,450, etc.). |
| `superadmin` | `/dashboard`, `/dashboard/admins` | Alta, edición y baja de administradores en `localStorage`. |

El menú se arma en `src/components/layout/sidebar-content.tsx`. El layout solo comprueba que exista un documento en `localStorage`; no hay guarda por rol en el servidor. Un cliente puede abrir `/dashboard/admins` escribiendo la URL.

### Entidades ya modeladas (`src/lib/types.ts`)

- **User**: `client | admin | barber | superadmin`. Identidad por `documentNumber`. Preferencias y teléfono opcionales.
- **Barber**: perfil operativo ligado a un `userId`, habilidades, horario semanal y rating.
- **Service**: nombre, duración en minutos, precio y descripción. Hoy es catálogo fijo; ninguna pantalla lo administra.
- **Appointment**: cliente, barbero, uno o más servicios, fecha, estado `scheduled | completed | cancelled`, motivo de cancelación, rating y comentario.
- **InventoryItem**: SKU, nombre, stock, precio e imagen.
- **Order**: líneas con precio congelado, total y estado `pending | shipped | delivered | cancelled`.
- **Feedback**: opinión ligada a una cita, rating, comentario y sentimiento `positive | negative | neutral`.

### IA que ya existe y debe quedarse en el servidor

| Flujo | Archivo | Cuándo debe dispararse |
| --- | --- | --- |
| Sentimiento de la opinión | `src/ai/flows/analyze-feedback-sentiment.ts` | Al guardar un feedback |
| Recomendación de servicios | `src/ai/flows/recommend-services.ts` | Al abrir reserva o el panel del cliente, con historial real |
| Sugerir texto de opinión | `src/ai/flows/suggest-feedback.ts` | Mientras el cliente escribe la reseña |
| Motivos de cancelación | `src/ai/flows/suggest-cancellation-reasons.ts` | Al abrir el diálogo de cancelar |

Esos flujos no deben exponer la API key de Google al navegador. Siguen como server actions o como endpoints internos llamados por el backend después de persistir.

## 3. Arquitectura objetivo

Un solo despliegue Next.js que actúa como frontend y como API. La base es **PostgreSQL** con **Prisma**. La sesión es una cookie httpOnly firmada (JWT).

```
Navegador (páginas actuales)
        │  fetch /api/v1  + cookie de sesión
        ▼
Next.js Route Handlers  src/app/api/v1/**
        │
        ├─ auth        documento + contraseña (bcrypt), cookie httpOnly
        ├─ rbac        guard por rol en cada handler
        ├─ services    reglas: solape de citas, stock, precio congelado
        └─ prisma
              ▼
        PostgreSQL
              │
              └─ Genkit (solo servidor) para sentimiento y textos
```

### Por qué esta forma

El dominio es relacional: un barbero es un usuario, una cita une cliente + barbero + N servicios, un pedido congela precios y descuenta stock, el documento es único. PostgreSQL expresa eso con claves foráneas y transacciones. Prisma encaja con el TypeScript que ya usa el proyecto y con Zod, que ya está instalado para validar entradas.

Firebase sigue siendo buena opción para **hospedar** la app (`apphosting.yaml` ya existe). Auth y Firestore no se usan como base del dominio: las reglas de solape, stock y unicidad de documento quedan más claras en SQL. El SDK `firebase` del `package.json` se puede quitar cuando la sesión propia esté estable, o conservarse solo si más adelante se añade login con Google mediante Firebase Auth como proveedor externo.

No se crea un segundo servicio (Express/Nest aparte). Hay un solo cliente, los flujos de Genkit ya viven dentro de Next, y un servicio separado añadiría CORS, otro despliegue y otra autenticación sin cambiar las reglas de negocio.

### Estructura de carpetas a añadir

```
prisma/
  schema.prisma
  seed.ts                      datos de src/lib/mock-data.ts
src/
  app/api/v1/                  route handlers
  server/
    auth/session.ts            firmar y leer la cookie
    auth/password.ts           hash y comparación
    auth/guard.ts              requireUser, requireRole
    db.ts                      instancia de Prisma
    validators/                esquemas Zod por recurso
    services/                  citas, pedidos, inventario, opiniones
  lib/api-client.ts            fetch tipado que usarán las páginas
```

Las páginas de `src/app/dashboard` se quedan. Dejan de importar `mock-data` y `user-store` y pasan a llamar a `src/lib/api-client.ts`.

## 4. Modelo de datos

Nombres alineados con `src/lib/types.ts` para que el frontend cambie poco.

```prisma
enum UserRole { client admin barber superadmin }
enum AppointmentStatus { scheduled completed cancelled }
enum OrderStatus { pending shipped delivered cancelled }
enum Sentiment { positive negative neutral }

model User {
  id             String   @id @default(cuid())
  displayName    String
  documentNumber String   @unique
  passwordHash   String
  role           UserRole
  phone          String?
  preferences    String[]
  avatarUrl      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  barberProfile  Barber?
  appointments   Appointment[] @relation("ClientAppointments")
  orders         Order[]
}

model Barber {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  documentNumber String   @unique
  phone          String
  skills         String[]
  rating         Float    @default(0)
  imageUrl       String
  schedules      BarberSchedule[]
  appointments   Appointment[]
}

model BarberSchedule {
  id        String  @id @default(cuid())
  barberId  String
  barber    Barber  @relation(fields: [barberId], references: [id], onDelete: Cascade)
  dayOfWeek Int     // 0 domingo … 6 sábado
  startMin  Int?    // minutos desde medianoche; null = no trabaja
  endMin    Int?
  @@unique([barberId, dayOfWeek])
}

model Service {
  id          String @id @default(cuid())
  name        String
  duration    Int
  price       Decimal @db.Decimal(10, 2)
  description String
  active      Boolean @default(true)
  lines       AppointmentService[]
}

model Appointment {
  id                  String            @id @default(cuid())
  userId              String
  client              User              @relation("ClientAppointments", fields: [userId], references: [id])
  barberId            String
  barber              Barber            @relation(fields: [barberId], references: [id])
  startsAt            DateTime
  endsAt              DateTime
  status              AppointmentStatus @default(scheduled)
  cancellationReason  String?
  services            AppointmentService[]
  feedback            Feedback?
  createdAt           DateTime          @default(now())
}

model AppointmentService {
  appointmentId String
  serviceId     String
  price         Decimal @db.Decimal(10, 2)
  duration      Int
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  service       Service     @relation(fields: [serviceId], references: [id])
  @@id([appointmentId, serviceId])
}

model InventoryItem {
  id       String  @id @default(cuid())
  sku      String  @unique
  name     String
  stock    Int
  price    Decimal @db.Decimal(10, 2)
  imageUrl String
  active   Boolean @default(true)
  lines    OrderItem[]
}

model Order {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  total     Decimal     @db.Decimal(10, 2)
  status    OrderStatus @default(pending)
  createdAt DateTime    @default(now())
  items     OrderItem[]
}

model OrderItem {
  id        String        @id @default(cuid())
  orderId   String
  itemId    String
  quantity  Int
  price     Decimal       @db.Decimal(10, 2)
  order     Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  item      InventoryItem @relation(fields: [itemId], references: [id])
}

model Feedback {
  id            String     @id @default(cuid())
  appointmentId String     @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  rating        Int
  comment       String
  sentiment     Sentiment?
  confidence    Float?
  createdAt     DateTime   @default(now())
}
```

Decisiones del modelo:

- El horario deja de ser un `Record` con strings `"09:00 AM"`. Se guarda por día en minutos (`startMin` / `endMin`) para calcular huecos sin parsear texto. La API sigue devolviendo `start` y `end` en el formato que ya pinta la UI.
- `Appointment.endsAt` se calcula en el servidor: `startsAt` + suma de duraciones. Así se puede impedir solapes con una consulta por rango.
- Precio y duración se copian en `AppointmentService` y en `OrderItem`. Un cambio posterior del catálogo no reescribe el historial.
- `Feedback` es 1:1 con la cita. Rating y comentario salen de la cita y viven solo aquí. La UI de citas puede seguir mostrándolos unidos en la respuesta.
- `passwordHash` nunca sale en las respuestas. El tipo `User` del frontend se mantiene igual.

## 5. Autenticación y permisos

### Sesión

- `POST /api/v1/auth/login` recibe `{ documentNumber, password }`.
- Si coinciden, se firma un JWT (`sub`, `role`, `exp` 7 días) y se guarda en cookie `sgb_session`: `HttpOnly`, `SameSite=Lax`, `Secure` en producción, `Path=/`.
- `GET /api/v1/auth/me` devuelve el usuario de la cookie. `useAuth` deja de leer `localStorage`.
- `POST /api/v1/auth/logout` borra la cookie.
- `POST /api/v1/auth/register` crea solo usuarios `client`. Documento único. Teléfono, nombre y contraseña obligatorios (mínimo 8 caracteres).

El login con Google queda fuera de la primera entrega. El botón de la pantalla de inicio se desactiva o se oculta hasta tener un proveedor OAuth. No se simula.

### Matriz de acceso

Cada handler llama a `requireRole(...)`. El layout del dashboard puede seguir ocultando enlaces; la autoridad está en la API.

| Recurso | client | barber | admin | superadmin |
| --- | --- | --- | --- | --- |
| Su perfil | leer y editar teléfono, nombre, preferencias | igual | igual | igual |
| Catálogo de servicios | leer activos | leer | CRUD | leer |
| Reservar cita | crear la suya | no | crear para un cliente | no |
| Citas | las propias | las de su perfil de barbero | todas | todas (lectura) |
| Cancelar cita | la suya si sigue `scheduled` | no | cualquiera `scheduled` | no |
| Completar cita | no | las suyas | cualquiera | no |
| Opinión | crear sobre cita propia `completed` sin feedback | leer las suyas | leer todas | leer |
| Horario | leer (para reservar) | editar el propio | editar cualquiera | no |
| Barberos | leer activos | leer el propio | CRUD (crea también el User `barber`) | no |
| Inventario | leer activos (tienda) | no | CRUD | no |
| Pedidos | crear el propio y ver los suyos | ver los suyos | ver todos y cambiar estado | no |
| Administradores | no | no | no | CRUD, nunca borrar al último superadmin ni a sí mismo |
| Métricas del panel | las suyas | las suyas | globales | conteo de admins |

## 6. API `/api/v1`

Respuestas de error uniformes: `{ "error": { "code": "APPOINTMENT_OVERLAP", "message": "..." } }` con 400, 401, 403, 404 o 409.

### Auth

| Método | Ruta | Notas |
| --- | --- | --- |
| POST | `/auth/register` | público, rol forzado a `client` |
| POST | `/auth/login` | público |
| POST | `/auth/logout` | sesión |
| GET | `/auth/me` | sesión |

### Usuarios y administradores

| Método | Ruta | Rol |
| --- | --- | --- |
| GET | `/users/me` | cualquiera |
| PATCH | `/users/me` | cualquiera; no puede cambiar `role` ni `documentNumber` |
| GET | `/admins` | superadmin |
| POST | `/admins` | superadmin; crea `role=admin` |
| PATCH | `/admins/:id` | superadmin |
| DELETE | `/admins/:id` | superadmin |

### Barberos, horario y servicios

| Método | Ruta | Rol |
| --- | --- | --- |
| GET | `/barbers` | cualquiera autenticado |
| POST | `/barbers` | admin; transacción User + Barber + 7 filas de horario |
| PATCH | `/barbers/:id` | admin |
| DELETE | `/barbers/:id` | admin; rechazar si tiene citas `scheduled` |
| GET | `/barbers/:id/schedule` | cualquiera |
| PUT | `/barbers/:id/schedule` | el barbero dueño o admin |
| GET | `/barbers/:id/availability?date=YYYY-MM-DD&duration=45` | client y admin; devuelve huecos libres |
| GET | `/services` | cualquiera |
| POST / PATCH / DELETE | `/services` y `/services/:id` | admin |

`DELETE` de servicio hace baja lógica (`active=false`) si ya está en citas históricas.

### Citas y opiniones

| Método | Ruta | Rol |
| --- | --- | --- |
| GET | `/appointments` | filtrado por rol (ver matriz) |
| POST | `/appointments` | client (su `userId`) o admin |
| GET | `/appointments/:id` | dueño, barbero asignado, admin, superadmin |
| POST | `/appointments/:id/cancel` | client dueño o admin; body `{ reason }` |
| POST | `/appointments/:id/complete` | barbero asignado o admin |
| POST | `/appointments/:id/feedback` | client dueño, cita `completed`, una sola vez |
| GET | `/feedback` | admin y superadmin; el barbero solo ve las de sus citas |

### Inventario y pedidos

| Método | Ruta | Rol |
| --- | --- | --- |
| GET | `/inventory` | client ve activos; admin ve todos |
| POST / PATCH | `/inventory`, `/inventory/:id` | admin |
| DELETE | `/inventory/:id` | admin; baja lógica si tiene líneas de pedido |
| POST | `/orders` | client; body `{ items: [{ itemId, quantity }] }` |
| GET | `/orders` | client y barber ven los suyos; admin ve todos |
| GET | `/orders/:id` | dueño o admin |
| PATCH | `/orders/:id/status` | admin; transiciones `pending → shipped → delivered`, o `pending/shipped → cancelled` |

### Panel

| Método | Ruta | Rol |
| --- | --- | --- |
| GET | `/stats/admin` | admin: citas de hoy, ingresos de la semana (citas completadas + pedidos no cancelados), clientes nuevos en 7 días, productos con `stock <= 5` |
| GET | `/stats/barber` | barber: citas de hoy y de la semana del barbero logueado |
| GET | `/stats/client` | client: próxima cita e historial resumido |

## 7. Reglas de negocio que el servidor debe imponer

1. **Documento único** en `User` y en `Barber`. El registro y el alta de admin/barbero responden 409 si ya existe.
2. **Contraseña** con bcrypt (cost 12). Nunca se registra ni se devuelve.
3. **Reserva**
   - Al menos un servicio activo.
   - El barbero trabaja ese día (`startMin`/`endMin` no nulos).
   - `startsAt` es futuro y cae en un hueco del horario.
   - `endsAt` no pasa del fin de jornada.
   - No solapa otra cita `scheduled` del mismo barbero. La comprobación y el insert van en la misma transacción.
   - Los huecos que devuelve `/availability` ya descuentan citas existentes y la duración pedida, no un bloque fijo de 30 minutos si la suma de servicios es mayor.
4. **Cancelar** solo si el estado es `scheduled`. Guarda `cancellationReason`.
5. **Completar** solo desde `scheduled`.
6. **Feedback** solo el cliente de esa cita, solo si está `completed`, solo una vez. Después se llama a `analyzeFeedbackSentiment` y se guardan `sentiment` y `confidence`. Si Genkit falla, la opinión se guarda igual y el sentimiento queda `null` para reintento.
7. **Pedido**
   - Transacción: bloquear filas de inventario, comprobar stock, descontar, copiar precio vigente, calcular `total` en el servidor (ignorar cualquier total que mande el cliente).
   - Cantidad entera `>= 1`.
   - Cancelar un pedido `pending` o `shipped` devuelve el stock. Un pedido `delivered` no se cancela por esta API.
8. **Rating del barbero** se recalcula como promedio de `Feedback.rating` de sus citas cada vez que entra una opinión.
9. **Alta de barbero** crea el `User` con rol `barber` y el perfil en una transacción. La contraseña inicial la define el admin y el barbero la cambia desde el perfil (fase 2: endpoint `PATCH /users/me/password`).
10. **Superadmin** no puede eliminarse a sí mismo ni dejar el sistema sin ningún usuario `superadmin`.

## 8. Cómo se conecta el frontend

Orden de sustitución, sin reescribir la UI:

1. Crear `src/lib/api-client.ts` con `api.get/post/patch/put/delete`. La cookie viaja sola (`credentials: 'include'`).
2. Reescribir `useAuth`: al montar llama a `/auth/me`. Login y registro llaman a la API. `logout` llama a `/auth/logout`. Se elimina `userDocument` de `localStorage`.
3. Borrar el uso de `src/lib/user-store.ts` en páginas y diálogos. Los diálogos de admin (`add/edit/delete-admin-dialog`) pasan a llamar a `/admins`.
4. Cada página reemplaza el `useState(mockX)` inicial por un `useEffect` que carga la API, manteniendo el estado local solo como caché de lo que pintó.
5. `handleBooking` en `/dashboard/book` deja el `setTimeout` y hace `POST /appointments`. Los huecos salen de `/barbers/:id/availability`.
6. El botón **Proceder al Pago** del carrito hace `POST /orders` y vacía el carrito si responde 201.
7. Los dashboards dejan de usar números fijos y leen `/stats/*`.
8. Cuando ninguna pantalla importe `mock-data`, el archivo queda solo como fuente del seed y se puede dejar de importar en cliente.

Los tipos de `src/lib/types.ts` se conservan. Si Prisma genera nombres distintos, un mapper en `src/server/services` devuelve exactamente esos tipos (fechas en ISO; el cliente hace `new Date(...)` como ya hace con las citas).

## 9. Fases de implementación

### Fase 0 — Base (1 día)

- Añadir Prisma, `@prisma/client` y `bcryptjs` (y tipos).
- `docker-compose.yml` con PostgreSQL 16 para desarrollo local, más `.env.example` con `DATABASE_URL` y `AUTH_SECRET`.
- `schema.prisma` de la sección 4 y la primera migración.
- `src/server/db.ts`, helpers de sesión y `guard.ts`.
- Seed que carga los cuatro usuarios de `mock-data` con contraseña `password`, más barberos, servicios, inventario, citas, opiniones y pedidos. El superadmin de prueba sigue siendo el documento `00000000`.

Criterio de salida: `npx prisma studio` muestra los datos del prototipo y un script de login devuelve `Set-Cookie`.

### Fase 1 — Identidad (1 día)

- Rutas de auth y `/users/me`.
- Conectar `src/app/page.tsx` y `use-auth.tsx`.
- Quitar la rama que redirige solo por ausencia de `localStorage`; redirigir cuando `/auth/me` responda 401.
- Proteger el layout: si el rol no corresponde a la ruta, mandar al panel de ese rol.

Criterio de salida: los cuatro documentos de prueba entran con `password`, un documento inexistente recibe 401, y el registro crea un `client` que sobrevive a recargar y a otro navegador.

### Fase 2 — Catálogo y personas (1–2 días)

- CRUD de servicios, barberos y horario.
- Pantallas `/dashboard/barbers`, `/dashboard/schedule` y diálogos existentes contra la API.
- Alta de barbero crea usuario + perfil.

Criterio de salida: un admin crea un barbero, define lunes a sábado, cierra sesión, entra como ese barbero y ve su horario.

### Fase 3 — Citas (2 días)

- Crear, listar, cancelar y completar, con la transacción de solape.
- Disponibilidad real en el paso de fecha de `/dashboard/book`.
- Opinión con análisis de sentimiento al guardar.
- Listado de `/dashboard/feedback` y `/dashboard/appointments` por rol.

Criterio de salida: dos reservas seguidas en el mismo hueco; la segunda responde 409. Cancelar y opinar persisten. El rating del barbero cambia.

### Fase 4 — Tienda (1–2 días)

- Inventario y pedidos con descuento de stock.
- Carrito: **Proceder al Pago** crea el pedido.
- `/dashboard/orders` cambia estado y, al cancelar, repone stock.
- `/dashboard/products` lee inventario activo.

Criterio de salida: comprar la última unidad deja stock en 0 y un segundo pedido del mismo ítem responde 409. Cancelar el pedido devuelve la unidad.

### Fase 5 — Paneles y cierre (1 día)

- `/stats/admin`, `/stats/barber`, `/stats/client` sustituyen los números fijos.
- Recomendaciones de Genkit leen historial desde la base, no un string armado en el cliente.
- Quitar imports de `mock-data` y `user-store` en componentes de UI.
- Documentar variables de entorno y el comando de seed en el `README.md`.

Criterio de salida: `npm run build` pasa, y un recorrido manual con los cuatro roles no toca datos de ejemplo en memoria.

## 10. Entorno local

```bash
# infra
docker compose up -d

# primera vez
npx prisma migrate dev
npx prisma db seed

# app (ya existe)
npm run dev          # http://localhost:9002
```

Variables:

```
DATABASE_URL=postgresql://sgb:sgb@localhost:5432/sgb
AUTH_SECRET=          # openssl rand -base64 32
GOOGLE_GENAI_API_KEY= # ya usada por Genkit; solo servidor
```

Usuarios del seed (contraseña `password` para todos, igual que el prototipo):

| Documento | Rol |
| --- | --- |
| 00000000 | superadmin |
| 11111111 | admin |
| 22222222 | barber |
| 33333333 | client |

## 11. Fuera de este plan

- Pasarela de pago real. El pedido nace en `pending` cuando el cliente confirma el carrito.
- Login con Google.
- Notificaciones por correo o WhatsApp de citas.
- Multibarbería / multi-sede. El modelo es un solo local.
- Subida de imágenes propias. Se sigue guardando `imageUrl` (URL). Storage llega después.
- App móvil. La API versionada `/api/v1` deja ese camino abierto sin cambiar el contrato.

## 12. Orden de trabajo recomendado

Empezar por la Fase 0 y la Fase 1 antes de tocar pantallas de negocio. Sin sesión real, el resto de CRUD volvería a confiar en el rol que el navegador dice tener. Después citas (Fase 3), porque es el flujo principal del producto, y la tienda al final.
