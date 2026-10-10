import { initCanvas, isInCircle, getPointerPos, Pt, Ellipse, distance } from "../common.js";
import { Renderer, FILL, BOTH } from "../Renderer.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);

const r = 10;
const cx = width / 2;
const cy = height / 2;

let f1 = new Pt(150, 300);
let f2 = new Pt(450, 300);
let p = new Pt(300, 100);
let [A, B] = Ellipse.findABfromFoci(f1, f2, p);
const foci = [f1, f2];

let dragging = false;
let dragType = "at";
let dragFoci = f1;

const render = new Renderer(c, width, height);

/**
 * @param {CanvasRenderingContext2D} c
 */
const draw = (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    // Coordinate axes
    c.strokeStyle = "#cbd5e1";
    c.lineWidth = 1;
    render.seg4(0, cy, width, cy);
    render.seg4(cx, 0, cx, height);

    // The ellipse
    c.fillStyle = "rgba(14,165,233,0.07)";
    c.strokeStyle = "#0284c7";
    render.ellipse(300, 300, A, B, 0, BOTH);

    // Line from P to both foci
    c.lineWidth = 4;
    c.strokeStyle = "red";
    render.seg4(f1.x, f1.y, p.x, p.y);
    c.strokeStyle = "blue";
    render.seg4(f2.x, f2.y, p.x, p.y);

    // Lines with equal length to above lines
    const d1 = distance(p, f1);
    const d2 = distance(p, f2);
    const y = 550;
    c.strokeStyle = "red";
    render.seg4(cx - A, y, cx - A + d1, y);
    c.strokeStyle = "blue"
    render.seg4(cx - A + d1, y, cx - A + d1 + d2, y);

    // Helper visual lines
    c.lineWidth = 1;
    c.strokeStyle = "#000";
    c.setLineDash([10, 10]);
    render.seg4(cx - A, 0, cx - A, height);
    render.seg4(cx + A, 0, cx + A, height);
    c.setLineDash([]);

    // Draggable dots.
    c.fillStyle = "#000";
    render.circle2(f1.x, f1.y, r, FILL);
    render.circle2(f2.x, f2.y, r, FILL);
    render.pt(p, 10, FILL);

    // Names
    c.font = "14px system-ui";
    c.fillStyle = "#172033";
    c.fillText("F₁", f1.x - 8, f1.y + 22);
    c.fillText("F₂", f2.x - 8, f2.y + 22);
    c.fillText("P", p.x + 10, p.y - 10);
}
draw(c);

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    const [x, y] = getPointerPos(canvas, e);
    for (const p of foci) {
        if (isInCircle(x, y, p.x, p.y, r)) {
            dragging = true;
            dragType = "foci"
            dragFoci = p
            return;
        }
    }
    if (isInCircle(x, y, p.x, p.y, r)) {
        dragging = true;
        dragType = "at"
    }
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    if (!dragging) return;

    e.preventDefault();
    let [x, y] = getPointerPos(canvas, e);

    if (dragType === "at") {
        x = (x - cx) / A;
        y = -(y - cy) / B;
        const t = Math.atan2(y, x);
        p.x = cx + A * Math.cos(t);
        p.y = cy - B * Math.sin(t);
    } else {
        const dx = x - dragFoci.x;
        if (dragFoci === f2) {
            f2.x = x;
            f1.x = f1.x - dx;
        } else {
            f1.x = x;
            f2.x = f2.x - dx;
        }
        [A, B] = Ellipse.findABfromFoci(f1, f2, p);
    }
    draw(c);
}

const pointerUp = () => {
    dragging = false;
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointerup", pointerUp, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerout", pointerUp, false);