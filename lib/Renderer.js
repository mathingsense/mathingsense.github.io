import { Midpoint } from "./Midpoint.js";
import { Point } from "./Point.js";
import { Segment } from "./Segment.js";

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
     * @param {Point} P
     * @param {number} r
     */
    point(P, r) {
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

    /**
     * @param {Midpoint} P
     * @param {number} r
     */
    midpoint(P, r) {
        this.c.beginPath();
        this.c.arc(P.x, P.y, r, 0, TAU);
        this.c.fillStyle = "gray";
        this.c.fill();
        this.c.lineWidth = 2;
        this.c.strokeStyle = "#fff";
        this.c.stroke();
    }

    /**
     * @param {Segment} S
     */
    segment(S) {
        this.c.beginPath();
        this.c.moveTo(S.A.x, S.A.y);
        this.c.lineTo(S.B.x, S.B.y);
        this.c.lineWidth = 2.5;
        this.c.stroke();
    }
}