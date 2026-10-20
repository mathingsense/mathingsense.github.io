import { Prop } from "./base.js";
import { Premise } from "./Premise.js";

export class Solver {
    /**
     * @param {Premise} P
     */
    constructor(P) {
        this.P = P;
        /** @type Prop | null */
        this.q = null;
    }

    /**
     * @param {Prop} P
     */
    ask(P) {
        this.q = P;
    }

    /**
     * @param {(...args: *[]) => boolean} th
     * @param {Prop[]} args
     */
    step(th, ...args) {
        th(...args);
    }

    /**
     * @returns {string}
     */
    toString() {
        if (this.q === null) {
            return "no question"
        }

        const result = this.q.toString();
        return result;
    }
}