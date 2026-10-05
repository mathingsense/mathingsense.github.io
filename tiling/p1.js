import { initCanvas, Lattice, P1 } from "../common.js";
import { Renderer } from "../Renderer.js";
import { Vec2 } from "../Vec2.js";

const width = 600;
const height = 600;

const [_, c] = initCanvas("canvas", width, height);

const a = new Vec2(120, 0);
const b = new Vec2(40, 100);
const o = new Vec2(0, 0);
const lattice = new Lattice(o, a, b);
const group = new P1(lattice);

const render = new Renderer(c, width, height);

/**
 * An asymmetric shape, drawn near the origin (0,0).
 * @param {CanvasRenderingContext2D} c 
 */
const motif = (c) => {
    c.fillStyle = '#00f';
    c.beginPath();
    c.moveTo(10, 10);
    c.lineTo(70, 20);
    c.lineTo(30, 50);
    c.lineTo(15, 80);
    c.closePath();
    c.fill();

    c.fillStyle = '#f00';
    c.beginPath();
    c.arc(60, 55, 8, 0, Math.PI * 2);
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