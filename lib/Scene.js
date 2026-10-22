import { GeoObject } from "./base.js";
import { Midpoint } from "./Midpoint.js";
import { Point } from "./Point.js";
import { Segment } from "./Segment.js";

export class Scene {
    constructor() {
        this.objects = new Map();  // name -> object
        this.nextAuto = new Map(); // prefix -> next number
        this.nextId = 1;

        /** @type Point[] */
        this.points = [];

        /** @type Segment[] */
        this.segments = [];

        /** @type Midpoint[] */
        this.midpoints = [];
    }

    /**
     * @param {string} prefix
     * @param {string} [requested]
     * @returns {string}
     */
    #makeName(prefix, requested) {
        const name = requested?.trim();
        if (name) {
            if (this.objects.has(name)) {
                throw new Error(`name already in use: "${name}"`);
            }
            return name;
        }

        let n = this.nextAuto.get(prefix) ?? 0;
        let auto = "";
        do {
            auto = prefix + n++;
        } while (this.objects.has(auto));
        this.nextAuto.set(prefix, n);
        return auto;
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {string} [name]
     * @returns {Point}
     */
    addPoint(x, y, name) {
        const n = this.#makeName("P", name);
        const point = new Point(x, y, n);
        this.objects.set(n, point);
        this.points.push(point);
        return point;
    }

    /**
     * TODO: Avoid duplicate segments regardless of endpoint order.
     * @param {Point} A
     * @param {Point} B
     * @param {string} [name]
     * @returns {Segment}
     */
    addSegment(A, B, name) {
        const n = this.#makeName("S", name);
        const segment = new Segment(A, B, n);
        this.objects.set(n, segment);
        this.segments.push(segment);
        return segment;
    }

    /**
     * @param {Segment} S
     * @param {string} [name]
     * @returns {Midpoint}
     */
    addMidpoint(S, name) {
        const n = this.#makeName("M", name);
        const midp = new Midpoint(S, n);
        this.objects.set(n, midp);
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
        if (visited.has(object.name)) return;
        visited.add(object.name);

        for (const d of object.children) {
            this.recompute(d);
            this.propagateChange(d, visited);
        }
    }
}