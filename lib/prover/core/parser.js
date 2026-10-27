import { variable, constant, type, app, pi, lam } from "./expr.js";

/** @import { Expr } from "./expr.js" */

/**
 * @typedef {{
 *   kind: "identifier" | "number" | "leftParen" | "rightParen" |
 *         "colon" | "arrow" | "lambdaArrow" | "eof";
 *   value: string;
 *   position: number;
 * }} Token
 */

/**
 * Convert source text into a sequence of tokens.
 *
 * @param {string} source
 * @returns {Token[]}
 */
export const tokenize = (source) => {
    /** @type {Token[]} */
    const tokens = [];
    let position = 0;

    while (position < source.length) {
        const char = source[position];

        // Ignore whitespace.
        if (/\s/.test(char)) {
            position++;
            continue;
        }

        // Recognize nonnegative integer literals.
        if (/[0-9]/.test(char)) {
            const start = position;
            position++;

            while (
                position < source.length &&
                /[0-9]/.test(source[position])
            ) {
                position++;
            }

            tokens.push({
                kind: "number",
                value: source.slice(start, position),
                position: start
            });

            continue;
        }

        // Recognize identifiers.
        if (/[a-zA-Z_]/.test(char)) {
            const start = position;
            position++;

            while (
                position < source.length &&
                /[a-zA-Z0-9_']/.test(source[position])
            ) {
                position++;
            }

            tokens.push({
                kind: "identifier",
                value: source.slice(start, position),
                position: start
            });

            continue;
        }

        // Recognize multi-character punctuation before single characters.
        if (source.startsWith("->", position)) {
            tokens.push({
                kind: "arrow",
                value: "->",
                position
            });
            position += 2;
            continue;
        }

        if (source.startsWith("=>", position)) {
            tokens.push({
                kind: "lambdaArrow",
                value: "=>",
                position
            });
            position += 2;
            continue;
        }

        const punctuation = {
            "(": "leftParen",
            ")": "rightParen",
            ":": "colon"
        };

        if (Object.hasOwn(punctuation, char)) {
            tokens.push({
                kind: punctuation[char],
                value: char,
                position
            });
            position++;
            continue;
        }

        throw new SyntaxError(
            `Unexpected character '${char}' at position ${position}`
        );
    }

    tokens.push({
        kind: "eof",
        value: "",
        position
    });

    return tokens;
};


/**
 * Parse source text into an expression.
 *
 * Grammar:
 *
 *   expression ::= piExpr | lambdaExpr | application
 *   piExpr ::= "Pi" binder "->" expression
 *   lambdaExpr ::= "fun" binder "=>" expression
 *   binder ::= "(" identifier ":" expression ")"
 *   application ::= atom atom*
 *   atom ::= identifier | "Type" "(" number ")" | "(" expression ")"
 *
 * Lowercase identifiers are variables; uppercase identifiers
 * are constants. Pi and fun are reserved keywords.
 *
 * @param {string} source
 * @param {Array<{name: string}>} [declarations=[]]
 * @returns {Expr}
 */
export const parse = (source, declarations = []) => {
    const tokens = tokenize(source);
    let index = 0;

    const declaredNames = new Set(
        declarations.map((declaration) => declaration.name)
    );

    // Names currently bound by Pi or fun expressions.
    /** @type {string[]} */
    const boundNames = [];

    const peek = () => tokens[index];

    /**
     * @param {string} kind
     * @returns {Token}
     */
    const expect = (kind) => {
        const token = peek();

        if (token.kind !== kind) {
            throw new SyntaxError(
                `Expected ${kind} at position ${token.position}, ` +
                `found '${token.value || "end of input"}'`
            );
        }

        index++;
        return token;
    };

    const expectKeyword = (keyword) => {
        const token = peek();

        if (token.kind !== "identifier" || token.value !== keyword) {
            throw new SyntaxError(
                `Expected '${keyword}' at position ${token.position}`
            );
        }

        index++;
        return token;
    };

    const startsAtom = () =>
        peek().kind === "leftParen" ||
        (
            peek().kind === "identifier" &&
            peek().value !== "Pi" &&
            peek().value !== "fun"
        );

    /**
     * Parse a binder of the form (x : A).
     *
     * @returns {{ name: string, domain: Expr }}
     */
    const parseBinder = () => {
        expect("leftParen");

        const name = expect("identifier");

        if (name.value === "Pi" || name.value === "fun") {
            throw new SyntaxError(
                `Reserved word '${name.value}' cannot be a binder name`
            );
        }

        expect("colon");
        const domain = parseExpression();
        expect("rightParen");

        return { name: name.value, domain };
    };

    /**
     * @returns {Expr}
     */
    const parsePi = () => {
        expectKeyword("Pi");

        const { name, domain } = parseBinder();

        expect("arrow");
        boundNames.push(name);

        let codomain;
        try {
            codomain = parseExpression();
        } finally {
            boundNames.pop();
        }

        return pi(name, domain, codomain);
    };

    /**
     * @returns {Expr}
     */
    const parseLambda = () => {
        expectKeyword("fun");

        const { name, domain } = parseBinder();

        expect("lambdaArrow");
        boundNames.push(name);

        let body;
        try {
            body = parseExpression();
        } finally {
            boundNames.pop();
        }

        return lam(name, domain, body);
    };

    /**
     * @returns {Expr}
     */
    const parseAtom = () => {
        const token = peek();

        if (token.kind === "identifier") {
            index++;

            if (token.value === "Type") {
                expect("leftParen");
                const levelToken = expect("number");
                expect("rightParen");

                return type(Number(levelToken.value));
            }

            if (token.value === "Pi" || token.value === "fun") {
                throw new SyntaxError(
                    `Expected a parenthesized expression at position ${token.position}`
                );
            }

            if (boundNames.includes(token.value)) {
                return variable(token.value);
            }

            if (declaredNames.has(token.value)) {
                return constant(token.value);
            }

            if (/^[A-Z]/.test(token.value)) {
                return constant(token.value);
            }

            return variable(token.value);
        }

        if (token.kind === "leftParen") {
            index++;
            const expr = parseExpression();
            expect("rightParen");
            return expr;
        }

        throw new SyntaxError(
            `Expected an expression at position ${token.position}`
        );
    };

    /**
     * @returns {Expr}
     */
    const parseApplication = () => {
        let expr = parseAtom();

        while (startsAtom()) {
            expr = app(expr, parseAtom());
        }

        return expr;
    };

    /**
     * @returns {Expr}
     */
    const parseExpression = () => {
        if (
            peek().kind === "identifier" &&
            peek().value === "Pi"
        ) {
            return parsePi();
        }

        if (
            peek().kind === "identifier" &&
            peek().value === "fun"
        ) {
            return parseLambda();
        }

        return parseApplication();
    };

    const expr = parseExpression();

    if (peek().kind !== "eof") {
        throw new SyntaxError(
            `Unexpected token '${peek().value}' at position ${peek().position}`
        );
    }

    return expr;
};
