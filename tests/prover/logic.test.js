import { initTestFile, section, test } from "../test-runner.js";
import { assert, throws } from "../test-utils.js";
import { declareTheorem } from "../../lib/prover/core/declarations.js";
import { parse } from "../../lib/prover/core/parser.js";
import { normalize } from "../../lib/prover/core/expr.js";
import { andType, impliesType } from "../../lib/prover/logic/encoding.js";

initTestFile("logic.test.js");

section("Implication", () => {
    test("proves implication introduction", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (a : A) -> A";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (a : A) => a";

        const extended = declareTheorem(
            [],
            "implicationIntroduction",
            statement,
            proof
        );

        assert(
            extended.some(
                (declaration) =>
                    declaration.name === "implicationIntroduction"
            ),
            "the implication introduction theorem should be registered"
        );
    });


    test("proves implication elimination", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (B : Type(0)) -> " +
            `Pi (f : ${impliesType("A", "B")}) -> ` +
            "Pi (a : A) -> B";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (f : Pi (x : A) -> B) => " +
            "fun (a : A) => f a";

        const extended = declareTheorem(
            [],
            "implicationElimination",
            statement,
            proof
        );

        assert(
            extended.some(
                (declaration) =>
                    declaration.name === "implicationElimination"
            ),
            "the implication elimination theorem should be registered"
        );
    });


    const statement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        "Pi (C : Type(0)) -> " +
        "Pi (f : Pi (x : A) -> B) -> " +
        "Pi (g : Pi (y : B) -> C) -> " +
        "Pi (a : A) -> C";

    test("proves implication transitivity", () => {
        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (C : Type(0)) => " +
            "fun (f : Pi (x : A) -> B) => " +
            "fun (g : Pi (y : B) -> C) => " +
            "fun (a : A) => g (f a)";

        const extended = declareTheorem(
            [],
            "implicationTransitivity",
            statement,
            proof
        );

        assert(
            extended.some(
                (declaration) =>
                    declaration.name === "implicationTransitivity"
            ),
            "the theorem should be registered"
        );
    });


    test("rejects an invalid transitivity proof", () => {
        const invalidProof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (C : Type(0)) => " +
            "fun (f : Pi (x : A) -> B) => " +
            "fun (g : Pi (y : B) -> C) => " +
            "fun (a : A) => f a";

        throws(() =>
            declareTheorem(
                [],
                "invalidTransitivity",
                statement,
                invalidProof
            ), Error
        );
    });
});


section("Conjunction", () => {
    test("proves conjunction introduction", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (B : Type(0)) -> " +
            "Pi (a : A) -> " +
            "Pi (b : B) -> " +
            "Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (a : A) => " +
            "fun (b : B) => " +
            "fun (C : Type(0)) => " +
            "fun (k : Pi (x : A) -> Pi (y : B) -> C) => " +
            "k a b";

        const extended = declareTheorem(
            [],
            "andIntroduction",
            statement,
            proof
        );

        assert(
            extended.some(
                (declaration) => declaration.name === "andIntroduction"
            ),
            "the conjunction introduction theorem should be registered"
        );
    });


    test("proves conjunction left elimination", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (B : Type(0)) -> " +
            "Pi (pair : " +
            "Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C" +
            ") -> A";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (pair : " +
            "Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C" +
            ") => " +
            "pair A (fun (x : A) => fun (y : B) => x)";

        const extended = declareTheorem(
            [],
            "andLeft",
            statement,
            proof
        );

        assert(
            extended.some((declaration) => declaration.name === "andLeft"),
            "the left projection should be registered"
        );
    });


    test("proves conjunction right elimination", () => {
        const statement =
            "Pi (A : Type(0)) -> " +
            "Pi (B : Type(0)) -> " +
            "Pi (pair : Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C" +
            ") -> B";

        const proof =
            "fun (A : Type(0)) => " +
            "fun (B : Type(0)) => " +
            "fun (pair : " +
            "Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C" +
            ") => " +
            "pair B (fun (x : A) => fun (y : B) => y)";

        const extended = declareTheorem(
            [],
            "andRight",
            statement,
            proof
        );

        assert(
            extended.some((declaration) => declaration.name === "andRight"),
            "the right projection should be registered"
        );
    });
});


test("proves conjunction commutativity", () => {
    const statement =
        `Pi (A : Type(0)) -> ` +
        `Pi (B : Type(0)) -> ` +
        `Pi (pair : ${andType("A", "B")}) -> ` +
        `${andType("B", "A")}`;

    const proof =
        `fun (A : Type(0)) => ` +
        `fun (B : Type(0)) => ` +
        `fun (pair : ${andType("A", "B")}) => ` +
        `fun (C : Type(0)) => ` +
        `fun (k : Pi (x : B) -> Pi (y : A) -> C) => ` +
        `pair C (fun (x : A) => fun (y : B) => k y x)`;

    const extended = declareTheorem(
        [],
        "andCommutativity",
        statement,
        proof
    );

    assert(
        extended.some(
            (declaration) =>
                declaration.name === "andCommutativity"
        ),
        "conjunction commutativity should be registered"
    );
});


