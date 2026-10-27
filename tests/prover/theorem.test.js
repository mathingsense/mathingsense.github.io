import { initTestFile, section, test } from "../test-runner.js";
import { assert, equal, throws } from "../test-utils.js";
import { parse } from "../../lib/prover/core/parser.js";
import { checkType, inferType } from "../../lib/prover/core/type-checker.js";
import { declareFromSource, declareTheorem } from "../../lib/prover/core/declarations.js";
import { definitionallyEqual, normalize } from "../../lib/prover/core/expr.js";

initTestFile("theorem.test.js");

section("Theorem proving", () => {
    test("proves that every type has an identity function", () => {
        const theorem = parse(
            "Pi (A : Type(0)) -> Pi (x : A) -> A"
        );

        const proof = parse(
            "fun (A : Type(0)) => fun (x : A) => x"
        );

        assert(checkType(proof, theorem) === true);
    });
});


section("declareTheorem", () => {
    const statement = "Pi (A : Type(0)) -> Pi (x : A) -> A";
    const proof = "fun (A : Type(0)) => fun (x : A) => x";

    test("registers a theorem with a valid proof", () => {
        const declarations = declareTheorem(
            [],
            "identity",
            statement,
            proof
        );

        equal(declarations.length, 1);
        equal(declarations[0].name, "identity");
        assert(declarations[0].type.kind === "Pi");
        assert(declarations[0].proof.kind === "Lam");
    });

    test("rejects a proof with the wrong type", () => {
        throws(
            () => declareTheorem(
                [],
                "badIdentity",
                statement,
                "fun (A : Type(0)) => fun (x : A) => A"
            ),
            Error
        );
    });

    test("rejects a duplicate theorem name", () => {
        const declarations = declareTheorem(
            [],
            "identity",
            statement,
            proof
        );

        throws(
            () => declareTheorem(
                declarations,
                "identity",
                statement,
                proof
            ),
            Error
        );
    });

    test("does not mutate the original declarations", () => {
        const original = [];
        const updated = declareTheorem(
            original,
            "identity",
            statement,
            proof
        );

        equal(original.length, 0);
        equal(updated.length, 1);
    });

    test("allows later declarations to use the theorem", () => {
        const withTheorem = declareTheorem(
            [],
            "identity",
            statement,
            proof
        );

        const withSecondTheorem = declareTheorem(
            withTheorem,
            "identityAgain",
            statement,
            "fun (A : Type(0)) => fun (x : A) => identity A x"
        );

        equal(withSecondTheorem.length, 2);
        assert(withSecondTheorem[1].proof.kind === "Lam");
    });
});




// TODO: move to tests/theorem-application.test.js

section("Concrete theorem application", () => {
    const withNat = declareFromSource(
        "const Nat : Type(0)"
    );

    const withZero = declareFromSource(
        "const zero : Nat",
        withNat
    );

    const declarations = declareTheorem(
        withZero,
        "identity",
        "Pi (A : Type(0)) -> Pi (x : A) -> A",
        "fun (A : Type(0)) => fun (x : A) => x"
    );

    test("identity Nat zero has type Nat", () => {
        const expression = parse(
            "identity Nat zero",
            declarations
        );

        const inferredType = inferType(
            expression,
            [],
            declarations
        );
        // console.log(inferredType)

        const expectedType = parse("Nat", declarations);

        assert(
            definitionallyEqual(inferredType, expectedType),
            "identity Nat zero should have type Nat"
        );

        checkType(
            expression,
            expectedType,
            [],
            declarations
        );


    });

    test("identity Nat zero reduces to zero", () => {
        const expression = parse(
            "identity Nat zero",
            declarations
        );

        const reduced = normalize(expression, 100, declarations);
        console.log(reduced);
        const expected = parse("zero", declarations);

        assert(
            definitionallyEqual(reduced, expected),
            "identity Nat zero should reduce to zero"
        );
    });

    test("constants without proofs remain opaque", () => {
        const expression = parse("zero", declarations);

        const reduced = normalize(expression, 100, declarations);

        assert(
            definitionallyEqual(reduced, expression),
            "zero should remain unchanged"
        );
    });

    test("proves and reuses a higher-order theorem", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (B : Type(0)) -> " +
            "Pi (f : Pi (x : A) -> B) -> " +
            "Pi (a : A) -> B";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (f : Pi (x : A) -> B) => " +
            "fun (a : A) => f a";

        const extended = declareTheorem(
            declarations,
            "modusPonens",
            statement,
            proof
        );

        const expression = parse(
            "modusPonens",
            extended
        );

        assert(
            definitionallyEqual(
                inferType(expression, [], extended),
                parse(statement, extended)
            ),
            "modusPonens should have its declared type"
        );
    });
});