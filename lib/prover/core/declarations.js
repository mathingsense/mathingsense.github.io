import { inferType } from "./type-checker.js";
import { declareConstant } from "./context.js";
import { parse } from "./parser.js";
import { checkType } from "./type-checker.js";

/** @import { Expr } from "./expr.js" */
/** @import { ConstantDeclaration } from "./context.js" */

/**
 * Declare a constant after checking that its declared type is valid.
 *
 * The declared type must itself have a universe as its inferred type.
 * Returns a new declarations array; the original is unchanged.
 *
 * @param {ConstantDeclaration[]} declarations
 * @param {string} name
 * @param {Expr} declaredType
 * @returns {ConstantDeclaration[]}
 */
export const declareCheckedConstant = (
    declarations,
    name,
    declaredType
) => {
    const inferredType = inferType(declaredType, [], declarations);

    if (inferredType.kind !== "Type") {
        throw new TypeError(
            "Declared type must itself be a type"
        );
    }

    return declareConstant(declarations, name, declaredType
    );
};


/**
 * Parse and validate a constant declaration.
 *
 * Syntax: const Name : expression
 *
 * @param {string} source
 * @param {ConstantDeclaration[]} [declarations=[]]
 * @returns {ConstantDeclaration[]}
 */
export const declareFromSource = (source, declarations = []) => {
    const match = /^const\s+([a-zA-Z_][A-Za-z0-9_']*)\s*:\s*(\S(?:[\s\S]*\S)?)\s*$/.exec(
        source.trim()
    );

    if (!match) {
        throw new SyntaxError(
            "Expected declaration in the form: const Name : type"
        );
    }

    const [, name, typeSource] = match;
    const declaredType = parse(typeSource, declarations);

    return declareCheckedConstant(declarations, name, declaredType);
};


/**
 * @typedef {{
 *   name: string,
 *   type: Expr,
 *   proof?: Expr}
 * } Theorem
 */

/**
 * Declare a theorem after verifying its proof.
 *
 * The checked proof is retained in the returned declaration.
 *
 * @param {ConstantDeclaration[]} declarations
 * @param {string} name
 * @param {string} statementSource
 * @param {string} proofSource
 * @returns {Theorem[]}
 */
export const declareTheorem = (
    declarations,
    name,
    statementSource,
    proofSource
) => {
    const theoremType = parse(statementSource, declarations);
    const proof = parse(proofSource, declarations);

    // Throws if the proof does not have the required type.
    checkType(proof, theoremType, [], declarations);

    // Reject duplicate names and preserve the original environment.
    const updated = declareConstant(declarations, name, theoremType);

    // Retain the verified proof alongside the theorem's type.
    return updated.map((declaration) =>
        declaration.name === name
            ? { ...declaration, proof }
            : declaration
    );
};