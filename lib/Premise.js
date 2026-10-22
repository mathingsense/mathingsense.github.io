import { GeoObject, Prop } from "./base.js";
import { Expr, print } from "./cas/Expr.js";

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
     * @param {Expr} len
     */
    constructor(A, B, len) {
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
        return `Length ${this.A.name} to ${this.B.name} is ${print(this.len)}`;
    }
}

export class PropMidpoint extends Prop {
    /**
     * @param {GeoObject} A
     * @param {GeoObject} B
     * @param {GeoObject} M
     */
    constructor(A, B, M) {
        super();
        this.A = A;
        this.B = B;
        this.M = M;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `${this.M.name} is the middle point of ${this.A.name} and ${this.B.name}`;
    }
}