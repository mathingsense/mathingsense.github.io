import { initTestFile, section, test } from "../test-runner.js";
import { equal } from "../test-utils.js";
import { andType, impliesType } from "../../lib/prover/logic/encoding.js";

initTestFile("encoding.test.js");

section("Logical encodings", () => {
    test("generates the Church encoding of conjunction", () => {
        equal(
            andType("A", "B"),
            "Pi (C : Type(0)) -> " +
            "Pi (k : Pi (x : A) -> Pi (y : B) -> C) -> C"
        );
    });

    test("generates implication as a function type", () => {
        equal(
            impliesType("A", "B"),
            "Pi (_ : A) -> B"
        );
    });
});