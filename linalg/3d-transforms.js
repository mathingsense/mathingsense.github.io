import { createBasisVectors, createCube, createCubeWireframe, createGridAndAxes, createProgram, initCanvasGl, M4, orbitView, perspective, resizeCanvas } from "../Gl.js";
import { getElement } from "../lib/html.js";
import { fs, vs } from "../shaders.js";
import { uiButton, uiSlider } from "../UI.js";

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

window.addEventListener("resize", () => {
    resizeCanvas(canvas, gl);
});


const cube = createCube(gl);
const originalWireframe = createCubeWireframe(gl);
const gridAndAxes = createGridAndAxes(gl);
const basisVectors = createBasisVectors(gl);

let model = M4.identity();

const matrixDisplay = getElement("matrix-display", HTMLPreElement);

const scale = { x: 1, y: 1, z: 1 };
const rot = { x: 0, y: 0, z: 0 };

const updateTransform = () => {
    model = M4.multiply(
        M4.rotationZ(rot.z),
        M4.multiply(
            M4.rotationY(rot.y),
            M4.multiply(
                M4.rotationX(rot.x),
                M4.scaling(scale.x, scale.y, scale.z)
            )
        )
    );

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
};

const scaleX = uiSlider({
    label: "Scale X",
    min: 0.2,
    max: 2.5,
    step: 0.1,
    value: 1,
    onChange(value) {
        scale.x = value;
        updateTransform();
    },
});

const scaleY = uiSlider({
    label: "Scale Y",
    min: 0.2,
    max: 2.5,
    step: 0.1,
    value: 1,
    onChange(value) {
        scale.y = value;
        updateTransform();
    },
});

const scaleZ = uiSlider({
    label: "Scale Z",
    min: 0.2,
    max: 2.5,
    step: 0.1,
    value: 1,
    onChange(value) {
        scale.z = value;
        updateTransform();
    },
});

const rotX = uiSlider({
    label: "Rotation X",
    min: -180,
    max: 180,
    step: 1,
    value: 0,
    onChange(value) {
        rot.x = value;
        updateTransform();
    },
});

const rotY = uiSlider({
    label: "Rotation Y",
    min: -180,
    max: 180,
    step: 1,
    value: 0,
    onChange(value) {
        rot.y = value;
        updateTransform();
    },
});

const rotZ = uiSlider({
    label: "Rotation Z",
    min: -180,
    max: 180,
    step: 1,
    value: 0,
    onChange(value) {
        rot.z = value;
        updateTransform();
    },
});

uiButton({
    label: "Reset Transform",
    onClick() {
        scaleX.value = 1;
        scaleY.value = 1;
        scaleZ.value = 1;
        rotX.value = 0;
        rotY.value = 0;
        rotZ.value = 0;

        updateTransform();
    },
});

uiButton({
    label: "Reset Camera",
    onClick() {
        azimuth = 0.75;
        elevation = 0.45;
        distance = 7.5;
    },
});

updateTransform();

const I4 = M4.identity();

const aspect = canvas.width / canvas.height;
const proj = perspective(Math.PI / 4, aspect, 0.1, 100);

let view = orbitView(azimuth, elevation, distance);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

gl.clearColor(1, 1, 1, 1);

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
    drawMesh(basisVectors, model, view, proj);

    requestAnimationFrame(render);
};
render();
