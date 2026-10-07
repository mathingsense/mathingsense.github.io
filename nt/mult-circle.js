import { getElement, initCanvas } from "../common.js";
import { Renderer, STROKE } from "../Renderer.js";

const width = 600;
const height = 600;

const [_, c] = initCanvas("canvas", width, height);

const nInput = getElement("n", HTMLInputElement);
const kInput = getElement("k", HTMLInputElement);
const button = getElement("update", HTMLButtonElement);
const error = getElement("error", HTMLDivElement);

const render = new Renderer(c, width, height);

let k = 5;
let n = 80;
const r = 250;
const cx = 300;
const cy = 300;

const draw = () => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    c.save()
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
    c.restore();
}
draw();

const update = () => {
    n = Number(nInput.value);
    k = Number(kInput.value);
    draw();
}

const validate = () => {
    const n = Number(nInput.value);
    const k = Number(kInput.value);
    let msg = "";

    if (!Number.isInteger(n) || n < 20 || n > 100) {
        msg = "n must be an integer between 20 and 100.";
    } else if (!Number.isInteger(k) || k < 2 || k > 20) {
        msg = "k must be an integer between 2 and 20.";
    }

    error.textContent = msg;
    button.disabled = msg !== "";
    return msg === "";
}

nInput.addEventListener("input", validate);
kInput.addEventListener("input", validate);

button.addEventListener("click", update, false);