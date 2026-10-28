import { Q } from "../lib/cas/Q.js";
import { Interval } from "../lib/cas/Interval.js";
import { initTestFile } from "./test-runner.js";
import { equal, throws, assert } from "./test-utils.js";

const { test, section } = initTestFile("Interval.test.js");

/**
 * @param {bigint} n
 * @param {bigint} d
 * @returns {Q}
 */
const q = (n, d = 1n) => new Q(n, d);

/**
 * @param {Q} a
 * @param {Q} b
 * @returns {Interval}
 */
const I = (a, b) => new Interval(a, b);

/**
 * @param {bigint} a
 * @param {bigint} b
 * @param {bigint} c
 * @param {bigint} d
 * @returns {Interval}
 */
const interval = (a, b, c = 1n, d = 1n) =>
    I(q(a, b), q(c, d));

test("constructor accepts valid intervals", () => {
    equal(interval(1n, 1n, 3n, 1n).lower.toString(), "1");
    equal(interval(1n, 1n, 3n, 1n).upper.toString(), "3");
    equal(interval(-2n, 1n, 5n, 1n).lower.toString(), "-2");
});

test("constructor accepts point intervals", () => {
    const a = interval(2n, 1n, 2n, 1n);
    assert(a.isPoint());
    equal(a.lower.toString(), "2");
    equal(a.upper.toString(), "2");
});

test("constructor rejects reversed bounds", () => {
    throws(
        () => interval(3n, 1n, 1n, 1n),
        /lower bound must be <= upper bound/i
    );
});

test("point()", () => {
    const a = Interval.point(q(3n, 4n));
    assert(a.isPoint());
    equal(a.lower.toString(), "3/4");
    equal(a.upper.toString(), "3/4");
});

test("equals()", () => {
    equal(
        interval(1n, 2n, 3n, 2n).equals(
            interval(2n, 4n, 6n, 4n)),
        true
    );

    equal(
        interval(1n, 1n, 2n, 1n).equals(
            interval(1n, 1n, 3n, 1n)),
        false);
});

test("isPoint()", () => {
    assert(interval(2n, 3n, 4n, 6n).isPoint());
    assert(!interval(1n, 1n, 2n, 1n).isPoint());
    assert(interval(0n, 1n, 0n, 1n).isPoint());
});

test("contains()", () => {
    const a = interval(1n, 1n, 3n, 1n);

    assert(a.contains(q(1n)));
    assert(a.contains(q(2n)));
    assert(a.contains(q(3n)));

    assert(!a.contains(q(0n)));
    assert(!a.contains(q(4n)));
    assert(a.contains(q(3n, 2n)));
});

test("containsZero()", () => {
    assert(interval(-1n, 1n, 1n, 1n).containsZero());
    assert(interval(0n, 1n, 2n, 1n).containsZero());
    assert(interval(-2n, 1n, 0n, 1n).containsZero());

    assert(!interval(1n, 1n, 2n, 1n).containsZero());
    assert(!interval(-2n, 1n, -1n, 1n).containsZero());
});

test("includes()", () => {
    const a = interval(1n, 1n, 5n, 1n);

    assert(a.includes(interval(2n, 1n, 4n, 1n)));
    assert(a.includes(interval(1n, 1n, 5n, 1n)));
    assert(a.includes(interval(1n, 1n, 3n, 1n)));
    assert(a.includes(interval(3n, 1n, 5n, 1n)));

    assert(!a.includes(interval(0n, 1n, 4n, 1n)));
    assert(!a.includes(interval(2n, 1n, 6n, 1n)));
    assert(!a.includes(interval(0n, 1n, 6n, 1n)));
    assert(!a.includes(interval(6n, 1n, 7n, 1n)));
});


section("fromString()", (test) => {
    test("integer bounds", () => {
        const a = Interval.fromString("[1,2]");
        assert(a.lower.equals(q(1n)));
        assert(a.upper.equals(q(2n)));
    });

    test("fraction bounds", () => {
        const a = Interval.fromString("[1/2, 3/4]");
        assert(a.lower.equals(q(1n, 2n)));
        assert(a.upper.equals(q(3n, 4n)));
    });

    test("singleton fraction", () => {
        const a = Interval.fromString("6/7");
        assert(a.lower.equals(q(6n, 7n)));
        assert(a.upper.equals(q(6n, 7n)));
    });

    test("singleton decimal", () => {
        const a = Interval.fromString("6.9");
        assert(a.lower.equals(q(69n, 10n)));
        assert(a.upper.equals(q(69n, 10n)));
    });

    test("mixed bounds", () => {
        const a = Interval.fromString("[-1/2, 4.5]");
        assert(a.lower.equals(q(-1n, 2n)));
        assert(a.upper.equals(q(9n, 2n)));
    });
});


