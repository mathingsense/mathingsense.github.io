/**
 * Assert that two values are strictly equal.
 * @param {unknown} actual
 * @param {unknown} expected
 */
export function equal(actual, expected) {
    if (!Object.is(actual, expected)) {
        throw new Error(
            `expected ${String(expected)} (${typeof expected}), ` +
            `received ${String(actual)} (${typeof actual})`
        );
    }
}

/**
 * Assert that a condition is true.
 * @param {boolean} condition
 * @param {string} [message]
 */
export function assert(condition, message = "assertion failed") {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * @param {() => unknown} fn
 * @param {RegExp | (new (...args: any[]) => Error)} expected
 */
export function throws(fn, expected) {
    let thrown = false;
    let error;

    try {
        fn();
    } catch (e) {
        thrown = true;
        error = e;
    }

    if (!thrown) {
        throw new Error("expected function to throw an error");
    }

    if (expected instanceof RegExp) {
        const message = error instanceof Error ? error.message : String(error);
        if (!expected.test(message)) {
            throw new Error(`error message "${message}" did not match ${expected}`);
        }
    } else if (!(error instanceof expected)) {
        const actual = error?.constructor?.name ?? typeof error;
        throw new Error(`expected ${expected.name} but got ${actual}`);
    }
}

/**
 * Assert that a numeric result is within a tolerance.
 * @param {number} actual
 * @param {number} expected
 * @param {number} [tolerance]
 */
export function approx(
    actual,
    expected,
    tolerance = 1e-10
) {
    if (
        !Number.isFinite(actual) ||
        Math.abs(actual - expected) > tolerance
    ) {
        throw new Error(
            `expected approximately ${expected}, received ${actual}`
        );
    }
}