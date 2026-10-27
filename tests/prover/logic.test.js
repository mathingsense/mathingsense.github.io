import { initTestFile, section, test } from "../test-runner.js";
import { assert, throws } from "../test-utils.js";
import { declareTheorem } from "../../lib/prover/core/declarations.js";

initTestFile("logic.test.js");


const andType = (a, b) =>
    `Pi (C : Type(0)) -> ` +
    `Pi (k : Pi (x : ${a}) -> Pi (y : ${b}) -> C) -> C`;

section("Propositional logic", () => {
    const statement =
        "Pi (A : Type(0)) -> " +
        "Pi (B : Type(0)) -> " +
        "Pi (C : Type(0)) -> " +
        "Pi (f : Pi (x : A) -> B) -> " +
        "Pi (g : Pi (y : B) -> C) -> " +
        "Pi (a : A) -> C";

    const proof =
        "fun (A : Type(0)) => " +
        "fun (B : Type(0)) => " +
        "fun (C : Type(0)) => " +
        "fun (f : Pi (x : A) -> B) => " +
        "fun (g : Pi (y : B) -> C) => " +
        "fun (a : A) => g (f a)";


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
            "Pi (f : Pi (x : A) -> B) -> " +
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


    test("proves implication transitivity", () => {
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