
function getPagination(query, allowedSort, defaultSort) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const sort = query.sort || defaultSort;

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new Error('Página o límite inválido');
    }

    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;

    if (!allowedSort.includes(sortField)) {
        throw new Error('Campo de ordenamiento inválido');
    }

    return {
        page,
        limit,
        sortField,
        sortOrder: sort.startsWith('-') ? -1 : 1
    };
}

module.exports = getPagination;
