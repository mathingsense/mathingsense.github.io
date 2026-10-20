import { applyCameraTransform, attachWheelZoom, clearCanvas, drawCheckerboard, initCanvas, panCamera, pointerToWorld, resizeCanvas } from "../lib/canvas.js";
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
let activePointerId = null;
let lastX = 0;
let lastY = 0;

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

canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = pointerToWorld(e, canvas, camera);
    const point = findPointAt(x, y);

    if (activeTool === "move") {
        lastX = e.clientX;
        lastY = e.clientY;
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
    activePointerId = e.pointerId;
});

canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId !== activePointerId) return;

    if (interaction.type === "drag-point") {
        interaction.point.x += (e.clientX - lastX) / camera.zoom;
        interaction.point.y += (e.clientY - lastY) / camera.zoom;
    } else if (interaction.type === "pan") {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        panCamera(camera, dx, dy);
    }

    lastX = e.clientX;
    lastY = e.clientY;

    draw();
});

const stopDragging = () => {
    activePointerId = null;
    interaction = { type: "idle" };
};

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);
canvas.addEventListener("lostpointercapture", stopDragging);
