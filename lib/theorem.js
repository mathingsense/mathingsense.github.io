import { PropLength, PropMidpoint } from "./Premise.js";

/**
 * @param {PropLength} lenAC
 * @param {PropLength} lenAB
 * @param {PropMidpoint} CmidAB
 * @returns {boolean}
 */
export const TMidp = (lenAC, lenAB, CmidAB) => {
    if (lenAB.len === null) {
        throw new TypeError("Tmidp: lenAB.len is unknown");
    }

    const { A: A1, B: B1 } = lenAB;
    const { A: A2, B: B2, C: C1 } = CmidAB;

    if (
        (A1 === A2 && B1 === B2)
        || (A1 === B2 && A2 == B1)
    ) {
        const { A: A3, B: C2 } = lenAC;
        if (C1 === C2 && (A3 === A1 || A3 === A2)) {
            lenAC.len = lenAB.len / 2;
            return true;
        }
    }
    throw new TypeError("not valid");
}