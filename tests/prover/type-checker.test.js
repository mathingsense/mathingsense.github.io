import { checkType, inferType } from "../../lib/prover/core/type-checker.js";
import { variable, constant, type, pi, lam, app } from "../../lib/prover/core/expr.js";
import { extendContext, declareConstant } from "../../lib/prover/core/context.js";
import { initTestFile, section, test } from "../test-runner.js";
import { equal, throws, assert } from "../test-utils.js";
import { parse } from "../../lib/prover/core/parser.js";

initTestFile("type-checker.test.js");

section("inferType: Var", () => {
    test("infers a variable's declared type", () => {
        const context = extendContext(
            [],
            "n",
            constant("Nat")
        );

        const result = inferType(variable("n"), context);

        assert(result.kind === "Const");
        equal(result.name, "Nat");
    });

    test("rejects an unknown variable", () => {
        throws(() => inferType(variable("n")), Error);
    });
});

section("inferType: Const", () => {
    test("infers a constant's declared type", () => {
        const declarations = declareConstant(
            [],
            "zero",
            constant("Nat")
        );

        const result = inferType(
            constant("zero"),
            [],
            declarations
        );

        assert(result.kind === "Const");
        equal(result.name, "Nat");
    });

    test("rejects an unknown constant", () => {
        throws(() => inferType(constant("zero")), Error);
    });
});

section("inferType: Type", () => {
    test("Type(0) has type Type(1)", () => {
        const result = inferType(type(0));

        assert(result.kind === "Type");
        equal(result.level, 1);
    });

    test("Type(1) has type Type(2)", () => {
        const result = inferType(type(1));

        assert(result.kind === "Type");
        equal(result.level, 2);
    });
});


section("Pi type inference", () => {
    const declarations = declareConstant(
        [],
        "Nat",
        type(0)
    );

    test("infers a nondependent product type", () => {
        const expr = pi(
            "n",
            constant("Nat"),
            constant("Nat")
        );

        const result = inferType(expr, [], declarations);

        assert(result.kind === "Type");
        equal(result.level, 0);
    });

    test("infers a dependent product type", () => {
        const expr = pi(
            "A",
            type(0),
            variable("A")
        );

        const result = inferType(expr);

        assert(result.kind === "Type");
        equal(result.level, 1);
    });

    test("rejects a domain that is not a type", () => {
        const withZero = declareConstant(
            declarations,
            "zero",
            constant("Nat")
        );

        const expr = pi(
            "n",
            constant("zero"),
            constant("Nat")
        );

        throws(() => inferType(expr, [], withZero), Error);
    });

    test("rejects a codomain that is not a type", () => {
        const context = extendContext(
            [],
            "n",
            constant("Nat")
        );

        const expr = pi(
            "A",
            type(0),
            variable("n")
        );

        throws(() => inferType(expr, context, declarations), Error);
    });
});


section("Lam type inference", () => {
    const declarations = declareConstant(
        [],
        "Nat",
        type(0)
    );

    test("infers the type of the identity function", () => {
        const expr = lam(
            "n",
            constant("Nat"),
            variable("n")
        );

        const result = inferType(expr, [], declarations);

        assert(result.kind === "Pi");
        equal(result.name, "n");

        assert(result.domain.kind === "Const");
        equal(result.domain.name, "Nat");

        assert(result.codomain.kind === "Const");
        equal(result.codomain.name, "Nat");
    });

    test("infers the type of a lambda with a universe parameter", () => {
        const expr = lam(
            "A",
            type(0),
            variable("A")
        );

        const result = inferType(expr);

        assert(result.kind === "Pi");
        equal(result.name, "A");

        assert(result.domain.kind === "Type");
        equal(result.domain.level, 0);

        assert(result.codomain.kind === "Type");
        equal(result.codomain.level, 0);
    });

    test("rejects a lambda domain that is not a type", () => {
        const withZero = declareConstant(
            declarations,
            "zero",
            constant("Nat")
        );

        const expr = lam(
            "n",
            constant("zero"),
            variable("n")
        );

        throws(() => inferType(expr, [], withZero), Error);
    });

    test("rejects an unknown variable in the body", () => {
        const expr = lam(
            "n",
            constant("Nat"),
            variable("missing")
        );

        throws(() => inferType(expr, [], declarations), Error);
    });
});


