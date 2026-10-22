import { Prop } from "./base.js";
import { Premise } from "./Premise.js";

export class Solver {
    /**
     * @param {Premise} P
     */
    constructor(P) {
        this.P = P;
        /** @type Prop[] */
        this.questions = [];
    }

    /**
     * @param {Prop} P
     */
    add(P) {
        this.questions.push(P);
    }

    /**
     * @param {Prop} P
     */
    ask(P) {
        this.questions.push(P);
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
        let result = "";
        for (let i = 0; i < this.questions.length; i++) {
            result += `(${i + 1}) ${this.questions[i]}\n`
        }
        return result;
    }
}