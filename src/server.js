require('dotenv').config();

const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

start();