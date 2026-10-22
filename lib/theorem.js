import { simplify } from "./cas/Expr.js";
import { Q } from "./cas/Q.js";
import { PropLength, PropMidpoint } from "./Premise.js";

/**
 * @param {PropMidpoint} MmidAB
 * @param {PropLength} lenAB
 * @returns {PropLength}
 */
export function half1LenMidpoint(MmidAB, lenAB) {
    const { A: A1, B: B1 } = lenAB;
    const { A: A2, B: B2, M } = MmidAB;
    if (
        (A1 === A2 && B1 === B2)
        || (A1 === B2 && A2 == B1)
    ) {
        return new PropLength(A1, M, simplify(lenAB.len.div(new Q(2n))));
    }
    throw new Error(`not valid`);
}