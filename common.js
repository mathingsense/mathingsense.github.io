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
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
export const line = (c, x1, y1, x2, y2) => {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} w
 * @param {number} h
 */
export const extLine = (c, x1, y1, x2, y2, w, h) => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const k = Math.max(w, h) * 2;
    const startX = x1 - dx * k;
    const startY = y1 - dy * k;
    const endX = x2 + dx * k;
    const endY = y2 + dy * k;

    c.beginPath();
    c.moveTo(startX, startY);
    c.lineTo(endX, endY);
    c.stroke();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} mode
 */
export const rect = (c, x, y, w, h, mode) => {
    c.beginPath();
    c.rect(x, y, w, h);
    paint(c, mode);
}

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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent} e
 * @returns {[number, number]}
 */
export const getPointerPos = (canvas, e) => {
    const b = canvas.getBoundingClientRect();
    return [
        e.pageX - (b.left + window.scrollX),
        e.pageY - (b.top + window.scrollY)
    ];
    // Below is simpler. Check later.
    // return [e.clientX - rect.left, e.clientY - rect.top];
};

/**
 * Returns a random integer x such that min <= x <= max
 * @param {number} min - Inclusive lower bound (integer)
 * @param {number} max - Inclusive upper bound (integer, >= min)
 * @returns {number}
 */
export const randomInt = (min, max) => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new TypeError("min and max must be integers");
    }
    if (min > max) {
        throw new RangeError("min must be <= max");
    }
    return min + Math.floor((max - min + 1) * Math.random());
};