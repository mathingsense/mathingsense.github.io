import { getElement, initCanvas } from "../common.js";
import { Renderer } from "../Renderer.js";

const width = 500;
const height = 700;

const [_, c] = initCanvas("canvas", width, height);
const selectZ = getElement("z", HTMLSelectElement);
selectZ.value = "6";

const divResult = getElement("result", HTMLDivElement);

const render = new Renderer(c, width, height);

const cx = 20;
const cy = 450;
const n = 44;   // Number of ticks
const u = 10;   // Tick length

const cos30 = Math.cos(Math.PI / 6);
const sin30 = Math.sin(Math.PI / 6);

c.font = "20px Arial";

const axisY = () => {
    c.strokeStyle = "#000";
    render.seg4(cx, 0, cx, cy);
    c.strokeStyle = "gray";
    for (let i = 1; i <= n; i++) {
        render.seg4(cx - 5, cy - i * u, cx, cy - i * u);
    }
    c.fillStyle = "#00f";
    c.fillText("Y", 0, 20);
    c.fillText("0", cx - 15, cy + 15);
}

const axisX = () => {
    const x = cy * cos30;
    const y = cy * sin30;
    c.strokeStyle = "#000";
    render.seg4(cx, cy, cx + x, cy + y);
    c.strokeStyle = "gray";
    const kx = u * cos30;
    const ky = u * sin30;
    for (let i = 1; i <= n; i++) {
        const k = cx + i * kx;
        const l = cy + i * ky;
        render.seg4(k, l, k - 5 * sin30, l + 5 * cos30);
    }
    c.fillStyle = "#00f";
    c.fillText("X", cx + x, cy + y + 20);
}

const axisZ = () => {
    const x = cy * cos30;
    const y = cy * -sin30;
    c.strokeStyle = "#000";
    render.seg4(cx, cy, cx + x, cy + y);
    c.strokeStyle = "gray";
    const kx = u * cos30;
    const ky = u * -sin30;
    for (let i = 1; i <= n; i++) {
        const k = cx + i * kx;
        const l = cy + i * ky;
        render.seg4(k, l, k - 5 * -sin30, l + 5 * cos30);
    }
    c.fillStyle = "#00f";
    c.fillText("Z", cx + x, cy + y + 20);
}

/**
 * @param {number} x
 * @param {number} y
 */
const lineXY = (x, y) => {
    const i = y * u * cos30;
    const j = y * u * sin30;
    render.line4(cx, cy - x * u, cx + i, cy + j);
}

/**
 * Finds all positive divisors of a positive integer sorted in ascending order.
 * @param {number} n
 * @returns {number[]}
 */
function divisor(n) {
    const divisors = [];
    for (let i = 1; i * i <= n; i++) {
        if (n % i === 0) {
            divisors.push(i);
            if (i !== n / i) {
                divisors.push(n / i);
            }
        }
    }
    return divisors.sort((a, b) => a - b);
}

/**
 * @param {number} z 
 */
const findXY = (z) => {
    const ds = divisor(z * z);
    const res = [];
    for (const d of ds) {
        res.push([z + d, z + z * z / d]);
    }
    return res;
}

let z = 6;

const draw = () => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);

    axisY();
    axisX();
    axisZ();

    const res = findXY(z);
    const n = res.length;
    for (let i = 0; i < n; i++) {
        const r = res[i];
        c.strokeStyle = `oklch(0.7 0.15 ${(i * 360) / n})`;
        lineXY(r[0], r[1]);
    }

    divResult.textContent = res
        .map(r => "(" + r.map(i => String(i)).join(", ") + ", " + z + ")")
        .join(" ");
}
draw();

selectZ.addEventListener("change", () => {
    z = Number(selectZ.value);
    draw();
});