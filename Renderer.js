import { Pt, Triangle, Circle, Lattice, P1 } from "./common.js";
import { Vec2 } from "./Vec2.js";

/** @typedef {{x: number, y: number}} XY */

const TAU = 2 * Math.PI;

export const STROKE = 1, FILL = 2, BOTH = 3;

/**
 * @param {CanvasRenderingContext2D} c
 * @param {*} mode
 */
const paint = (c, mode) => {
    if (mode & FILL) c.fill();
    if (mode & STROKE) c.stroke();
};

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
     * @param {number} mode
     */
    pt(P, r, mode) {
        this.c.beginPath();
        this.c.arc(P.x, P.y, r, 0, TAU);
        paint(this.c, mode);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {number} mode
     */
    pt2(x, y, r, mode) {
        this.c.beginPath();
        this.c.arc(x, y, r, 0, TAU);
        paint(this.c, mode);
    };

    /**
     * @param {Pt} A
     * @param {Pt} B
     */
    seg2(A, B) {
        this.seg4(A.x, A.y, B.x, B.y);
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     */
    seg4(x1, y1, x2, y2) {
        this.c.beginPath();
        this.c.moveTo(x1, y1);
        this.c.lineTo(x2, y2);
        this.c.stroke();
    }

    /**
     * @param {Pt} A
     * @param {Pt} B
     */
    line2(A, B) {
        this.line4(A.x, A.y, B.x, B.y);
    }

    /**
     * Draws an infinite-looking line, clipped to the canvas.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
    */
    line4(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        const length = Math.hypot(dx, dy);
        if (length === 0) return; // Direction is undefined.

        const ux = dx / length;
        const uy = dy / length;

        const k = Math.hypot(this.w, this.h) + Math.hypot(x1, y1);

        this.c.beginPath();
        this.c.moveTo(x1 - ux * k, y1 - uy * k);
        this.c.lineTo(x1 + ux * k, y1 + uy * k);
        this.c.stroke();
    }

    /**
     * @param {Triangle} T
     * @param {number} mode
     */
    triangle(T, mode) {
        this.triangle6(
            T.A.x, T.A.y,
            T.B.x, T.B.y,
            T.C.x, T.C.y,
            mode
        );
    }

    /**
     * @param {Pt} A
     * @param {Pt} B
     * @param {Pt} C
     * @param {number} mode
     */
    triangle3(A, B, C, mode) {
        this.triangle6(
            A.x, A.y,
            B.x, B.y,
            C.x, C.y,
            mode
        );
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} mode
     */
    triangle6(x1, y1, x2, y2, x3, y3, mode) {
        this.c.beginPath();
        this.c.moveTo(x1, y1);
        this.c.lineTo(x2, y2);
        this.c.lineTo(x3, y3);
        this.c.closePath();
        paint(this.c, mode);
    };

    /**
     * @param {Circle} C
     * @param {number} mode
     */
    circle(C, mode) {
        this.c.beginPath();
        this.c.arc(C.x, C.y, C.r, 0, TAU);
        paint(this.c, mode);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} mode
     */
    rect4(x, y, w, h, mode) {
        this.c.beginPath();
        this.c.rect(x, y, w, h);
        paint(this.c, mode);
    }

    /**
     * @param {XY} o
     * @param {Vec2} a
     * @param {Vec2} b
     */
    parallelogram(o, a, b) {
        this.c.beginPath();
        this.c.moveTo(o.x, o.y);
        this.c.lineTo(o.x + a.x, o.y + a.y);
        this.c.lineTo(o.x + a.x + b.x, o.y + a.y + b.y);
        this.c.lineTo(o.x + b.x, o.y + b.y);
        this.c.closePath();
        this.c.stroke();
    }

    /**
     * @param {Lattice} L
     */
    lattice(L) {
        for (let m = -10; m <= 10; m++) {
            for (let n = -10; n <= 10; n++) {
                const p = L.point(m, n);

                if (p.x >= 0 && p.x <= this.w &&
                    p.y >= 0 && p.y <= this.h
                ) {
                    this.pt2(p.x, p.y, 5, FILL);
                }

                // Draw cell edges
                const pa = L.point(m + 1, n);
                const pb = L.point(m, n + 1);

                this.c.beginPath();
                this.c.moveTo(p.x, p.y);
                this.c.lineTo(pa.x, pa.y);
                this.c.moveTo(p.x, p.y);
                this.c.lineTo(pb.x, pb.y);
                this.c.stroke();
            }
        }
    }

    /**
     * @param {P1} G
     * @param {*} motif
     */
    group(G, motif) {
        for (let i = -10; i <= 10; i++) {
            for (let j = -10; j <= 10; j++) {
                const p = G.lattice.point(i, j);

                for (const [m0, m1, m2, m3] of G.ops) {
                    this.c.save();
                    this.c.transform(m0, m1, m2, m3, p.x, p.y);
                    motif(this.c);
                    this.c.restore();
                }
            }
        }
        // Draw lattice for debugging
        // this.lattice(G.lattice);
    }
}