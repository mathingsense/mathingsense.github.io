import { Q } from "./Q.js";

/**
 * A closed interval [lower, upper] with exact rational endpoints.
 *
 * @example
 * const a = new Interval(
 *   new Q(1n, 1n),
 *   new Q(2n, 1n)
 * );
 *
 * @example
 * const b = new Interval(
 *   new Q(3n, 1n),
 *   new Q(4n, 1n)
 * );
 *
 * const sum = a.add(b); // [4, 6]
 */
export class Interval {
    /** @readonly @type {Q} */ lower;
    /** @readonly @type {Q} */ upper;

    /** @readonly */ static ZERO = Interval.point(Q.ZERO);
    /** @readonly */ static ONE = Interval.point(Q.ONE);

    /**
     * @param {Q} lower
     * @param {Q} upper
     * @throws {RangeError} If lower > upper.
     */
    constructor(lower, upper) {
        if (lower.compare(upper) > 0) {
            throw new RangeError(
                "Interval lower bound must be <= upper bound"
            );
        }

        this.lower = lower;
        this.upper = upper;
        Object.freeze(this);
    }

    /**
     * Creates a singleton interval [value, value].
     *
     * @param {Q} value
     * @returns {Interval}
     */
    static point(value) {
        return new Interval(value, value);
    }

    /**
     * @param {Interval} i
     * @returns {Interval}
     */
    static abs(i) {
        if (i.lower.compare(Q.ZERO) > 0) {
            return i;
        }
        if (i.upper.compare(Q.ZERO) < 0) {
            return i.neg();
        }
        return new Interval(
            Q.ZERO,
            Q.max(i.lower.neg(), i.upper)
        );
    }

    /**
     * @param {...Interval} is
     * @returns {Interval}
     */
    static max(...is) {
        if (is.length === 0) {
            throw new RangeError("max requires at least one interval");
        }
        return new Interval(
            Q.max(...is.map(i => i.lower)),
            Q.max(...is.map(i => i.upper))
        );
    }

    /**
     * @param {...Interval} is
     * @returns {Interval}
     */
    static min(...is) {
        if (is.length === 0) {
            throw new RangeError("min requires at least one interval");
        }
        return new Interval(
            Q.min(...is.map(i => i.lower)),
            Q.min(...is.map(i => i.upper))
        );
    }

    /**
     * @param {...Interval} is
     * @returns {boolean}
     */
    static isIntersect(...is) {
        if (is.length === 0) {
            throw new RangeError("isIntersect requires at least one interval");
        }
        const lower = Q.max(...is.map(i => i.lower));
        const upper = Q.min(...is.map(i => i.upper));
        return lower.compare(upper) <= 0;
    }

    /**
     * @param {...Interval} is
     * @returns {Interval}
     */
    static intersect(...is) {
        if (is.length === 0) {
            throw new RangeError("intersect requires at least one interval");
        }
        return new Interval(
            Q.max(...is.map(i => i.lower)),
            Q.min(...is.map(i => i.upper))
        );
    }

    /**
     * @param {Interval} other
     * @returns {boolean}
     */
    equals(other) {
        return this.lower.equals(other.lower) && this.upper.equals(other.upper);
    }

    /**
     * @returns {Q}
     */
    length() {
        return this.upper.sub(this.lower);
    }

    /**
     * @param {Interval} other
     * @returns {boolean}
     */
    lt(other) {
        return this.upper.compare(other.lower) < 0;
    }

    /**
     * @param {Q} value
     * @returns {boolean}
     */
    contains(value) {
        return (
            this.lower.compare(value) <= 0 &&
            value.compare(this.upper) <= 0
        );
    }

    /**
     * @returns {boolean}
     */
    containsZero() {
        return this.contains(Q.ZERO);
    }

    /**
     * @param {Interval} other
     * @returns {boolean}
     */
    includes(other) {
        return this.lower.compare(other.lower) <= 0
            && other.upper.compare(this.upper) <= 0;
    }

    /**
     * Tests whether the interval contains exactly one value.
     *
     * @returns {boolean}
     */
    isPoint() {
        return this.lower.equals(this.upper);
    }

    /**
     * @param {Interval} other
     * @returns {Interval}
     */
    add(other) {
        return new Interval(
            this.lower.add(other.lower),
            this.upper.add(other.upper)
        );
    }

    /**
     * [a, b] - [c, d] = [a - d, b - c]
     *
     * @param {Interval} other
     * @returns {Interval}
     */
    sub(other) {
        return new Interval(
            this.lower.sub(other.upper),
            this.upper.sub(other.lower)
        );
    }

    /**
     * @returns {Interval}
     */
    reci() {
        if (this.containsZero()) {
            throw new RangeError("cannot take reciprocal of an interval containing zero");
        }
        return new Interval(
            this.upper.reci(),
            this.lower.reci()
        );
    }

    /**
     * @returns {Interval}
     */
    neg() {
        return new Interval(
            this.upper.neg(),
            this.lower.neg()
        );
    }

    /**
     * Computes the minimum and maximum of the four endpoint
     * products to obtain the exact interval enclosure.
     *
     * @param {Interval} other
     * @returns {Interval}
     */
    mul(other) {
        const products = [
            this.lower.mul(other.lower),
            this.lower.mul(other.upper),
            this.upper.mul(other.lower),
            this.upper.mul(other.upper),
        ];

        let lower = products[0];
        let upper = products[0];

        for (const value of products.slice(1)) {
            if (value.compare(lower) < 0) {
                lower = value;
            }

            if (value.compare(upper) > 0) {
                upper = value;
            }
        }

        return new Interval(lower, upper);
    }

    /**
     * @param {Interval} other
     * @returns {Interval}
     * @throws {RangeError} If the divisor contains zero.
     */
    div(other) {
        if (other.containsZero()) {
            throw new RangeError("cannot divide by an interval containing zero");
        }

        const quotients = [
            this.lower.div(other.lower),
            this.lower.div(other.upper),
            this.upper.div(other.lower),
            this.upper.div(other.upper),
        ];

        let lower = quotients[0];
        let upper = quotients[0];

        for (const value of quotients.slice(1)) {
            if (value.compare(lower) < 0) {
                lower = value;
            }

            if (value.compare(upper) > 0) {
                upper = value;
            }
        }

        return new Interval(lower, upper);
    }
}
