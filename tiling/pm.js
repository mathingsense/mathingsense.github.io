import { initCanvas, Lattice, Pm } from "../common.js";
import { Renderer } from "../Renderer.js";

const width = 600;
const height = 600;

const [_, c] = initCanvas("canvas", width, height);

const render = new Renderer(c, width, height);

const lattice = Lattice.rectangular(120, 100);
const group = new Pm(lattice);

/**
 * An asymmetric shape, drawn near the origin (0,0).
 * @param {CanvasRenderingContext2D} c 
 */
const motif = (c) => {
    c.fillStyle = '#00f';
    c.fillRect(100, 40, 10, 50);

    c.fillStyle = '#f00';
    c.beginPath();
    c.arc(90, 85, 5, 0, Math.PI * 2);
    c.fill();
}

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#fff";
    c.strokeStyle = "#000";
    c.fillRect(0, 0, width, height);

    c.fillStyle = "#000"
    render.group(group, motif);
}
draw(c);