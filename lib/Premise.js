import { GeoObject, Prop } from "./base.js";

export class Premise {
    constructor() {
        /** @type Prop[] */
        this.items = [];
    }

    /**
     * @param {Prop} P
     */
    add(P) {
        this.items.push((P));
    }

    /**
     * @returns {string}
     */
    toString() {
        let result = "";
        for (const item of this.items) {
            result += item.toString() + "\n";
        }
        return result;
    }
}


export class PropLength extends Prop {
    /**
     * @param {GeoObject} A
     * @param {GeoObject} B
     * @param {number | null} [len]
     */
    constructor(A, B, len = null) {
        super();
        this.A = A;
        this.B = B;
        this.len = len;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `Length ${this.A.name} to ${this.B.name} is ${this.len}`;
    }
}

export class PropMidpoint extends Prop {
    /**
     * @param {GeoObject} A
     * @param {GeoObject} B
     * @param {GeoObject} C
     */
    constructor(A, B, C) {
        super();
        this.A = A;
        this.B = B;
        this.C = C;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `${this.C.name} is the middle point of ${this.A.name} and ${this.B.name}`;
    }
}