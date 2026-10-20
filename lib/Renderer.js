import { Pt } from "../lib/Pt.js";

const TAU = 2 * Math.PI;

export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} c
     * @param {number} w
     * @param {number} h
     */
    constructor(c, w, h) {
        this.c = c;
        this.w = w;
        this.h = h;
    }

    /**
     * @param {Pt} P
     * @param {number} r
     */
    pt(P, r) {
        this.c.beginPath();
        this.c.arc(P.x, P.y, r, 0, TAU);
        this.c.fillStyle = "#2563eb";
        this.c.fill();
        this.c.lineWidth = 2;
        this.c.strokeStyle = "#fff";
        this.c.stroke();

        this.c.font = "600 13px system-ui, sans-serif";
        this.c.fillStyle = "#172033";
        this.c.fillText(P.label, P.x + 10, P.y - 10);
    }
}