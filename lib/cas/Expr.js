import { Q } from "./Q.js";
import { Symbol } from "./Symbol.js";

/** @typedef {{base: Expr, exponent: number}} Factor */
/** @typedef {{coefficient: Q, factors: Factor[]}} Term */

/**
 * @param {Expr | Q} value
 * @returns {Expr}
 */
const toExpr = (value) => {
    return value instanceof Expr
        ? value
        : new Constant(value);
}

export class Expr {
    /**
     * @param {Expr | Q} other
     * @returns {Expr}
     */
    div(other) {
        return div(this, toExpr(other));
    }

    /**
     * This is for structural equaity. So below should return false:
     *   new Add(x, y).equals(new Add(y, x));
     * @param {Expr} other
     * @returns {boolean}
     */
    equals(other) {
        void other;
        throw new Error("equals() must be implemented");
    }
}

export class Constant extends Expr {
    /**
     * @param {Q} value
     */
    constructor(value) {
        super();
        this.value = value;
    }

    /**
     * @override
     * @param {Expr} other
     */
    equals(other) {
        return other instanceof Constant &&
            this.value.equals(other.value);
    }
}

export class SymbolExpr extends Expr {
    /**
     * @param {Symbol} symbol
     */
    constructor(symbol) {
        super();
        this.symbol = symbol;
    }

    /**
     * @override
     * @param {Expr} other
     */
    equals(other) {
        return other instanceof SymbolExpr &&
            this.symbol === other.symbol;
    }
}

export class Product extends Expr {
    /**
     * @param {Q} coefficient
     * @param {Factor[]} factors
     */
    constructor(coefficient, factors) {
        super();
        this.coefficient = coefficient;
        this.factors = factors;
    }

    /**
     * @override
     * @param {Expr} other
     */
    equals(other) {
        return other instanceof Product &&
            this.coefficient.equals(other.coefficient) &&
            factorsEqual(this.factors, other.factors);
    }
}

/**
 * @param {Factor[]} a
 * @param {Factor[]} b
 * @returns {boolean}
 */
function factorsEqual(a, b) {
    return a.length === b.length &&
        a.every((f, i) =>
            f.exponent === b[i].exponent &&
            f.base.equals(b[i].base)
        );
}

/**
 * @param {Expr} expr
 * @returns {string}
 */
function key(expr) {
    if (expr instanceof Constant) {
        return `C(${expr.value.toString()})`;
    }

    if (expr instanceof SymbolExpr) {
        return `S(${expr.symbol.name})`;
    }

    throw new Error("unhandled expression type");
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareKeys(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {Factor[]} factors
 * @returns {Factor[]}
 */
function sortFactors(factors) {
    return factors.sort((a, b) =>
        compareKeys(key(a.base), key(b.base))
    );
}

/**
 * Canonical product factory.
 * Combines rational coefficients and integer exponents of
 * structurally identical factors.
 */
/**
 * @param {Q} coefficient
 * @param {Factor[]} inputFactors
 * @returns {Expr}
 */
function makeProduct(coefficient, inputFactors) {
    if (coefficient.isZero()) {
        return new Constant(Q.ZERO);
    }

    /** @type {Map<string, Factor>} */
    const combined = new Map();

    for (const factor of inputFactors) {
        if (factor.exponent === 0) continue;

        const k = key(factor.base);
        const existing = combined.get(k);

        if (existing) {
            existing.exponent += factor.exponent;
        } else {
            combined.set(k, {
                base: factor.base,
                exponent: factor.exponent
            });
        }
    }

    const factors = [...combined.values()]
        .filter(f => f.exponent !== 0);

    sortFactors(factors);

    if (factors.length === 0) {
        return new Constant(coefficient);
    }

    if (coefficient.isOne() &&
        factors.length === 1 &&
        factors[0].exponent === 1
    ) {
        return factors[0].base;
    }

    return new Product(coefficient, factors);
}

/**
 * Convert a normalized expression into a coefficient and
 * factors without expanding sums.
 * @param {Expr} expr
 * @returns {Term}
 */
function productParts(expr) {
    if (expr instanceof Constant) {
        return { coefficient: expr.value, factors: [] };
    }

    if (expr instanceof Product) {
        return {
            coefficient: expr.coefficient,
            factors: [...expr.factors]
        };
    }

    return {
        coefficient: Q.ONE,
        factors: [{ base: expr, exponent: 1 }]
    };
}

/**
 * @param {Expr} a
 * @param {Expr} b
 * @returns {Expr}
 */
export function mul(a, b) {
    if (isZero(a) || isZero(b)) {
        return new Constant(Q.ZERO);
    }

    const A = productParts(a);
    const B = productParts(b);

    return makeProduct(
        A.coefficient.mul(B.coefficient),
        [...A.factors, ...B.factors]
    );
}

/**
 * @param {Expr} a
 * @param {Expr} b
 * @returns {Expr}
 */
export function div(a, b) {
    if (isZero(b)) {
        throw new Error("division by zero");
    }

    if (b instanceof Constant) {
        return mul(a, new Constant(Q.ONE.div(b.value)));
    }

    throw new Error("div() is not fully implemented");
    // return mul(a, pow(b, -1));
}


/**
 * @param {Expr} expr
 * @returns {string}
 */
export function print(expr) {
    if (expr instanceof Constant) {
        return expr.value.toString();
    }

    if (expr instanceof SymbolExpr) {
        return expr.symbol.name;
    }

    if (expr instanceof Product) {
        const parts = [];

        if (!expr.coefficient.isOne() ||
            expr.factors.length === 0
        ) {
            parts.push(expr.coefficient.toString());
        }

        for (const f of expr.factors) {
            parts.push(
                f.exponent === 1
                    ? print(f.base)
                    : `${print(f.base)}^${f.exponent}`
            );
        }

        return parts.join(" * ");
    }

    throw new Error("unknown expression type");
}

/**
 * @param {Expr} expr
 * @returns {Expr}
 */
export function simplify(expr) {
    if (expr instanceof Constant || expr instanceof SymbolExpr) {
        return expr;
    }

    if (expr instanceof Product) {
        const factors = expr.factors.map(f => ({
            base: simplify(f.base),
            exponent: f.exponent
        }));

        return makeProduct(expr.coefficient, factors);
    }

    throw new Error("unknown expression type");
}

/**
 * @param {Expr} expr
 * @returns {boolean}
 */
function isZero(expr) {
    return expr instanceof Constant && expr.value.isZero();
}