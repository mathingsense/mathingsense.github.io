/**
 * @typedef {{
 *   kind: "Var";
 *   name: string;
 * }} Var
 */

/**
 * @typedef {{
 *   kind: "Const";
 *   name: string;
 * }} Const
 */

/**
 * A dependent function type: (x : domain) -> codomain.
 * The codomain may refer to the bound variable.
 *
 * @typedef {{
 *   kind: "Pi";
 *   name: string;
 *   domain: Expr;
 *   codomain: Expr;
 * }} Pi
 */

/**
 * A typed lambda abstraction.
 *
 * @typedef {{
 *   kind: "Lam";
 *   name: string;
 *   domain: Expr;
 *   body: Expr;
 * }} Lam
 */

/**
 * Function application.
 *
 * @typedef {{
 *   kind: "App";
 *   fn: Expr;
 *   arg: Expr;
 * }} App
 */

/**
 * @typedef {{
 *   kind: "Type";
 *   level: number;
 * }} Type
 */

/**
 * @typedef {Var | Const | Pi | Lam | App | Type} Expr
 */


/**
 * @param {string} name
 * @returns {Var}
 * */
export const variable = (name) => ({ kind: "Var", name });

/**
 * @param {string} name
 * @returns {Const}
 */
export const constant = (name) => ({ kind: "Const", name });

/**
 * @param {number} level
 * @returns {Type}
 */
export const type = (level) => {
    if (!Number.isInteger(level) || level < 0) {
        throw new RangeError("universe level must be a nonnegative integer");
    }

    return { kind: "Type", level };
};

/**
 * @param {string} name
 * @param {Expr} domain
 * @param {Expr} codomain
 * @returns {Pi}
 */
export const pi = (name, domain, codomain) => ({
    kind: "Pi",
    name,
    domain,
    codomain
});

/**
 * @param {string} name
 * @param {Expr} domain
 * @param {Expr} body
 * @returns {Lam}
 */
export const lam = (name, domain, body) => ({
    kind: "Lam",
    name,
    domain,
    body
});

/**
 * @param {Expr} fn
 * @param {Expr} arg
 * @returns {App}
 */
export const app = (fn, arg) => ({
    kind: "App",
    fn,
    arg
});


/**
 * Return the names of all free variables in an expression.
 *
 * A Pi binder binds its variable in the codomain only.
 * A Lam binder binds its variable in the body only.
 *
 * @param {Expr} expr
 * @returns {Set<string>}
 */
export const freeVariables = (expr) => {
    switch (expr.kind) {
        case "Var":
            return new Set([expr.name]);

        case "Const":
        case "Type":
            return new Set();

        case "App":
            return new Set([
                ...freeVariables(expr.fn),
                ...freeVariables(expr.arg)
            ]);

        case "Pi": {
            const vars = freeVariables(expr.domain);
            const codomainVars = freeVariables(expr.codomain);

            codomainVars.delete(expr.name);

            return new Set([...vars, ...codomainVars]);
        }

        case "Lam": {
            const vars = freeVariables(expr.domain);
            const bodyVars = freeVariables(expr.body);

            bodyVars.delete(expr.name);

            return new Set([...vars, ...bodyVars]);
        }
    }
};



/**
 * Rename occurrences of a bound variable, stopping at nested binders
 * that shadow the same name.
 *
 * @param {Expr} expr
 * @param {string} oldName
 * @param {string} newName
 * @returns {Expr}
 */
const renameBound = (expr, oldName, newName) => {
    switch (expr.kind) {
        case "Var":
            return expr.name === oldName
                ? variable(newName)
                : expr;

        case "Const":
        case "Type":
            return expr;

        case "App":
            return app(
                renameBound(expr.fn, oldName, newName),
                renameBound(expr.arg, oldName, newName)
            );

        case "Lam":
            return lam(
                expr.name,
                renameBound(expr.domain, oldName, newName),
                expr.name === oldName
                    ? expr.body
                    : renameBound(expr.body, oldName, newName)
            );

        case "Pi":
            return pi(
                expr.name,
                renameBound(expr.domain, oldName, newName),
                expr.name === oldName
                    ? expr.codomain
                    : renameBound(expr.codomain, oldName, newName)
            );
    }
};

