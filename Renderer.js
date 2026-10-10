import { Pt, Triangle, Circle } from "./common.js";
import { Lattice, WallpaperGroup, mul } from "./WallpaperGroup.js";

/** @typedef {{x: number, y: number}} XY */

const TAU = 2 * Math.PI;

/** @typedef {1 | 2 | 3} Mode */
export const STROKE = 1, FILL = 2, BOTH = 3;

/**
 * @param {CanvasRenderingContext2D} c
 * @param {Mode} mode
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
     * @param {Mode} mode
     */
    pt(P, r, mode) {
        this.circle2(P.x, P.y, r, mode);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {Mode} mode
     */
    pt2(x, y, r, mode) {
        this.circle2(x, y, r, mode);
    }

    /**
     * @param {Circle} C
     * @param {Mode} mode
     */
    circle(C, mode) {
        this.circle2(C.x, C.y, C.r, mode);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {Mode} mode
     */
    circle2(x, y, r, mode) {
        this.c.beginPath();
        this.c.arc(x, y, r, 0, TAU);
        paint(this.c, mode);
    }

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
     * @param {Mode} mode
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
     * @param {Mode} mode
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
     * @param {Mode} mode
     */
    triangle6(x1, y1, x2, y2, x3, y3, mode) {
        this.c.beginPath();
        this.c.moveTo(x1, y1);
        this.c.lineTo(x2, y2);
        this.c.lineTo(x3, y3);
        this.c.closePath();
        paint(this.c, mode);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {Mode} mode
     */
    rect4(x, y, w, h, mode) {
        this.c.beginPath();
        this.c.rect(x, y, w, h);
        paint(this.c, mode);
    }

    /**
     * Integer lattice-index bounds covering the visible canvas
     * @param {Lattice} L
     * @param {number} pad
     * @returns {*}
     */
    #tileRange(L, pad = 1) {
        const corners = [[0, 0], [this.w, 0], [0, this.h], [this.w, this.h]].map(([px, py]) =>
            L.fractional(px, py));
        const us = corners.map(c => c[0]);
        const vs = corners.map(c => c[1]);
        return {
            i0: Math.floor(Math.min(...us)) - pad,
            i1: Math.ceil(Math.max(...us)) + pad,
            j0: Math.floor(Math.min(...vs)) - pad,
            j1: Math.ceil(Math.max(...vs)) + pad,
        };
    }

    /**
     * @param {Lattice} L
     */
    lattice(L) {
        const { i0, i1, j0, j1 } = this.#tileRange(L);

        this.c.beginPath();
        for (let i = i0; i <= i1; i++) {
            this.c.moveTo(...L.point(i, j0));
            this.c.lineTo(...L.point(i, j1));
        }
        for (let j = j0; j <= j1; j++) {
            this.c.moveTo(...L.point(i0, j));
            this.c.lineTo(...L.point(i1, j));
        }
        this.c.stroke();
    }

    /**
     * @param {WallpaperGroup} G
     * @param {Lattice} L
     * @param {*} motif
     */
    group(G, L, motif) {
        const ops = G.cartesianOps(L);

        const { i0, i1, j0, j1 } = this.#tileRange(L);

        for (let i = i0; i <= i1; i++) {
            for (let j = j0; j <= j1; j++) {
                const t = L.translation(i, j);

                for (const m of ops) {
                    this.c.save();
                    this.c.transform(...mul(t, m));
                    motif(this.c);
                    this.c.restore();
                }
            }
        }
    }

    /**
     * Draw just a specific cell for testing.
     * @param {WallpaperGroup} G
     * @param {Lattice} L
     * @param {(c: CanvasRenderingContext2D) => void} motif
     * @param {number} i
     * @param {number} j
     */
    group1(G, L, motif, i, j) {
        const ops = G.cartesianOps(L);
        const t = L.translation(i, j);

        for (const m of ops) {
            this.c.save();
            this.c.transform(...mul(t, m));
            motif(this.c);
            this.c.restore();
        }
    }
}