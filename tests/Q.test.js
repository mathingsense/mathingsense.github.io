import { Q } from "../lib/cas/Q.js";
import { createTestGroup } from "./test-runner.js";
import { assertEqual, assertThrows, assertApprox } from "./test-utils.js";

const { test } = createTestGroup("Q.test.js");

test("constructs an integer", () => {
    const q = new Q(5n);

    assertEqual(q.toString(), "5");
});

test("adds two rational numbers", () => {
    const result = new Q(1n, 2n).add(new Q(1n, 3n));

    assertEqual(result.toString(), "5/6");
});

test("subtracts two rational numbers", () => {
    const result = new Q(3n, 4n).sub(new Q(1n, 4n));

    assertEqual(result.toString(), "1/2");
});

test("multiplies two rational numbers", () => {
    const result = new Q(2n, 3n).mul(new Q(3n, 4n));

    assertEqual(result.toString(), "1/2");
});

test("divides two rational numbers", () => {
    const result = new Q(1n, 2n).div(new Q(3n, 4n));

    assertEqual(result.toString(), "2/3");
});

test("converts to a floating-point number", () => {
    assertApprox(new Q(1n, 4n).toFloat(), 0.25);
});

test("compares rational numbers", () => {
    assertEqual(new Q(1n, 2n).compare(new Q(2n, 3n)), -1);
});

test("rejects division by zero", () => {
    assertThrows(() => new Q(1n, 2n).div(new Q(0n)));
});