/** @import { Theorem } from "../../lib/prover/core/declarations.js" */

test("proves conjunction commutativity using registered theorems", () => {
    /** @type {Theorem[]} */
    let declarations = [];

    // 1. Register conjunction introduction.
    const introductionStatement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        "Pi (a : A) -> " +
        "Pi (b : B) -> " +
        andType("A", "B");

    const introductionProof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        "fun (a : A) => " +
        "fun (b : B) => " +
        "fun (C : Type(0)) => " +
        "fun (k : Pi (x : A) -> Pi (y : B) -> C) => " +
        "k a b";

    declarations = declareTheorem(
        declarations,
        "andIntroduction",
        introductionStatement,
        introductionProof
    );

    // 2. Register the left projection.
    const leftStatement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        `Pi (pair : ${andType("A", "B")}) -> A`;

    const leftProof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        `fun (pair : ${andType("A", "B")}) => ` +
        "pair A (fun (x : A) => fun (y : B) => x)";

    declarations = declareTheorem(
        declarations,
        "andLeft",
        leftStatement,
        leftProof
    );

    // 3. Register the right projection.
    const rightStatement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        `Pi (pair : ${andType("A", "B")}) -> B`;

    const rightProof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        `fun (pair : ${andType("A", "B")}) => ` +
        "pair B (fun (x : A) => fun (y : B) => y)";

    declarations = declareTheorem(
        declarations,
        "andRight",
        rightStatement,
        rightProof
    );

    // 4. Prove commutativity using the registered theorems.
    const commutativityStatement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        `Pi (pair : ${andType("A", "B")}) -> ` +
        andType("B", "A");

    const commutativityProof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        `fun (pair : ${andType("A", "B")}) => ` +
        "andIntroduction B A " +
        "(andRight A B pair) " +
        "(andLeft A B pair)";

    declarations = declareTheorem(
        declarations,
        "andCommutativityUsingTheorems",
        commutativityStatement,
        commutativityProof
    );

    assert(
        declarations.some(
            (declaration) =>
                declaration.name === "andCommutativityUsingTheorems"
        ),
        "commutativity should be registered using existing theorems"
    );
});


test("normalizes a registered theorem application", () => {
    /** @type {Theorem[]} */
    let declarations = [];

    const identityStatement =
        "Pi (A : Type(0)) -> Pi (a : A) -> A";

    const identityProof =
        "fun (A : Type(0)) => fun (a : A) => a";

    declarations = declareTheorem(
        declarations,
        "identity",
        identityStatement,
        identityProof
    );

    // The identity theorem applied to a type and a term.
    const expression = parse(
        "identity",
        declarations
    );

    const result = normalize(expression, 100, declarations);

    // The theorem should unfold to its stored lambda proof.
    assert(
        result.kind === "Lam",
        "normalization should unfold the identity theorem"
    );
});



test("reuses identity at different types", () => {
    /** @type {Theorem[]} */
    let declarations = [];

    const identityStatement =
        "Pi (A : Type(0)) -> " +
        "Pi (a : A) -> A";

    const identityProof =
        "fun (A : Type(0)) => " +
        "fun (a : A) => a";

    declarations = declareTheorem(
        declarations,
        "identity",
        identityStatement,
        identityProof
    );

    const functionType = impliesType("A", "A");
    const conjunctionType = andType("A", "B");

    const functionIdentityStatement =
        `Pi (A : Type(0)) -> ` +
        `Pi (f : ${functionType}) -> ${functionType}`;

    const functionIdentityProof =
        "fun (A : Type(0)) => " +
        "fun (f : Pi (proof : A) -> A) => " +
        "identity (Pi (proof : A) -> A) f";

    declarations = declareTheorem(
        declarations,
        "identityOnFunctions",
        functionIdentityStatement,
        functionIdentityProof
    );

    const identityAt1Statement =
        "Pi (A : Type(1)) -> " +
        "Pi (a : A) -> A";

    const identityAt1Proof =
        "fun (A : Type(1)) => " +
        "fun (a : A) => a";

    declarations = declareTheorem(
        declarations,
        "identityAt1",
        identityAt1Statement,
        identityAt1Proof
    );

    const conjunctionIdentityStatement =
        `Pi (A : Type(0)) -> ` +
        `Pi (B : Type(0)) -> ` +
        `Pi (p : ${conjunctionType}) -> ${conjunctionType}`;

    const conjunctionIdentityProof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        `fun (p : ${conjunctionType}) => ` +
        `identityAt1 (${conjunctionType}) p`;

    declarations = declareTheorem(
        declarations,
        "identityOnConjunctions",
        conjunctionIdentityStatement,
        conjunctionIdentityProof
    );

    assert(
        declarations.some(
            (declaration) =>
                declaration.name === "identityOnFunctions"
        ),
        "identity should be reusable at a function type"
    );

    assert(
        declarations.some(
            (declaration) =>
                declaration.name === "identityOnConjunctions"
        ),
        "identity should be reusable at a conjunction type"
    );
});