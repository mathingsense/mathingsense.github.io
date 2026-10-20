import { applyCameraTransform, attachWheelZoom, clearCanvas, drawCheckerboard, initCanvas, panCamera, pointerToWorld, resizeCanvas, zoomAtPoint } from "../lib/canvas.js";
import { Renderer } from "../lib/Renderer.js";
import { Point } from "../lib/Point.js";
import { Scene } from "../lib/Scene.js";
import { PropLength, Premise, PropMidpoint } from "../lib/Premise.js";
import { getElement } from "../common.js";
import { Solver } from "../lib/Solver.js";
import { TMidp } from "../lib/theorem.js";

const world = { w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx } = initCanvas("canvas");
const divPremises = getElement("premises", HTMLDivElement);
const divConclusion = getElement("conclusion", HTMLDivElement);

const scene = new Scene();
const render = new Renderer(ctx, world.w, world.h);

const A = scene.addPoint(100, 100, "A");
const B = scene.addPoint(400, 300, "B");
const s = scene.addSegment(A, B);
const midp = scene.addMidpoint(s, "M");

const points = scene.points;
const segments = scene.segments;
const midpoints = scene.midpoints;

const premise = new Premise();
const lenAB = new PropLength(A, B, 100);
const midAB = new PropMidpoint(A, B, midp);

premise.add(lenAB);
premise.add(midAB);

const solver = new Solver(premise);
const lenAC = new PropLength(A, midp);
solver.ask(lenAC);
solver.step(TMidp, lenAC, lenAB, midAB);

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
/** @type number | null */

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
    }

    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDist = null;
});

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
