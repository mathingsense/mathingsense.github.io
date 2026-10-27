import { lookupVariable, lookupConstant, extendContext } from "./context.js";
import { substitute, definitionallyEqual, pi, type } from "./expr.js";

/** @import { Expr } from "./expr.js" */
/** @import { Context, ConstantDeclaration } from "./context.js" */

/**
 * Infer the type of a variable, constant, or universe.
 *
 * Pi, Lam, and App will be implemented in later steps.
 *
 * @param {Expr} expr
 * @param {Context} [context=[]]
 * @param {ConstantDeclaration[]} [declarations=[]]
 * @returns {Expr}
 */
export const inferType = (
    expr,
    context = [],
    declarations = []
) => {
    switch (expr.kind) {
        case "Var": {
            const result = lookupVariable(context, expr.name);

            if (result === null) {
                throw new Error(
                    `Unknown variable: ${expr.name}`
                );
            }

            return result;
        }

        case "Const": {
            const result = lookupConstant(declarations, expr.name);

            if (result === null) {
                throw new Error(
                    `Unknown constant: ${expr.name}`
                );
            }

            return result;
        }

        case "Type":
            return { kind: "Type", level: expr.level + 1 };

        case "Pi": {
            // The domain must itself be a type.
            const domainType = inferType(expr.domain, context, declarations);

            if (domainType.kind !== "Type") {
                throw new Error("Pi domain must be a type");
            }

            // The codomain may refer to the bound variable.
            const extendedContext = extendContext(context, expr.name, expr.domain);

            const codomainType = inferType(expr.codomain, extendedContext, declarations);

            if (codomainType.kind !== "Type") {
                throw new Error(
                    "Pi codomain must be a type"
                );
            }

            // Predicative product universe rule.
            return type(Math.max(domainType.level, codomainType.level));
        }

        case "Lam": {
            // The parameter's domain must be a type.
            const domainType = inferType(expr.domain, context, declarations);

            if (domainType.kind !== "Type") {
                throw new Error(
                    "Lambda domain must be a type"
                );
            }

            // Infer the body type with the parameter in scope.
            const extendedContext = extendContext(context, expr.name, expr.domain);

            const bodyType = inferType(expr.body, extendedContext, declarations);

            return pi(expr.name, expr.domain, bodyType);
        }

        case "App": {
            // Infer the type of the function.
            const fnType = inferType(expr.fn, context, declarations);

            if (fnType.kind !== "Pi") {
                throw new Error(
                    "Application function must have a Pi type"
                );
            }

            // Infer the type of the argument.
            const argType = inferType(expr.arg, context, declarations);

            // The argument must match the function's domain.
            if (!definitionallyEqual(argType, fnType.domain)) {
                throw new Error(
                    "Application argument has the wrong type"
                );
            }

            // Compute the result type by substituting the argument
            // for the bound variable in the codomain.
            return substitute(fnType.codomain, fnType.name, expr.arg);
        }

    }
};


/**
 * Check that an expression has an expected type.
 *
 * @param {Expr} expr
 * @param {Expr} expectedType
 * @param {Context} [context=[]]
 * @param {ConstantDeclaration[]} [declarations=[]]
 * @returns {true}
 */
export const checkType = (
    expr,
    expectedType,
    context = [],
    declarations = []
) => {
    const actualType = inferType(
        expr,
        context,
        declarations
    );

    if (!definitionallyEqual(actualType, expectedType)) {
        throw new Error(
            "Type mismatch: expression does not have the expected type"
        );
    }

    return true;
};