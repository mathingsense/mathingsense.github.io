// @ts-check

const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById("canvas"));
if (canvas === null) {
    throw new Error("canvas element is not found");
}

const c = canvas.getContext("2d");
if (c === null) {
    throw new Error("2D rendering context is not found");
}

const pixelRatio = window.devicePixelRatio || 1;

const size = 600;
canvas.style.width = size + "px";
canvas.style.height = size + "px";
canvas.width = size * pixelRatio;
canvas.height = size * pixelRatio;
c.scale(pixelRatio, pixelRatio);

// ---------------------------------------------------------

const button = document.getElementById("togglePlay");
if (button === null) {
    throw new Error("togglePlay button is not found");
}

const rand_button = document.getElementById("randomRadius");
if (rand_button === null) {
    throw new Error("randomRadius button is not found");
}

const width = size;
const height = size;
let paused = true;

let w = 100;    // hallway width
let r = 80;     // radius of half circle shape of in center sofa
let r2 = w+r;   // half lenght of sofa
let x = r2;     // the x origin to draw sofa
let y = w;      // the y origin to draw sofa
let v = 2;      // linear velocity
let dt = 0.01;  // angular velocity
let t = 0;      // angle
let dir = 0;    // direction of sofa

const draw = () => {
    c.save();
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, width, height);
    c.strokeRect(w, w, width-2*w, height-2*w);
    c.translate(x, y);
    c.rotate(t);

    c.fillStyle = "#0000ff";
    c.beginPath();
    c.moveTo(-r, 0);
    c.arc(-r, 0, w, Math.PI, 3/2*Math.PI);
    c.lineTo(r, -w);
    c.arc(r, 0, w, 3/2*Math.PI, 2*Math.PI);
    c.lineTo(r, 0);
    c.arc(0, 0, r, 0, Math.PI, true);
    c.closePath();
    c.fill();
    // c.stroke();

    switch (dir) {
        case 0:     // right
            x += v;
            if (x + r2 > width)
                dir = 1;
            break;
        case 1:     // top right corner
            t += dt;
            x = (width-w) - Math.cos(t) * r;
            y = w + Math.sin(t) * r;
            if (t > Math.PI/2) {
                t = Math.PI/2;
                dir = 2;
            }
            break;
        case 2:     // down
            y += v;
            if (y + r2 > height)
                dir = 3;
            break;
        case 3:     // bottom left corner
            t += dt;
            x = (width-w) + Math.cos(t) * r;
            y = (width-w) - Math.sin(t) * r;
            if (t > Math.PI) {
                t = Math.PI;
                dir = 4;
            }
            break;
        case 4:     // left
            x -= v;
            if (x - r2 < 0)
                dir = 5;
            break;
        case 5:     // bottom left corner
            t += dt;
            x = w - Math.cos(t) * r;
            y = (width-w) + Math.sin(t) * r;
            if (t > 3/2*Math.PI) {
                t = 3/2*Math.PI;
                dir = 6;
            }
            break;
        case 6:     // up
            y -= v;
            if (y - r2 < 0)
                dir = 7;
            break;
        case 7:     // top left corner
            t += dt;
            x = w + Math.cos(t) * r;
            y = w - Math.sin(t) * r;
            if (t > 2*Math.PI) {
                t = 0;
                dir = 0;
            }
            break;
    }

    c.restore();
    if (!paused)
        requestAnimationFrame(draw);
}
draw();

const randomRadius = () => {
    r = randomInt(10, 90);
    // reset all globals
    r2 = w+r;
    x = r2;
    y = w;
    t = 0;
    dir = 0;
    paused = true;
    button.innerHTML = "play";
    draw();
}

// Return integer x such that min <= x <= max
// min and max must be integers
/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randomInt = (min, max) => {
    return min + Math.floor((max-min+1) * Math.random());
}

const togglePlay = () => {
    if (paused) {
        button.innerHTML = "pause";
        requestAnimationFrame(draw);
    } else {
        button.innerHTML = "play";
    }
    paused = !paused;
}

button.addEventListener("click", togglePlay, false);
rand_button.addEventListener("click", randomRadius, false);

export {};