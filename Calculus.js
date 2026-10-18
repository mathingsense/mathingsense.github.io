/** @typedef {(x: number, z: number) => number} Surface */

/**
 * @param {Surface} fn
 * @param {number} x
 * @param {number} z
 * @param {number} [h]
 * @returns {{dx: number, dz: number}}
 */
export const partialDerivatives = (fn, x, z, h = 0.001) => {
    const dx = (fn(x + h, z) - fn(x - h, z)) / (2 * h);
    const dz = (fn(x, z + h) - fn(x, z - h)) / (2 * h);

    return { dx, dz };
};

/**
 * @typedef {Object} TangentPlane
 * @property {{x: number, y: number, z: number}} point
 * @property {number} dx
 * @property {number} dz
 * @property {(px: number, pz: number) => number} heightAt
 */

/**
 * @param {Surface} fn
 * @param {number} x
 * @param {number} z
 * @param {number} [h]
 * @returns {TangentPlane}
 */
export const tangentPlane = (fn, x, z, h) => {
    const y = fn(x, z);
    const { dx, dz } = partialDerivatives(fn, x, z, h);

    return {
        point: { x, y, z },
        dx,
        dz,
        heightAt: (px, pz) => y + dx * (px - x) + dz * (pz - z),
    };
};