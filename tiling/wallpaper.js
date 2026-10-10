import { initCanvas, getElement, getPointerPos } from "../common.js";
import { Lattice, WallpaperGroup } from "../WallpaperGroup.js";
import { FILL, Renderer, STROKE } from "../Renderer.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height);
const selectGroup = getElement("group", HTMLSelectElement);
const selectMode = getElement("mode", HTMLSelectElement);
const showGrid = getElement("showGrid", HTMLInputElement);

selectGroup.value = "p1";
selectMode.value = "default";
showGrid.checked = true;

const render = new Renderer(c, width, height);

const mp1 = () => render.triangle6(10, 10, 80, 20, 50, 40, STROKE);
const lp1 = Lattice.oblique(120, 107, 69);
const p1 = new WallpaperGroup("p1");

const mp2 = () => render.triangle6(10, 10, 60, 10, 60, 30, STROKE);
const lp2 = Lattice.oblique(120, 107, 69);
const p2 = new WallpaperGroup("p2");

// const mpm = () => render.rect4(100, 40, 10, 50, STROKE);
const mpm = () => render.triangle6(10, 10, 50, 10, 50, 30, STROKE);
const lpm = Lattice.rectangular(120, 100);
const pm = new WallpaperGroup("pm");

const mpg = () => render.triangle6(40, 10, 110, 10, 110, 40, STROKE);
const lpg = Lattice.rectangular(120, 100);
const pg = new WallpaperGroup("pg");

const mpmm = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lpmm = Lattice.rectangular(120, 100);
const pmm = new WallpaperGroup("pmm");

const mpmg = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lpmg = Lattice.rectangular(120, 100);
const pmg = new WallpaperGroup("pmg");

const mpgg = () => render.triangle6(60, 10, 115, 10, 115, 40, STROKE);
const lpgg = Lattice.rectangular(120, 100);
const pgg = new WallpaperGroup("pgg");

const mcm = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lcm = Lattice.rectangular(120, 100);
const cm = new WallpaperGroup("cm");

const mcmm = () => render.triangle6(65, 20, 65, 40, 115, 40, STROKE);
const lcmm = Lattice.rectangular(120, 100);
const cmm = new WallpaperGroup("cmm");

const mp4 = () => render.triangle6(65, 20, 65, 40, 115, 40, STROKE);
const lp4 = Lattice.square(120);
const p4 = new WallpaperGroup("p4");

const mp4m = () => render.triangle6(110, 10, 110, 50, 90, 50, STROKE);
const lp4m = Lattice.square(120);
const p4m = new WallpaperGroup("p4m");

const mp4g = () => render.triangle6(75, 10, 110, 10, 110, 30, STROKE);
const lp4g = Lattice.square(120);
const p4g = new WallpaperGroup("p4g");

const mp3 = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp3 = Lattice.hexagonal(120);
const p3 = new WallpaperGroup("p3");

const mp3m1 = () => render.triangle6(20, 5, 50, 5, 50, 20, STROKE);
const lp3m1 = Lattice.hexagonal(120);
const p3m1 = new WallpaperGroup("p3m1");

const mp31m = () => render.triangle6(20, 5, 50, 5, 50, 20, STROKE);
const lp31m = Lattice.hexagonal(120);
const p31m = new WallpaperGroup("p31m");

const mp6 = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp6 = Lattice.hexagonal(120);
const p6 = new WallpaperGroup("p6");

const mp6m = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp6m = Lattice.hexagonal(120);
const p6m = new WallpaperGroup("p6m");


/** @type {Record<string, [WallpaperGroup, Lattice, (c: CanvasRenderingContext2D) => void]>} */
const defaults = {
    p1: [p1, lp1, mp1],
    p2: [p2, lp2, mp2],
    pm: [pm, lpm, mpm],
    pg: [pg, lpg, mpg],
    pmm: [pmm, lpmm, mpmm],
    pmg: [pmg, lpmg, mpmg],
    pgg: [pgg, lpgg, mpgg],
    cm: [cm, lcm, mcm],
    cmm: [cmm, lcmm, mcmm],
    p4: [p4, lp4, mp4],
    p4m: [p4m, lp4m, mp4m],
    p4g: [p4g, lp4g, mp4g],
    p3: [p3, lp3, mp3],
    p3m1: [p3m1, lp3m1, mp3m1],
    p31m: [p31m, lp31m, mp31m],
    p6: [p6, lp6, mp6],
    p6m: [p6m, lp6m, mp6m],
};

let currGroup = selectGroup.value;
let currMode = selectMode.value;
let current = defaults[currGroup];

/** @type {{points: [number, number][]}[]} */
let strokes = [];

/** @type {{points: [number, number][]} | null} */
let currStroke = null;

let isDrawing = false;

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#fff";
    c.strokeStyle = "#000";
    c.fillRect(0, 0, width, height);

    c.fillStyle = "#000"
    if (showGrid.checked) {
        render.lattice(current[1]);
    }
    render.group(current[0], current[1], current[2]);
}
draw(c);

function drawCustom() {
    const visibleStrokes = currStroke
        ? [...strokes, currStroke]
        : strokes;

    for (const stroke of visibleStrokes) {
        drawStroke(c, stroke);
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{points: [number, number][]}} stroke
 */
function drawStroke(ctx, stroke) {
    const points = stroke.points;
    if (points.length === 0) return;

    ctx.strokeStyle = "#000";
    if (points.length === 1) {
        // A tap should produce a dot.
        render.circle2(points[0][0], points[0][1], 2, FILL);
    } else {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();
    }
}

/**
 * @param {PointerEvent} e
 */
const pointerDown = (e) => {
    if (currMode !== "freehand") return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    isDrawing = true;
    currStroke = {
        points: [getPointerPos(canvas, e)]
    };
    draw(c);
}

/**
 * @param {PointerEvent} e
 */
const pointerMove = (e) => {
    if (!isDrawing || !currStroke) return;
    currStroke.points.push(getPointerPos(canvas, e));
    draw(c);
}

function finishStroke() {
    if (!isDrawing) return;
    isDrawing = false;

    if (currStroke) {
        strokes.push(currStroke);
        currStroke = null;
    }
    draw(c);
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", pointerDown, false);
canvas.addEventListener("pointermove", pointerMove, false);
canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointercancel", finishStroke);

showGrid.addEventListener("change", () => draw(c));

const updateMode = () => {
    if (currMode === "default") {
        current[2] = defaults[currGroup][2];
    } else {
        current = [current[0], current[1], drawCustom];
    }
}

selectGroup.addEventListener("change", () => {
    const value = selectGroup.value;
    currGroup = value;
    current = defaults[value];
    updateMode();
    draw(c);
});

selectMode.addEventListener("change", () => {
    const value = selectMode.value;
    currMode = value;
    updateMode();
    draw(c);
});