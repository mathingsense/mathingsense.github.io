/** @typedef {{x: number, y: number}} XY */
/** @typedef {{x: number, y: number, zoom: number}} Camera */

// ---------------------------------------------------------
// Canvas initialization & resize
// ---------------------------------------------------------

/**
 * @param {string} id
 * @returns {{
 *   canvas: HTMLCanvasElement,
 *   ctx: CanvasRenderingContext2D,
 * }}
 */
export const initCanvas = (id) => {
    const canvas = document.getElementById(id);
    if (canvas === null) {
        throw new Error(`element #${id} not found`);
    }
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new TypeError(`element #${id} is not a canvas`);
    }

    const ctx = canvas.getContext("2d");
    if (ctx === null) {
        throw new Error(`could not get a 2D context for #${canvas.id || "(no id)"}`);
    }

    resizeCanvas(canvas);
    return { canvas, ctx };
};

/**
 * @param {HTMLCanvasElement} canvas
 */
export const resizeCanvas = (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    const pixelWidth = Math.round(cssW * dpr);
    const pixelHeight = Math.round(cssH * dpr);

    if (
        canvas.width !== pixelWidth ||
        canvas.height !== pixelHeight
    ) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }
};

// ---------------------------------------------------------
// Coordinate conversion
// ---------------------------------------------------------

/**
 * @param {number} x
 * @param {number} y
 * @param {Camera} camera
 * @returns {XY}
 */
export const canvasToWorld = (x, y, camera) => {
    return {
        x: x / camera.zoom + camera.x,
        y: y / camera.zoom + camera.y,
    };
};

/**
 * @param {number} x
 * @param {number} y
 * @param {Camera} camera
 * @returns {XY}
 */
export const worldToCanvas = (x, y, camera) => {
    return {
        x: (x - camera.x) * camera.zoom,
        y: (y - camera.y) * camera.zoom,
    };
};

/**
 * @param {MouseEvent} e
 * @param {HTMLCanvasElement} canvas
 * @returns {XY}
 */
export const pointerToCanvas = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    return {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
    };
};

/**
 * @param {MouseEvent} e
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @returns {XY}
 */
export const pointerToWorld = (e, canvas, camera) => {
    const point = pointerToCanvas(e, canvas);
    return canvasToWorld(point.x, point.y, camera);
};

// ---------------------------------------------------------
// Drawing transforms
// ---------------------------------------------------------

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export const clearCanvas = (canvas, ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} [tileSize]
 */
export const drawCheckerboard = (canvas, ctx, tileSize = 10) => {
    const width = canvas.width;
    const height = canvas.height;

    const tile = Math.max(1, Math.round(tileSize * (window.devicePixelRatio || 1)));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#d8d8d8";
    ctx.beginPath();
    for (let y = 0, row = 0; y < height; y += tile, row++) {
        for (let x = (row & 1) * tile; x < width; x += tile * 2) {
            ctx.rect(x, y, tile, tile);
        }
    }
    ctx.fill();
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Camera} camera
 */
export const applyCameraTransform = (canvas, ctx, camera) => {
    const sx = canvas.width / canvas.clientWidth;
    const sy = canvas.height / canvas.clientHeight;
    const z = camera.zoom;

    ctx.setTransform(
        sx * z, 0,
        0, sy * z,
        -camera.x * sx * z,
        -camera.y * sy * z
    );
};

// ---------------------------------------------------------
// Camera
// ---------------------------------------------------------

/**
 * @param {Camera} camera
 * @param {number} canvasX
 * @param {number} canvasY
 * @param {number} factor
 */
export const zoomAtPoint = (camera, canvasX, canvasY, factor) => {
    if (!Number.isFinite(factor) || factor <= 0) return;

    const worldPoint = canvasToWorld(canvasX, canvasY, camera);

    const newZoom = Math.max(0.1, Math.min(10, camera.zoom * factor));
    camera.zoom = newZoom;

    // Keep the same world point under the canvas point.
    camera.x = worldPoint.x - canvasX / newZoom;
    camera.y = worldPoint.y - canvasY / newZoom;
};

/**
 * @param {MouseEvent} e
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @param {number} factor
 */
export const zoomAtPointer = (e, canvas, camera, factor) => {
    const point = pointerToCanvas(e, canvas);
    zoomAtPoint(camera, point.x, point.y, factor);
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @param {() => void} onChange
 * @param {number} [zoomSpeed]
 * @returns {() => void}
 */
export const attachWheelZoom = (
    canvas,
    camera,
    onChange,
    zoomSpeed = 0.001
) => {
    /**
     * @param {WheelEvent} e
     */
    const handleWheel = (e) => {
        e.preventDefault();

        const factor = Math.exp(-e.deltaY * zoomSpeed);
        zoomAtPointer(e, canvas, camera, factor);

        onChange?.();
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false, });

    return () => {
        canvas.removeEventListener("wheel", handleWheel);
    };
};

/**
 * @param {Camera} camera
 * @param {number} dx
 * @param {number} dy
 */
export const panCamera = (camera, dx, dy) => {
    camera.x -= dx / camera.zoom;
    camera.y -= dy / camera.zoom;
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @param {() => void} onChange
 * @returns {() => void}
 */
export const attachPan = (
    canvas,
    camera,
    onChange,
) => {
    let lastX = 0;
    let lastY = 0;
    /** @type number | null */
    let activePointerId = null;


    /**
     * @param {PointerEvent} e
     */
    const handlePointerDown = (e) => {
        if (e.button !== 0) return;

        lastX = e.clientX;
        lastY = e.clientY;
        activePointerId = e.pointerId;
        canvas.setPointerCapture(e.pointerId);
    };

    /**
     * @param {PointerEvent} e
     */
    const handlePointerMove = (e) => {
        if (e.pointerId !== activePointerId) return;

        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;

        panCamera(camera, dx, dy);

        lastX = e.clientX;
        lastY = e.clientY;

        onChange?.();
    };

    /**
     * @param {PointerEvent} e
     */
    const stopDragging = (e) => {
        if (e.pointerId !== activePointerId) return;
        activePointerId = null;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("lostpointercapture", stopDragging);

    return () => {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", stopDragging);
        canvas.removeEventListener("pointercancel", stopDragging);
        canvas.removeEventListener("lostpointercapture", stopDragging);
    };
};