import { gcd, Q } from "../lib/cas/Q.js";
import { initTestFile } from "./test-runner.js";
import { equal, throws, assert } from "./test-utils.js";

const { test, section } = initTestFile("Q.test.js");

/**
 * @param {bigint} n
 * @param {bigint} d
 * @returns {Q}
 */
const q = (n, d = 1n) => new Q(n, d);

test("constructor reduces fractions", () => {
    equal(new Q(2n, 4n).toString(), "1/2");
    equal(new Q(10n, 5n).toString(), "2");
});

test("constructor normalizes denominator signs", () => {
    equal(new Q(2n, -4n).toString(), "-1/2");
    equal(new Q(-2n, -4n).toString(), "1/2");
});

test("constructor handles zero", () => {
    equal(new Q(0n, 5n).toString(), "0");
    equal(new Q(0n).toString(), "0");
});

test("constructor handles integers", () => {
    equal(new Q(69n).toString(), "69");
    equal(new Q(-123n).toString(), "-123");
});

test("constructor rejects zero denominator", () => {
    throws(() => new Q(1n, 0n), /division by zero/i);
    throws(() => new Q(0n, 0n), /division by zero/i);
});

test("additions", () => {
    equal(new Q(1n, 2n).add(new Q(1n, 3n)).toString(), "5/6");
    equal(new Q(1n, 2n).add(new Q(1n, 2n)).toString(), "1");
    equal(new Q(-1n, 2n).add(new Q(1n, 2n)).toString(), "0");
});

test("subtractions", () => {
    equal(new Q(3n, 4n).sub(new Q(1n, 4n)).toString(), "1/2");
    equal(new Q(1n, 3n).sub(new Q(1n, 3n)).toString(), "0");
    equal(new Q(1n, 2n).sub(new Q(2n, 3n)).toString(), "-1/6");
});

test("multiplications", () => {
    equal(new Q(2n, 3n).mul(new Q(3n, 4n)).toString(), "1/2");
    equal(new Q(-2n, 3n).mul(new Q(3n, 4n)).toString(), "-1/2");
    equal(new Q(0n).mul(new Q(5n, 7n)).toString(), "0");
});

test("divisions", () => {
    equal(new Q(1n, 2n).div(new Q(3n, 4n)).toString(), "2/3");
    equal(new Q(-1n, 2n).div(new Q(3n, 4n)).toString(), "-2/3");
    equal(new Q(2n, 3n).div(new Q(2n, 3n)).toString(), "1");
});

test("division by zero throws", () => {
    throws(() => new Q(1n).div(new Q(0n)), /division by zero/i);
});

test("negations", () => {
    equal(new Q(1n, 2n).neg().toString(), "-1/2");
    equal(new Q(-1n, 2n).neg().toString(), "1/2");
    equal(new Q(0n).neg().toString(), "0");
});

test("equals()", () => {
    equal(new Q(1n, 2n).equals(new Q(2n, 4n)), true);
    equal(new Q(1n, 2n).equals(new Q(3n, 4n)), false);
    equal(new Q(0n, 5n).equals(new Q(0n, 7n)), true);
});

test("comparisons", () => {
    equal(new Q(1n, 2n).compare(new Q(2n, 3n)), -1);
    equal(new Q(2n, 3n).compare(new Q(1n, 2n)), 1);
    equal(new Q(1n, 2n).compare(new Q(2n, 4n)), 0);
    equal(new Q(-1n, 2n).compare(new Q(1n, 3n)), -1);
});

test("large BigInt values remain exact", () => {
    const n = 10n ** 100n;

    equal(new Q(n, 2n * n).toString(), "1/2");
    equal(new Q(n).add(new Q(1n)).toString(), String(n + 1n));
    equal(new Q(n).compare(new Q(n - 1n)), 1);
});

test("arithmetic results remain normalized", () => {
    const values = [
        new Q(1n, 6n).add(new Q(1n, 3n)),
        new Q(3n, 4n).sub(new Q(1n, 4n)),
        new Q(2n, 3n).mul(new Q(3n, 4n)),
        new Q(1n, 2n).div(new Q(3n, 4n)),
    ];

    for (const q of values) {
        assert(q.d > 0n, "Denominator must be positive");
        assert(gcd(q.n, q.d) === 1n, "Fraction must be reduced");
    }
});

test("isZero(), isOne()", () => {
    assert(new Q(0n).isZero());
    assert(new Q(2n, 2n).isOne());
});

test("Q instance is frozen", () => {
    const a = new Q(10n);
    throws(() => { a.n = 2n; }, TypeError);
    throws(() => { a.d = 3n; }, TypeError);
});


