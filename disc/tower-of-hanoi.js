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

// -------------------------------------------------------------------

const width = size;
const height = size;
const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f"];

let pegs = [[5, 4, 3, 2, 1], [], []];
const disk_height = 20;

let select = 0
let target = 0
let msg = ""

/**
 * @param {CanvasRenderingContext2D} c 
 */
const draw = (c) => {
    c.lineWidth = 1;
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#000000";
    c.fillRect(0, 0, width, height);

    // Highlight selected peg
    if (select > 0) {
        c.fillStyle = "rgb(132, 193, 211)";
        c.fillRect(200 * select - 200, 0, 200, 600);
    }

    // Draw dashed lines to separate pegs
    c.beginPath();
    c.setLineDash([15, 10]); // [dash length, gap length]
    c.moveTo(200, 0);
    c.lineTo(200, 600);
    c.moveTo(400, 0);
    c.lineTo(400, 600);
    c.stroke();

    c.setLineDash([])

    // Draw pegs
    c.lineWidth = 4;
    c.strokeStyle = "#000";

    c.beginPath();
    c.moveTo(100, 500);
    c.lineTo(100, 300);
    c.moveTo(300, 500);
    c.lineTo(300, 300);
    c.moveTo(500, 500);
    c.lineTo(500, 300);
    c.stroke();

    // Draw disks
    for (let i = 0; i < pegs.length; i++) {
        const peg = pegs[i];
        for (let j = 0; j < peg.length; j++) {
            const disk_size = peg[j];
            const disk_width = 20 + disk_size * 30;
            const x = 100 + i * 200 - disk_width / 2;
            const y = 500 - (j + 1) * disk_height;
            c.fillStyle = colors[disk_size - 1];
            c.fillRect(x, y, disk_width, disk_height);
            c.strokeRect(x, y, disk_width, disk_height);
        }
    }

    if (msg) {
        c.fillStyle = "#ff0000";
        c.font = "20px Arial";
        c.fillText(msg, 10, 30);
    }
}
draw(c);

/**
 * @param {MouseEvent} e
 */
const handleClick = (e) => {
    const [x, y] = get_mouse_pos(e);

    if (select === 0) {
        if (x < 200) {
            select = 1;
        } else if (x < 400) {
            select = 2;
        } else {
            select = 3;
        }
        // Check if the selected peg has any disks
        if (pegs[select - 1].length === 0) {
            msg = "Selected peg is empty";
            select = 0;
        } else {
            msg = "";
        }
        draw(c);
    } else {
        if (x < 200) {
            target = 1;
        } else if (x < 400) {
            target = 2;
        } else {
            target = 3;
        }

        if (select === target) {
            msg = "Cannot move to the same peg";
        }

        // Check if the move is valid
        const sourcePeg = pegs[select - 1];
        const targetPeg = pegs[target - 1];

        if (targetPeg.length > 0 && sourcePeg[sourcePeg.length - 1] > targetPeg[targetPeg.length - 1]) {
            msg = "Cannot place larger disk on top of smaller disk";
        } else {
            // Move the disk
            /** @type {number} */
            const disk = /** number */ (sourcePeg.pop());
            targetPeg.push(disk);
            msg = "";
        }

        select = 0;
        draw(c);
    }
}

canvas.style.touchAction = "none";
canvas.addEventListener("click", handleClick, false);

/**
 * @param {MouseEvent} e
 * @returns {[number, number]}
 */
const get_mouse_pos = (e) => {
    const b = canvas.getBoundingClientRect();
    return [e.pageX - (b.left + window.scrollX), e.pageY - (b.top + window.scrollY)];
}

export { };