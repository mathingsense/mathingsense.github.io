import { GeoObject } from "./base.js";

export class Point extends GeoObject {
    static nextNumber = 1;

    /**
     * @param {number} x
     * @param {number} y
     * @param {string} name
     */
    constructor(x, y, name) {
        super();
        this.x = x;
        this.y = y;
        this.name = name;
        this.type = "point";
    }
}