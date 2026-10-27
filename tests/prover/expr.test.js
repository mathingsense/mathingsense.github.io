import { variable, constant, type, pi, lam, app, freeVariables, substitute, betaReduce, reduceOnce, normalize, definitionallyEqual } from "../../lib/prover/core/expr.js";
import { initTestFile, section, test } from "../test-runner.js";
import { equal, throws, assert } from "../test-utils.js";

initTestFile("expr.test.js");

/**
 * @param {Set<string>} actual
 * @param {string[]} expected
 */
function equalSet(actual, expected) {
    assert(actual.size === expected.length);

    for (const value of expected) {
        assert(actual.has(value));
    }
}


test("variable constructs a Var expression", () => {
    const expr = variable("x");

    equal(expr.kind, "Var");
    equal(expr.name, "x");
});

test("constant constructs a Const expression", () => {
    const expr = constant("Nat");

    equal(expr.kind, "Const");
    equal(expr.name, "Nat");
});

test("type constructs a Type expression", () => {
    const expr = type(0);

    equal(expr.kind, "Type");
    equal(expr.level, 0);

    equal(type(1).level, 1);
    equal(type(2).level, 2);
});

test("type rejects invalid universe levels", () => {
    throws(() => type(-1), /universe level/i);
    throws(() => type(1.5), /universe level/i);
    throws(() => type(NaN), /universe level/i);
});

test("pi constructs a dependent function type", () => {
    const domain = constant("Nat");
    const codomain = constant("Nat");
    const expr = pi("n", domain, codomain);

    equal(expr.kind, "Pi");
    equal(expr.name, "n");
    assert(expr.domain === domain);
    assert(expr.codomain === codomain);
});

test("lam constructs a typed lambda expression", () => {
    const domain = constant("Nat");
    const body = variable("n");
    const expr = lam("n", domain, body);

    equal(expr.kind, "Lam");
    equal(expr.name, "n");
    assert(expr.domain === domain);
    assert(expr.body === body);
});

test("app constructs a function application", () => {
    const fn = constant("succ");
    const arg = constant("zero");
    const expr = app(fn, arg);

    equal(expr.kind, "App");
    assert(expr.fn === fn);
    assert(expr.arg === arg);
});

test("expressions can be nested", () => {
    const Nat = constant("Nat");
    const zero = constant("zero");

    const identity = lam("n", Nat, variable("n"));
    const result = app(identity, zero);

    equal(result.kind, "App");
    equal(result.fn.kind, "Lam");
    equal(result.fn.body.kind, "Var");
    equal(result.fn.body.name, "n");
    equal(result.arg.name, "zero");
});

test("dependent function types can reference their bound variable", () => {
    const Nat = constant("Nat");

    const expr = pi(
        "n",
        Nat,
        pi("m", Nat, Nat)
    );

    equal(expr.kind, "Pi");
    equal(expr.name, "n");
    equal(expr.codomain.kind, "Pi");
    equal(expr.codomain.name, "m");
    assert(expr.domain === Nat);
    assert(expr.codomain.domain === Nat);
    assert(expr.codomain.codomain === Nat);
});


section("freeVariables()", () => {
    test("finds a free variable", () => {
        equalSet(freeVariables(variable("x")), ["x"]);
    });

    test("ignores constants and universes", () => {
        equalSet(freeVariables(constant("Nat")), []);
        equalSet(freeVariables(type(0)), []);
    });

    test("excludes a lambda-bound variable", () => {
        const Nat = constant("Nat");
        const identity = lam("n", Nat, variable("n"));

        equalSet(freeVariables(identity), []);
    });

    test("includes free variables in a lambda domain", () => {
        const expr = lam("x", variable("A"), variable("x"));

        equalSet(freeVariables(expr), ["A"]);
    });

    test("respects Pi binding", () => {
        const expr = pi("x", variable("A"), variable("x"));

        equalSet(freeVariables(expr), ["A"]);
    });

    test("combines variables from an application", () => {
        const expr = app(variable("f"), variable("x"));

        equalSet(freeVariables(expr), ["f", "x"]);
    });
});


