/**
 * Church encoding of conjunction.
 *
 * Given types A and B, a conjunction can produce any result C
 * when given a function that consumes evidence of A and B.
 *
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
export const andType = (a, b) =>
    `Pi (C : Type(0)) -> ` +
    `Pi (k : Pi (x : ${a}) -> Pi (y : ${b}) -> C) -> C`;


/**
 * Encodes implication A -> B as a function type.
 *
 * A proof of A -> B is a function that transforms
 * evidence of A into evidence of B.
 *
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
export const impliesType = (a, b) =>
    `Pi (_ : ${a}) -> ${b}`;