/**
 * Collect variable and binder names to avoid collisions during renaming.
 *
 * @param {Expr} expr
 * @returns {Set<string>}
 */
const allNames = (expr) => {
    switch (expr.kind) {
        case "Var":
            return new Set([expr.name]);

        case "Const":
        case "Type":
            return new Set();

        case "App":
            return new Set([
                ...allNames(expr.fn),
                ...allNames(expr.arg)
            ]);

        case "Pi":
            return new Set([
                expr.name,
                ...allNames(expr.domain),
                ...allNames(expr.codomain)
            ]);

        case "Lam":
            return new Set([
                expr.name,
                ...allNames(expr.domain),
                ...allNames(expr.body)
            ]);
    }
};

/**
 * Return a fresh variable name that does not occur in either expression.
 *
 * @param {string} name
 * @param {Expr} expr
 * @param {Expr} replacement
 * @returns {string}
 */
const freshName = (name, expr, replacement) => {
    const used = new Set([
        ...allNames(expr),
        ...allNames(replacement)
    ]);

    let candidate = `${name}'`;

    while (used.has(candidate)) {
        candidate += "'";
    }

    return candidate;
};


/**
 * Substitute free occurrences of `name` with `replacement` in `expr`.
 * Avoids variable capture by renaming binders when necessary.
 *
 * @param {Expr} expr
 * @param {string} name
 * @param {Expr} replacement
 * @returns {Expr}
 */
export const substitute = (expr, name, replacement) => {
    switch (expr.kind) {
        case "Var":
            return expr.name === name ? replacement : expr;

        case "Const":
        case "Type":
            return expr;

        case "App":
            return app(
                substitute(expr.fn, name, replacement),
                substitute(expr.arg, name, replacement)
            );

        case "Lam": {
            const domain = substitute(expr.domain, name, replacement);

            // The binder shadows the variable in the body.
            if (expr.name === name) {
                return lam(expr.name, domain, expr.body);
            }

            let binder = expr.name;
            let body = expr.body;

            // Rename the binder if it would capture a free variable
            // introduced by the replacement.
            if (
                freeVariables(replacement).has(binder) &&
                freeVariables(body).has(name)
            ) {
                const renamed = freshName(binder, expr, replacement);

                body = renameBound(body, binder, renamed);
                binder = renamed;
            }

            return lam(
                binder,
                domain,
                substitute(body, name, replacement)
            );
        }

        case "Pi": {
            const domain = substitute(expr.domain, name, replacement);

            // The binder shadows the variable in the codomain.
            if (expr.name === name) {
                return pi(expr.name, domain, expr.codomain);
            }

            let binder = expr.name;
            let codomain = expr.codomain;

            if (
                freeVariables(replacement).has(binder) &&
                freeVariables(codomain).has(name)
            ) {
                const renamed = freshName(binder, expr, replacement);

                codomain = renameBound(codomain, binder, renamed);

                binder = renamed;
            }

            return pi(
                binder,
                domain,
                substitute(codomain, name, replacement)
            );
        }
    }
};



/**
 * Perform one beta-reduction step.
 *
 * Returns the reduced expression if expr is a beta-redex;
 * otherwise returns null.
 *
 * @param {Expr} expr
 * @returns {Expr | null}
 */
export const betaReduce = (expr) => {
    if (
        expr.kind === "App" &&
        expr.fn.kind === "Lam"
    ) {
        return substitute(
            expr.fn.body,
            expr.fn.name,
            expr.arg
        );
    }

    return null;
};


/**
 * Perform one reduction step, if possible.
 *
 * Reduction proceeds from the outside inward:
 * - reduce a beta-redex at the root first;
 * - unfold a constant with a stored proof;
 * - otherwise try the function, then the argument of an application;
 * - otherwise try the body of a lambda;
 * - otherwise try the domain and codomain of a Pi.
 *
 * @param {Expr} expr
 * @param {Array<{name: string, type: Expr, proof?: Expr}>} [declarations=[]]
 * @returns {Expr | null}
 */
