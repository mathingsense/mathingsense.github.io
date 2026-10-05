import { initCanvas, STROKE, FILL, BOTH, distance, isInCircle, circle, getPointerPos, Pt, Circle, Renderer } from "../common.js";

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
const A = new Pt(250, 100);
const B = new Pt(500, 300);
const C = new Pt(100, 500);
const vs = [A, B, C];

const r = 10;
let dragging = false;
let type = "corner"
let t = A

const render = new Renderer(c, width, height);

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

    c.setLineDash([10, 10]); // [dash length, gap length]
    render.line2(A, B, width, height);
    render.line2(B, C, width, height);
    render.line2(C, A, width, height);
    c.setLineDash([]);

    render.triangle3(A, B, C, STROKE);
    c.fillStyle = "#000";
    for (const v of vs) {
        render.pt(v, r, FILL)
    }

    render.pt2(ab.x, ab.y, r, FILL);
    render.pt2(bc.x, bc.y, r, FILL);
    render.pt2(ca.x, ca.y, r, FILL);

    const k = Circle.circumcircle(A, ab, ca);
    if (k) {
        c.fillStyle = colors[0]
        render.circle(k, BOTH);
    }

    const l = Circle.circumcircle(B, bc, ab);
    if (l) {
        c.fillStyle = colors[1]
        render.circle(l, BOTH);
    }

    const m = Circle.circumcircle(C, ca, bc);
    if (m) {
        c.fillStyle = colors[2]
        render.circle(m, BOTH);
    }

    if (k && l && m) {
        let d = Circle.intersect(k, l)

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