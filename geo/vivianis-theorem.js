import { initCanvas, getPointerPos, STROKE, FILL, isInCircle, Renderer, Pt, Triangle } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

/** @typedef {{x: number, y: number}} Point */

const colors = ["#f00", "#0f0", "#00f"];

const s = 300
const t = Math.sin(Math.PI / 3) * s
const cy = height / 2

// Vertices of equilateral triangle
const A = new Pt(250, cy - t / 2);
const B = new Pt(400, cy + t / 2);
const C = new Pt(100, cy + t / 2);

const tri = new Triangle(A, B, C);

const p = new Pt(250, cy);

const r = 10;
let dragging = false;

const render = new Renderer(c);

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
    render.seg4(x1, y1, x2, y2);
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {Pt} A
 * @param {Pt} B
 * @param {string} color
 */
const line2 = (c, A, B, color) => {
    c.strokeStyle = color;
    render.seg2(A, B);
}

/**
 * Returns the projection point of a given point onto a line segment defined by two endpoints.
 * @param {Pt} p
 * @param {Pt} A
 * @param {Pt} B
 * @returns {Pt}
 */
const get_projection_point = (p, A, B) => {
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const line_length_sq = dx * dx + dy * dy;
    if (line_length_sq === 0) return A;

    // Calculate the projection scalar t.
    const uX = p.x - A.x;
    const uY = p.y - A.y;
    const t = (uX * dx + uY * dy) / line_length_sq;

    return new Pt(
        A.x + t * dx,
        A.y + t * dy
    );
}

let p1 = get_projection_point(p, A, B);
let p2 = get_projection_point(p, B, C);
let p3 = get_projection_point(p, C, A);

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#000000";
    c.fillRect(0, 0, width, height);

    render.triangle3(A, B, C, STROKE);

    // Draw draggable vertices
    c.fillStyle = "#000";
    render.pt(p, r, FILL);

    c.lineWidth = 4;

    line2(c, p, p1, colors[0]);
    line2(c, p, p2, colors[1]);
    line2(c, p, p3, colors[2]);

    const l1 = p.distanceTo(p1);
    const l2 = p.distanceTo(p2);
    const l3 = p.distanceTo(p3);

    const x = 500;
    const y = B.y;
    line(c, x, y, x, y - l1, colors[0]);
    line(c, x, y - l1, x, y - l1 - l2, colors[1]);
    line(c, x, y - l1 - l2, x, y - l1 - l2 - l3, colors[2]);
}
draw(c);

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = getPointerPos(canvas, e);
    if (isInCircle(x, y, p.x, p.y, r)) {
        dragging = true;
    }
}

const pointerUp = () => {
    dragging = false;
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    e.preventDefault();
    if (dragging) {
        const [x, y] = getPointerPos(canvas, e);
        if (!tri.contains(new Pt(x, y))) return;

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