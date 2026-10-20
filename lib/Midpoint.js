import { GeoObject } from "./base.js";
import { Segment } from "./Segment.js";

export class Midpoint extends GeoObject {
    /**
     * @param {Segment} segment
     * @param {string} name
     */
    constructor(segment, name) {
        super([segment]);
        this.name = name;
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