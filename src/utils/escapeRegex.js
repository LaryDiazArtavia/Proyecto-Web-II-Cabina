// Escapa caracteres especiales para usar texto del usuario dentro de un $regex
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;