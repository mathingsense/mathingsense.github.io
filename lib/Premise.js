import { GeoObject, Prop } from "./base.js";
import { Q } from "./cas/Q.js";

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
     * @param {Prop[]} ps
     */
    addMany(...ps) {
        this.items.push(...ps);
    }

    /**
     * @returns {string}
     */
    toString() {
        let result = "";
        for (let i = 0; i < this.items.length; i++) {
            result += `(${i + 1}) ${this.items[i]}\n`
        }
        return result;
    }
}


export class PropLength extends Prop {
    /**
     * @param {GeoObject} A
     * @param {GeoObject} B
     * @param {Q | null} [len]
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