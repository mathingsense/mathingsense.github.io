import { initCanvasGl } from "../common.js";
import { createHeightField, createProgram, M4, orbitView, perspective, resizeCanvas } from "../Gl.js";
import { fs, vs } from "../shaders.js";
import { uiButton, uiSelect } from "../UI.js";

const width = 600;
const height = 600;

const [canvas, gl] = initCanvasGl("canvas", width, height);

const program = createProgram(gl, vs, fs);
gl.useProgram(program);

const uModel = gl.getUniformLocation(program, "uModel");
const uView = gl.getUniformLocation(program, "uView");
const uProjection = gl.getUniformLocation(program, "uProjection");

/** @typedef {(x: number, y: number) => number} Surface */

/** @type {Record<string, {fn: Surface, description: string}>} */
const functions = {
    wave: {
        fn: (x, z) => Math.sin(2 * x) * Math.cos(2 * z),
        description:
            "A repeating wave with alternating peaks and valleys.",
    },

    saddle: {
        fn: (x, z) => 0.5 * (x * x - z * z),
        description:
            "A saddle rises in one direction and falls in the other.",
    },

    gaussian: {
        fn: (x, z) => 2 * Math.exp(-(x * x + z * z)),
        description:
            "A smooth central peak that approaches zero outward.",
    },
};

/** @typedef {{buffer: WebGLBuffer, count: number, mode: number}} Mesh */

let fn = "wave";
let surfaceData = createHeightField(gl, functions[fn].fn);

let azimuth = 0.75;
let elevation = 0.45;
let distance = 7.5;

const minDistance = 2.5;
const maxDistance = 20;

const pointers = new Map();   // pointerId -> {x, y}

/** @type number | null */
let lastPinchDist = null;

canvas.style.touchAction = "none";

canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPinchDist = null;
});

canvas.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
        // one pointer: rotate
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;

        azimuth -= dx * 0.008;
        elevation += dy * 0.008;
        elevation = Math.max(-1.45, Math.min(1.45, elevation));
    } else if (pointers.size === 2) {
        // two pointers: pinch to zoom
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        if (lastPinchDist !== null && dist > 0) {
            distance *= lastPinchDist / dist;
            distance = Math.max(minDistance, Math.min(maxDistance, distance));
        }
        lastPinchDist = dist;
    }
});

/**
 * @param {PointerEvent} e
 */
const endPointer = (e) => {
    pointers.delete(e.pointerId);
    lastPinchDist = null;
};

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    distance *= Math.exp(e.deltaY * 0.001);
    distance = Math.max(minDistance, Math.min(maxDistance, distance));
},
    { passive: false }
);

window.addEventListener("resize", () => {
    resizeCanvas(canvas, gl);
});

uiButton({
    label: "Reset Camera",
    onClick() {
        azimuth = 0.75;
        elevation = 0.45;
        distance = 7.5;
    },
});

uiSelect({
    label: "Function",
    value: fn,
    options: [
        { label: "Wave: sin(2x) cos(2z)", value: "wave" },
        { label: "Saddle: 0.5(x^2 - z^2)", value: "saddle" },
        { label: "Gaussian: 2exp(-(x^2+z^2))", value: "gaussian" },
    ],
    onChange(value) {
        fn = value;
        const selected = functions[value];
        const nextSurface = createHeightField(gl, selected.fn);

        // @todo cache
        gl.deleteBuffer(surfaceData.surface.buffer);
        gl.deleteBuffer(surfaceData.wireframe.buffer);

        surfaceData = nextSurface;
    },
});

let display = "surface";

uiSelect({
    label: "Display",
    value: display,
    options: [
        { label: "Surface", value: "surface" },
        { label: "Wireframe", value: "wireframe" },
        { label: "Both", value: "both" },
    ],
    onChange(value) {
        fn = value;
        display = value;
    },
});

/**
 * @param {Mesh} mesh
 * @param {Float32Array} model
 * @param {Float32Array} view
 * @param {Float32Array} projection
 */
const drawMesh = (mesh, model, view, projection) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProjection, false, projection);

    gl.drawArrays(mesh.mode, 0, mesh.count);
};

const model = M4.identity();
const aspect = canvas.width / canvas.height;
const proj = perspective(Math.PI / 4, aspect, 0.1, 100);
const view = new Float32Array(16);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.clearColor(1, 1, 1, 1);

const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    orbitView(azimuth, elevation, distance, view);

    if (display !== "wireframe") {
        if (display === "both") {
            gl.enable(gl.POLYGON_OFFSET_FILL);
            gl.polygonOffset(1, 1);
        }
        drawMesh(surfaceData.surface, model, view, proj);

        if (display === "both") {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
    }
    if (display !== "surface") {
        drawMesh(surfaceData.wireframe, model, view, proj);
    }
    requestAnimationFrame(render);
};
render();
