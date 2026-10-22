import { GeoObject, Prop } from "./base.js";
import { Expr, print } from "./cas/Expr.js";
import { Midpoint } from "./Midpoint.js";
import { Point } from "./Point.js";
import { Segment } from "./Segment.js";

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

export class PropPoint extends Prop {
    /**
     * @param {Point} P
     */
    constructor(P) {
        super();
        this.P = P;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `${this.P.name} is a point`;
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
     * @param {Segment} S
     * @param {Midpoint} M
     */
    constructor(S, M) {
        super();
        this.S = S;
        this.M = M;
    }

    /**
     * @override
     * @returns {string}
     */
    toString() {
        return `${this.M.name} is the midpoint of segment ${this.S.A.name}${this.S.B.name}`;
    }
}