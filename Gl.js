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
}

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
}

export const identity = () => {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
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
}

/**
 * @param {number[]} eye 
 * @param {number[]} center 
 * @param {number[]} up 
 * @returns {Float32Array}
 */
export const lookAt = (eye, center, up) => {
    let zx = eye[0] - center[0];
    let zy = eye[1] - center[1];
    let zz = eye[2] - center[2];

    let length = Math.hypot(zx, zy, zz);
    zx /= length;
    zy /= length;
    zz /= length;

    let xx = up[1] * zz - up[2] * zy;
    let xy = up[2] * zx - up[0] * zz;
    let xz = up[0] * zy - up[1] * zx;

    length = Math.hypot(xx, xy, xz);
    xx /= length;
    xy /= length;
    xz /= length;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,

        -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
        -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
        -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
        1,
    ]);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} azimuth
 * @param {number} elevation
 * @param {number} distance
 * @returns {{view: Float32Array, projection: Float32Array}}
 */
export const getCameraMatrices = (canvas, azimuth, elevation, distance) => {
    const target = [0, 0, 0];

    const eye = [
        distance * Math.cos(elevation) * Math.sin(azimuth),
        distance * Math.sin(elevation),
        distance * Math.cos(elevation) * Math.cos(azimuth),
    ];

    const view = lookAt(eye, target, [0, 1, 0]);

    const aspect = canvas.width / canvas.height;
    const projection = perspective(Math.PI / 4, aspect, 0.1, 100);

    return { view, projection };
}

/** @typedef {{buffer: WebGLBuffer, count: number, mode: number}} Mesh */

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number[]} data
 * @param {number} mode
 * @returns {Mesh}
 */
export const createMesh = (gl, data, mode) => {
    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(data),
        gl.STATIC_DRAW
    );

    return {
        buffer,
        count: data.length / 6,
        mode,
    };
}

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
}