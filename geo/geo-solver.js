import { applyCameraTransform, attachWheelZoom, clearCanvas, drawCheckerboard, initCanvas, panCamera, pointerToWorld, resizeCanvas, zoomAtPoint } from "../lib/canvas.js";
import { Renderer } from "../lib/Renderer.js";
import { Point } from "../lib/Point.js";
import { Scene } from "../lib/Scene.js";
import { PropLength, Premise, PropMidpoint, PropPoint } from "../lib/Premise.js";
import { getElement } from "../common.js";
import { Solver } from "../lib/Solver.js";
import { halfLenMidpoint } from "../lib/theorem.js";
import { SymbolManager } from "../lib/cas/Symbol.js";
import { UI } from "../lib/UI.js";

const world = { w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx } = initCanvas("canvas");
const divPremises = getElement("premises", HTMLDivElement);
const divConclusion = getElement("conclusion", HTMLDivElement);

const uiObj = new UI()
    .title("Objects").background("white");

const objectList = uiObj.list({
    items: [],
});

const scene = new Scene(objectList);
const render = new Renderer(ctx, world.w, world.h);

const A = scene.addPoint(100, 100, "A");
const B = scene.addPoint(400, 300, "B");
const S1 = scene.addSegment(A, B);
const M = scene.addMidpoint(S1, "M");

const S2 = scene.addSegment(A, M);
const N = scene.addMidpoint(S2, "N");

const points = scene.points;
const segments = scene.segments;
const midpoints = scene.midpoints;

const symbols = new SymbolManager();
const x = symbols.expr("x");

const premise = new Premise();
const pA = new PropPoint(A);
const pB = new PropPoint(B);
const lenAB = new PropLength(A, B, x);

const MmidAB = new PropMidpoint(S1, M);
const NmidAM = new PropMidpoint(S2, N);

premise.addMany(pA, pB, lenAB, MmidAB, NmidAM);

const solver = new Solver(premise);


const lenAM = halfLenMidpoint(pA, MmidAB, lenAB);
const lenAN = halfLenMidpoint(pA, NmidAM, lenAM);
solver.add(lenAM);
solver.add(lenAN);

const lenMB = halfLenMidpoint(pB, MmidAB, lenAB);
solver.add(lenMB);

const draw = () => {
    clearCanvas(canvas, ctx);
    drawCheckerboard(canvas, ctx, 40);
    applyCameraTransform(canvas, ctx, camera);

    for (const s of segments) {
        render.segment(s);
    }

    for (const p of points) {
        render.point(p, 10);
    }

    for (const p of midpoints) {
        render.midpoint(p, 10);
    }

    // Draw the world border.
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeRect(0, 0, world.w, world.h);

    divPremises.textContent = premise.toString();
    divConclusion.textContent = solver.toString();
};
draw();

window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    draw();
});

attachWheelZoom(canvas, camera, draw);

/**
 * @typedef {{ type: "idle" }
 *   | { type: "drag-point", point: Point }
 *   | { type: "pan" }} Interaction
 */

/** @type Interaction */
let interaction = { type: "idle" };

let activeTool = "move";

const HIT_RADIUS_SQ = 10 * 10;

/**
 * @param {number} x
 * @param {number} y
 * @returns {Point | null}
 */
const findPointAt = (x, y) => {
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy <= HIT_RADIUS_SQ) return p;
    }
    return null;
};

const pointers = new Map();   // pointerId -> {x, y}

/** @type number | null */
let lastPinchDist = null;

canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = pointerToWorld(e, canvas, camera);
    const point = findPointAt(x, y);

    if (activeTool === "move") {
        if (point) {
            interaction = {
                type: "drag-point",
                point: point,
            };
        } else {
            interaction = { type: "pan" };
        }
    } else if (activeTool === "point") {
        // Only create on empty canvas; don't accidentally stack points.
        if (!point) {
            scene.addPoint(x, y);
        } else {
            console.log("There's already a point here.");
        }
        draw();
        return;
    }

    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDist = null;
});

/** @typedef {{x: number, y: number}} XY */

/**
 * @param {XY} a
 * @param {XY} b
 * @returns {XY}
 */
const getMidpoint = (a, b) => {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
};

canvas.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;

        if (interaction.type === "drag-point") {
            const p = interaction.point;
            p.x += dx / camera.zoom;
            p.y += dy / camera.zoom;
            scene.propagateChange(p);
        } else if (interaction.type === "pan") {
            panCamera(camera, dx, dy);
        }
    } else if (pointers.size === 2) {
        // two pointers: pinch to zoom
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        if (lastPinchDist !== null && dist > 0) {
            const factor = dist / lastPinchDist;
            const midpoint = getMidpoint(a, b);
            const rect = canvas.getBoundingClientRect();

            const x = midpoint.x - rect.left;
            const y = midpoint.y - rect.top;

            zoomAtPoint(camera, x, y, factor);
        }
        lastPinchDist = dist;
    }

    draw();
});

/**
 * @param {PointerEvent} e
 */
const stopDragging = (e) => {
    pointers.delete(e.pointerId);
    lastPinchDist = null;
    interaction = { type: "idle" };
};

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);
canvas.addEventListener("lostpointercapture", stopDragging);

const uiControl = new UI()
    .background("white").right(10);

uiControl.select({
    label: "Mode",
    value: activeTool,
    options: [
        { label: "Move", value: "move" },
        { label: "Point", value: "point" },
    ],
    onChange(value) {
        activeTool = value;
    },
});