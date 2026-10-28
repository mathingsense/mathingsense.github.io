import { applyCameraTransform, clearCanvas, fitWorld, initCanvas } from "../lib/canvas.js";
import { getElement } from "../lib/html.js";

const world = { x: 0, y: 0, w: 600, h: 600 };
const camera = { x: 0, y: 0, zoom: 1 };

const { canvas, ctx: c } = initCanvas("canvas");
fitWorld(canvas, camera, world);

const selectStep = getElement("step", HTMLSelectElement);
selectStep.value = "squarelimit";

/** @typedef {[number, number, number, number]} Segment */
/** @typedef {Segment[]} Fish */

/**
 * From https://frank-buss.de/lisp/functional.html
 * I flipped the y coordinates to match HTML canvas coordinate.
 * @type {Record<string, Fish>}
 */
const fish = {
    p: [[4, 12, 6, 16], [0, 13, 3, 12], [3, 12, 0, 8], [0, 8, 0, 13], [4, 11, 7, 10], [7, 10, 4, 6], [4, 6, 4, 11], [11, 16, 10, 12], [10, 12, 8, 8], [8, 8, 4, 3], [4, 3, 0, 0], [11, 16, 14, 14], [14, 14, 16, 14], [10, 12, 13, 11], [13, 11, 16, 12], [9, 10, 12, 9], [12, 9, 16, 10], [8, 8, 12, 7], [12, 7, 16, 8], [8, 4, 16, 6], [0, 0, 6, 1], [6, 1, 8, 0], [8, 0, 12, 4], [12, 4, 16, 4], [10, 0, 12, 2], [12, 2, 16, 3], [12, 0, 13, 1], [13, 1, 16, 2], [14, 0, 16, 1]],
    q: [[2, 16, 4, 11], [4, 11, 4, 9], [4, 16, 6, 11], [6, 11, 6, 9], [6, 16, 8, 11], [8, 11, 8, 8], [8, 16, 10, 10], [10, 10, 10, 7], [10, 16, 14, 5], [12, 16, 13, 12], [13, 12, 16, 8], [16, 8, 15, 6], [15, 6, 16, 0], [16, 0, 12, 6], [12, 6, 6, 9], [6, 9, 4, 9], [4, 9, 0, 8], [13, 16, 16, 10], [14, 16, 16, 12], [15, 16, 16, 14], [0, 6, 7, 5], [9, 4, 10, 6], [10, 6, 12, 4], [12, 4, 9, 4], [8, 1, 9, 3], [9, 3, 11, 1], [11, 1, 8, 1], [0, 4, 3, 3], [3, 3, 7, 1], [7, 1, 8, 0], [2, 0, 3, 3], [4, 0, 5, 2], [6, 0, 7, 1], /*my addition*/[0, 0, 0, 4], [0, 8, 0, 16], [0, 16, 8, 16], [12, 16, 16, 16]],
    r: [[0, 4, 1, 2], [0, 8, 2, 4], [0, 12, 5, 6], [0, 16, 8, 8], [1, 15, 4, 16], [2, 14, 8, 16], [3, 13, 8, 14], [8, 14, 12, 16], [5, 11, 12, 13], [12, 13, 16, 16], [0, 0, 2, 4], [2, 4, 8, 8], [8, 8, 14, 10], [14, 10, 16, 12], [6, 0, 11, 6], [11, 6, 16, 10], [11, 0, 12, 4], [12, 4, 16, 8], [12, 4, 16, 0], [13, 3, 16, 6], [14, 2, 16, 4], [15, 1, 16, 2]],
    s: [[0, 16, 4, 14], [4, 14, 8, 14], [8, 14, 16, 16], [0, 12, 2, 15], [0, 10, 7, 12], [0, 8, 8, 10], [0, 6, 7, 8], [0, 4, 7, 6], [0, 2, 7, 3], [8, 0, 7, 3], [7, 3, 7, 8], [7, 8, 8, 10], [8, 10, 10, 12], [10, 12, 16, 16], [10, 0, 11, 6], [10, 10, 12, 12], [12, 12, 12, 9], [12, 9, 10, 10], [13, 9, 15, 11], [15, 11, 15, 8], [15, 8, 13, 9], [12, 0, 13, 3], [13, 3, 15, 7], [15, 7, 16, 8], [13, 3, 16, 2], [14, 5, 16, 4], [15, 7, 16, 6]]
};

class Pic {
    /**
     * @param {number} w
     * @param {number} h
     */
    constructor(w, h) {
        this.w = w;
        this.h = h;
        /** @type {Segment[]} */
        this.segments = [];
    }

    /**
     * @param {Segment} s
     * @returns {Pic}
     */
    add_segment(s) {
        this.segments.push(s);
        return this;
    }

    /**
     * @param {Segment[]} segments
     * @returns {Pic}
     */
    add_segments(segments) {
        this.segments.push(...segments);
        return this;
    }

    /**
     * @param {number} k
     * @returns {Pic}
     */
    scale(k) {
        const segments = this.segments.map(s => /** @type{Segment} */([s[0] * k, s[1] * k, s[2] * k, s[3] * k]));
        return new Pic(this.w * k, this.h * k)
            .add_segments(segments);
    }

    /**
     * Only correct for square picture, because it will rotate the whole picture instead of elements inside it.
     * @param {Pic} pic
     * @returns {Pic}
     */
    static ccw(pic) {
        const c = pic.w / 2;
        const d = pic.h / 2;
        const segments = pic.segments.map(s => /** @type{Segment} */([
            s[1] + c - d,
            -s[0] + c + d,
            s[3] + c - d,
            -s[2] + c + d,
        ]));
        return new Pic(pic.w, pic.h)
            .add_segments(segments);
    }

