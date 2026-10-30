# Proyecto-Web-II-Cabina
Proyecto de Programación Web II donde vamos a crear un sistema para administrar salas de ensayo, bandas, músicos, reservas y préstamos de equipos.

API REST (solo backend) del centro cultural: salas de ensayo, bandas, músicos, reservas y préstamo de equipo. Hecha con Express y MongoDB mediante Mongoose.

## Integrantes

- Lary Díaz Artavia — Salas, equipos e infraestructura
- Integrante 2 — Bandas, músicos y documentación
- Integrante 3 — Reservas, préstamos y transacciones

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

En la carpeta `postman/` están la colección **Cabina** y su environment. Importar ambos y correr las carpetas en este orden: salas, bandas, músicos, equipo, reservas, consultas y errores.

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

### Booking y Loan
*(pendiente: lo completa el Integrante 3)*

## Transacción

*(pendiente: lo completa el Integrante 3)*