export const reduceOnce = (expr, declarations = []) => {
    // Prefer reducing a beta-redex at the root.
    const reduced = betaReduce(expr);

    if (reduced !== null) {
        return reduced;
    }

    switch (expr.kind) {
        case "Var":
        case "Type":
            return null;

        case "Const": {
            const declaration = declarations.find(
                (item) => item.name === expr.name
            );

            if (declaration?.proof !== undefined) {
                return declaration.proof;
            }

            return null;
        }

        case "App": {
            const fn = reduceOnce(expr.fn, declarations);

            if (fn !== null) {
                return app(fn, expr.arg);
            }

            const arg = reduceOnce(expr.arg, declarations);

            if (arg !== null) {
                return app(expr.fn, arg);
            }

            return null;
        }

        case "Lam": {
            const domain = reduceOnce(expr.domain, declarations);

            if (domain !== null) {
                return lam(expr.name, domain, expr.body);
            }

            const body = reduceOnce(expr.body, declarations);

            if (body !== null) {
                return lam(expr.name, expr.domain, body);
            }

            return null;
        }

        case "Pi": {
            const domain = reduceOnce(expr.domain, declarations);

            if (domain !== null) {
                return pi(expr.name, domain, expr.codomain);
            }

            const codomain = reduceOnce(
                expr.codomain,
                declarations
            );

            if (codomain !== null) {
                return pi(expr.name, expr.domain, codomain);
            }

            return null;
        }
    }
};


/**
 * Reduce an expression until no more reduction steps are possible.
 *
 * Throws if the maximum number of steps is exceeded.
 *
 * @param {Expr} expr
 * @param {number} [maxSteps=100]
 * @param {Array<{name: string, type: Expr, proof?: Expr}>} [declarations=[]]
 * @returns {Expr}
 */
export const normalize = (
    expr,
    maxSteps = 100,
    declarations = []
) => {
    if (!Number.isInteger(maxSteps) || maxSteps < 0) {
        throw new RangeError("maxSteps must be a nonnegative integer");
    }

    let current = expr;

    for (let step = 0; step < maxSteps; step++) {
        const next = reduceOnce(current, declarations);

        if (next === null) {
            return current;
        }

        current = next;
    }

    // Check whether the last permitted step reached normal form.
    if (reduceOnce(current, declarations) === null) {
        return current;
    }

    throw new Error("Normalization step limit exceeded");
};


/**
 * Check whether two expressions are alpha-equivalent.
 * Bound variable names may differ, but free variable names must match.
 *
 * @param {Expr} a
 * @param {Expr} b
 * @param {{ left: string, right: string }[]} [bindings=[]]
 * @returns {boolean}
 */
const alphaEquivalent = (a, b, bindings = []) => {
    if (a.kind !== b.kind) {
        return false;
    }

    switch (a.kind) {
        case "Var": {
            if (b.kind !== "Var") {
                return false;
            }

            // Find the nearest binding for each variable.
            let leftBinding = -1;
            let rightBinding = -1;

            for (let i = bindings.length - 1; i >= 0; i--) {
                if (leftBinding === -1 &&
                    bindings[i].left === a.name) {
                    leftBinding = i;
                }

                if (rightBinding === -1 &&
                    bindings[i].right === b.name) {
                    rightBinding = i;
                }
            }

            // Bound variables must refer to corresponding binders.
            if (leftBinding !== -1 || rightBinding !== -1) {
                return leftBinding === rightBinding;
            }

            // Free variables must have identical names.
            return a.name === b.name;
        }

        case "Const":
            return b.kind === "Const" && a.name === b.name;

        case "Type":
            return b.kind === "Type" && a.level === b.level;

        case "App":
            return b.kind === "App" &&
                alphaEquivalent(a.fn, b.fn, bindings) &&
                alphaEquivalent(a.arg, b.arg, bindings);

        case "Lam":
            return b.kind === "Lam" &&
                alphaEquivalent(a.domain, b.domain, bindings) &&
                alphaEquivalent(
                    a.body,
                    b.body,
                    [...bindings, { left: a.name, right: b.name }]
                );

        case "Pi":
            return b.kind === "Pi" &&
                alphaEquivalent(a.domain, b.domain, bindings) &&
                alphaEquivalent(
                    a.codomain,
                    b.codomain,
                    [...bindings, { left: a.name, right: b.name }]
                );
    }
};

/**
 * Check whether two expressions have the same normal form,
 * up to renaming of bound variables.
 *
 * @param {Expr} a
 * @param {Expr} b
 * @returns {boolean}
 */
export const definitionallyEqual = (a, b) =>
    alphaEquivalent(normalize(a), normalize(b));