section("fromString()", (test) => {
    test("trim input", () => {
        const n = Q.fromString("  123   ");
        equal(n.n, 123n);
        equal(n.d, 1n);
    });

    test("positive integer", () => {
        const n = Q.fromString("123");
        equal(n.n, 123n);
        equal(n.d, 1n);
    });

    test("negative integer", () => {
        const n = Q.fromString("-69");
        equal(n.n, -69n);
        equal(n.d, 1n);
    });

    test("zero", () => {
        const n = Q.fromString("0");
        equal(n.n, 0n);
        equal(n.d, 1n);
    });

    test("positive decimal", () => {
        const n = Q.fromString("1.25");
        equal(n.n, 5n);
        equal(n.d, 4n);
    });

    test("negative decimal", () => {
        const n = Q.fromString("-0.25");
        equal(n.n, -1n);
        equal(n.d, 4n);
    });

    test("fraction", () => {
        const n = Q.fromString("3/5");
        equal(n.n, 3n);
        equal(n.d, 5n);
    });

    test("accepts whitespace around slash", () => {
        const n = Q.fromString("3 /   5");
        equal(n.n, 3n);
        equal(n.d, 5n);
    });

    test("normalizes negative denominator", () => {
        const n = Q.fromString("3/-5");
        equal(n.n, -3n);
        equal(n.d, 5n);
    });

    test("accepts decimal fraction", () => {
        const n = Q.fromString("1.5/2");
        equal(n.n, 3n);
        equal(n.d, 4n);
    });

    test("throws for division by zero", () => {
        throws(() => Q.fromString("2/0"), RangeError);
    });

    test("throws for decimal without leading digit", () => {
        throws(() => Q.fromString(".5"), SyntaxError);
    });

    test("throws for decimal without a fractional digit", () => {
        throws(() => Q.fromString("5."), SyntaxError);
    });

    test("throws for scientific notation", () => {
        throws(() => Q.fromString("1e-2"), SyntaxError);
        throws(() => Q.fromString("1e2"), SyntaxError);
        throws(() => Q.fromString("1E-2"), SyntaxError);
    });

    test("throws for multiple slashes", () => {
        throws(() => Q.fromString("2/3/4"), SyntaxError);
    });
});


section("Conversion", (test) => {
    test("float conversion", () => {
        equal(new Q(1n, 2n).toFloat(), 0.5);
        equal(new Q(3n, 2n).toFloat(), 1.5);
        equal(new Q(-1n, 4n).toFloat(), -0.25);
    });

    test("string conversion", () => {
        equal(new Q(3n, 1n).toString(), "3");
        equal(new Q(-3n, 1n).toString(), "-3");
        equal(new Q(3n, 5n).toString(), "3/5");
    });
});

section("Constant", (test) => {
    test("ZERO and ONE constants", () => {
        equal(Q.ZERO.equals(new Q(0n)), true);
        equal(Q.ONE.equals(new Q(1n)), true);
    });
});

section("reci()", (test) => {
    test("reciprocal of a positive rational", () => {
        equal(new Q(2n, 3n).reci().toString(), "3/2");
    });

    test("reciprocal of a negative rational", () => {
        equal(new Q(-2n, 3n).reci().toString(), "-3/2");
    });

    test("reciprocal of an integer", () => {
        equal(new Q(2n).reci().toString(), "1/2");
    });

    test("throws for zero", () => {
        throws(() => Q.ZERO.reci(), RangeError);
    });

    test("reciprocal of reciprocal returns the original rational", () => {
        const q = new Q(3n, 5n);
        equal(q.reci().reci().toString(), "3/5");
    });
});

section("max()", (test) => {
    test("two values", () => {
        equal(Q.max(q(2n), q(5n)).toString(), "5");
    });

    test("multiple values", () => {
        equal(Q.max(q(2n), q(5n), q(3n), q(1n)).toString(), "5");
    });

    test("negative values", () => {
        equal(Q.max(q(-5n), q(-2n), q(-8n)).toString(), "-2");
    });

    test("compares rationals exactly", () => {
        equal(Q.max(new Q(1n, 2n), new Q(2n, 3n)).toString(), "2/3");
    });

    test("equal values preserve first argument", () => {
        const a = new Q(1n, 2n);
        const b = new Q(2n, 4n);
        assert(Q.max(a, b) === a);
    });

    test("single value", () => {
        const a = q(7n);
        assert(Q.max(a) === a);
    });

    test("no values throws", () => {
        throws(() => Q.max(), RangeError);
    });
});

section("min()", (test) => {
    test("two values", () => {
        equal(Q.min(q(2n), q(5n)).toString(), "2");
    });

    test("multiple values", () => {
        equal(Q.min(q(2n), q(5n), q(3n), q(1n)).toString(), "1");
    });

    test("negative values", () => {
        equal(Q.min(q(-5n), q(-2n), q(-8n)).toString(), "-8");
    });

    test("compares rationals exactly", () => {
        equal(Q.min(new Q(1n, 2n), new Q(2n, 3n)).toString(), "1/2");
    });

    test("equal values preserve first argument", () => {
        const a = new Q(1n, 2n);
        const b = new Q(2n, 4n);
        assert(Q.min(a, b) === a);
    });

    test("single value", () => {
        const a = q(7n);
        assert(Q.min(a) === a);
    });

    test("no values throws", () => {
        throws(() => Q.min(), RangeError);
    });
});