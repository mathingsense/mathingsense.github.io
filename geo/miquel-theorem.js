import { initCanvas, STROKE, FILL, BOTH, distance, isInCircle, circle, triangle, getPointerPos } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

/** @typedef {{x: number, y: number}} Point */

const colors = [
    "rgba(255, 0, 0, 0.2)",
    "rgba(0, 255, 0, 0.2)",
    "rgba(0, 0, 255, 0.2)",
];

// Initial vertices of triangle
const A = { x: 250, y: 100 };
const B = { x: 500, y: 300 };
const C = { x: 100, y: 500 };
const vs = [A, B, C];

const r = 10;
let dragging = false;
let type = "corner"
let t = A

/**
 * @param {number} t
 * @param {Point} A
 * @param {Point} B
 * @returns
 */
const updateSidePoint = (t, A, B) => {
    const x = A.x + t * (B.x - A.x);
    const y = A.y + t * (B.y - A.y);
    return { x, y, t, A, B };
}

let ab = updateSidePoint(0.4, A, B)
let bc = updateSidePoint(0.4, B, C)
let ca = updateSidePoint(0.4, C, A)
let abc = [ab, bc, ca];
let g = ab

const update = () => {
    ab = updateSidePoint(ab.t, A, B);
    bc = updateSidePoint(bc.t, B, C);
    ca = updateSidePoint(ca.t, C, A);
    abc = [ab, bc, ca];
}

/**
 * @param {Point} A 
 * @param {Point} B 
 * @param {Point} C 
 * @returns 
 */
const circumcircle = (A, B, C) => {
    const { x: x1, y: y1 } = A;
    const { x: x2, y: y2 } = B;
    const { x: x3, y: y3 } = C;

    const D = 2 * (
        x1 * (y2 - y3) +
        x2 * (y3 - y1) +
        x3 * (y1 - y2)
    );

    if (D < 0.0001) return null;

    const h = (
        (x1 ** 2 + y1 ** 2) * (y2 - y3) +
        (x2 ** 2 + y2 ** 2) * (y3 - y1) +
        (x3 ** 2 + y3 ** 2) * (y1 - y2)
    ) / D;

    const k = (
        (x1 ** 2 + y1 ** 2) * (x3 - x2) +
        (x2 ** 2 + y2 ** 2) * (x1 - x3) +
        (x3 ** 2 + y3 ** 2) * (x2 - x1)
    ) / D;

    const r = Math.hypot(h - x1, k - y1);

    return { x: h, y: k, r: r };
}

/**
 * 
 * @param {{x: number, y: number, r: number}} A 
 * @param {{x: number, y: number, r: number}} B 
 * @returns 
 */
function circleIntersections(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const d = Math.hypot(dx, dy);

    // Distance from circle 1's center to the chord
    const a = (A.r ** 2 - B.r ** 2 + d ** 2) / (2 * d);

    // Height from the chord to either intersection point
    const hSquared = A.r ** 2 - a ** 2;
    const h = Math.sqrt(Math.max(0, hSquared));

    // Point along the line between the two centers
    const xm = A.x + (a * dx) / d;
    const ym = A.y + (a * dy) / d;

    // Perpendicular unit vector
    const px = -dy / d;
    const py = dx / d;

    const p1 = {
        x: xm + h * px,
        y: ym + h * py
    };

    const p2 = {
        x: xm - h * px,
        y: ym - h * py
    };

    // Tangent circles have one unique point
    if (h < 0.0000001) {
        return {
            type: "tangent",
            points: [p1]
        };
    }

    return {
        type: "two-intersections",
        points: [p1, p2]
    };
}

/**
 * @param {Point} p 
 * @param {Point} A 
 * @param {Point} B 
 * @returns {{x: number, y: number, t: number} | null}
 */
const getProjectionPoint = (p, A, B) => {
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const line_length_sq = dx * dx + dy * dy;
    if (line_length_sq === 0) return null;

    // Calculate the projection scalar t.
    const uX = p.x - A.x;
    const uY = p.y - A.y;
    let t = (uX * dx + uY * dy) / line_length_sq;
    t = Math.max(0, Math.min(1, t));

    return {
        x: A.x + t * dx,
        y: A.y + t * dy,
        t: t
    }
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#000000";
    c.fillRect(0, 0, width, height);

    triangle(c, A.x, A.y, B.x, B.y, C.x, C.y, STROKE);
    c.fillStyle = "#000";
    for (const v of vs) {
        circle(c, v.x, v.y, r, FILL);
    }

    circle(c, ab.x, ab.y, r, FILL);
    circle(c, bc.x, bc.y, r, FILL);
    circle(c, ca.x, ca.y, r, FILL);

    const k = circumcircle(A, ab, ca)
    if (k) {
        c.fillStyle = colors[0]
        circle(c, k.x, k.y, k.r, BOTH);
    }

    const l = circumcircle(B, bc, ab)
    if (l) {
        c.fillStyle = colors[1]
        circle(c, l.x, l.y, l.r, BOTH);
    }

    const m = circumcircle(C, ca, bc)
    if (m) {
        c.fillStyle = colors[2]
        circle(c, m.x, m.y, m.r, BOTH);
    }

    let d = circleIntersections(k, l)

    let h = d.points
    let M
    if (distance(h[0], ab) > distance(h[1], ab)) {
        M = h[0]
    } else {
        M = h[1];
    }
    c.fillStyle = "red"
    circle(c, M.x, M.y, r, BOTH);
}
draw(c);

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = getPointerPos(canvas, e);
    for (const p of vs) {
        if (isInCircle(x, y, p.x, p.y, r)) {
            dragging = true;
            type = "corner"
            t = p
        }
    }
    for (const p of abc) {
        if (isInCircle(x, y, p.x, p.y, r)) {
            dragging = true;
            type = "side";
            g = p;
        }
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
        if (type === "corner") {
            t.x = x;
            t.y = y;
            update();
        } else {
            const p = getProjectionPoint({ x, y }, g.A, g.B)
            if (p) {
                g.x = p.x;
                g.y = p.y;
                g.t = p.t;
            }
        }

        draw(c);
    }
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointerup", pointerUp, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerout", pointerUp, false);