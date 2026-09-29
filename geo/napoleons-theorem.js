import { STROKE, BOTH, initCanvas, triangle } from "../common.js";

const [canvas, c] = initCanvas("canvas", 600, 600);

const width = 600;
const height = 600;
const colors = ["#ffff0099", "#00ffff99", "#ff00ff99"];

// Initial coordinate of vertices of the main triangle
let A = {
    x: 220,
    y: 185,
};
let B = {
    x: 430,
    y: 360,
};
let C = {
    x: 210,
    y: 405,
};
let vs = [A, B, C];     // iterable vertices

let r = 10;     // vertex radius
let deg = -Math.PI / 3;
let dragging = false;
/** @type {{x: number, y: number}} */
let currentDrag = A;
/** @type {{x: number, y: number}[]} */
let cs = [];    // center of side triangles

/**
 * @param {CanvasRenderingContext2D} c 
 */
const sideTriangle = (c) => {
    for (let i = 0; i < 3; i++) {
        let dx = vs[(i + 1) % 3].x - vs[i].x;
        let dy = vs[(i + 1) % 3].y - vs[i].y;
        let x3 = vs[i].x + dx * Math.cos(deg) - dy * Math.sin(deg);
        let y3 = vs[i].y + dx * Math.sin(deg) + dy * Math.cos(deg);

        c.fillStyle = colors[i];
        triangle(c, vs[i].x, vs[i].y, vs[(i + 1) % 3].x, vs[(i + 1) % 3].y, x3, y3, BOTH);

        // Center of side triangle
        let x = (vs[i].x + vs[(i + 1) % 3].x + x3) / 3;
        let y = (vs[i].y + vs[(i + 1) % 3].y + y3) / 3;
        cs[i] = { x, y };
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
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.arc(A.x, A.y, r, 0, 2 * Math.PI);
    c.moveTo(B.x, B.y);
    c.arc(B.x, B.y, r, 0, 2 * Math.PI);
    c.moveTo(C.x, C.y);
    c.arc(C.x, C.y, r, 0, 2 * Math.PI);
    c.closePath();
    c.fill();
}
draw(c);


/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = get_mouse_pos(e);
    for (let i = 0; i < 3; i++) {
        if (is_inside(x, y, vs[i])) {
            dragging = true;
            currentDrag = vs[i];
            break;
        }
    }
}

/**
 * @param {number} x
 * @param {number} y
 * @param {{x: number, y: number}} v
 * @returns {boolean}
 */
const is_inside = (x, y, v) => {
    return Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2) < r;
}

function pointerUp() {
    dragging = false;
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    e.preventDefault();
    if (dragging) {
        const [x, y] = get_mouse_pos(e);
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

/**
 * @param {PointerEvent} e
 * @returns {[number, number]}
 */
const get_mouse_pos = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.pageX - (b.left + window.scrollX), e.pageY - (b.top + window.scrollY)];
}