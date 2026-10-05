import { STROKE, FILL, BOTH, initCanvas, isInCircle, getPointerPos, Pt, Triangle, Renderer } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

const colors = ["#ffff0099", "#00ffff99", "#ff00ff99"];

// Initial coordinate of vertices of the main triangle.
const A = new Pt(220, 185);
const B = new Pt(430, 360);
const C = new Pt(210, 405);
const vs = [A, B, C];

const r = 10;           // vertex radius
const deg = -Math.PI / 3;

/** @type {{x: number, y: number} | null} */
let currentDrag = null;

const render = new Renderer(c, width, height);

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    // render.triangle3(A, B, C, STROKE);

    const cs = [];
    for (let i = 0; i < 3; i++) {
        const A = vs[i];
        const B = vs[(i + 1) % 3];
        const C = B.rotate(A, deg);

        c.fillStyle = colors[i];
        render.triangle3(A, B, C, BOTH);

        cs.push(Triangle.centroid(A, B, C));
    }

    render.triangle3(cs[0], cs[1], cs[2], STROKE);

    // const t = Triangle.napoleon(A, B, C);
    // render.triangle(t, STROKE);

    // Draw draggable vertices
    c.fillStyle = "#0000ff";
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