    /**
     * Top and bottom pictures musst have the same width and height.
     * @param {number} rtop
     * @param {number} rbottom
     * @param {Pic} top
     * @param {Pic} bottom
     * @returns {Pic}
     */
    static above(rtop, rbottom, top, bottom) {
        const scale = rtop / (rtop + rbottom);

        const topSegments = top.segments.map(s => /** @type {Segment} */([
            s[0],
            s[1] * scale,
            s[2],
            s[3] * scale
        ]));

        const bottomSegments = bottom.segments.map(s => /** @type {Segment} */([
            s[0],
            bottom.h * scale + s[1] * (1 - scale),
            s[2],
            bottom.h * scale + s[3] * (1 - scale)
        ]));

        return new Pic(top.w, top.h)
            .add_segments(topSegments)
            .add_segments(bottomSegments);
    }

    /**
     * Left and right pictures must have the same width and height.
     * @param {number} rleft
     * @param {number} rright
     * @param {Pic} left
     * @param {Pic} right
     * @returns {Pic}
     */
    static beside(rleft, rright, left, right) {
        const scale = rleft / (rleft + rright);

        const leftSegments = left.segments.map(s => /** @type {Segment} */([
            s[0] * scale,
            s[1],
            s[2] * scale,
            s[3],
        ]));

        const rightSegments = right.segments.map(s => /** @type {Segment} */([
            left.w * scale + s[0] * (1 - scale),
            s[1],
            left.w * scale + s[2] * (1 - scale),
            s[3],
        ]));

        return new Pic(left.w, right.h)
            .add_segments(leftSegments)
            .add_segments(rightSegments);
    }

    /**
     * Assuming all pictures have same width and height.
     * @param {Pic} p
     * @param {Pic} q
     * @param {Pic} r
     * @param {Pic} s
     * @returns {Pic}
     */
    static quartet(p, q, r, s) {
        return Pic.above(
            1,
            1,
            Pic.beside(1, 1, p, q),
            Pic.beside(1, 1, r, s)
        );
    }

    /**
     * Assuming all pictures have same width and height.
     * @param {Pic} p
     * @returns {Pic}
     */
    static cycle(p) {
        const rot = Pic.ccw(p);
        const rot2 = Pic.ccw(rot);
        const rot3 = Pic.ccw(rot2);
        return Pic.quartet(p, rot3, rot, rot2);
    }

    /**
     * @param {Pic} p1
     * @param {Pic} p2
     * @param {Pic} p3
     * @param {Pic} p4
     * @param {Pic} p5
     * @param {Pic} p6
     * @param {Pic} p7
     * @param {Pic} p8
     * @param {Pic} p9
     * @returns {Pic}
     */
    static nonet(p1, p2, p3, p4, p5, p6, p7, p8, p9) {
        return Pic.above(1, 2, Pic.beside(1, 2, p1, Pic.beside(1, 1, p2, p3)),
            Pic.above(1, 1, Pic.beside(1, 2, p4, Pic.beside(1, 1, p5, p6)),
                Pic.beside(1, 2, p7, Pic.beside(1, 1, p8, p9))));
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    draw(x, y) {
        c.save();
        c.translate(x, y);
        c.beginPath();
        for (const s of this.segments) {
            c.moveTo(s[0], s[1]);
            c.lineTo(s[2], s[3]);
        }
        c.stroke();
        c.restore();
    }
}

const p = new Pic(16, 16).add_segments(fish["p"]);
const q = new Pic(16, 16).add_segments(fish["q"]);
const r = new Pic(16, 16).add_segments(fish["r"]);
const s = new Pic(16, 16).add_segments(fish["s"]);
const blank = new Pic(16, 16);

const t = Pic.quartet(p, q, r, s);
const u = Pic.cycle(Pic.ccw(q));
const side1 = Pic.quartet(blank, blank, Pic.ccw(t), t);
const side2 = Pic.quartet(side1, side1, Pic.ccw(t), t);
const corner1 = Pic.quartet(blank, blank, blank, u);
const corner2 = Pic.quartet(corner1, side1, Pic.ccw(side1), u);
const pseudocorner = Pic.quartet(corner2, side2, Pic.ccw(side2), Pic.ccw(t));
const pseudolimit = Pic.cycle(pseudocorner);

const corner = Pic.nonet(corner2, side2, side2,
    Pic.ccw(side2), u, Pic.ccw(t),
    Pic.ccw(side2), Pic.ccw(t), Pic.ccw(q)
);
const squarelimit = Pic.cycle(corner);


/**
 * @param {Pic} step
 */
const z = (step) => step.scale(600 / 16).draw(0, 0);

/** @type {Record<string, () => void>} */
const steps = {
    base() {
        const k = 100 / 16;
        p.scale(k).draw(50, 50);
        q.scale(k).draw(175, 50);
        r.scale(k).draw(300, 50);
        s.scale(k).draw(425, 50);
    },
    t() {
        z(t);
    },
    u() {
        z(u);
    },
    side1() {
        z(side1);
    },
    side2() {
        z(side2);
    },
    corner1() {
        z(corner1);
    },
    corner2() {
        z(corner2);
    },
    pseudocorner() {
        z(pseudocorner);
    },
    pseudolimit() {
        z(pseudolimit);
    },
    corner() {
        z(corner);
    },
    squarelimit() {
        z(squarelimit);
    }
};

let step = steps[selectStep.value];

const draw = () => {
    clearCanvas(canvas, c);
    applyCameraTransform(canvas, c, camera);
    step();
};
draw();

selectStep.addEventListener("change", () => {
    step = steps[selectStep.value];
    draw();
});