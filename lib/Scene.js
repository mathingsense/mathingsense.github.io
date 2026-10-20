import { Point } from "./Point.js";
import { Segment } from "./Segment.js";

export class Scene {
    constructor() {
        this.object = new Map();
        /** @type Point[] */
        this.points = [];

        /** @type Segment[] */
        this.segments = [];
        this.nextId = 1;
    }

    /**
     * @param {number} x
     * @param {number} y
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
     */
    addSegment(A, B) {
        const id = "S" + this.nextId++;
        const segment = new Segment(id, A, B);
        this.object.set(id, segment);
        this.segments.push(segment);
        return segment;
    }
}