/** @import { Expr } from "./expr.js" */

/**
 * @typedef {{
 *   name: string,
 *   type: Expr
 * }} ContextEntry
 */

/**
 * A typing context for local variables.
 *
 * @typedef {ContextEntry[]} Context
 */

/**
 * Add a local variable binding without modifying the original context.
 *
 * @param {Context} context
 * @param {string} name
 * @param {Expr} type
 * @returns {Context}
 */
export const extendContext = (context, name, type) => [
    ...context,
    { name, type }
];

/**
 * Look up a local variable's type.
 * The most recent binding takes precedence.
 *
 * @param {Context} context
 * @param {string} name
 * @returns {Expr | null}
 */
export const lookupVariable = (context, name) => {
    for (let i = context.length - 1; i >= 0; i--) {
        if (context[i].name === name) {
            return context[i].type;
        }
    }

    return null;
};

/**
 * @typedef {{
 *   name: string,
 *   type: Expr
 * }} ConstantDeclaration
 */

/**
 * Look up a named constant's declared type.
 *
 * @param {ConstantDeclaration[]} declarations
 * @param {string} name
 * @returns {Expr | null}
 */
export const lookupConstant = (declarations, name) => {
    const declaration = declarations.find(
        entry => entry.name === name
    );

    return declaration ? declaration.type : null;
};

/**
 * Add a constant declaration without modifying the original list.
 * Reject duplicate names.
 *
 * Note: This records the declaration; it does not yet verify
 * that the declared type is valid.
 *
 * @param {ConstantDeclaration[]} declarations
 * @param {string} name
 * @param {Expr} type
 * @returns {ConstantDeclaration[]}
 */
export const declareConstant = (declarations, name, type) => {
    if (declarations.some(entry => entry.name === name)) {
        throw new Error(`Constant already declared: ${name}`);
    }

    return [...declarations, { name, type }];
};