section("arithmetic", (test) => {
    test("additions", () => {
        const a = interval(1n, 2n, 5n, 2n);
        const b = interval(-1n, 2n, 4n, 1n);
        const result = a.add(b);

        assert(result.equals(interval(0n, 1n, 13n, 2n)));

        assert(
            interval(-2n, 1n, 1n, 1n)
                .add(interval(1n, 1n, 3n, 1n))
                .equals(interval(-1n, 1n, 4n, 1n))
        );
    });

    test("subtractions", () => {
        const a = interval(1n, 1n, 2n, 1n);
        const b = interval(3n, 1n, 4n, 1n);

        assert(a.sub(b).equals(interval(-3n, 1n, -1n, 1n)));

        assert(
            interval(1n, 1n, 3n, 1n)
                .sub(interval(1n, 1n, 2n, 1n))
                .equals(interval(-1n, 1n, 2n, 1n))
        );
    });

    test("negations", () => {
        assert(
            interval(1n, 1n, 3n, 1n)
                .neg()
                .equals(interval(-3n, 1n, -1n, 1n))
        );

        assert(
            interval(-3n, 1n, -1n, 1n)
                .neg()
                .equals(interval(1n, 1n, 3n, 1n))
        );
    });

    test("multiplications", () => {
        assert(
            interval(1n, 1n, 2n, 1n)
                .mul(interval(3n, 1n, 4n, 1n))
                .equals(interval(3n, 1n, 8n, 1n))
        );

        assert(
            interval(-2n, 1n, -1n, 1n)
                .mul(interval(3n, 1n, 4n, 1n))
                .equals(interval(-8n, 1n, -3n, 1n))
        );

        assert(
            interval(-2n, 1n, 3n, 1n)
                .mul(interval(-4n, 1n, 5n, 1n))
                .equals(interval(-12n, 1n, 15n, 1n))
        );

        assert(
            interval(-2n, 1n, 3n, 1n)
                .mul(interval(-4n, 1n, -1n, 1n))
                .equals(interval(-12n, 1n, 8n, 1n))
        );

        assert(
            interval(0n, 1n, 0n, 1n)
                .mul(interval(-5n, 1n, 7n, 1n))
                .equals(interval(0n, 1n, 0n, 1n))
        );
    });
});

test("divisions", () => {
    assert(
        interval(1n, 1n, 2n, 1n)
            .div(interval(3n, 1n, 4n, 1n))
            .equals(interval(1n, 4n, 2n, 3n))
    );

    assert(
        interval(1n, 1n, 2n, 1n)
            .div(interval(-4n, 1n, -2n, 1n))
            .equals(interval(-1n, 1n, -1n, 4n))
    );

    assert(
        interval(-2n, 1n, 3n, 1n)
            .div(interval(2n, 1n, 4n, 1n))
            .equals(interval(-1n, 1n, 3n, 2n))
    );

    assert(
        interval(2n, 1n, 2n, 1n)
            .div(interval(4n, 1n, 4n, 1n))
            .equals(Interval.point(q(1n, 2n)))
    );
});

test("division rejects intervals containing zero", () => {
    const a = interval(1n, 1n, 2n, 1n);

    throws(() => a.div(interval(-1n, 1n, 1n, 1n)), /zero/i);
    throws(() => a.div(interval(0n, 1n, 2n, 1n)), /zero/i);
    throws(() => a.div(interval(-2n, 1n, 0n, 1n)), /zero/i);
    throws(() => a.div(Interval.point(q(0n))), /zero/i);
});

test("arithmetic results have ordered bounds", () => {
    const intervals = [
        interval(1n, 1n, 2n, 1n).add(interval(3n, 1n, 4n, 1n)),
        interval(1n, 1n, 2n, 1n).sub(interval(3n, 1n, 4n, 1n)),
        interval(-2n, 1n, 3n, 1n).mul(interval(-4n, 1n, 5n, 1n)),
        interval(1n, 1n, 2n, 1n).div(interval(3n, 1n, 4n, 1n)),
    ];

    for (const result of intervals) {
        assert(
            result.lower.compare(result.upper) <= 0,
            "Interval bounds must be ordered"
        );
    }
});

