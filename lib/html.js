/**
 * @template {Element} T
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 */
export const getElement = (id, type) => {
    const el = document.getElementById(id);
    if (el === null) {
        throw new Error(`element #${id} not found`);
    }
    if (!(el instanceof type)) {
        throw new TypeError(`element #${id} is not a ${type.name}`);
    }
    return el;
};