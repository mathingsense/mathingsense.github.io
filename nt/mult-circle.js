import { applyCameraTransform, clearCanvas, fitWorld, initCanvas } from "../lib/canvas.js";
import { getElement } from "../lib/html.js";
import { Renderer, STROKE } from "../Renderer.js";

const world = { x: 0, y: 0, w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx: c } = initCanvas("canvas");
fitWorld(canvas, camera, world);

const nInput = getElement("n", HTMLInputElement);
const kInput = getElement("k", HTMLInputElement);
const button = getElement("update", HTMLButtonElement);
const error = getElement("error", HTMLDivElement);

const render = new Renderer(c, world.w, world.h);

let n = 200;
let k = 6;

// Note: this is necessary because browser retains the previous input values
//       when the page is reloaded
// TODO: create a helper
nInput.value = n.toString();
kInput.value = k.toString();

const r = 250;
const cx = 300;
const cy = 300;

const draw = () => {
    clearCanvas(canvas, c);
    applyCameraTransform(canvas, c, camera);

    c.translate(cx, cy);
    render.circle2(0, 0, r, STROKE);

    let t = 2 * Math.PI / n;
    for (let i = 0; i < n; i++) {
        let x1 = r * Math.cos(t * i);
        let y1 = r * Math.sin(t * i);
        let x2 = r * Math.cos(t * i * k);
        let y2 = r * Math.sin(t * i * k);
        render.seg4(x1, y1, x2, y2);
    }
};
draw();

const update = () => {
    n = Number(nInput.value);
    k = Number(kInput.value);
    draw();
};

// TODO: generalize and separate check for each input
const validate = () => {
    const n = Number(nInput.value);
    const k = Number(kInput.value);
    let msg = "";

    if (!Number.isInteger(n) || n < 20 || n > 200) {
        msg = "n must be an integer between 20 and 200.";
    } else if (!Number.isInteger(k) || k < 2 || k > 20) {
        msg = "k must be an integer between 2 and 20.";
    }

    error.textContent = msg;
    button.disabled = msg !== "";
    return msg === "";
};

nInput.addEventListener("input", validate);
kInput.addEventListener("input", validate);

button.addEventListener("click", update, false);