import { GeoObject } from "./base.js";
import { Point } from "./Point.js";

export class Segment extends GeoObject {
    /**
     * @param {string} id
     * @param {Point} A
     * @param {Point} B
     */
    constructor(id, A, B) {
        if (A === B) throw new Error("same end");

        super([A, B]);
        this.id = id;
        this.A = A;
        this.B = B;
        this.type = "segment";
    }
}