export class Point {
    static nextNumber = 1;

    /**
     * @param {string} id
     * @param {number} x
     * @param {number} y
     */
    constructor(id, x, y) {
        this.id = id;
        this.label = String.fromCharCode(64 + Point.nextNumber);
        this.x = x;
        this.y = y;
        this.type = "point";
        Point.nextNumber++;
    }
}