test("large BigInt endpoints remain exact", () => {
    const n = 10n ** 100n;
    const a = I(q(n), q(n + 1n));
    const b = I(q(2n), q(3n));

    assert(
        a.add(b).equals(I(q(n + 2n), q(n + 4n)))
    );

    assert(
        a.mul(b).equals(I(q(2n * n), q(3n * (n + 1n))))
    );
});

section("Algebraic properties", (test) => {
    test("addition is commutative", () => {
        const a = interval(-2n, 1n, 3n, 1n);
        const b = interval(1n, 2n, 5n, 2n);

        assert(a.add(b).equals(b.add(a)));
    });

    test("multiplication is commutative", () => {
        const a = interval(-2n, 1n, 3n, 1n);
        const b = interval(1n, 2n, 5n, 2n);

        assert(a.mul(b).equals(b.mul(a)));
    });

    test("double negation returns the original interval", () => {
        const a = interval(-2n, 3n, 5n, 3n);

        assert(a.neg().neg().equals(a));
    });

    test("adding zero interval preserves the interval", () => {
        const a = interval(-2n, 3n, 5n, 3n);
        const zero = Interval.point(q(0n));

        assert(a.add(zero).equals(a));
    });

    test("multiplying by one interval preserves the interval", () => {
        const a = interval(-2n, 3n, 5n, 3n);
        const one = Interval.point(q(1n));

        assert(a.mul(one).equals(a));
    });
});

section("Constants", (test) => {
    test("ZERO and ONE constants", () => {
        assert(Interval.ZERO.isPoint());
        equal(Interval.ZERO.lower.toString(), "0");
        equal(Interval.ZERO.upper.toString(), "0");

        assert(Interval.ONE.isPoint());
        equal(Interval.ONE.lower.toString(), "1");
        equal(Interval.ONE.upper.toString(), "1");
    });

    test("ZERO is the additive identity", () => {
        const a = interval(-2n, 1n, 3n, 1n);
        const result = a.add(Interval.ZERO);

        equal(result.lower.toString(), a.lower.toString());
        equal(result.upper.toString(), a.upper.toString());
    });

    test("ONE is the multiplicative identity", () => {
        const a = interval(-2n, 1n, 3n, 1n);
        const result = a.mul(Interval.ONE);

        equal(result.lower.toString(), a.lower.toString());
        equal(result.upper.toString(), a.upper.toString());
    });
});

section("lt()", (test) => {
    test("returns true when this interval is strictly below the other", () => {
        assert(interval(1n, 1n, 2n, 1n).lt(interval(3n, 1n, 4n, 1n)));
    });

    test("returns false when intervals share an endpoint", () => {
        assert(!interval(1n, 1n, 2n, 1n).lt(interval(2n, 1n, 4n, 1n)));
    });

    test("returns false when intervals overlap", () => {
        assert(!interval(1n, 1n, 3n, 1n).lt(interval(2n, 1n, 4n, 1n)));
    });

    test("returns false when this interval is above the other", () => {
        assert(!interval(3n, 1n, 4n, 1n).lt(interval(1n, 1n, 2n, 1n)));
    });

    test("handles point intervals", () => {
        assert(interval(1n, 1n, 1n, 1n).lt(interval(2n, 1n, 2n, 1n)));
        assert(!interval(1n, 1n, 1n, 1n).lt(interval(1n, 1n, 1n, 1n)));
    });

    test("handles negative intervals", () => {
        assert(interval(-4n, 1n, -3n, 1n).lt(interval(-2n, 1n, -1n, 1n)));
    });

    test("handles rational endpoints", () => {
        assert(interval(1n, 2n, 2n, 3n).lt(interval(3n, 4n, 5n, 2n)));
    });
});

section("reci()", (test) => {
    test("reciprocal of a positive interval", () => {
        const result = interval(2n, 1n, 4n, 1n).reci();
        equal(result.lower.toString(), "1/4");
        equal(result.upper.toString(), "1/2");
    });

    test("reciprocal of a negative interval", () => {
        const result = interval(-4n, 1n, -2n, 1n).reci();
        equal(result.lower.toString(), "-1/2");
        equal(result.upper.toString(), "-1/4");
    });

    test("reciprocal of a positive point interval", () => {
        const result = interval(2n, 1n, 2n, 1n).reci();
        equal(result.lower.toString(), "1/2");
        equal(result.upper.toString(), "1/2");
    });

    test("reciprocal of a negative point interval", () => {
        const result = interval(-2n, 1n, -2n, 1n).reci();
        equal(result.lower.toString(), "-1/2");
        equal(result.upper.toString(), "-1/2");
    });

    test("throws when the interval contains zero", () => {
        throws(() => interval(-1n, 1n, 1n, 1n).reci(), RangeError);
    });

    test("throws when zero is the lower endpoint", () => {
        throws(() => interval(0n, 1n, 2n, 1n).reci(), RangeError);
    });

    test("throws when zero is the upper endpoint", () => {
        throws(() => interval(-2n, 1n, 0n, 1n).reci(), RangeError);
    });
});

