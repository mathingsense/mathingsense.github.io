// Using clockwise convention.

/** @typedef {{x: number, y: number}} Point */

const TAU = 2 * Math.PI;

/**
 * @param {string} id
 * @param {number} width
 * @param {number} height
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
export const initCanvas = (id, width, height) => {
    if (!(width > 0 && height > 0)) {
        throw new RangeError('width and height must be positive');
    }

    const el = document.getElementById(id);
    if (el === null) {
        throw new Error(`element #${id} not found`);
    }
    if (!(el instanceof HTMLCanvasElement)) {
        throw new Error(`element #${id} is not a <canvas>`);
    }

    const ctx = el.getContext("2d");
    if (ctx === null) {
        throw new Error(`could not get a 2D context for #${id}`);
    }

    // Sizes the canvas for crisp rendering on HiDPI displays.
    const dpr = window.devicePixelRatio || 1;

    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);

    ctx.setTransform(el.width / width, 0, 0, el.height / height, 0, 0);
    return [el, ctx];
};

/**
 * @param {Point} A
 * @param {Point} B
 * @returns {number}
 */
export const distance = (A, B) => {
    return Math.hypot(B.x - A.x, B.y - A.y);
};

export const STROKE = 1, FILL = 2, BOTH = 3;

/**
 * @param {CanvasRenderingContext2D} c
 * @param {*} mode
 */
const paint = (c, mode) => {
    if (mode & FILL) c.fill();
    if (mode & STROKE) c.stroke();
};

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {number} mode
 */
export const circle = (c, x, y, r, mode) => {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    paint(c, mode);
};

/**
 * @param {number} px
 * @param {number} py
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {boolean}
 */
export const isInCircle = (px, py, cx, cy, r) => {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= r * r;
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent} e
 * @returns {[number, number]}
 */
export const getPointerPos = (canvas, e) => {
    const b = canvas.getBoundingClientRect();
    return [
        e.pageX - (b.left + window.scrollX),
        e.pageY - (b.top + window.scrollY)
    ];
    // Below is simpler. Check later.
    // return [e.clientX - rect.left, e.clientY - rect.top];
};

/**
 * Returns a random integer x such that min <= x <= max
 * @param {number} min - Inclusive lower bound (integer)
 * @param {number} max - Inclusive upper bound (integer, >= min)
 * @returns {number}
 */
export const randomInt = (min, max) => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new TypeError("min and max must be integers");
    }
    if (min > max) {
        throw new RangeError("min must be <= max");
    }
    return min + Math.floor((max - min + 1) * Math.random());
};

export class Pt {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Pt} P
     * @returns {number}
     */
    distanceTo(P) {
        return Math.hypot(this.x - P.x, this.y - P.y);
    };

    /**
     * @param {Pt} pivot
     * @param {number} angle
     * @returns {Pt}
     */
    rotate(pivot, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = this.x - pivot.x;
        const dy = this.y - pivot.y;
        return new Pt(
            pivot.x + dx * cos - dy * sin,
            pivot.y + dx * sin + dy * cos
        );
    }
}

export class Triangle {
    /**
     * @param {Pt} A
     * @param {Pt} B
     * @param {Pt} C
     */
    constructor(A, B, C) {
        this.A = A;
        this.B = B;
        this.C = C;
    }

    /**
     * Returns the cross product of vectors (p2 - p1) and (p3 - p1).
     * @param {Point} p1
     * @param {Point} p2
     * @param {Point} p3
     * @returns {number}
     */
    #cross_product(p1, p2, p3) {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }

    /**
     * @param {Pt} P
     * @returns {boolean}
     */
    contains(P) {
        const d1 = this.#cross_product(P, this.A, this.B);
        const d2 = this.#cross_product(P, this.B, this.C);
        const d3 = this.#cross_product(P, this.C, this.A);

        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

        // Point is inside if all cross products have the same sign
        return !(hasNeg && hasPos);
    }

    /**
     * @param {Pt} A
     * @param {Pt} B
     * @param {Pt} C
     * @returns {Pt}
     */
    static centroid(A, B, C) {
        return new Pt(
            (A.x + B.x + C.x) / 3,
            (A.y + B.y + C.y) / 3
        );
    }

