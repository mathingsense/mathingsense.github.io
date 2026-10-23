// TODO: Fix Q.toFloat().
//
// Not optimized. Should divide by gcd in arithmetic operations.
// Q.toFloat() can loss precision.


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
            throw new Error("division by zero");
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
}