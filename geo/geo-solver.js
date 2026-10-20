import { applyCameraTransform, attachWheelZoom, clearCanvas, drawCheckerboard, initCanvas, panCamera, pointerToWorld, resizeCanvas, zoomAtPointer } from "../lib/canvas.js";
import { Renderer } from "../lib/Renderer.js";
import { Pt } from "../lib/Pt.js";
import { Seg } from "../lib/Seg.js";

const world = { w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx } = initCanvas("canvas");
const render = new Renderer(ctx, world.w, world.h);

const a = new Pt(100, 100);
const b = new Pt(400, 300);
const s = new Seg(a, b);
const points = [a, b];
const segs = [s];

const draw = () => {
    clearCanvas(canvas, ctx);
    drawCheckerboard(canvas, ctx, 40);
    applyCameraTransform(canvas, ctx, camera);

    for (const s of segs) {
        render.seg(s);
    }

    for (const p of points) {
        render.pt(p, 10);
    }

    // Draw the world border.
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeRect(0, 0, world.w, world.h);
};
draw();

window.addEventListener('resize', () => {
    resizeCanvas(canvas);
    draw();
});

attachWheelZoom(canvas, camera, draw);

/**
 * @typedef {{ type: "idle" }
 *   | { type: "drag-point", point: Pt }
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
 * @returns {Pt | null}
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

canvas.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;

        if (interaction.type === "drag-point") {
            interaction.point.x += dx / camera.zoom;
            interaction.point.y += dy / camera.zoom;
        } else if (interaction.type === "pan") {
            panCamera(camera, dx, dy);
        }
    } else if (pointers.size === 2) {
        // two pointers: pinch to zoom
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        if (lastPinchDist !== null && dist > 0) {
            const factor = lastPinchDist / dist;
            zoomAtPointer(e, canvas, camera, factor);
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
