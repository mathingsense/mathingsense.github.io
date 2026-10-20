export class Pt {
    static nextNumber = 1;

    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.id = "P" + Pt.nextNumber;
        this.label = String.fromCharCode(64 + Pt.nextNumber);
        this.x = x;
        this.y = y;
        this.type = "point";
        Pt.nextNumber++;
    }
}