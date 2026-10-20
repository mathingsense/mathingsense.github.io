import { GeoObject } from "./base.js";
import { Point } from "./Point.js";

export class Segment extends GeoObject {
    /**
     * @param {Point} A
     * @param {Point} B
     * @param {string} name
     */
    constructor(A, B, name) {
        if (A === B) throw new Error("same end");

        super([A, B]);
        this.A = A;
        this.B = B;
        this.name = name;
        this.type = "segment";
    }
}