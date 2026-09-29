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

export const STROKE = 1, FILL = 2, BOTH = 3;

/**
 * @param {CanvasRenderingContext2D} c
 * @param {*} mode
 */
const paint = (c, mode) => {
    if (mode & FILL) c.fill();
    if (mode & STROKE) c.stroke();
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} mode
 */
export const circle = (c, x, y, r, mode) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    paint(c, mode);
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} mode
 */
export const triangle = (c, x1, y1, x2, y2, x3, y3, mode) => {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.closePath();
    paint(c, mode);
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