section("substitute()", () => {
    test("replaces a matching variable", () => {
        const result = substitute(
            variable("x"),
            "x",
            constant("zero")
        );

        assert(
            result.kind === "Const" &&
            result.name === "zero"
        );
    });

    test("leaves a different variable unchanged", () => {
        const result = substitute(
            variable("y"),
            "x",
            constant("zero")
        );

        assert(
            result.kind === "Var" &&
            result.name === "y"
        );
    });

    test("substitutes in both sides of an application", () => {
        const result = substitute(
            app(variable("x"), variable("y")),
            "x",
            constant("zero")
        );

        assert(result.kind === "App");
        assert(result.fn.kind === "Const");
        equal(result.fn.name, "zero");
        assert(result.arg.kind === "Var");
        equal(result.arg.name, "y");
    });


    test("substitutes in the body when the binder name differs", () => {
        const expr = lam("y", constant("Nat"), variable("x"));
        const result = substitute(expr, "x", constant("zero"));

        assert(result.kind === "Lam");
        equal(result.name, "y");
        assert(result.body.kind === "Const");
        equal(result.body.name, "zero");
    });


    test("does not substitute beneath a shadowing lambda", () => {
        const expr = lam("x", constant("Nat"), variable("x"));
        const result = substitute(expr, "x", constant("zero"));

        assert(result.kind === "Lam");
        assert(result.body.kind === "Var");
        equal(result.body.name, "x");
    });

    test("avoids capture under a lambda", () => {
        const expr = lam("x", constant("Nat"), variable("y"));
        const result = substitute(expr, "y", variable("x"));

        assert(result.kind === "Lam");
        assert(result.name !== "x");
        assert(result.body.kind === "Var");
        equal(result.body.name, "x");
        assert(freeVariables(result).has("x"));
    });


    test("substitutes in the codomain when the binder name differs", () => {
        const expr = pi("y", constant("Nat"), variable("x"));
        const result = substitute(expr, "x", constant("zero"));

        assert(result.kind === "Pi");
        equal(result.name, "y");
        assert(result.codomain.kind === "Const");
        equal(result.codomain.name, "zero");
    });


    test("avoids capture under a Pi", () => {
        const expr = pi("x", constant("Nat"), variable("y"));
        const result = substitute(expr, "y", variable("x"));

        assert(result.kind === "Pi");
        assert(result.name !== "x");
        assert(result.codomain.kind === "Var");
        equal(result.codomain.name, "x");
        assert(freeVariables(result).has("x"));
    });

    test("substitutes in a lambda domain", () => {
        const expr = lam("y", variable("x"), variable("y"));
        const result = substitute(expr, "x", constant("Nat"));

        assert(result.kind === "Lam");
        assert(result.domain.kind === "Const");
        equal(result.domain.name, "Nat");
        assert(result.body.kind === "Var");
        equal(result.body.name, "y");
    });
});


section("betaReduce()", () => {
    test("reduces an identity function application", () => {
        const expr = app(
            lam("n", constant("Nat"), variable("n")),
            constant("zero")
        );

        const result = betaReduce(expr);

        assert(result !== null);
        assert(result.kind === "Const");
        equal(result.name, "zero");
    });

    test("reduces a constant function application", () => {
        const expr = app(
            lam("x", constant("Nat"), variable("y")),
            constant("zero")
        );

        const result = betaReduce(expr);

        assert(result !== null);
        assert(result.kind === "Var");
        equal(result.name, "y");
    });

    test("returns null for a non-redex", () => {
        const expr = app(
            variable("f"),
            constant("zero")
        );

        equal(betaReduce(expr), null);
    });

    test("preserves free variables during reduction", () => {
        const expr = app(
            lam("y", constant("Nat"), variable("x")),
            variable("y")
        );

        const result = betaReduce(expr);

        assert(result !== null);
        assert(result.kind === "Var");
        equal(result.name, "x");
    });
});


