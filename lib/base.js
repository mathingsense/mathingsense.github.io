export class GeoObject {
    /**
     * @param {GeoObject[]} [deps]
     */
    constructor(deps = []) {
        this.deps = deps;
        this.id = "";
        this.type = "";

        /** @type GeoObject[] */
        this.children = [];

        deps.forEach(d => d.children.push(this));
    }
}

export class Prop {
    /**
     * @returns {string}
     */
    toString() { return ""; }
}