section("length()", (test) => {
    test("length of a positive interval", () => {
        equal(interval(2n, 1n, 5n, 1n).length().toString(), "3");
    });

    test("length of a negative interval", () => {
        equal(interval(-5n, 1n, -2n, 1n).length().toString(), "3");
    });

    test("length of an interval crossing zero", () => {
        equal(interval(-3n, 1n, 2n, 1n).length().toString(), "5");
    });

    test("zero for a point interval", () => {
        equal(interval(4n, 1n, 4n, 1n).length().toString(), "0");
    });

    test("supports rational endpoints", () => {
        equal(interval(1n, 2n, 3n, 2n).length().toString(), "1");
    });
});

section("abs()", (test) => {
    test("returns the same interval when entirely positive", () => {
        const i = interval(2n, 1n, 5n, 1n);
        assert(Interval.abs(i) === i);
    });

    test("negates an interval when entirely negative", () => {
        const result = Interval.abs(interval(-5n, 1n, -2n, 1n));
        equal(result.lower.toString(), "2");
        equal(result.upper.toString(), "5");
    });

    test("handles an interval crossing zero", () => {
        const result = Interval.abs(interval(-3n, 1n, 5n, 1n));
        equal(result.lower.toString(), "0");
        equal(result.upper.toString(), "5");
    });

    test("handles an interval with a larger negative magnitude", () => {
        const result = Interval.abs(interval(-5n, 1n, 2n, 1n));
        equal(result.lower.toString(), "0");
        equal(result.upper.toString(), "5");
    });

    test("handles zero as an endpoint", () => {
        const result = Interval.abs(interval(-3n, 1n, 0n, 1n));
        equal(result.lower.toString(), "0");
        equal(result.upper.toString(), "3");
    });

    test("handles a point interval at zero", () => {
        const result = Interval.abs(Interval.ZERO);
        equal(result.lower.toString(), "0");
        equal(result.upper.toString(), "0");
    });

    test("handles a point interval at a negative value", () => {
        const result = Interval.abs(Interval.point(new Q(-3n)));
        equal(result.lower.toString(), "3");
        equal(result.upper.toString(), "3");
    });
});

section("max()", (test) => {
    test("two intervals", () => {
        const r = Interval.max(interval(1n, 1n, 4n, 1n), interval(3n, 1n, 6n, 1n));
        equal(r.lower.toString(), "3");
        equal(r.upper.toString(), "6");
    });

    test("multiple intervals", () => {
        const r = Interval.max(
            interval(1n, 1n, 4n, 1n),
            interval(3n, 1n, 6n, 1n),
            interval(2n, 1n, 8n, 1n)
        );
        equal(r.lower.toString(), "3");
        equal(r.upper.toString(), "8");
    });

    test("single interval", () => {
        const r = Interval.max(interval(-2n, 1n, 5n, 1n));
        equal(r.lower.toString(), "-2");
        equal(r.upper.toString(), "5");
    });

    test("no intervals throws", () => {
        throws(() => Interval.max(), RangeError);
    });

    test("negative intervals", () => {
        const r = Interval.max(interval(-5n, 1n, -2n, 1n), interval(-3n, 1n, -1n, 1n));
        equal(r.lower.toString(), "-3");
        equal(r.upper.toString(), "-1");
    });
});

section("min()", (test) => {
    test("two intervals", () => {
        const r = Interval.min(interval(1n, 1n, 4n, 1n), interval(3n, 1n, 6n, 1n));
        equal(r.lower.toString(), "1");
        equal(r.upper.toString(), "4");
    });

    test("multiple intervals", () => {
        const r = Interval.min(
            interval(1n, 1n, 4n, 1n),
            interval(3n, 1n, 6n, 1n),
            interval(-2n, 1n, 8n, 1n)
        );
        equal(r.lower.toString(), "-2");
        equal(r.upper.toString(), "4");
    });

    test("single interval", () => {
        const r = Interval.min(interval(-2n, 1n, 5n, 1n));
        equal(r.lower.toString(), "-2");
        equal(r.upper.toString(), "5");
    });

    test("no intervals throws", () => {
        throws(() => Interval.min(), RangeError);
    });

    test("negative intervals", () => {
        const r = Interval.min(interval(-5n, 1n, -2n, 1n), interval(-3n, 1n, -1n, 1n));
        equal(r.lower.toString(), "-5");
        equal(r.upper.toString(), "-2");
    });
});

