import { project, distance, isInCircle, Pt, Circle } from "../common.js";
import { applyCameraTransform, clearCanvas, fitWorld, initCanvas, pointerToWorld, resizeCanvas } from "../lib/canvas.js";
import { Renderer, STROKE, FILL, BOTH } from "../Renderer.js";

const world = { x: 0, y: 0, w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx: c } = initCanvas("canvas");
fitWorld(canvas, camera, world);

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
let type = "corner";
let t = A;

const render = new Renderer(c, world.w, world.h);

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
};

let ab = updateSidePoint(0.4, A, B);
let bc = updateSidePoint(0.4, B, C);
let ca = updateSidePoint(0.4, C, A);
let abc = [ab, bc, ca];
let g = ab;

const update = () => {
    ab = updateSidePoint(ab.t, A, B);
    bc = updateSidePoint(bc.t, B, C);
    ca = updateSidePoint(ca.t, C, A);
    abc = [ab, bc, ca];
};

const draw = () => {
    clearCanvas(canvas, c);
    applyCameraTransform(canvas, c, camera);

    c.setLineDash([10, 10]); // [dash length, gap length]
    render.line2(A, B);
    render.line2(B, C);
    render.line2(C, A);
    c.setLineDash([]);

    render.triangle3(A, B, C, STROKE);
    c.fillStyle = "#000";
    for (const v of vs) {
        render.pt(v, r, FILL);
    }

    render.pt2(ab.x, ab.y, r, FILL);
    render.pt2(bc.x, bc.y, r, FILL);
    render.pt2(ca.x, ca.y, r, FILL);

    const k = Circle.circumcircle(A, ab, ca);
    if (k) {
        c.fillStyle = colors[0];
        render.circle(k, BOTH);
    }

    const l = Circle.circumcircle(B, bc, ab);
    if (l) {
        c.fillStyle = colors[1];
        render.circle(l, BOTH);
    }

    const m = Circle.circumcircle(C, ca, bc);
    if (m) {
        c.fillStyle = colors[2];
        render.circle(m, BOTH);
    }

    if (k && l && m) {
        let d = Circle.intersect(k, l);

        let h = d.points;
        let M;
        if (distance(h[0], ab) > distance(h[1], ab)) {
            M = h[0];
        } else {
            M = h[1];
        }
        c.fillStyle = "red";
        render.pt2(M.x, M.y, r, BOTH);
    }
};
draw();

window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    fitWorld(canvas, camera, world);
    draw();
});

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const { x, y } = pointerToWorld(e, canvas, camera);
    for (const p of vs) {
        if (isInCircle(x, y, p.x, p.y, r)) {
            dragging = true;
            type = "corner";
            t = p;
            return;
        }
    }
    for (const p of abc) {
        if (isInCircle(x, y, p.x, p.y, r)) {
            dragging = true;
            type = "side";
            g = p;
            return;
        }
    }
};

const pointerUp = () => {
    dragging = false;
};

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    e.preventDefault();
    if (dragging) {
        const { x, y } = pointerToWorld(e, canvas, camera);
        if (type === "corner") {
            t.x = x;
            t.y = y;
            update();
        } else {
            const p = project({ x, y }, g.A, g.B);
            g.x = p.x;
            g.y = p.y;
            g.t = p.t;
        }

        draw();
    }
};

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointerup", pointerUp, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerout", pointerUp, false);