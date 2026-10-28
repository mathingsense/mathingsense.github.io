// TODO: Fix Q.toFloat().
//
// Not optimized. Should divide by gcd in arithmetic operations.
// Q.toFloat() can loss precision.


/**
 * Parses a plain decimal literal ("12", "-1.25") exactly.
 *
 * @param {string} text
 * @returns {Q}
 */
function parseDecimal(text) {
    const m = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!m) {
        throw new SyntaxError(`invalid number: "${text}"`);
    }

    const [, sign, int, frac = ""] = m;
    const num = BigInt(int + frac);
    const den = 10n ** BigInt(frac.length);

    return new Q(sign === "-" ? -num : num, den);
}


/**
 * Always non-negative.
 * gcd(0n, 0n) = 0n.
 * 
 * @param {bigint} a
 * @param {bigint} b
 * @returns {bigint}
 */
export const gcd = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;

    while (b !== 0n) {
        const t = b;
        b = a % b;
        a = t;
    }

    return a;
};


export class Q {
    /** @readonly @type {bigint} */ n;
    /** @readonly @type {bigint} */ d;

    /** @readonly */ static ZERO = new Q(0n);
    /** @readonly */ static ONE = new Q(1n);

    /**
     * @param {bigint} n
     * @param {bigint} [d]
     */
    constructor(n, d = 1n) {
        if (d === 0n) {
            throw new RangeError("division by zero");
        }

        if (d < 0n) {
            n = -n;
            d = -d;
        }

        const g = gcd(n, d);

        this.n = n / g;
        this.d = d / g;
        Object.freeze(this);
    }

    /**
     * Parses an exact rational from a string. Accepted forms:
     * integers ("42"), decimals ("-1.25"), and fractions ("3/4", "-1.5/2").
     *
     * @param {string} str
     * @returns {Q}
     */
    static fromString(str) {
        const s = str.trim();
        const slash = s.indexOf("/");

        if (slash === -1) {
            return parseDecimal(s);
        }

        const num = parseDecimal(s.slice(0, slash).trim());
        const den = parseDecimal(s.slice(slash + 1).trim());

        return num.div(den);
    }

    /**
     * @param {Q} other
     * @returns {Q}
     */
    add(other) {
        return new Q(
            this.n * other.d + other.n * this.d,
            this.d * other.d
        );
    }

    /**
     * @param {Q} other
     * @returns {Q}
     */
    sub(other) {
        return new Q(
            this.n * other.d - other.n * this.d,
            this.d * other.d
        );
    }

    /**
     * @param {Q} other
     * @returns {Q}
     */
    mul(other) {
        return new Q(
            this.n * other.n,
            this.d * other.d
        );
    }

    /**
     * @param {Q} other
     * @returns {Q}
     */
    div(other) {
        return new Q(
            this.n * other.d,
            this.d * other.n
        );
    }

    /**
     * @returns {Q}
     */
    reci() {
        return new Q(this.d, this.n);
    }

    /**
     * @returns {Q}
     */
    neg() {
        return new Q(-this.n, this.d);
    }

    /**
     * @returns {boolean}
     */
    isZero() {
        return this.n === 0n;
    }

    /**
     * @returns {boolean}
     */
    isOne() {
        return this.n === this.d;
    }

    /**
     * @param {Q} other
     * @returns {boolean}
     */
    equals(other) {
        return this.n === other.n && this.d === other.d;
    }

    /**
     * @param {Q} other
     * @returns {number}
     */
    compare(other) {
        const L = this.n * other.d;
        const R = other.n * this.d;
        return L < R ? -1 : L > R ? 1 : 0;
    }

    /**
     * @returns {number}
     */
    toFloat() {
        return Number(this.n) / Number(this.d);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
    }

    /**
     * @param {...Q} qs
     * @returns {Q}
     */
    static max(...qs) {
        if (qs.length === 0) {
            throw new RangeError("max requires at least one value");
        }
        return qs.reduce((a, b) => a.compare(b) >= 0 ? a : b);
    }

    /**
     * @param {...Q} qs
     * @returns {Q}
     */
    static min(...qs) {
        if (qs.length === 0) {
            throw new RangeError("min requires at least one value");
        }
        return qs.reduce((a, b) => a.compare(b) <= 0 ? a : b);
    }
}