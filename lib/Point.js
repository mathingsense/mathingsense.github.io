import { GeoObject } from "./base.js";

export class Point extends GeoObject {
    static nextNumber = 1;

    /**
     * @param {string} id
     * @param {number} x
     * @param {number} y
     */
    constructor(id, x, y) {
        super();
        this.id = id;
        this.label = String.fromCharCode(64 + Point.nextNumber);
        this.x = x;
        this.y = y;
        this.type = "point";
        Point.nextNumber++;
    }
}