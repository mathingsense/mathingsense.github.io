import { initCanvasGl } from "../common.js";
import { createHeightField, createPointMarker, createProgram, createTangentPlaneMesh, M4, orbitView, perspective, resizeCanvas } from "../Gl.js";
import { fs, vs } from "../shaders.js";
import { uiButton, uiSelect, uiSlider } from "../UI.js";

const width = 600;
const height = 600;

const [canvas, gl] = initCanvasGl("canvas", width, height);

const tangentFragmentShader = `#version 300 es
    precision highp float;

    in vec3 vColor;
    out vec4 outColor;

    void main() {
        outColor = vec4(vColor, 0.35);
    }
`;

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const program = createProgram(gl, vs, fs);
const tangentProgram = createProgram(gl, vs, tangentFragmentShader);
gl.useProgram(program);

/**
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @returns
 */
const getUniforms = (gl, program) => {
    return {
        model: gl.getUniformLocation(program, "uModel"),
        view: gl.getUniformLocation(program, "uView"),
        projection: gl.getUniformLocation(program, "uProjection"),
    };
}

const surfaceUniforms = getUniforms(gl, program);
const tangentUniforms = getUniforms(gl, tangentProgram);

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

/**
 * @param {Surface} fn
 * @param {number} x
 * @param {number} z
 * @param {number} h
 * @returns {{dx: number, dz: number}}
 */
const partialDerivatives = (fn, x, z, h = 0.001) => {
    const dx = (fn(x + h, z) - fn(x - h, z)) / (2 * h);
    const dz = (fn(x, z + h) - fn(x, z - h)) / (2 * h);

    return { dx, dz };
}


/**
 * @param {Surface} fn
 * @param {number} x
 * @param {number} z
 * @returns
 */
const tangentPlane = (fn, x, z) => {
    const y = fn(x, z);
    const { dx, dz } = partialDerivatives(fn, x, z);

    return {
        point: { x, y, z },
        dx,
        dz,
        /**
         * @param {number} px
         * @param {number} pz
         */
        heightAt(px, pz) {
            return y + dx * (px - x) + dz * (pz - z);
        }
    };
}

/** @typedef {{buffer: WebGLBuffer, count: number, mode: number}} Mesh */

let fn = "wave";
let surfaceData = createHeightField(gl, functions[fn].fn);

/** @type Mesh | null */
let tangentMesh = null;
/** @type Mesh | null */
let pointMesh = null;

let point = { x: 0, z: 0 };

/**
 * @param {Surface} fn
 */
function updateTangentMeshes(fn) {
    if (tangentMesh) {
        gl.deleteBuffer(tangentMesh.buffer);
    }

    if (pointMesh) {
        gl.deleteBuffer(pointMesh.buffer);
    }

    const plane = tangentPlane(fn, point.x, point.z);

    tangentMesh = createTangentPlaneMesh(gl, plane, 1);
    pointMesh = createPointMarker(gl, plane.point);
}
updateTangentMeshes(functions[fn].fn);


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
        updateTangentMeshes(functions[fn].fn);
    },
});

uiSlider({
    label: "Point x",
    min: -2,
    max: 2,
    step: 0.1,
    value: 0.5,
    onChange(value) {
        point.x = value;
        updateTangentMeshes(functions[fn].fn);
    },
});

uiSlider({
    label: "Point z",
    min: -2,
    max: 2,
    step: 0.1,
    value: 0.5,
    onChange(value) {
        point.z = value;
        updateTangentMeshes(functions[fn].fn);
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
 * @param {WebGLProgram} program
 * @param {*} uniforms
 */
const drawMesh = (mesh, model, view, projection, program, uniforms) => {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniformMatrix4fv(uniforms.view, false, view);
    gl.uniformMatrix4fv(uniforms.projection, false, projection);

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
        drawMesh(surfaceData.surface, model, view, proj, program, surfaceUniforms);

        if (display === "both") {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
    }
    if (display !== "surface") {
        drawMesh(surfaceData.wireframe, model, view, proj, program, surfaceUniforms);
    }

    if (tangentMesh && pointMesh) {
        drawMesh(tangentMesh, model, view, proj, tangentProgram, tangentUniforms);
        // drawMesh(tangentMesh, model, view, proj, program);

        drawMesh(pointMesh, model, view, proj, program, surfaceUniforms);
    }
    requestAnimationFrame(render);
};
render();
