import { getElement, initCanvasGl } from "../common.js";
import { createCube, createGridAndAxes, createProgram, getCameraMatrices, identity, resizeCanvas } from "../Gl.js";
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
function drawMesh(mesh, model, view, projection) {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);

    gl.uniformMatrix4fv(uModel, false, model);
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProjection, false, projection);

    gl.drawArrays(mesh.mode, 0, mesh.count);
}


let azimuth = 0.75;
let elevation = 0.45;
let distance = 7.5;

const minDistance = 3;
const maxDistance = 20;

let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.style.touchAction = "none";

canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    azimuth -= dx * 0.008;
    elevation += dy * 0.008;

    elevation = Math.max(-1.45, Math.min(1.45, elevation));

    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener("pointerup", () => {
    dragging = false;
});

canvas.addEventListener("pointercancel", () => {
    dragging = false;
});

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    distance *= Math.exp(e.deltaY * 0.001);

    distance = Math.max(
        minDistance,
        Math.min(maxDistance, distance)
    );
}, { passive: false });

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

const model = identity();
const cube = createCube(gl);
const gridAndAxes = createGridAndAxes(gl);

const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    const { view, projection } = getCameraMatrices(canvas, azimuth, elevation, distance);

    drawMesh(gridAndAxes, model, view, projection);
    drawMesh(cube, model, view, projection);
    requestAnimationFrame(render);
}
render();
