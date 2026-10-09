import { initCanvas, getElement } from "../common.js";
import { Lattice, WG } from "../WallpaperGroup.js";
import { Renderer, STROKE } from "../Renderer.js";

const width = 600;
const height = 600;

const [_, c] = initCanvas("canvas", width, height);
const select = getElement("group", HTMLSelectElement);
select.value = "p6m";

const render = new Renderer(c, width, height);

const mp1 = () => render.triangle6(10, 10, 80, 20, 50, 40, STROKE);
const lp1 = Lattice.oblique(120, 107, 69);
const p1 = new WG("p1");

const mp2 = () => render.triangle6(10, 10, 60, 10, 60, 30, STROKE);
const lp2 = Lattice.oblique(120, 107, 69);
const p2 = new WG("p2");

// const mpm = () => render.rect4(100, 40, 10, 50, STROKE);
const mpm = () => render.triangle6(10, 10, 50, 10, 50, 30, STROKE);
const lpm = Lattice.rectangular(120, 100);
const pm = new WG("pm");

const mpg = () => render.triangle6(40, 10, 110, 10, 110, 40, STROKE);
const lpg = Lattice.rectangular(120, 100);
const pg = new WG("pg");

const mpmm = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lpmm = Lattice.rectangular(120, 100);
const pmm = new WG("pmm");

const mpmg = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lpmg = Lattice.rectangular(120, 100);
const pmg = new WG("pmg");

const mpgg = () => render.triangle6(60, 10, 115, 10, 115, 40, STROKE);
const lpgg = Lattice.rectangular(120, 100);
const pgg = new WG("pgg");

const mcm = () => render.triangle6(65, 10, 65, 40, 115, 40, STROKE);
const lcm = Lattice.rectangular(120, 100);
const cm = new WG("cm");

const mcmm = () => render.triangle6(65, 20, 65, 40, 115, 40, STROKE);
const lcmm = Lattice.rectangular(120, 100);
const cmm = new WG("cmm");

const mp4 = () => render.triangle6(65, 20, 65, 40, 115, 40, STROKE);
const lp4 = Lattice.square(120);
const p4 = new WG("p4");

const mp4m = () => render.triangle6(110, 10, 110, 50, 90, 50, STROKE);
const lp4m = Lattice.square(120);
const p4m = new WG("p4m");

const mp4g = () => render.triangle6(75, 10, 110, 10, 110, 30, STROKE);
const lp4g = Lattice.square(120);
const p4g = new WG("p4g");

const mp3 = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp3 = Lattice.hexagonal(120);
const p3 = new WG("p3");

const mp3m1 = () => render.triangle6(20, 5, 50, 5, 50, 20, STROKE);
const lp3m1 = Lattice.hexagonal(120);
const p3m1 = new WG("p3m1");

const mp31m = () => render.triangle6(20, 5, 50, 5, 50, 20, STROKE);
const lp31m = Lattice.hexagonal(120);
const p31m = new WG("p31m");

const mp6 = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp6 = Lattice.hexagonal(120);
const p6 = new WG("p6");

const mp6m = () => render.triangle6(10, 10, 30, 10, 30, 40, STROKE);
const lp6m = Lattice.hexagonal(120);
const p6m = new WG("p6m");


/** @type {Record<string, [WG, Lattice, (c: CanvasRenderingContext2D) => void]>} */
const defaults = {
    p1: [p1, lp1, mp1],
    p2: [p2, lp2, mp2],
    pm: [pm, lpm, mpm],
    pg: [pg, lpg, mpg],
    pmm: [pmm, lpmm, mpmm],
    pmg: [pmg, lpmg, mpmg],
    pgg: [pgg, lpgg, mpgg],
    cm: [cm, lcm, mcm],
    cmm: [cmm, lcmm, mcmm],
    p4: [p4, lp4, mp4],
    p4m: [p4m, lp4m, mp4m],
    p4g: [p4g, lp4g, mp4g],
    p3: [p3, lp3, mp3],
    p3m1: [p3m1, lp3m1, mp3m1],
    p31m: [p31m, lp31m, mp31m],
    p6: [p6, lp6, mp6],
    p6m: [p6m, lp6m, mp6m],
};

let current = defaults[select.value];

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#fff";
    c.strokeStyle = "#000";
    c.fillRect(0, 0, width, height);

    c.fillStyle = "#000"
    render.gr(current[0], current[1], current[2]);
}
draw(c);

const onChange = () => {
    const value = select.value;
    current = defaults[value];
    draw(c);
}

select.addEventListener("change", onChange, false);