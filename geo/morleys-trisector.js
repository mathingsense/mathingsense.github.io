import { trisect, intersect, initCanvas, getPointerPos, STROKE, FILL, isInCircle, Renderer, Pt, BOTH } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

// Vertices of triangle.
const A = new Pt(230, 100);
const B = new Pt(500, 350);
const C = new Pt(100, 550);
const vs = [A, B, C];

const sets = [[A, B, C], [B, C, A], [C, A, B]];

const r = 10;
/** @type {{x: number, y: number} | null} */
let currentDrag = null;

const render = new Renderer(c, width, height);

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.fillStyle = "#fff";
    c.strokeStyle = "#000";
    c.fillRect(0, 0, width, height);

    render.triangle3(A, B, C, STROKE);

    const ks = [];
    for (const [V, P, Q] of sets) {
        const tris = trisect(V, P, Q);
        for (const dir of tris) {
            const k = intersect(V, dir, P, { x: Q.x - P.x, y: Q.y - P.y });
            ks.push({ V, k });
        }
    }

    c.strokeStyle = "#00f";
    for (const k of ks) {
        render.seg4(k.V.x, k.V.y, k.k.x, k.k.y);
    }

    const ACB = trisect(A, C, B);
    const BAC = trisect(B, A, C);
    const CBA = trisect(C, B, A);

    const v1 = intersect(A, ACB[1], B, BAC[0]);
    const v2 = intersect(B, BAC[1], C, CBA[0]);
    const v3 = intersect(C, CBA[1], A, ACB[0]);

    c.fillStyle = "#ff0";
    render.triangle3(v1, v2, v3, BOTH);

    c.strokeStyle = "#000";
    c.fillStyle = "#f00";
    render.pt2(v1.x, v1.y, 5, FILL);
    render.pt2(v2.x, v2.y, 5, FILL);
    render.pt2(v3.x, v3.y, 5, FILL);

    // Draw draggable vertices
    c.fillStyle = "#000";
    for (const v of vs) {
        render.pt(v, r, FILL);
    }
}
draw(c);

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = getPointerPos(canvas, e);
    // Reverse order so the topmost-drawn vertex wins
    for (let i = vs.length - 1; i >= 0; i--) {
        const v = vs[i];
        if (isInCircle(x, y, v.x, v.y, r)) {
            currentDrag = v;
            break;
        }
    }
}

function pointerUp() {
    currentDrag = null;
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    e.preventDefault();
    if (currentDrag !== null) {
        const [x, y] = getPointerPos(canvas, e);
        currentDrag.x = x;
        currentDrag.y = y;
        draw(c);
    }
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointerup", pointerUp, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerout", pointerUp, false);