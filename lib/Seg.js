import { Pt } from "./Pt.js";

export class Seg {
    static nextNumber = 1;

    /**
     * TODO: Avoid duplicate segments regardless of endpoint order.
     * @param {Pt} A
     * @param {Pt} B
     */
    constructor(A, B) {
        if (A === B) throw new Error("same end");
        this.id = "S" + Seg.nextNumber;
        this.A = A;
        this.B = B;
        this.type = "segment";
        Seg.nextNumber++;
    }
}