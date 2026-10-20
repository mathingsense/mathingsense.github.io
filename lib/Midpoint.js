import { GeoObject } from "./base.js";
import { Segment } from "./Segment.js";

export class Midpoint extends GeoObject {
    /**
     * @param {string} id
     * @param {Segment} segment
     */
    constructor(id, segment) {
        super([segment]);
        this.id = id;
        this.segment = segment;
        this.type = "midpoint";
        this.x = 0;
        this.y = 0;
        this.update();
    }

    update() {
        const a = this.segment.A;
        const b = this.segment.B;

        this.x = (a.x + b.x) / 2;
        this.y = (a.y + b.y) / 2;
    }
}