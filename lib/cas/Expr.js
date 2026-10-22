import { Q } from "./Q.js";
import { Symbol } from "./Symbol.js";

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
     * @returns {Add}
     */
    add(other) {
        return new Add(this, toExpr(other));
    }

    /**
     * @param {Expr | Q} other
     * @returns {Sub}
     */
    sub(other) {
        return new Sub(this, toExpr(other));
    }

    /**
     * @param {Expr | Q} other
     * @returns {Mul}
     */
    mul(other) {
        return new Mul(this, toExpr(other));
    }

    /**
     * @param {Expr | Q} other
     * @returns {Div}
     */
    div(other) {
        return new Div(this, toExpr(other));
    }

    /**
     * @param {Expr | Q} other
     * @returns {Pow}
     */
    pow(other) {
        return new Pow(this, toExpr(other));
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

export class BinaryExpr extends Expr {
    /**
     * @param {Expr} left
     * @param {Expr} right
     */
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }

    /**
     * @override
     * @param {Expr} other
     */
    equals(other) {
        return other instanceof BinaryExpr &&
            other.constructor === this.constructor &&
            this.left.equals(other.left) &&
            this.right.equals(other.right);
    }
}

class Add extends BinaryExpr { }
class Sub extends BinaryExpr { }
class Mul extends BinaryExpr { }
class Div extends BinaryExpr { }

export class Pow extends Expr {
    /**
     * @param {Expr} base
     * @param {Expr} exponent
     */
    constructor(base, exponent) {
        super();
        this.base = base;
        this.exponent = exponent;
    }

    /**
     * @override
     * @param {Expr} other
     */
    equals(other) {
        return other instanceof Pow &&
            this.base === other.exponent;
    }
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

    if (expr instanceof Add) {
        return `(${print(expr.left)} + ${print(expr.right)})`;
    }

    if (expr instanceof Sub) {
        return `(${print(expr.left)} - ${print(expr.right)})`;
    }

    if (expr instanceof Mul) {
        return `(${print(expr.left)} * ${print(expr.right)})`;
    }

    if (expr instanceof Div) {
        return `(${print(expr.left)} / ${print(expr.right)})`;
    }

    if (expr instanceof Pow) {
        return `(${print(expr.base)} ^ ${print(expr.exponent)})`;
    }

    throw new Error("unknown expression type");
}

/**
 * TODO: optimize.
 * TODO: make it a method?
 * @param {Expr} expr
 * @returns {Expr}
 */
export function simplify(expr) {
    if (expr instanceof Constant || expr instanceof SymbolExpr) {
        return expr;
    }

    if (expr instanceof Add) {
        const left = simplify(expr.left);
        const right = simplify(expr.right);

        // Constant folding.
        if (left instanceof Constant && right instanceof Constant) {
            return new Constant(left.value.add(right.value));
        }

        // x + 0 = x
        if (isZero(left)) return right;
        if (isZero(right)) return left;

        // x + x = 2x
        if (left.equals(right)) {
            return new Mul(new Constant(new Q(2n)), left);
        }

        return new Add(left, right);
    }

    if (expr instanceof Sub) {
        const left = simplify(expr.left);
        const right = simplify(expr.right);

        if (left instanceof Constant && right instanceof Constant) {
            return new Constant(left.value.sub(right.value));
        }

        // x - 0 = x
        if (isZero(right)) return left;

        // x - x = 0
        if (left.equals(right)) {
            return constant(0n);
        }

        return new Sub(left, right);
    }

    if (expr instanceof Mul) {
        const left = simplify(expr.left);
        const right = simplify(expr.right);

        if (isZero(left) || isZero(right)) return constant(0n);

        if (isOne(left)) return right;
        if (isOne(right)) return left;

        if (left instanceof Constant && right instanceof Constant) {
            return new Constant(left.value.mul(right.value));
        }

        return new Mul(left, right);
    }

    if (expr instanceof Div) {
        const left = simplify(expr.left);
        const right = simplify(expr.right);

        if (isZero(right)) {
            throw new Error("Division by zero");
        }

        if (isZero(left)) return constant(0n);
        if (isOne(right)) return left;

        if (left instanceof Constant && right instanceof Constant) {
            return new Constant(left.value.div(right.value));
        }

        // x / x = 1, provided x is nonzero
        if (left.equals(right) && isProvablyNonZero(left)) {
            return constant(1n);
        }

        return new Div(left, right);
    }

    if (expr instanceof Pow) {
        const base = simplify(expr.base);
        const exponent = simplify(expr.exponent);

        if (isZero(exponent)) return constant(1n);
        if (isOne(exponent)) return base;
        if (isOne(base)) return constant(1n);

        // Implement after Q supports exact integer powers.
        // if (base instanceof Constant && exponent instanceof Constant) {
        //     const n = exponent.value.toNumber();

        //     if (Number.isInteger(n)) {
        //         return new Constant(base.value.pow(n));
        //     }
        // }

        return new Pow(base, exponent);
    }

    throw new Error(`unknown expression type: ${expr?.constructor?.name}`);
}

/**
 * @param {bigint} n
 * @returns {Constant}
 */
function constant(n) {
    return new Constant(new Q(n));
}

/**
 * @param {Expr} expr
 * @returns {boolean}
 */
function isZero(expr) {
    return expr instanceof Constant && expr.value.isZero();
}

/**
 * @param {Expr} expr
 * @returns {boolean}
 */
function isOne(expr) {
    return expr instanceof Constant && expr.value.isOne();
}

/**
 * @param {Expr} expr
 * @returns {boolean}
 */
function isProvablyNonZero(expr) {
    return expr instanceof Constant && !isZero(expr);
}