    /**
     * @param {Pt} A
     * @param {Pt} B
     * @param {Pt} C
     * @returns {Triangle}
     */
    static napoleon(A, B, C) {
        const deg = -Math.PI / 3;
        return new Triangle(
            Triangle.centroid(A, B, B.rotate(A, deg)),
            Triangle.centroid(B, C, C.rotate(B, deg)),
            Triangle.centroid(C, A, A.rotate(C, deg))
        );
    }
}

export class Circle {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} r
     */
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
    }

    /**
     * @param {Point} A
     * @param {Point} B
     * @param {Point} C
     * @returns {Circle | null}
     */
    static circumcircle(A, B, C) {
        const { x: x1, y: y1 } = A;
        const { x: x2, y: y2 } = B;
        const { x: x3, y: y3 } = C;

        const D = 2 * (
            x1 * (y2 - y3) +
            x2 * (y3 - y1) +
            x3 * (y1 - y2)
        );

        if (Math.abs(D) < 0.001) return null;

        const h = (
            (x1 ** 2 + y1 ** 2) * (y2 - y3) +
            (x2 ** 2 + y2 ** 2) * (y3 - y1) +
            (x3 ** 2 + y3 ** 2) * (y1 - y2)
        ) / D;

        const k = (
            (x1 ** 2 + y1 ** 2) * (x3 - x2) +
            (x2 ** 2 + y2 ** 2) * (x1 - x3) +
            (x3 ** 2 + y3 ** 2) * (x2 - x1)
        ) / D;

        const r = Math.hypot(h - x1, k - y1);

        return new Circle(h, k, r);
    }

    /**
     * @param {Circle} A
     * @param {Circle} B
     * @returns
     */
    static intersect(A, B) {
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const d = Math.hypot(dx, dy);

        // Distance from circle 1's center to the chord
        const a = (A.r ** 2 - B.r ** 2 + d ** 2) / (2 * d);

        // Height from the chord to either intersection point
        const hSquared = A.r ** 2 - a ** 2;
        const h = Math.sqrt(Math.max(0, hSquared));

        // Point along the line between the two centers
        const xm = A.x + (a * dx) / d;
        const ym = A.y + (a * dy) / d;

        // Perpendicular unit vector
        const px = -dy / d;
        const py = dx / d;

        const p1 = new Pt(xm + h * px, ym + h * py);
        const p2 = new Pt(xm - h * px, ym - h * py);

        // Tangent circles have one unique point
        if (h < 0.0000001) {
            return {
                type: "tangent",
                points: [p1]
            };
        }

        return {
            type: "two-intersections",
            points: [p1, p2]
        };
    }
}

export class Renderer {
    /**
     * @param {CanvasRenderingContext2D} c
     */
    constructor(c) {
        this.c = c;
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
     * @param {number} w
     * @param {number} h
     */
    line2(A, B, w, h) {
        this.line4(A.x, A.y, B.x, B.y, w, h);
    }

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} w
     * @param {number} h
    */
    line4(x1, y1, x2, y2, w, h) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Normalize.
        const length = Math.hypot(dx, dy);
        const ux = dx / length;
        const uy = dy / length;

        const k = 2 * Math.max(w, h);
        const startX = x1 - ux * k;
        const startY = y1 - uy * k;
        const endX = x2 + ux * k;
        const endY = y2 + uy * k;

        this.c.beginPath();
        this.c.moveTo(startX, startY);
        this.c.lineTo(endX, endY);
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
}

export class Vec2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

/**
 * @param {Pt} V
 * @param {Pt} P
 * @param {Pt} Q
 * @returns {[Vec2, Vec2]}
 */
export const trisect = (V, P, Q) => {
    const a1 = Math.atan2(P.y - V.y, P.x - V.x);
    const a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
    const d = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;

    const t1 = a1 + d / 3;
    const t2 = t1 + d / 3;
    return [
        new Vec2(Math.cos(t1), Math.sin(t1)),
        new Vec2(Math.cos(t2), Math.sin(t2))
    ];
}

/**
 * @param {Pt} V1
 * @param {Point} d1
 * @param {Pt} V2
 * @param {Point} d2
 * @returns {Pt}
 */
export const intersect = (V1, d1, V2, d2) => {
    /**
     * @param {Point} u
     * @param {Point} v
     * @returns {number}
     */
    const cross = (u, v) => u.x * v.y - u.y * v.x;
    const t = cross({ x: V2.x - V1.x, y: V2.y - V1.y }, d2) / cross(d1, d2);
    return new Pt(
        V1.x + t * d1.x,
        V1.y + t * d1.y
    );
}