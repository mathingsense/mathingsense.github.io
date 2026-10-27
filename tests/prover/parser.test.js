import { initTestFile, section, test } from "../test-runner.js";
import { assert, equal, throws } from "../test-utils.js";
import { parse, tokenize } from "../../lib/prover/core/parser.js";
import { declareConstant } from "../../lib/prover/core/context.js";
import { checkType, inferType } from "../../lib/prover/core/type-checker.js";
import { constant, definitionallyEqual, pi, type } from "../../lib/prover/core/expr.js";

initTestFile("parser.test.js");

section("tokenize", () => {
    test("recognizes identifiers", () => {
        const tokens = tokenize("x Nat my_name");

        assert(tokens.length === 4);
        equal(tokens[0].kind, "identifier");
        equal(tokens[0].value, "x");
        equal(tokens[1].value, "Nat");
        equal(tokens[2].value, "my_name");
        equal(tokens[3].kind, "eof");
    });

    test("recognizes punctuation", () => {
        const tokens = tokenize("(x : Nat) -> Nat");

        equal(
            tokens.map((token) => token.kind).join(","),
            [
                "leftParen",
                "identifier",
                "colon",
                "identifier",
                "rightParen",
                "arrow",
                "identifier",
                "eof"
            ].join(",")
        );
    });

    test("recognizes the lambda arrow", () => {
        const tokens = tokenize("fun (x : Nat) => x");

        equal(tokens[6].kind, "lambdaArrow");
        equal(tokens[6].value, "=>");
    });

    test("ignores whitespace", () => {
        const tokens = tokenize("  x \n Nat  ");

        equal(tokens[0].value, "x");
        equal(tokens[1].value, "Nat");
        equal(tokens[2].kind, "eof");
    });

    test("records source positions", () => {
        const tokens = tokenize("x -> Nat");

        equal(tokens[0].position, 0);
        equal(tokens[1].position, 2);
        equal(tokens[2].position, 5);
    });

    test("rejects unsupported characters", () => {
        throws(
            () => tokenize("x @ y"),
            /Unexpected character '@' at position 2/
        );
    });
});


section("parse", () => {
    test("parses a lowercase identifier as a variable", () => {
        const expr = parse("x");

        assert(expr.kind === "Var");
        equal(expr.name, "x");
    });

    test("parses an uppercase identifier as a constant", () => {
        const expr = parse("Nat");

        assert(expr.kind === "Const");
        equal(expr.name, "Nat");
    });

    test("parses universe levels", () => {
        const expr = parse("Type(0)");

        assert(expr.kind === "Type");
        equal(expr.level, 0);
    });

    test("parses higher universe levels", () => {
        const expr = parse("Type(2)");

        assert(expr.kind === "Type");
        equal(expr.level, 2);
    });

    test("parses function application", () => {
        const expr = parse("f x");

        assert(expr.kind === "App");
        assert(expr.fn.kind === "Var");
        assert(expr.arg.kind === "Var");
        equal(expr.fn.name, "f");
        equal(expr.arg.name, "x");
    });

    test("parses application as left-associative", () => {
        const expr = parse("f x y");

        assert(expr.kind === "App");
        assert(expr.fn.kind === "App");
        assert(expr.arg.kind === "Var");
        equal(expr.arg.name, "y");

        assert(expr.fn.fn.kind === "Var");
        equal(expr.fn.fn.name, "f");

        assert(expr.fn.arg.kind === "Var");
        equal(expr.fn.arg.name, "x");
    });

    test("parses parenthesized expressions", () => {
        const expr = parse("(x)");

        assert(expr.kind === "Var");
        equal(expr.name, "x");
    });

    test("parentheses control application grouping", () => {
        const expr = parse("f (g x)");

        assert(expr.kind === "App");
        assert(expr.fn.kind === "Var");
        equal(expr.fn.name, "f");

        assert(expr.arg.kind === "App");
        assert(expr.arg.fn.kind === "Var");
        equal(expr.arg.fn.name, "g");
        assert(expr.arg.arg.kind === "Var");
        equal(expr.arg.arg.name, "x");
    });

    test("rejects empty input", () => {
        throws(() => parse(""), SyntaxError);
    });

    test("rejects unmatched parentheses", () => {
        throws(() => parse("(x"), SyntaxError);
        throws(() => parse("x)"), SyntaxError);
    });

    test("rejects malformed universe expressions", () => {
        throws(() => parse("Type()"), SyntaxError);
        throws(() => parse("Type(x)"), SyntaxError);
        throws(() => parse("Type(0"), SyntaxError);
    });

    test("rejects trailing tokens", () => {
        throws(() => parse("x y )"), SyntaxError);
    });
});



