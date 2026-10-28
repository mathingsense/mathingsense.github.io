import { getElement } from "../lib/html.js";
import { Interval } from "../lib/cas/Interval.js";
import { Q } from "../lib/cas/Q.js";

const source = getElement("source", HTMLTextAreaElement);
const resultDiv = getElement("result", HTMLDivElement);
const calculateBtn = getElement("calculate", HTMLButtonElement);

const init = "[-3,2]*[4,5]";
source.value = init;

function calculate() {
    try {
        const r = evaluate(source.value);
        resultDiv.textContent = r.toString();
    } catch (e) {
        resultDiv.textContent = e instanceof Error ? e.message : String(e);
    }
}
calculate();

calculateBtn.addEventListener("click", calculate);


/**
 * @typedef {{
 *     type: "num" | "op",
 *     value: string,
 *     index: number,
 * }} Token
 */

/**
 * Splits the source into number and operator tokens.
 * @param {string} src
 * @returns {Token[]}
 */
function tokenize(src) {
    const re = /\s*(?:(\d+(?:\.\d+)?)|(.))/y;
    const text = src.trim();

    /** @type {Token[]} */
    const tokens = [];

    while (re.lastIndex < text.length) {
        const index = re.lastIndex;
        const m = re.exec(text);
        if (m === null) throw new Error();
        if (m[1] !== undefined) {
            tokens.push({ type: "num", value: m[1], index });
        } else if ("+-*/()[],".includes(m[2])) {
            tokens.push({ type: "op", value: m[2], index });
        } else {
            throw new SyntaxError(`Unexpected character "${m[2]}"`);
        }
    }
    return tokens;
}

/**
 * Evaluates an interval arithmetic expression exactly.
 *
 * @example
 * evaluate("[1,2] + [2,3]");        // [3, 5]
 * evaluate("([1,2] - 1) * [1/2, 3]");
 *
 * @param {string} src
 * @returns {Interval}
 */
export function evaluate(src) {
    const tokens = tokenize(src);
    let pos = 0;

    const peek = () => tokens[pos];
    /**
     * @param {Token} t
     * @param  {string[]} ops
     * @returns {boolean}
     */
    const isOp = (t, ...ops) => {
        return t !== undefined
            && t.type === "op"
            && ops.includes(t.value);
    };

    /** @param {string} op */
    function expect(op) {
        const t = tokens[pos++];
        if (!isOp(t, op)) {
            throw new SyntaxError(
                t ? `Expected "${op}" at position ${t.index}, got "${t.value}"`
                    : `Expected "${op}" but input ended`
            );
        }
    }

    /** @returns {Interval} */
    function expr() {
        let left = term();
        while (isOp(peek(), "+", "-")) {
            const op = tokens[pos++].value;
            const right = term();
            left = op === "+" ? left.add(right) : left.sub(right);
        }
        return left;
    }

    /** @returns {Interval} */
    function term() {
        let left = unary();
        while (isOp(peek(), "*", "/")) {
            const op = tokens[pos++].value;
            const right = unary();
            left = op === "*" ? left.mul(right) : left.div(right);
        }
        return left;
    }

    /** @returns {Interval} */
    function unary() {
        if (isOp(peek(), "-")) {
            pos++;
            return unary().neg();
        }
        return primary();
    }

    /** @returns {Interval} */
    function primary() {
        const t = tokens[pos++];
        if (t === undefined) {
            throw new SyntaxError("Unexpected end of input");
        }
        if (t.type === "num") {
            return Interval.point(Q.fromString(t.value));
        }
        if (t.value === "(") {
            const e = expr();
            expect(")");
            return e;
        }
        if (t.value === "[") {
            const lo = expr();
            expect(",");
            const hi = expr();
            expect("]");
            if (!lo.isPoint() || !hi.isPoint()) {
                throw new RangeError("Interval bounds must be exact numbers, not intervals");
            }
            return new Interval(lo.lower, hi.lower);
        }
        throw new SyntaxError(`Unexpected "${t.value}" at position ${t.index}`);
    }

    const result = expr();
    if (pos < tokens.length) {
        throw new SyntaxError(
            `Unexpected "${tokens[pos].value}" at position ${tokens[pos].index}`
        );
    }
    return result;
}