section("isIntersect()", (test) => {
    test("disjoint intervals", () => {
        assert(!Interval.isIntersect(interval(1n, 1n, 2n, 1n), interval(3n, 1n, 4n, 1n)));
    });

    test("one interval contains the other", () => {
        assert(Interval.isIntersect(interval(1n, 1n, 5n, 1n), interval(2n, 1n, 3n, 1n)));
    });

    test("identical intervals", () => {
        assert(Interval.isIntersect(interval(1n, 1n, 3n, 1n), interval(1n, 1n, 3n, 1n)));
    });

    test("point intervals at same value", () => {
        assert(Interval.isIntersect(interval(2n, 1n, 2n, 1n), interval(2n, 1n, 2n, 1n)));
    });

    test("point interval outside another interval", () => {
        assert(!Interval.isIntersect(interval(3n, 1n, 3n, 1n), interval(1n, 1n, 2n, 1n)));
    });

    test("two overlapping intervals", () => {
        assert(Interval.isIntersect(
            interval(1n, 1n, 4n, 1n),
            interval(3n, 1n, 6n, 1n)
        ));
    });

    test("multiple intervals with common intersection", () => {
        assert(Interval.isIntersect(
            interval(1n, 1n, 5n, 1n),
            interval(2n, 1n, 6n, 1n),
            interval(3n, 1n, 4n, 1n)
        ));
    });

    test("multiple intervals without common intersection", () => {
        assert(!Interval.isIntersect(
            interval(1n, 1n, 4n, 1n),
            interval(3n, 1n, 6n, 1n),
            interval(5n, 1n, 8n, 1n)
        ));
    });

    test("touching at a common endpoint", () => {
        assert(Interval.isIntersect(
            interval(1n, 1n, 3n, 1n),
            interval(2n, 1n, 4n, 1n),
            interval(3n, 1n, 5n, 1n)
        ));
    });

    test("single interval", () => {
        assert(Interval.isIntersect(interval(1n, 1n, 3n, 1n)));
    });

    test("no intervals throws", () => {
        throws(() => Interval.isIntersect(), RangeError);
    });
});

section("intersect()", (test) => {
    test("identical intervals", () => {
        const r = Interval.intersect(interval(1n, 1n, 3n, 1n), interval(1n, 1n, 3n, 1n));
        equal(r.lower.toString(), "1");
        equal(r.upper.toString(), "3");
    });

    test("point interval inside another interval", () => {
        const r = Interval.intersect(interval(2n, 1n, 2n, 1n), interval(1n, 1n, 3n, 1n));
        equal(r.lower.toString(), "2");
        equal(r.upper.toString(), "2");
    });

    test("two overlapping intervals", () => {
        const r = Interval.intersect(
            interval(1n, 1n, 4n, 1n),
            interval(3n, 1n, 6n, 1n)
        );
        equal(r.lower.toString(), "3");
        equal(r.upper.toString(), "4");
    });

    test("multiple intervals", () => {
        const r = Interval.intersect(
            interval(1n, 1n, 5n, 1n),
            interval(2n, 1n, 6n, 1n),
            interval(3n, 1n, 4n, 1n)
        );
        equal(r.lower.toString(), "3");
        equal(r.upper.toString(), "4");
    });

    test("intersection is a single point", () => {
        const r = Interval.intersect(
            interval(1n, 1n, 3n, 1n),
            interval(2n, 1n, 4n, 1n),
            interval(3n, 1n, 5n, 1n)
        );
        equal(r.lower.toString(), "3");
        equal(r.upper.toString(), "3");
    });

    test("single interval", () => {
        const r = Interval.intersect(interval(1n, 1n, 3n, 1n));
        equal(r.lower.toString(), "1");
        equal(r.upper.toString(), "3");
    });

    test("disjoint intervals throw", () => {
        throws(
            () => Interval.intersect(
                interval(1n, 1n, 2n, 1n),
                interval(3n, 1n, 4n, 1n)
            ),
            RangeError
        );
    });

    test("multiple intervals without common intersection throw", () => {
        throws(
            () => Interval.intersect(
                interval(1n, 1n, 4n, 1n),
                interval(3n, 1n, 6n, 1n),
                interval(5n, 1n, 8n, 1n)
            ),
            RangeError
        );
    });

    test("no intervals throws", () => {
        throws(() => Interval.intersect(), RangeError);
    });
});