section("App type inference", () => {
    const declarations = declareConstant(
        [],
        "Nat",
        type(0)
    );

    test("infers the result type of applying the identity function", () => {
        const identity = lam(
            "n",
            constant("Nat"),
            variable("n")
        );

        const expr = app(identity, constant("zero"));

        const withZero = declareConstant(
            declarations,
            "zero",
            constant("Nat")
        );

        const result = inferType(expr, [], withZero);

        assert(result.kind === "Const");
        equal(result.name, "Nat");
    });

    test("substitutes an argument into a dependent codomain", () => {
        const polymorphicIdentityType = pi(
            "A",
            type(0),
            variable("A")
        );

        const withIdentity = declareConstant(
            declarations,
            "id",
            polymorphicIdentityType
        );

        const expr = app(
            constant("id"),
            constant("Nat")
        );

        const result = inferType(expr, [], withIdentity);

        assert(result.kind === "Const");
        equal(result.name, "Nat");
    });

    test("rejects applying a term whose type is not Pi", () => {
        const withZero = declareConstant(
            declarations,
            "zero",
            constant("Nat")
        );

        const expr = app(
            constant("zero"),
            constant("zero")
        );

        throws(() => inferType(expr, [], withZero), Error);
    });

    test("rejects an argument with the wrong type", () => {
        const withBool = declareConstant(
            declarations,
            "Bool",
            type(0)
        );

        const withZero = declareConstant(
            withBool,
            "zero",
            constant("Nat")
        );

        const withTrue = declareConstant(
            withZero,
            "true",
            constant("Bool")
        );

        const identity = lam(
            "n",
            constant("Nat"),
            variable("n")
        );

        const expr = app(identity, constant("true"));

        throws(() => inferType(expr, [], withTrue), Error);
    });
});


section("checkType()", () => {
    const declarations = declareConstant(
        [],
        "Nat",
        type(0)
    );

    const withZero = declareConstant(
        declarations,
        "zero",
        constant("Nat")
    );

    test("accepts an expression with the expected type", () => {
        const result = checkType(
            constant("zero"),
            constant("Nat"),
            [],
            withZero
        );

        equal(result, true);
    });

    test("rejects an expression with the wrong expected type", () => {
        const withBool = declareConstant(
            withZero,
            "Bool",
            type(0)
        );

        throws(() => checkType(
            constant("zero"),
            constant("Bool"),
            [],
            withBool
        ), Error);
    });

    test("accepts a lambda with its dependent function type", () => {
        const identity = lam(
            "n",
            constant("Nat"),
            variable("n")
        );

        const expectedType = pi(
            "n",
            constant("Nat"),
            constant("Nat")
        );

        const result = checkType(
            identity,
            expectedType,
            [],
            withZero
        );

        equal(result, true);
    });

    test("rejects an unknown constant", () => {
        throws(() => checkType(
            constant("missing"),
            constant("Nat"),
            [],
            withZero
        ), Error);
    });
});



section("Universe levels", () => {
    test("Type(0) has type Type(1)", () => {
        const inferred = inferType(parse("Type(0)"));

        assert(
            inferred.kind === "Type" && inferred.level === 1,
            "Type(0) should have type Type(1)"
        );
    });

    test("Type(1) has type Type(2)", () => {
        const inferred = inferType(parse("Type(1)"));

        assert(
            inferred.kind === "Type" && inferred.level === 2,
            "Type(1) should have type Type(2)"
        );
    });

    test("a Pi type over Type(0) lives in Type(1)", () => {
        const inferred = inferType(
            parse("Pi (A : Type(0)) -> A")
        );

        assert(
            inferred.kind === "Type" && inferred.level === 1,
            "the Pi type should live in Type(1)"
        );
    });

    test("a Pi type over Type(1) lives in Type(2)", () => {
        const inferred = inferType(
            parse("Pi (A : Type(1)) -> A")
        );

        assert(
            inferred.kind === "Type" && inferred.level === 2,
            "the Pi type should live in Type(2)"
        );
    });
});


section("Invalid type constructions", () => {
    test("rejects a Pi domain that is not a type", () => {
        // Type(0) is a term whose type is Type(1).
        // The domain here is Type(0), which is valid.
        // Instead, use a function value as the proposed domain.
        const expression =
            "Pi (f : fun (A : Type(0)) => A) -> Type(0)";

        throws(
            () => inferType(parse(expression)),
            Error
        );
    });

    test("rejects a Pi codomain that is not a type", () => {
        // The codomain expression is a function value,
        // not a type.
        const expression =
            "Pi (A : Type(0)) -> fun (x : A) => x";

        throws(
            () => inferType(parse(expression)),
            Error
        );
    });
});