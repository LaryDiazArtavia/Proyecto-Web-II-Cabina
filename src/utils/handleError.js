// Traduce errores de Mongoose/MongoDB a respuestas JSON { error } con su código HTTP
function handleError(res, error) {
    // Clave duplicada (name o email únicos) -> conflicto
    if (error.code === 11000) {
        const campo = Object.keys(error.keyPattern || {})[0] || 'campo';
        return res.status(409).json({ error: `Ya existe un registro con ese ${campo}` });
    }
    // Validaciones del schema o ids con formato inválido -> body/parámetro inválido
    return res.status(400).json({ error: error.message });
}

module.exports = handleError;