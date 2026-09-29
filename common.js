/** @typedef {{x: number, y: number}} Point */

/**
 * @param {string} id
 * @param {number} width
 * @param {number} height
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
export const initCanvas = (id, width, height) => {
    if (!(width > 0 && height > 0)) {
        throw new RangeError('width and height must be positive');
    }

    const el = document.getElementById(id);
    if (el === null) {
        throw new Error(`element #${id} not found`);
    }
    if (!(el instanceof HTMLCanvasElement)) {
        throw new Error(`element #${id} is not a <canvas>`);
    }

    const ctx = el.getContext("2d");
    if (ctx === null) {
        throw new Error(`could not get a 2D context for #${id}`);
    }

    // Sizes the canvas for crisp rendering on HiDPI displays.
    const dpr = window.devicePixelRatio || 1;

    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);

    ctx.setTransform(el.width / width, 0, 0, el.height / height, 0, 0);
    return [el, ctx];
};

/**
 * @param {Point} A
 * @param {Point} B
 * @returns {number}
 */
export const distance = (A, B) => {
    return Math.hypot(B.x - A.x, B.y - A.y);
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
export const fillCircle = (c, x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
export const strokeCircle = (c, x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.stroke();
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 */
export const fillStrokeCircle = (c, x, y, r) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.stroke();
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {Point} A
 * @param {Point} B
 * @param {Point} C
 */
export const strokeTriangle = (c, A, B, C) => {
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(B.x, B.y);
    c.lineTo(C.x, C.y);
    c.closePath();
    c.stroke();
};

/**
 * @param {number} px
 * @param {number} py
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {boolean}
 */
export const isInCircle = (px, py, cx, cy, r) => {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
};