import { extendContext, lookupVariable, lookupConstant, declareConstant } from "../../lib/prover/core/context.js";
import { constant, type } from "../../lib/prover/core/expr.js";
import { initTestFile, section, test } from "../test-runner.js";
import { equal, throws, assert } from "../test-utils.js";

initTestFile("context.test.js");

section("extendContext", () => {
    test("adds a variable binding", () => {
        const context = extendContext([], "n", constant("Nat"));

        equal(context.length, 1);
        equal(context[0].name, "n");
        assert(context[0].type.kind === "Const");
        equal(context[0].type.name, "Nat");
    });

    test("does not modify the original context", () => {
        const original = [];
        const extended = extendContext(original, "n", constant("Nat"));

        equal(original.length, 0);
        equal(extended.length, 1);
    });
});

section("lookupVariable", () => {
    test("finds a variable's type", () => {
        const context = extendContext([], "n", constant("Nat"));
        const result = lookupVariable(context, "n");

        assert(result !== null);
        assert(result.kind === "Const");
        equal(result.name, "Nat");
    });

    test("returns null for an unknown variable", () => {
        equal(lookupVariable([], "n"), null);
    });

    test("uses the most recent binding", () => {
        const context = extendContext(
            extendContext([], "n", constant("Nat")),
            "n",
            constant("Bool")
        );

        const result = lookupVariable(context, "n");

        assert(result !== null);
        assert(result.kind === "Const");
        equal(result.name, "Bool");
    });
});

section("constant declarations", () => {
    test("declares and looks up a constant", () => {
        const declarations = declareConstant(
            [],
            "Nat",
            type(0)
        );

        const result = lookupConstant(declarations, "Nat");

        assert(result !== null);
        assert(result.kind === "Type");
        equal(result.level, 0);
    });

    test("returns null for an unknown constant", () => {
        equal(lookupConstant([], "Nat"), null);
    });

    test("rejects duplicate constant names", () => {
        const declarations = declareConstant(
            [],
            "Nat",
            type(0)
        );

        throws(
            () => declareConstant(declarations, "Nat", type(0)),
            Error
        );
    });
});