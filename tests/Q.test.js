import { gcd, Q } from "../lib/cas/Q.js";
import { initTestFile } from "./test-runner.js";
import { equal, throws, assert } from "./test-utils.js";

const { test } = initTestFile("Q.test.js");

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

test("ZERO and ONE constants", () => {
    equal(Q.ZERO.equals(new Q(0n)), true);
    equal(Q.ONE.equals(new Q(1n)), true);
});

test("Q instance is frozen", () => {
    const a = new Q(10n);
    throws(() => {a.n = 2n;}, TypeError);
    throws(() => {a.d = 3n;}, TypeError);
});