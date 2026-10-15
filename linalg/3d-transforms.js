import { getElement, initCanvasGl } from "../common.js";
import { createCube, createCubeWireframe, createGridAndAxes, createProgram, M4, orbitView, perspective, resizeCanvas } from "../Gl.js";
import { fs, vs } from "../shaders.js";

const width = 600;
const height = 600;

const [canvas, gl] = initCanvasGl("canvas", width, height);

const program = createProgram(gl, vs, fs);
gl.useProgram(program);

const uModel = gl.getUniformLocation(program, "uModel");
const uView = gl.getUniformLocation(program, "uView");
const uProjection = gl.getUniformLocation(program, "uProjection");


/** @typedef {{buffer: WebGLBuffer, count: number, mode: number}} Mesh */

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


let azimuth = 0.75;
let elevation = 0.45;
let distance = 7.5;

const minDistance = 3;
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

getElement("reset-camera", HTMLButtonElement)
    .addEventListener("click", () => {
        azimuth = 0.75;
        elevation = 0.45;
        distance = 7.5;
    });


window.addEventListener("resize", () => {
    resizeCanvas(canvas, gl);
});


gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

gl.clearColor(1, 1, 1, 1);

const cube = createCube(gl);
const originalWireframe = createCubeWireframe(gl);
const gridAndAxes = createGridAndAxes(gl);

let model = M4.identity();

const scaleX = getElement("scale-x", HTMLInputElement);
const scaleY = getElement("scale-y", HTMLInputElement);
const scaleZ = getElement("scale-z", HTMLInputElement);
const rotY = getElement("rotation-y", HTMLInputElement);

const scaleXOut = getElement("scale-x-value", HTMLOutputElement);
const scaleYOut = getElement("scale-y-value", HTMLOutputElement);
const scaleZOut = getElement("scale-z-value", HTMLOutputElement);
const rotYOut = getElement("rotation-y-value", HTMLOutputElement);

const matrixDisplay = getElement("matrix-display", HTMLPreElement);

function updateTransform() {
    const sx = Number(scaleX.value);
    const sy = Number(scaleY.value);
    const sz = Number(scaleZ.value);
    const angle = Number(rotY.value);

    scaleXOut.textContent = sx.toFixed(1);
    scaleYOut.textContent = sy.toFixed(1);
    scaleZOut.textContent = sz.toFixed(1);
    rotYOut.textContent = `${angle}°`;

    model = M4.multiply(M4.rotationY(angle), M4.scaling(sx, sy, sz));

    // Display the matrix as four readable rows.
    const rows = [];

    for (let row = 0; row < 4; row++) {
        const values = [];
        for (let col = 0; col < 4; col++) {
            values.push(
                model[col * 4 + row].toFixed(2).padStart(6)
            );
        }
        rows.push(`[ ${values.join("  ")} ]`);
    }

    matrixDisplay.textContent = rows.join("\n");
}

[scaleX, scaleY, scaleZ, rotY].forEach(
    (input) => {
        input.addEventListener("input", updateTransform);
    }
);

getElement("reset-transform", HTMLButtonElement)
    .addEventListener("click", () => {
        scaleX.value = "1";
        scaleY.value = "1";
        scaleZ.value = "1";
        rotY.value = "0";

        updateTransform();
    });

updateTransform();

const I4 = M4.identity();

const aspect = canvas.width / canvas.height;
const proj = perspective(Math.PI / 4, aspect, 0.1, 100);

let view = orbitView(azimuth, elevation, distance);

const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    orbitView(azimuth, elevation, distance, view);

    drawMesh(gridAndAxes, I4, view, proj);

    // Draw the original cube as a ghost wireframe.
    // Do not let the wireframe write to the depth buffer.
    gl.depthMask(false);

    drawMesh(originalWireframe, I4, view, proj);

    // Restore depth writes before drawing the solid cube.
    gl.depthMask(true);

    drawMesh(cube, model, view, proj);

    requestAnimationFrame(render);
};
render();
