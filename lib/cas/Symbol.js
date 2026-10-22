import { SymbolExpr } from "./Expr.js";

export class Symbol {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }
}

export class SymbolManager {
    constructor() {
        this.symbols = new Map();
    }

    /**
     * @param {string} name
     */
    get(name) {
        let symbol = this.symbols.get(name);

        if (!symbol) {
            symbol = new Symbol(name);
            this.symbols.set(name, symbol);
        }

        return symbol;
    }

    /**
     * @param {string} name
     */
    expr(name) {
        return new SymbolExpr(this.get(name));
    }
}