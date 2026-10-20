import { Point } from "./Point.js";

export class Segment {
    /**
     * @param {string} id
     * @param {Point} A
     * @param {Point} B
     */
    constructor(id, A, B) {
        if (A === B) throw new Error("same end");
        this.id = id;
        this.A = A;
        this.B = B;
        this.type = "segment";
    }
}