export class Vec2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Vec2} v
     * @returns {Vec2}
     */
    add(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    /**
     * @param {Vec2} v
     * @returns {Vec2}
     */
    sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }

    /**
     * @param {number} s
     * @returns {Vec2}
     */
    scale(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    /**
     * @param {Vec2} v
     * @returns {Vec2}
     */
    dot(v) {
        return new Vec2(this.x * v.x, this.y * v.y);
    }

    length() {
        return Math.hypot(this.x, this.y);
    }
}