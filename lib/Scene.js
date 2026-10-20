import { GeoObject } from "./base.js";
import { Midpoint } from "./Midpoint.js";
import { Point } from "./Point.js";
import { Segment } from "./Segment.js";

export class Scene {
    constructor() {
        this.object = new Map();
        this.nextId = 1;

        /** @type Point[] */
        this.points = [];

        /** @type Segment[] */
        this.segments = [];

        /** @type Midpoint[] */
        this.midpoints = [];
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {Point}
     */
    addPoint(x, y) {
        const id = "P" + this.nextId++;
        const point = new Point(id, x, y);
        this.object.set(id, point);
        this.points.push(point);
        return point;
    }

    /**
     * TODO: Avoid duplicate segments regardless of endpoint order.
     * @param {Point} A
     * @param {Point} B
     * @returns {Segment}
     */
    addSegment(A, B) {
        const id = "S" + this.nextId++;
        const segment = new Segment(id, A, B);
        this.object.set(id, segment);
        this.segments.push(segment);
        return segment;
    }

    /**
     * @param {Segment} S
     * @returns {Midpoint}
     */
    addMidpoint(S) {
        const id = "Midp" + this.nextId++;
        const midp = new Midpoint(id, S);
        this.object.set(id, midp);
        this.midpoints.push(midp);
        return midp;
    }

    /**
     * @param {GeoObject} object
     */
    recompute(object) {
        if (object instanceof Midpoint) {
            object.update();
        }
    }

    /**
     * @param {GeoObject} object
     * @param {Set<string>} visited
     */
    propagateChange(object, visited = new Set()) {
        if (visited.has(object.id)) return;
        visited.add(object.id);

        for (const d of object.children) {
            this.recompute(d);
            this.propagateChange(d, visited);
        }
    }
}