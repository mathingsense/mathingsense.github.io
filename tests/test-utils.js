/**
 * Assert that two values are strictly equal.
 * @param {unknown} actual
 * @param {unknown} expected
 */
export function equal(actual, expected) {
    if (!Object.is(actual, expected)) {
        throw new Error(
            `expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

/**
 * Assert that a condition is true.
 * @param {unknown} condition
 * @param {string} [message]
 */
export function assert(condition, message = "assertion failed") {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * @param {() => unknown} fn
 * @param {RegExp} [expectedMessage]
 */
export function throws(fn, expectedMessage) {
    let thrown = false;

    try {
        fn();
    } catch (error) {
        thrown = true;

        if (
            expectedMessage &&
            !expectedMessage.test(
                error instanceof Error ? error.message : String(error)
            )
        ) {
            throw new Error(
                `Error did not match ${expectedMessage}`
            );
        }
    }

    if (!thrown) {
        throw new Error("expected function to throw an error");
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