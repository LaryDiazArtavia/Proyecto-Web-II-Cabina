# Proyecto-Web-II-Cabina
Proyecto de Programación Web II donde vamos a crear un sistema para administrar salas de ensayo, bandas, músicos, reservas y préstamos de equipos.

## Índices de MongoDB

### Room
- `name` (único): evita registrar dos salas con el mismo nombre.

### Equipment
- `name` (único): evita registrar dos equipos con el mismo nombre.

Estos índices se definen en los schemas de Mongoose mediante `unique: true`.