section("parse dependent function types", () => {
    test("parses a simple Pi type", () => {
        const expr = parse("Pi (x : Nat) -> Nat");

        assert(expr.kind === "Pi");
        equal(expr.name, "x");

        assert(expr.domain.kind === "Const");
        equal(expr.domain.name, "Nat");

        assert(expr.codomain.kind === "Const");
        equal(expr.codomain.name, "Nat");
    });

    test("parses nested Pi types right-associatively", () => {
        const expr = parse(
            "Pi (x : Nat) -> Pi (y : Nat) -> Nat"
        );

        assert(expr.kind === "Pi");
        assert(expr.codomain.kind === "Pi");
        equal(expr.codomain.name, "y");
    });

    test("allows a dependent codomain", () => {
        const expr = parse("Pi (A : Type(0)) -> A");

        assert(expr.kind === "Pi");
        assert(expr.domain.kind === "Type");
        assert(expr.codomain.kind === "Var");
        equal(expr.codomain.name, "A");
    });

    test("parses a parenthesized Pi type", () => {
        const expr = parse("(Pi (x : Nat) -> Nat)");

        assert(expr.kind === "Pi");
    });
});

section("parse lambda abstractions", () => {
    test("parses a simple lambda", () => {
        const expr = parse("fun (x : Nat) => x");

        assert(expr.kind === "Lam");
        equal(expr.name, "x");

        assert(expr.domain.kind === "Const");
        equal(expr.domain.name, "Nat");

        assert(expr.body.kind === "Var");
        equal(expr.body.name, "x");
    });

    test("parses nested lambdas right-associatively", () => {
        const expr = parse(
            "fun (x : Nat) => fun (y : Nat) => x"
        );

        assert(expr.kind === "Lam");
        assert(expr.body.kind === "Lam");
        equal(expr.body.name, "y");

        assert(expr.body.body.kind === "Var");
        equal(expr.body.body.name, "x");
    });

    test("allows a lambda as a parenthesized argument", () => {
        const expr = parse("f (fun (x : Nat) => x)");

        assert(expr.kind === "App");
        assert(expr.arg.kind === "Lam");
    });
});

section("reject malformed binders", () => {
    test("rejects a Pi without an arrow", () => {
        throws(
            () => parse("Pi (x : Nat) Nat"),
            SyntaxError
        );
    });

    test("rejects a lambda without its arrow", () => {
        throws(
            () => parse("fun (x : Nat) x"),
            SyntaxError
        );
    });

    test("rejects a missing binder type", () => {
        throws(
            () => parse("fun (x :) => x"),
            SyntaxError
        );
    });

    test("rejects reserved binder names", () => {
        throws(
            () => parse("Pi (fun : Nat) -> Nat"),
            SyntaxError
        );
    });
});



section("parser and type checker integration", () => {
    const declarations = declareConstant(
        [],
        "Nat",
        type(0)
    );

    test("infers the type of a parsed lambda", () => {
        const expr = parse("fun (x : Nat) => x");

        const inferred = inferType(
            expr,
            [],
            declarations
        );

        const expected = pi(
            "x",
            constant("Nat"),
            constant("Nat")
        );

        assert(definitionallyEqual(inferred, expected));
    });

    test("checks a parsed lambda against its expected type", () => {
        const expr = parse("fun (x : Nat) => x");

        const expected = pi(
            "y",
            constant("Nat"),
            constant("Nat")
        );

        assert(checkType(expr, expected, [], declarations));
    });

    test("rejects a parsed lambda with an incorrect expected type", () => {
        const expr = parse("fun (x : Nat) => x");

        const wrongExpected = pi(
            "x",
            type(0),
            type(0)
        );

        throws(
            () => checkType(
                expr,
                wrongExpected,
                [],
                declarations
            ),
            /Type mismatch/
        );
    });
});


test("parses a declared lowercase name as a constant", () => {
    const declarations = [
        { name: "zero", type: constant("Nat") },
    ];

    const result = parse("zero", declarations);

    assert(result.kind === "Const");
    equal(result.name, "zero");
});

test("keeps undeclared lowercase names as variables", () => {
    const result = parse("zero");

    assert(result.kind === "Var");
    equal(result.name, "zero");
});

test("bound names shadow declared constants", () => {
    const declarations = [
        { name: "zero", type: constant("Nat") },
    ];

    const result = parse("fun (zero : Nat) => zero", declarations);

    assert(result.kind === "Lam");
    assert(result.body.kind === "Var");
    equal(result.body.name, "zero");
});

test("resolves lowercase constants inside a type", () => {
    const declarations = [
        { name: "Nat", type: type(0) },
        { name: "zero", type: constant("Nat") },
    ];

    const result = parse("Pi (x : Nat) -> zero", declarations);

    assert(result.kind === "Pi");
    assert(result.codomain.kind === "Const");
    equal(result.codomain.name, "zero");
});