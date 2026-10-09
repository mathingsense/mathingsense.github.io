/**
 * 2D affine transform, column-major: [a, b, c, d, e, f].
 * maps (x, y) to (a*x + c*y + e, b*x + d*y + f).
 * @typedef {[number, number, number, number, number, number]} AffineMatrix
 */

/**
 * Helper to assign type.
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @param {*} d
 * @param {*} e
 * @param {*} f
 * @returns {AffineMatrix}
 */
const T = (a, b, c, d, e = 0, f = 0) => [a, b, c, d, e, f];

/**
 * @param {AffineMatrix} P
 * @returns {AffineMatrix}
 */
function inv(P) {
    const det = P[0] * P[3] - P[1] * P[2];
    const a = P[3] / det, b = -P[1] / det, c = -P[2] / det, d = P[0] / det;
    return [a, b, c, d, -(a * P[4] + c * P[5]), -(b * P[4] + d * P[5])];
}

/**
 * Compose affines, apply Q first, then P
 * @param {AffineMatrix} P
 * @param {AffineMatrix} Q
 * @returns {AffineMatrix}
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
    constructor(ax, ay, bx, by, type) {
        this.type = type;
        this.m = T(ax, ay, bx, by);
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
        return new Lattice(a, 0, 0, b, "rectangular");
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
     * @returns {AffineMatrix}
     */
    translation(i, j) {
        const [x, y] = this.point(i, j);
        return [1, 0, 0, 1, x, y];
    }
}

const I = T(1, 0, 0, 1);
const R90 = T(0, 1, -1, 0);    // 4-fold rotation (x, y) -> (-y, x) [square lattice]
const R180 = T(-1, 0, 0, -1);  // 2-fold rotation (x, y) -> (-x, -y)
const R270 = T(0, -1, 1, 0);   // (x, y) -> (y, -x) [square lattice]

const R60 = T(1, 1, -1, 0);    // 6-fold rotation (x, y) -> (x-y, x) [hex lattice]
const R120 = T(0, 1, -1, -1);  // 3-fold rotation (x, y)->(-y, x-y) [hex lattice]
const R240 = T(-1, -1, 1, 0);  // (x, y) -> (y-x, -x)

const Mx = T(-1, 0, 0, 1);     // mirror (x, y) -> (-x, y)
const My = T(1, 0, 0, -1);     // mirror (x, y) -> (x, -y)
const Mdiag = T(0, 1, 1, 0);   // mirror (x, y) -> (y, x)
const Manti = T(0, -1, -1, 0); // mirror (x, y) -> (-y, -x) [hex lattice]

const CR = T(1, 0, 0, 1, 0.5, 0.5);  // centering translation (x, y) -> (x + 1/2, y + 1/2)

/** @type {Record<string, string>} */
const LatticeType = {
    p1: "oblique",
    p2: "oblique",
    pm: "rectangular",
    pg: "rectangular",
    pmm: "rectangular",
    pmg: "rectangular",
    pgg: "rectangular",
    cm: "rectangular",
    cmm: "rectangular",
    p4: "square",
    p4m: "square",
    p4g: "square",
    p3: "hexagonal",
    p3m1: "hexagonal",
    p31m: "hexagonal",
    p6: "hexagonal",
    p6m: "hexagonal",
};

/** @type {Record<string, AffineMatrix[]>} */
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
        Mdiag,
        Manti,
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
    ],
    p31m: [
        I,
        R120,
        R240,
        Mdiag,
        [1, 0, -1, -1, 0, 0],
        [-1, -1, 0, 1, 0, 0],
    ],
    p6: [
        I,
        R60,
        R120,
        R180,
        R240,
        [0, -1, 1, 1, 0, 0],  // R300
    ],
    p6m: [
        I,
        R60,
        R120,
        R180,
        R240,
        [0, -1, 1, 1, 0, 0],  // R300
        Mdiag,
        Manti,
        [1, 1, 0, -1, 0, 0],
        [-1, 0, 1, 1, 0, 0],
        [1, 0, -1, -1, 0, 0],
        [-1, -1, 0, 1, 0, 0],
    ],
};

/** @type {Record<string, string[]>} */
const SUBLATTICES = {
    oblique: ["oblique", "rectangular", "square", "hexagonal"],
    rectangular: ["rectangular", "square"],
    square: ["square"],
    hexagonal: ["hexagonal"],
};

export class WallpaperGroup {
    /**
     * @param {string} name
     * @param {Lattice} lattice
     */
    constructor(name, lattice) {
        if (!SUBLATTICES[LatticeType[name]].includes(lattice.type)) {
            throw new Error(`${name} cannot have lattice ${lattice.type}`);
        }

        this.lattice = lattice;
        const ops = OPS[name];
        if (ops === undefined) {
            throw new Error(`unknown wallpaper group: ${name}`);
        }
        this.ops = ops;
        this.cops = this.cartesianOps();
    }

    /**
     * @returns {AffineMatrix[]}
     */
    cartesianOps() {
        return this.ops.map(G => toCartesian(G, this.lattice.m));
    }
}

/**
 * Re-expresses a transform defined in fractional (lattice) coordinates
 * as a transform in Cartesian/canvas coordinates: L · G · L⁻¹.
 * @param {AffineMatrix} G Transform acting on fractional coordinates.
 * @param {AffineMatrix} L Lattice matrix mapping fractional -> Cartesian.
 * @returns {AffineMatrix}
 */
const toCartesian = (G, L) => mul(L, mul(G, inv(L)));