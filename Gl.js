/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source
 * @returns {WebGLShader}
 */
export const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (shader === null) {
        throw new Error(`could not create shader of type ${type}`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`could not compile ${kind} shader:\n${log}`);
    }

    return shader;
};

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} vSource
 * @param {string} fSource
 * @returns {WebGLProgram}
 */
export const createProgram = (gl, vSource, fSource) => {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fSource);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`could not link program:\n${log}`);
    }

    return program;
};

export class M4 {
    static identity = () => {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * @param {number} tx
     * @param {number} ty
     * @param {number} [tz]
     */
    static translation(tx, ty, tz = 0) {
        const matrix = M4.identity();
        matrix[12] = tx;
        matrix[13] = ty;
        matrix[14] = tz;
        return matrix;
    }

    /**
     * @param {number} sx
     * @param {number} sy
     * @param {number} sz
     * @returns {Float32Array}
     */
    static scaling(sx, sy, sz) {
        return new Float32Array([
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * @param {number} deg
     * @returns {Float32Array}
     */
    static rotationX(deg) {
        const angle = deg * Math.PI / 180;
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Float32Array([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * @param {number} deg
     * @returns {Float32Array}
     */
    static rotationY(deg) {
        const angle = deg * Math.PI / 180;
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Float32Array([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * @param {number} deg
     * @returns {Float32Array}
     */
    static rotationZ(deg) {
        const angle = deg * Math.PI / 180;
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * @param {Float32Array} a
     * @param {Float32Array} b
     * @returns {Float32Array<ArrayBuffer>}
     */
    static multiply(a, b) {
        const out = new Float32Array(16);

        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                for (let k = 0; k < 4; k++) {
                    out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
                }
            }
        }

        return out;
    }
}

/**
 * @param {number} fov
 * @param {number} aspect
 * @param {number} near
 * @param {number} far
 * @returns {Float32Array}
 */
export const perspective = (fov, aspect, near, far) => {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
    ]);
};

/**
 * @param {ArrayLike<number>} eye
 * @param {ArrayLike<number>} center
 * @param {ArrayLike<number>} up
 * @param {Float32Array} [out]
 * @returns {Float32Array}
 */
export const lookAt = (eye, center, up, out = new Float32Array(16)) => {
    let zx = eye[0] - center[0];
    let zy = eye[1] - center[1];
    let zz = eye[2] - center[2];

    let len = Math.hypot(zx, zy, zz);
    if (len < 1e-8) throw new RangeError("lookAt: eye and center coincide");
    zx /= len;
    zy /= len;
    zz /= len;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;

    len = Math.hypot(xx, xy, xz);
    if (len < 1e-8) throw new RangeError("lookAt: up is parallel to view direction");
    xx /= len;
    xy /= len;
    xz /= len;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
};

/**
 * @param {number} azimuth
 * @param {number} elevation
 * @param {number} distance
 * @param {Float32Array} [out]
 * @param {number[]} target
 * @returns {Float32Array}
 */
export const orbitView = (
    azimuth,
    elevation,
    distance,
    out = new Float32Array(16),
    target = [0, 0, 0]
) => {
    const [tx, ty, tz] = target;

    const eye = [
        tx + distance * Math.cos(elevation) * Math.sin(azimuth),
        ty + distance * Math.sin(elevation),
        tz + distance * Math.cos(elevation) * Math.cos(azimuth),
    ];

    return lookAt(eye, target, [0, 1, 0], out);
};

/** @typedef {{buffer: WebGLBuffer, count: number, mode: number, strideFloats: number}} Mesh */

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number[] | Float32Array} data
 * @param {number} mode
 * @param {number} [strideFloats]
 * @param {number} [usage]
 * @returns {Mesh}
 */
export const createMesh = (
    gl,
    data,
    mode,
    strideFloats = 6,
    usage = gl.STATIC_DRAW
) => {
    const buffer = gl.createBuffer();
    const typed = data instanceof Float32Array
        ? data
        : new Float32Array(data);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, typed, usage);

    return {
        buffer,
        count: typed.length / strideFloats,
        mode,
        strideFloats,
    };
};

/**
 * vertex: x, y, z, r, g, b
 * @param {WebGL2RenderingContext} gl
 * @returns {Mesh}
 */
export const createCube = (gl) => {
    const vertices = [];

    const faces = [
        // Front: blue
        {
            p: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
            c: [0.30, 0.55, 1.00],
        },
        // Back: purple
        {
            p: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
            c: [0.62, 0.42, 1.00],
        },
        // Right: cyan
        {
            p: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]],
            c: [0.20, 0.85, 0.90],
        },
        // Left: orange
        {
            p: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
            c: [1.00, 0.50, 0.30],
        },
        // Top: green
        {
            p: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]],
            c: [0.30, 0.90, 0.55],
        },
        // Bottom: pink
        {
            p: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
            c: [0.95, 0.35, 0.60],
        },
    ];

    const order = [0, 1, 2, 0, 2, 3];

    for (const face of faces) {
        for (const index of order) {
            vertices.push(
                ...face.p[index],
                ...face.c
            );
        }
    }

    return createMesh(gl, vertices, gl.TRIANGLES);
};

/**
 * @param {WebGL2RenderingContext} gl
 * @returns {Mesh}
 */
export const createCubeWireframe = (gl) => {
    const vertices = [];
    const color = [0.55, 0.65, 0.80];

    const corners = [
        [-1, -1, -1], // 0
        [1, -1, -1], // 1
        [1, 1, -1], // 2
        [-1, 1, -1], // 3
        [-1, -1, 1], // 4
        [1, -1, 1], // 5
        [1, 1, 1], // 6
        [-1, 1, 1], // 7
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    for (const [a, b] of edges) {
        vertices.push(...corners[a], ...color);
        vertices.push(...corners[b], ...color);
    }

    return createMesh(gl, vertices, gl.LINES);
};

/**
 * @param {WebGL2RenderingContext} gl
 * @returns {Mesh}
 */
export const createBasisVectors = (gl) => {
    /** @type number[] */
    const vertices = [];

    /**
     * @param {number[]} start
     * @param {number[]} end
     * @param {number[]} color
     */
    function addLine(start, end, color) {
        vertices.push(
            ...start, ...color,
            ...end, ...color
        );
    }

    const origin = [0, 0, 0];
    const length = 1.5;
    const headLength = 0.18;
    const headWidth = 0.10;

    // X axis: red
    const red = [1.0, 0.2, 0.2];
    addLine(origin, [length, 0, 0], red);
    addLine(
        [length - headLength, headWidth, 0],
        [length, 0, 0], red
    );
    addLine(
        [length - headLength, -headWidth, 0],
        [length, 0, 0], red
    );

    // Y axis: green
    const green = [0.2, 1.0, 0.35];
    addLine(origin, [0, length, 0], green);
    addLine(
        [headWidth, length - headLength, 0],
        [0, length, 0], green
    );
    addLine(
        [-headWidth, length - headLength, 0],
        [0, length, 0], green
    );

    // Z axis: blue
    const blue = [0.25, 0.55, 1.0];
    addLine(origin, [0, 0, length], blue);
    addLine(
        [0, headWidth, length - headLength],
        [0, 0, length], blue
    );
    addLine(
        [0, -headWidth, length - headLength],
        [0, 0, length], blue
    );

    return createMesh(gl, vertices, gl.LINES);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @returns {Mesh}
 */
export const createGridAndAxes = (gl) => {
    /** @type {number[]} */
    const vertices = [];

    /**
     * @param {number[]} a
     * @param {number[]} b
     * @param {number[]} color
     */
    function line(a, b, color) {
        vertices.push(...a, ...color);
        vertices.push(...b, ...color);
    }

    const extent = 10;
    const gridY = -1.015;
    const gridColor = [0.15, 0.21, 0.33];

    for (let i = -extent; i <= extent; i++) {
        line(
            [-extent, gridY, i],
            [extent, gridY, i],
            gridColor
        );

        line(
            [i, gridY, -extent],
            [i, gridY, extent],
            gridColor
        );
    }

    // X axis: red
    line(
        [-3, 0, 0],
        [3, 0, 0],
        [1.0, 0.30, 0.40]
    );

    // Y axis: green
    line(
        [0, -2, 0],
        [0, 3, 0],
        [0.30, 1.0, 0.55]
    );

    // Z axis: blue
    line(
        [0, 0, -3],
        [0, 0, 3],
        [0.35, 0.60, 1.0]
    );

    return createMesh(gl, vertices, gl.LINES);
};


/**
 * @todo refactor this and the above function.
 * @param {WebGL2RenderingContext} gl
 * @param {number} [size]
 * @param {number} [divisions]
 * @returns {Mesh}
 */
export function createGroundGrid(gl, size = 4, divisions = 10) {
    /** @type {number[]} */
    const vertices = [];
    const half = size / 2;
    const step = size / divisions;

    const gridColor = [0.35, 0.38, 0.42];
    const axisXColor = [0.95, 0.25, 0.25];
    const axisZColor = [0.25, 0.45, 1.0];

    /**
     * @param {number[]} a
     * @param {number[]} b
     * @param {number[]} color
     */
    function addLine(a, b, color) {
        vertices.push(...a, ...color, ...b, ...color);
    }

    for (let i = 0; i <= divisions; i++) {
        const p = -half + i * step;

        // Lines parallel to the X axis
        addLine(
            [-half, 0, p],
            [half, 0, p],
            Math.abs(p) < 1e-6 ? axisXColor : gridColor
        );

        // Lines parallel to the Z axis
        addLine(
            [p, 0, -half],
            [p, 0, half],
            Math.abs(p) < 1e-6 ? axisZColor : gridColor
        );
    }

    return createMesh(gl, vertices, gl.LINES);
}


/**
 * @param {HTMLCanvasElement} canvas
 * @param {WebGL2RenderingContext} gl
 */
export const resizeCanvas = (canvas, gl) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
};

/** @typedef {{x: number, y: number, z: number}} XYZ */

/**
 * Generate a triangle mesh for y = f(x, z)
 * @param {WebGL2RenderingContext} gl
 * @param {(x: number, z: number) => number} fn
 * @param {number} segments
 * @param {number} size
 * @returns {{
 *   surface: Mesh,
 *   wireframe: Mesh,
 *   minHeight: number,
 *   maxHeight: number
 * }}
 */
export const createHeightField = (gl, fn, segments = 100, size = 4) => {
    /** @type {{x: number, y: number, z: number, normal?: XYZ}[][]} */
    const samples = [];
    let minHeight = Infinity;
    let maxHeight = -Infinity;

    const step = size / segments;
    const half = size / 2;

    // Sample the function first, so we know its height range.
    for (let j = 0; j <= segments; j++) {
        const row = [];

        for (let i = 0; i <= segments; i++) {
            const x = -half + i * step;
            const z = -half + j * step;
            const y = fn(x, z);

            row.push({ x, y, z });

            minHeight = Math.min(minHeight, y);
            maxHeight = Math.max(maxHeight, y);
        }

        samples.push(row);
    }

    /** @type number[] */
    const triangles = [];

    /** @type number[] */
    const lines = [];

    const range = maxHeight - minHeight;

    /**
     * @param {number[]} target
     * @param {XYZ} p
     * @param {number[] | null} [color]
     * @param {XYZ | null} [normal]
     */
    function addVertex(target, p, color, normal = null) {
        // Normalize the height to [0, 1].
        const t = range > 1e-7
            ? (p.y - minHeight) / range
            : 0.5;

        // Blue at the bottom, red at the top.
        const r = color ? color[0] : t;
        const g = color ? color[1] : 0.25;
        const b = color ? color[2] : 1 - t;

        target.push(p.x, p.y, p.z, r, g, b);
        if (normal) {
            target.push(normal.x, normal.y, normal.z);
        }
    }

    /**
     * @param {number} x
     * @param {number} z
     * @returns {XYZ}
     */
    const getNormal = (x, z) => {
        const h = step * 0.5;

        const dx = (fn(x + h, z) - fn(x - h, z)) / (2 * h);
        const dz = (fn(x, z + h) - fn(x, z - h)) / (2 * h);

        const length = Math.hypot(dx, 1, dz);

        return {
            x: -dx / length,
            y: 1 / length,
            z: -dz / length,
        };
    }

    for (const row of samples) {
        for (const p of row) {
            p.normal = getNormal(p.x, p.z);
        }
    }

    const wireColor = [0.08, 0.09, 0.12];

    for (let j = 0; j < segments; j++) {
        for (let i = 0; i < segments; i++) {
            const a = samples[j][i];
            const b = samples[j][i + 1];
            const c = samples[j + 1][i];
            const d = samples[j + 1][i + 1];

            // Two triangles per cell.
            addVertex(triangles, a, null, a.normal);
            addVertex(triangles, c, null, c.normal);
            addVertex(triangles, b, null, b.normal);

            addVertex(triangles, b, null, b.normal);
            addVertex(triangles, c, null, c.normal);
            addVertex(triangles, d, null, d.normal);

            // Grid edges
            addVertex(lines, a, wireColor);
            addVertex(lines, b, wireColor);

            addVertex(lines, a, wireColor);
            addVertex(lines, c, wireColor);
        }
    }

    // Add the far boundaries of the grid.
    for (let i = 0; i < segments; i++) {
        addVertex(lines, samples[segments][i], wireColor);
        addVertex(lines, samples[segments][i + 1], wireColor);

        addVertex(lines, samples[i][segments], wireColor);
        addVertex(lines, samples[i + 1][segments], wireColor);

    }

    return {
        surface: createMesh(gl, triangles, gl.TRIANGLES, 9),
        wireframe: createMesh(gl, lines, gl.LINES),
        minHeight,
        maxHeight,
    };
}


/**
 * @param {WebGL2RenderingContext} gl
 * @param {*} plane
 * @param {number} [size]
 * @returns {Mesh}
 */
export const createTangentPlaneMesh = (gl, plane, size = 1) => {
    const { x, z } = plane.point;

    const x0 = x - size;
    const x1 = x + size;
    const z0 = z - size;
    const z1 = z + size;

    /**
     * @param {number} px
     * @param {number} pz
     */
    function vertex(px, pz) {
        return [
            px,
            plane.heightAt(px, pz),
            pz,
            1.0, 0.65, 0.15
        ];
    }

    const a = vertex(x0, z0);
    const b = vertex(x1, z0);
    const c = vertex(x1, z1);
    const d = vertex(x0, z1);

    const triangles = [
        ...a, ...b, ...c,
        ...a, ...c, ...d
    ];

    return createMesh(gl, triangles, gl.TRIANGLES);
}


/**
 * @param {WebGL2RenderingContext} gl
 * @param {XYZ} point
 * @param {number} [radius]
 * @returns {Mesh}
 */
export function createPointMarker(gl, point, radius = 0.5) {
    const { x, y, z } = point;
    const r = radius;
    const color = [1.0, 0.2, 0.15];

    const lines = [
        [x - r, y, z],
        [x + r, y, z],

        [x, y - r, z],
        [x, y + r, z],

        [x, y, z - r],
        [x, y, z + r]
    ];

    const vertices = [];

    for (const p of lines) {
        vertices.push(...p, ...color);
    }

    return createMesh(gl, vertices, gl.LINES);
}


/**
 * @param {WebGL2RenderingContext} gl
 * @param {*} plane
 * @param {number} [length]
 * @returns {Mesh}
 */
export function createTangentVectors(gl, plane, length = 2) {
    const { x, y, z } = plane.point;

    const normalLength = Math.hypot(plane.dx, 1, plane.dz);
    const epsilon = 0.015;

    const offsetX = (-plane.dx / normalLength) * epsilon;
    const offsetY = (1 / normalLength) * epsilon;
    const offsetZ = (-plane.dz / normalLength) * epsilon;

    const vectors = [
        {
            direction: [1, plane.dx, 0],
            color: [0.0, 0.0, 0.0]
        },
        {
            direction: [0, plane.dz, 1],
            color: [0.0, 0.0, 0.0]
        }
    ];

    const vertices = [];

    for (const { direction, color } of vectors) {
        const [dx, dy, dz] = direction;

        // Normalize the direction so both vectors have the same displayed length.
        const magnitude = Math.hypot(dx, dy, dz);
        const sx = (dx / magnitude) * length;
        const sy = (dy / magnitude) * length;
        const sz = (dz / magnitude) * length;

        vertices.push(
            x + offsetX,
            y + offsetY,
            z + offsetZ,
            ...color,

            x + offsetZ + sx,
            y + offsetY + sy,
            z + offsetZ + sz,
            ...color
        );
    }

    return createMesh(gl, vertices, gl.LINES);
}