section("reduceOnce", () => {
    test("reduces a beta-redex at the root", () => {
        const expr = app(
            lam("x", constant("Nat"), variable("x")),
            constant("zero")
        );

        const result = reduceOnce(expr);

        assert(result !== null);
        assert(result.kind === "Const");
        equal(result.name, "zero");
    });

    test("reduces inside the function of an application", () => {
        const expr = app(
            app(
                lam("x", constant("Nat"), variable("x")),
                variable("f")
            ),
            constant("zero")
        );

        const result = reduceOnce(expr);

        assert(result !== null);
        assert(result.kind === "App");
        assert(result.fn.kind === "Var");
        equal(result.fn.name, "f");
        assert(result.arg.kind === "Const");
        equal(result.arg.name, "zero");
    });

    test("reduces inside the argument of an application", () => {
        const expr = app(
            variable("f"),
            app(
                lam("x", constant("Nat"), variable("x")),
                constant("zero")
            )
        );

        const result = reduceOnce(expr);

        assert(result !== null);
        assert(result.kind === "App");
        assert(result.arg.kind === "Const");
        equal(result.arg.name, "zero");
    });

    test("returns null when no reduction is possible", () => {
        equal(reduceOnce(variable("x")), null);
    });
});



section("normalize()", () => {
    test("normalizes an identity application", () => {
        const expr = app(
            lam("x", constant("Nat"), variable("x")),
            constant("zero")
        );

        const result = normalize(expr);

        assert(result.kind === "Const");
        equal(result.name, "zero");
    });

    test("normalizes nested applications", () => {
        const expr = app(
            lam(
                "x",
                constant("Nat"),
                app(
                    lam("y", constant("Nat"), variable("y")),
                    variable("x")
                )
            ),
            constant("zero")
        );

        const result = normalize(expr);

        assert(result.kind === "Const");
        equal(result.name, "zero");
    });

    test("leaves normal forms unchanged", () => {
        const expr = app(variable("f"), constant("zero"));

        const result = normalize(expr);

        assert(result.kind === "App");
        assert(result.fn.kind === "Var");
        equal(result.fn.name, "f");
        assert(result.arg.kind === "Const");
        equal(result.arg.name, "zero");
    });

    test("rejects an invalid step limit", () => {
        throws(() => normalize(variable("x"), -1), Error);
    });
});


section("definitionallyEqual()", () => {
    test("recognizes a beta-reduction", () => {
        const expr = app(
            lam("x", constant("Nat"), variable("x")),
            constant("zero")
        );

        assert(definitionallyEqual(expr, constant("zero")));
    });

    test("recognizes renamed bound variables", () => {
        const a = lam("x", constant("Nat"), variable("x"));
        const b = lam("y", constant("Nat"), variable("y"));

        assert(definitionallyEqual(a, b));
    });

    test("distinguishes different free variables", () => {
        assert(!definitionallyEqual(variable("x"), variable("y")));
    });

    test("distinguishes different constants", () => {
        assert(!definitionallyEqual(
            constant("zero"),
            constant("Nat")
        ));
    });

    test("recognizes renamed binders in Pi types", () => {
        const a = pi("x", constant("Nat"), variable("x"));
        const b = pi("y", constant("Nat"), variable("y"));

        assert(definitionallyEqual(a, b));
    });

    test("handles nested shadowing", () => {
        const a = lam(
            "x",
            constant("Nat"),
            lam("x", constant("Nat"), variable("x"))
        );

        const b = lam(
            "y",
            constant("Nat"),
            lam("z", constant("Nat"), variable("z"))
        );

        assert(definitionallyEqual(a, b));
    });
});