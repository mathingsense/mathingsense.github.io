/** @typedef {[number, number, number, number, number, number]} TransformMatrix */

/**
 * @param {TransformMatrix} P
 * @returns {TransformMatrix}
 */
function inv(P) {
    const det = P[0] * P[3] - P[1] * P[2];
    const a = P[3] / det, b = -P[1] / det, c = -P[2] / det, d = P[0] / det;
    return [a, b, c, d, -(a * P[4] + c * P[5]), -(b * P[4] + d * P[5])];
}

/**
 * Compose affines, apply Q first, then P
 * @param {TransformMatrix} P
 * @param {TransformMatrix} Q
 * @returns {TransformMatrix}
 */
export const mul = (P, Q) => {
    return [
        P[0] * Q[0] + P[2] * Q[1],
        P[1] * Q[0] + P[3] * Q[1],
        P[0] * Q[2] + P[2] * Q[3],
        P[1] * Q[2] + P[3] * Q[3],
        P[0] * Q[4] + P[2] * Q[5] + P[4],
        P[1] * Q[4] + P[3] * Q[5] + P[5],
    ];
}

export class Lattice {
    /**
     * @param {number} ax
     * @param {number} ay
     * @param {number} bx
     * @param {number} by
     * @param {string} type
     */
    constructor(ax, ay, bx, by, type = "oblique") {
        this.type = type;
        /** @type {TransformMatrix} */
        this.m = [ax, ay, bx, by, 0, 0];
        this.inv = inv(this.m);
    }

    /**
     * @param {number} a
     * @param {number} b
     * @param {number} deg
     * @returns {Lattice}
     */
    static oblique(a, b, deg) {
        const g = deg * Math.PI / 180;
        return new Lattice(a, 0, b * Math.cos(g), b * Math.sin(g), "oblique");
    }

    /**
     * @param {number} a
     * @param {number} b
     * @returns {Lattice}
     */
    static rectangular(a, b) {
        return new Lattice(a, 0, 0, b, 'rectangular');
    }

    /**
     * @param {number} a
     * @returns {Lattice}
     */
    static square(a) {
        return new Lattice(a, 0, 0, a, "square");
    }

    /**
     * @param {number} a
     * @returns {Lattice}
     */
    static hexagonal(a) {
        return new Lattice(a, 0, -a / 2, a * Math.sqrt(3) / 2, "hexagonal");
    }

    /**
     * Fractional (u,v) -> Cartesian [x,y]
     * @param {number} u
     * @param {number} v
     * @returns {[number, number]}
     */
    point(u, v) {
        return [this.m[0] * u + this.m[2] * v, this.m[1] * u + this.m[3] * v];
    }

    /**
     * Cartesian (x,y) -> fractional [u,v]
     * @param {number} x
     * @param {number} y
     * @returns {[number, number]}
     */
    fractional(x, y) {
        return [this.inv[0] * x + this.inv[2] * y, this.inv[1] * x + this.inv[3] * y];
    }

    /**
     * Translation matrix for lattice offset (i,j)
     * @param {number} i
     * @param {number} j
     * @returns {TransformMatrix}
     */
    translation(i, j) {
        const [x, y] = this.point(i, j);
        return [1, 0, 0, 1, x, y];
    }
}


const I = [1, 0, 0, 1, 0, 0];
const R90 = [0, 1, -1, 0, 0, 0];    // 4-fold rotation (x, y) -> (-y, x) [square lattice]
const R180 = [-1, 0, 0, -1, 0, 0];  // 2-fold rotation (x, y) -> (-x, -y)
const R270 = [0, -1, 1, 0, 0, 0];   // (x, y) -> (y, -x) [square lattice]

const R120 = [0, 1, -1, -1, 0, 0];  // 3-fold rotation (x, y)->(-y, x-y) [hex lattice]
const R240 = [-1, -1, 1, 0, 0, 0];  // (x, y) -> (y-x, -x)

const Mx = [-1, 0, 0, 1, 0, 0];     // mirror (x, y) -> (-x, y)
const My = [1, 0, 0, -1, 0, 0];     // mirror (x, y) -> (x, -y)
const Manti = [0, -1, -1, 0, 0, 0]; // mirror (x, y) -> (-y, -x) [hex lattice]

const CR = [1, 0, 0, 1, 0.5, 0.5];  // centering translation (x, y) -> (x + 1/2, y + 1/2)

/** @type {Record<string, any[]>} */
const OPS = {
    p1: [
        I,
    ],
    p2: [
        I,
        R180,
    ],
    pm: [
        I,
        Mx,
    ],
    pg: [
        I,
        [-1, 0, 0, 1, 0, 0.5],
    ],
    pmm: [
        I,
        R180,
        Mx,
        My,
    ],
    pmg: [
        I,
        Mx,
        [-1, 0, 0, -1, 0.5, 0],
        [1, 0, 0, -1, 0.5, 0],
    ],
    pgg: [
        I,
        R180,
        [-1, 0, 0, 1, 0.5, 0.5],
        [1, 0, 0, -1, -0.5, -0.5],
    ],
    cm: [
        I,
        Mx,
        CR,
        [-1, 0, 0, 1, 0.5, 0.5], // CR M_X
    ],
    cmm: [
        I,
        R180,
        Mx,
        My,
        CR,
        [-1, 0, 0, -1, 0.5, 0.5], // CR R2
        [-1, 0, 0, 1, 0.5, 0.5],  // CR M_X
        [1, 0, 0, -1, 0.5, 0.5],  // CR M_Y
    ],
    p4: [
        I,
        R90,
        R180,
        R270,
    ],
    p4m: [
        I,
        R90,
        R270,
        R180,
        Mx,
        My,
        [0, 1, 1, 0, 0, 0],    // (x, y) -> (y, x)
        [0, -1, -1, 0, 0, 0],  // (x, y) -> (-y, -x)
    ],
    p4g: [
        I,
        R90,
        R180,
        R270,
        [0, 1, 1, 0, 0.5, 0.5],    // (x, y) -> (y + 0.5, x + 0.5)
        [0, -1, -1, 0, 0.5, 0.5],  // (x, y) -> (-y + 0.5, -x + 0.5)
        [1, 0, 0, -1, 0.5, 0.5],   // (x, y) -> (x + 0.5, -y + 0.5)
        [-1, 0, 0, 1, 0.5, 0.5],   // (x, y) -> (-x + 0.5, y + 0.5)
    ],
    p3: [
        I,
        R120,
        R240,
    ],
    p3m1: [
        I,
        R120,
        R240,
        Manti,
        [-1, 0, 1, 1, 0, 0],
        [1, 1, 0, -1, 0, 0],
    ]
};

export class WallpaperGroup {
    /**
     * @param {string} name
     * @param {Lattice} lattice
     */
    constructor(name, lattice) {
        this.lattice = lattice;
        const ops = OPS[name];
        if (ops === undefined) {
            throw new Error(`unknown wallpaper group: ${name}`);
        }
        this.ops = ops;
    }
}

/**
 * Fractional-coordinate transform -> Cartesian (canvas) transform: L · G · L⁻¹
 * @param {TransformMatrix} G
 * @param {TransformMatrix} L
 * @returns {TransformMatrix}
 */
const toCartesian = (G, L) => mul(L, mul(G, inv(L)));

/**
 * @todo move to WallpaperGroup
 * @param {TransformMatrix[]} ops
 * @param {Lattice} L
 * @returns {TransformMatrix[]}
 */
export const cartesianOps = (ops, L) => {
    return ops.map(G => toCartesian(G, L.m));
}