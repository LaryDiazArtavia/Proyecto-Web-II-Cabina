# Proyecto-Web-II-Cabina
Proyecto de Programación Web II donde vamos a crear un sistema para administrar salas de ensayo, bandas, músicos, reservas y préstamos de equipos.

API REST (solo backend) del centro cultural: salas de ensayo, bandas, músicos, reservas y préstamo de equipo. Hecha con Express y MongoDB mediante Mongoose.

## Integrantes

- Lary Díaz Artavia — Salas, equipos e infraestructura
- Andrey Araya Quiros — Bandas, músicos y documentación
- Kristel Bravo Rivera — Reservas, préstamos y transacciones

## Instalación

1. Clonar el repositorio e instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el archivo `.env` a partir de `.env.example` y completar el string de conexión:

   ```
   PORT=3000
   MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/cabina
   ```

   El `.env` no se sube al repositorio. Las transacciones requieren un cluster de MongoDB Atlas (replica set).

3. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   El servidor queda en `http://localhost:3000`. Para producción: `npm start`.

## Postman

En la carpeta `postman/` están la colección **Cabina** y su Environment. Se deben importar ambos archivos en Postman.

El orden recomendado para ejecutar las solicitudes es: Salas, Bandas, Músicos, Equipo, Reservas, Consultas y Errores.

Las carpetas Préstamos y Cancelación permiten comprobar los préstamos de equipos y su devolución al cancelar una reserva. Algunas solicitudes dependen de datos creados previamente.

## Índices de MongoDB

Todos se declaran en los schemas de Mongoose.

### Room
- `name` (único): evita dos salas con el mismo nombre.

### Band
- `name` (único): evita dos bandas con el mismo nombre y acelera la búsqueda por nombre.

### Musician
- `email` (único): evita registrar dos músicos con el mismo correo.
- `band`: acelera las consultas de los músicos de una banda (`GET /api/bands/:id/musicians`, el populate del detalle de la banda, el filtro `?band=` y la validación de borrado de una banda con músicos).

### Equipment
- `name` (único): evita registrar dos equipos con el mismo nombre.

### Booking
- `{ room, date, startHour }` (compuesto): sirve para el horario de una sala en un día (`GET /api/rooms/:id/schedule`, ordenado por `startHour`) y para revisar traslapes al crear o editar una reserva, porque esa consulta busca reservas de la misma sala y la misma fecha.

### Loan
- `booking`: sirve para buscar los préstamos de una reserva: el detalle de la reserva, la cancelación (que devuelve sus préstamos) y el filtro `GET /api/loans?booking=`.
- `{ equipment, status }` (compuesto): sirve para buscar los préstamos de un equipo según su estado, por ejemplo los que siguen `prestado`, y para el filtro `GET /api/loans?equipment=&status=`.


## Transacción

Crear y cancelar una reserva usan una transacción con `mongoose.startSession()` y `session.withTransaction()`. Todo lo que pasa adentro se guarda junto o no se guarda nada. Requiere MongoDB Atlas, porque las transacciones solo funcionan en un replica set.

### Dónde está
En `src/controllers/bookings.js`:
- `createBooking` → `POST /api/bookings`
- `cancelBooking` → `PATCH /api/bookings/:id/cancel`

### Qué colecciones toca
**Crear reserva** (`createBooking`):
1. Revisa las reglas con `validateBooking`: lee `rooms`, `bands`, `musicians` y busca traslapes en `bookings`.
2. Revisa el inventario en `equipment`.
3. Crea el documento en `bookings`.
4. Crea un documento en `loans` por cada equipo, con estado `prestado`.
5. Descuenta las unidades en `equipment` con `$inc` (negativo).

**Cancelar reserva** (`cancelBooking`):
1. Cambia la reserva a `cancelada` en `bookings`.
2. Cambia sus préstamos a `devuelto` en `loans`.
3. Devuelve las unidades a `equipment` con `$inc` (positivo).

Cada consulta adentro de la transacción lleva la sesión (`.session(session)` o `{ session }`). Si algo falla, se lanza un error con `throwError` y Mongo deshace todo, así no queda una reserva sin equipo ni equipo descontado sin reserva.

### Cómo probamos el 409
En Postman, carpeta **Errores** de la colección `Cabina`:
- **Equipo de más**: solicita 999 unidades de un equipo, superando la cantidad disponible. Responde 409. Después se revisan `GET /api/bookings` y `GET /api/equipment` para comprobar que no se creó la reserva y que `availableUnits` no cambió. Esto demuestra que la transacción se deshizo.
- **Traslape**: pide la misma sala y fecha con un horario que se cruza con otra reserva activa. Responde 409.
- **Cancelar reserva ya cancelada** (carpeta Cancelación): responde 409 porque una reserva cancelada se queda así.