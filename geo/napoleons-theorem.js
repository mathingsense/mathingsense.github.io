import { STROKE, FILL, BOTH, initCanvas, circle, triangle, isInCircle, getPointerPos } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

const colors = ["#ffff0099", "#00ffff99", "#ff00ff99"];

// Initial coordinate of vertices of the main triangle
const A = { x: 220, y: 185 };
const B = { x: 430, y: 360 };
const C = { x: 210, y: 405 };
const vs = [A, B, C];

/** @type {{x: number, y: number}[]} */
const cs = [];          // center of side triangles

const r = 10;           // vertex radius
const deg = -Math.PI / 3;
const cos = Math.cos(deg);
const sin = Math.sin(deg);

/** @type {{x: number, y: number} | null} */
let currentDrag = null;

/**
 * @param {CanvasRenderingContext2D} c 
 */
const sideTriangle = (c) => {
    for (let i = 0; i < 3; i++) {
        const A = vs[i];
        const B = vs[(i + 1) % 3];

        let dx = B.x - A.x;
        let dy = B.y - A.y;
        let x3 = A.x + dx * cos - dy * sin;
        let y3 = A.y + dx * sin + dy * cos;

        c.fillStyle = colors[i];
        triangle(c, A.x, A.y, B.x, B.y, x3, y3, BOTH);

        // Center of side triangle
        cs[i] = {
            x: (A.x + B.x + x3) / 3,
            y: (A.y + B.y + y3) / 3
        };
    }
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    // triangle(c, A.x, A.y, B.x, B.y, C.x, C.y, STROKE);

    sideTriangle(c);
    triangle(c, cs[0].x, cs[0].y, cs[1].x, cs[1].y, cs[2].x, cs[2].y, STROKE);

    // Draw draggable vertices
    c.fillStyle = "#0000ff";
    for (const v of vs) {
        circle(c, v.x, v.y, r, FILL);
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