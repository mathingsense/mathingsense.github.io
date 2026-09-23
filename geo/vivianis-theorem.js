// @ts-check

const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("canvas"));
if (canvas === null) {
    throw new Error("canvas element is not found");
}

const c = canvas.getContext("2d");
if (c === null) {
    throw new Error("2D rendering context is not found");
}

const pixelRatio = window.devicePixelRatio || 1;

const size = 600;
canvas.style.width = size + "px";
canvas.style.height = size + "px";
canvas.width = size * pixelRatio;
canvas.height = size * pixelRatio;
c.scale(pixelRatio, pixelRatio);

// -------------------------------------------------------------------

/** @typedef {{x: number, y: number}} Point */

const width = size;
const height = size;
const colors = ["#f00", "#0f0", "#00f"];

const s = 300
const t = Math.sin(Math.PI / 3) * s
const cy = height / 2

// Vertices of equilateral triangle
const A = {
    x: 250,
    y: cy - t / 2
};

const B = {
    x: 400,
    y: cy + t / 2
};

const C = {
    x: 100,
    y: cy + t / 2
};

const p = {
    x: 250,
    y: cy
};

const r = 10;
let dragging = false;


/**
 * @param {CanvasRenderingContext2D} c
 * @param {Point} A
 * @param {Point} B
 * @param {Point} C
 */
const draw_triangle = (c, A, B, C) => {
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(B.x, B.y);
    c.lineTo(C.x, C.y);
    c.closePath();
    c.stroke()
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 */
const line = (c, x1, y1, x2, y2, color) => {
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
}

/**
 * Returns the projection point of a given point onto a line segment defined by two endpoints.
 * @param {Point} point
 * @param {Point} line_start
 * @param {Point} line_end
 * @returns {Point}
 */
const get_projection_point = (point, line_start, line_end) => {
    const dx = line_end.x - line_start.x;
    const dy = line_end.y - line_start.y;

    const line_length_sq = dx * dx + dy * dy;
    if (line_length_sq === 0) return line_start;

    // Calculate the projection scalar t.
    const uX = point.x - line_start.x;
    const uY = point.y - line_start.y;
    const t = (uX * dx + uY * dy) / line_length_sq;

    return {
        x: line_start.x + t * dx,
        y: line_start.y + t * dy
    }
}

let p1 = get_projection_point(p, A, B);
let p2 = get_projection_point(p, B, C);
let p3 = get_projection_point(p, C, A);

/**
 * @param {Point} p1 
 * @param {Point} p2 
 * @returns {number}
 */
const dist = (p1, p2) => {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Draws a line between two points on the canvas.
 * @param {CanvasRenderingContext2D} c 
 * @param {Point} A 
 * @param {Point} B 
 * @param {string} color 
 */
const line2 = (c, A, B, color) => {
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.lineTo(B.x, B.y);
    c.stroke();
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#000000";
    c.fillRect(0, 0, width, height);

    draw_triangle(c, A, B, C);;

    // Draw draggable vertices
    c.fillStyle = "#000";
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.arc(p.x, p.y, r, 0, 2 * Math.PI);
    c.closePath();
    c.fill();

    c.lineWidth = 4;

    const l1 = dist(p, p1);
    const l2 = dist(p, p2);
    const l3 = dist(p, p3);
    line2(c, p, p1, colors[0]);
    line2(c, p, p2, colors[1]);
    line2(c, p, p3, colors[2]);

    const k = { x: 500, y: B.y };
    line(c, k.x, k.y, k.x, k.y - l1, colors[0]);
    line(c, k.x, k.y - l1, k.x, k.y - l1 - l2, colors[1]);
    line(c, k.x, k.y - l1 - l2, k.x, k.y - l1 - l2 - l3, colors[2]);
}
draw(c);

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = get_mouse_pos(e);
    const is_inside = (p.x - x) ** 2 + (p.y - y) ** 2 < r ** 2
    if (is_inside) {
        dragging = true;
    }
}

const pointerUp = () => {
    dragging = false;
}

/**
 * Returns the cross product of vectors (p2 - p1) and (p3 - p1).
 * @param {Point} p1 
 * @param {Point} p2 
 * @param {Point} p3 
 * @returns {number}
 */
const cross_product = (p1, p2, p3) => {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

/**
 * Checks if a point is inside a triangle.
 * @param {Point} p
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 * @returns {boolean}
 */
const isPointInTriangle = (p, a, b, c) => {
    const d1 = cross_product(p, a, b);
    const d2 = cross_product(p, b, c);
    const d3 = cross_product(p, c, a);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    // Point is inside if all cross products have the same sign
    return !(hasNeg && hasPos);
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    e.preventDefault();
    if (dragging) {
        const [x, y] = get_mouse_pos(e);
        if (!isPointInTriangle({ x, y }, A, B, C)) return;

        p.x = x;
        p.y = y;

        p1 = get_projection_point(p, A, B);
        p2 = get_projection_point(p, B, C);
        p3 = get_projection_point(p, C, A);
        draw(c);
    }
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointerup", pointerUp, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerout", pointerUp, false);

/**
 * @param {PointerEvent} e
 * @returns {[number, number]}
 */
const get_mouse_pos = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.pageX - (b.left + window.scrollX), e.pageY - (b.top + window.scrollY)];
}

export { };