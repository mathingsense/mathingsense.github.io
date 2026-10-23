import { Q } from "../lib/cas/Q.js";
import { div, Expr, mul, print, Product, simplify, SymbolExpr } from "../lib/cas/Expr.js";
import { initTestFile, section, test } from "./test-runner.js";
import { equal, throws } from "./test-utils.js";
import { Constant } from "../lib/cas/Expr.js";
import { SymbolManager } from "../lib/cas/Symbol.js";

initTestFile("Expr.test.js");

/**
 * @param {bigint} n
 * @param {bigint} [d]
 * @returns {Constant}
 */
const c = (n, d = 1n) => new Constant(new Q(n, d));
const symbols = new SymbolManager();
const x = symbols.expr("x");
const y = symbols.expr("y");

test("base equals() is abstract", () => {
    throws(() => new Expr().equals(x), /equals\(\) must be implemented/);
});

section("Constant", () => {
    test("equal rational values compare equal", () => {
        equal(c(1n, 2n).equals(c(2n, 4n)), true);
    });

    test("different values do not compare equal", () => {
        equal(c(1n).equals(c(2n)), false);
    });

    test("constants are not equal to other expression types", () => {
        equal(c(1n).equals(x), false);
    });

    test("prints integer and rational values", () => {
        equal(print(c(5n)), "5");
        equal(print(c(3n, 4n)), "3/4");
    });
});

section("SymbolExpr", () => {
    test("prints the symbol name", () => {
        equal(print(x), "x");
    });

    test("the same symbol object compares equal", () => {
        equal(x.equals(x), true);
    });

    test("symbols from the same manager are reused", () => {
        equal(x.equals(symbols.expr("x")), true);
    });

    test("different symbols are not equal", () => {
        equal(x.equals(y), false);
    });

    test("same name on a different Symbol object is not equal", () => {
        equal(
            x.equals(new SymbolExpr({ name: "x" })),
            false
        );
    });
});

section("mul()", () => {
    test("multiplies rational constants", () => {
        equal(print(mul(c(2n), c(3n))), "6");
    });

    test("multiplies rational coefficients", () => {
        equal(print(mul(c(1n, 2n), c(2n, 3n))), "1/3");
    });

    test("zero annihilates a product", () => {
        equal(print(mul(c(0n), x)), "0");
        equal(print(mul(x, c(0n))), "0");
    });

    test("multiplication by one preserves a symbol", () => {
        equal(mul(c(1n), x), x);
        equal(mul(x, c(1n)), x);
    });

    test("combines coefficients and repeated factors", () => {
        equal(print(mul(mul(c(2n), x), mul(c(3n), x))), "6 * x^2");
    });

    test("cancels factors with opposite exponents", () => {
        const result = mul(
            new Product(Q.ONE, [{ base: x, exponent: 1 }]),
            new Product(Q.ONE, [{ base: x, exponent: -1 }])
        );

        equal(print(result), "1");
    });

    test("sorts factors into a canonical order", () => {
        equal(print(mul(y, x)), print(mul(x, y)));
    });
});

section("div()", () => {
    test("divides rational constants", () => {
        equal(print(div(c(6n), c(3n))), "2");
    });

    test("supports rational quotients", () => {
        equal(print(div(c(1n, 2n), c(3n, 4n))), "2/3");
    });

    test("divides a symbol by a nonzero constant", () => {
        equal(print(div(x, c(2n))), "1/2 * x");
    });

    test("throws on division by zero", () => {
        throws(() => div(x, c(0n)), /division by zero/);
    });

    test("symbolic denominator remains explicitly unsupported", () => {
        throws(
            () => div(x, y),
            /div\(\) is not fully implemented/
        );
    });
});

section("print()", () => {
    test("prints products with coefficients", () => {
        equal(
            print(new Product(new Q(3n), [
                { base: x, exponent: 1 },
                { base: y, exponent: 1 },
            ])),
            "3 * x * y"
        );
    });

    test("omits coefficient one for a nontrivial product", () => {
        equal(
            print(new Product(Q.ONE, [
                { base: x, exponent: 1 },
                { base: y, exponent: 2 },
            ])),
            "x * y^2"
        );
    });

    test("prints negative and zero exponents", () => {
        equal(
            print(new Product(Q.ONE, [{ base: x, exponent: -2 }])),
            "x^-2"
        );
        equal(
            print(new Product(new Q(2n), [{ base: x, exponent: 0 }])),
            "2 * x^0"
        );
    });
});

section("simplify()", () => {
    test("leaves constants unchanged", () => {
        const value = c(7n);
        equal(simplify(value), value);
    });

    test("leaves symbols unchanged", () => {
        equal(simplify(x), x);
    });

    test("combines repeated factors in a product", () => {
        const result = simplify(new Product(Q.ONE, [
            { base: x, exponent: 1 },
            { base: x, exponent: 2 },
        ]));

        equal(print(result), "x^3");
    });

    test("removes factors whose combined exponent is zero", () => {
        const result = simplify(new Product(Q.ONE, [
            { base: x, exponent: 1 },
            { base: x, exponent: -1 },
        ]));

        equal(print(result), "1");
    });

    test("normalizes a zero-coefficient product", () => {
        const result = simplify(new Product(Q.ZERO, [
            { base: x, exponent: 1 },
        ]));

        equal(print(result), "0");
    });
});

section("Product.equals()", () => {
    test("equal normalized products compare equal", () => {
        const a = new Product(new Q(2n), [
            { base: x, exponent: 2 },
        ]);
        const b = new Product(new Q(2n), [
            { base: x, exponent: 2 },
        ]);

        equal(a.equals(b), true);
    });

    test("different coefficients are not equal", () => {
        const a = new Product(new Q(2n), [
            { base: x, exponent: 1 },
        ]);
        const b = new Product(new Q(3n), [
            { base: x, exponent: 1 },
        ]);

        equal(a.equals(b), false);
    });

    test("different factor exponents are not equal", () => {
        const a = new Product(Q.ONE, [
            { base: x, exponent: 1 },
        ]);
        const b = new Product(Q.ONE, [
            { base: x, exponent: 2 },
        ]);

        equal(a.equals(b), false);
    });

    test("factor order matters for structural equality", () => {
        const a = new Product(Q.ONE, [
            { base: x, exponent: 1 },
            { base: y, exponent: 1 },
        ]);
        const b = new Product(Q.ONE, [
            { base: y, exponent: 1 },
            { base: x, exponent: 1 },
        ]);

        equal(a.equals(b), false);
    });
});