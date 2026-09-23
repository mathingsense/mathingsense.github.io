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

const width = size;
const height = size;
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
let deg = -Math.PI/3;
let dragging = false;
/** @type {{x: number, y: number}} */
let currentDrag = A;
/** @type {{x: number, y: number}[]} */
let cs = [];    // center of side triangles


/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 */
const draw_triangle = (c, x1, y1, x2, y2, x3, y3) => {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.closePath();
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const sideTriangle = (c) => {
    for (let i = 0; i < 3; i++) {
        let dx = vs[(i+1)%3].x - vs[i].x;
        let dy = vs[(i+1)%3].y - vs[i].y;
        let x3 = vs[i].x + dx * Math.cos(deg) - dy * Math.sin(deg);
        let y3 = vs[i].y + dx * Math.sin(deg) + dy * Math.cos(deg);

        draw_triangle(c, vs[i].x, vs[i].y, vs[(i+1)%3].x, vs[(i+1)%3].y, x3, y3);
        c.fillStyle = colors[i];
        c.fill();
        c.stroke();

        // Center of side triangle
        let x = (vs[i].x + vs[(i+1)%3].x + x3) / 3;
        let y = (vs[i].y + vs[(i+1)%3].y + y3) / 3;
        cs[i] = {x, y};
    }
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    draw_triangle(c, A.x, A.y, B.x, B.y, C.x, C.y);
    c.stroke();
    sideTriangle(c);
    draw_triangle(c, cs[0].x, cs[0].y, cs[1].x, cs[1].y, cs[2].x, cs[2].y);
    c.stroke();

    // Draw draggable vertices
    c.fillStyle = "#0000ff";
    c.beginPath();
    c.moveTo(A.x, A.y);
    c.arc(A.x, A.y, r, 0, 2*Math.PI);
    c.moveTo(B.x, B.y);
    c.arc(B.x, B.y, r, 0, 2*Math.PI);
    c.moveTo(C.x, C.y);
    c.arc(C.x, C.y, r, 0, 2*Math.PI);
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
    return Math.sqrt((v.x-x)**2 + (v.y-y)**2) < r;
}

/**
 * @param {PointerEvent} e
 */
function pointerUp(e) {
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
