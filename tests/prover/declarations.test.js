import { initTestFile, section, test } from "../test-runner.js";
import { assert, equal, throws } from "../test-utils.js";
import { declareCheckedConstant, declareFromSource } from "../../lib/prover/core/declarations.js";
import { constant, type, pi, lam, variable } from "../../lib/prover/core/expr.js";

initTestFile("declarations.test.js");

section("declareCheckedConstant", () => {
    test("declares a constant with a universe as its type", () => {
        const declarations = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        equal(declarations.length, 1);
        equal(declarations[0].name, "Nat");
        assert(declarations[0].type.kind === "Type");
        equal(declarations[0].type.level, 0);
    });

    test("allows a type to refer to an existing constant", () => {
        const withNat = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        const withZero = declareCheckedConstant(
            withNat,
            "zero",
            constant("Nat")
        );

        equal(withZero.length, 2);
        equal(withZero[1].name, "zero");
        assert(withZero[1].type.kind === "Const");
        equal(withZero[1].type.name, "Nat");
    });

    test("allows a dependent function type", () => {
        const declarations = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        const natFunction = pi(
            "x",
            constant("Nat"),
            constant("Nat")
        );

        const updated = declareCheckedConstant(
            declarations,
            "identity",
            natFunction
        );

        equal(updated.length, 2);
        equal(updated[1].name, "identity");
    });

    test("rejects a term where a type is required", () => {
        const declarations = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        const term = lam(
            "x",
            constant("Nat"),
            variable("x")
        );

        throws(
            () => declareCheckedConstant(
                declarations,
                "Bad",
                term
            ),
            /Declared type must itself be a type/
        );
    });

    test("rejects an unknown constant in a declared type", () => {
        throws(
            () => declareCheckedConstant(
                [],
                "Bad",
                constant("Unknown")
            ),
            Error
        );
    });

    test("rejects duplicate constant names", () => {
        const declarations = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        throws(
            () => declareCheckedConstant(
                declarations,
                "Nat",
                type(0)
            ),
            Error
        );
    });

    test("does not mutate the original declarations", () => {
        const original = declareCheckedConstant(
            [],
            "Nat",
            type(0)
        );

        const updated = declareCheckedConstant(
            original,
            "zero",
            constant("Nat")
        );

        equal(original.length, 1);
        equal(updated.length, 2);
    });
});


section("declareFromSource", () => {
    test("declares a universe-level type", () => {
        const declarations = declareFromSource(
            "const Nat : Type(0)"
        );

        equal(declarations.length, 1);
        equal(declarations[0].name, "Nat");
        assert(declarations[0].type.kind === "Type");
        equal(declarations[0].type.level, 0);
    });

    test("allows subsequent declarations to use earlier constants", () => {
        const withNat = declareFromSource("const Nat : Type(0)");

        const withZero = declareFromSource(
            "const Zero : Nat",
            withNat
        );

        equal(withZero.length, 2);
        equal(withZero[1].name, "Zero");
        assert(withZero[1].type.kind === "Const");
        equal(withZero[1].type.name, "Nat");
    });

    test("parses dependent function types in declarations", () => {
        const withNat = declareFromSource("const Nat : Type(0)");

        const declarations = declareFromSource(
            "const Identity : Pi (x : Nat) -> Nat",
            withNat
        );

        equal(declarations.length, 2);
        assert(declarations[1].type.kind === "Pi");
    });

    test("rejects malformed declaration syntax", () => {
        throws(
            () => declareFromSource("Nat : Type(0)"),
            SyntaxError
        );
    });

    test("rejects duplicate declarations", () => {
        const declarations = declareFromSource("const Nat : Type(0)");

        throws(
            () => declareFromSource(
                "const Nat : Type(0)",
                declarations
            ),
            Error
        );
    });

    test("rejects unknown constants in declared types", () => {
        throws(
            () => declareFromSource("const Bad : Unknown"),
            Error
        );
    });

    test("does not mutate the original declarations", () => {
        const original = declareFromSource("const Nat : Type(0)");

        const updated = declareFromSource(
            "const Zero : Nat",
            original
        );

        equal(original.length, 1);
        equal(updated.length, 2);
    });
});


test("allows lowercase declaration names", () => {
    const declarations = declareFromSource("const Nat : Type(0)");
    const updated = declareFromSource("const zero : Nat", declarations);

    equal(updated.length, 2);
    equal(updated[1].name, "zero");
    assert(updated[1].type.kind === "Const");
    equal(updated[1].type.name, "Nat");
});

test("allows later declarations to refer to lowercase constants", () => {
    const withNat = declareFromSource("const Nat : Type(0)");
    const withZero = declareFromSource("const zero : Nat", withNat);
    const withNext = declareFromSource(
        "const next : Pi (x : Nat) -> Nat",
        withZero
    );

    equal(withNext.length, 3);
    assert(withNext[2].type.kind === "Pi");
});