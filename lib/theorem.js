import { simplify } from "./cas/Expr.js";
import { Q } from "./cas/Q.js";
import { PropLength, PropMidpoint, PropPoint } from "./Premise.js";

/**
 * @param {PropPoint} endpoint
 * @param {PropMidpoint} MmidAB
 * @param {PropLength} lenAB
 * @returns {PropLength}
 */
export function halfLenMidpoint(endpoint, MmidAB, lenAB) {
    const { A, B } = lenAB;
    const { S, M } = MmidAB;
    if (
        (A === S.A && B === S.B)
        || (A === S.B && B == S.A)
    ) {
        if (endpoint.P === S.A || endpoint.P === S.B) {
            return new PropLength(endpoint.P, M, simplify(lenAB.len.div(new Q(2n))));
        }
    }
    throw new Error(`not valid`);
}