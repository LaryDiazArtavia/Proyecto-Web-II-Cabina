const express = require('express');

const roomsRoutes = require('./routes/rooms');
const equipmentRoutes = require('./routes/equipment');

const app = express();

app.use(express.json());

app.use('/api/rooms', roomsRoutes);
app.use('/api/equipment', equipmentRoutes);

// Manejo de errores
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: error.type === 'entity.parse.failed'
            ? 'JSON inválido'
            : error.message
    });
});

module.exports = app;
