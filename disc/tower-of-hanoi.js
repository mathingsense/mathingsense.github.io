import { initCanvas, getPointerPos, FILL, BOTH, line, rect } from "../common.js";

const width = 600;
const height = 600;

const [canvas, c] = initCanvas("canvas", width, height)

const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f"];

const pegs = [[5, 4, 3, 2, 1], [], []];
const disk_height = 20;

let select = 0
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
        rect(c, (select - 1) * 200, 0, 200, 600, FILL);
    }

    // Draw dashed lines to separate pegs
    c.setLineDash([15, 10]); // [dash length, gap length]
    line(c, 200, 0, 200, 600);
    line(c, 400, 0, 400, 600);

    c.setLineDash([])

    // Draw pegs
    c.lineWidth = 4;
    line(c, 100, 500, 100, 300);
    line(c, 300, 500, 300, 300);
    line(c, 500, 500, 500, 300);

    // Draw disks
    for (let i = 0; i < pegs.length; i++) {
        const peg = pegs[i];
        for (let j = 0; j < peg.length; j++) {
            const disk_size = peg[j];
            const disk_width = 20 + disk_size * 30;
            const x = 100 + i * 200 - disk_width / 2;
            const y = 500 - (j + 1) * disk_height;
            c.fillStyle = colors[disk_size - 1];
            rect(c, x, y, disk_width, disk_height, BOTH);
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
    const [x, _] = getPointerPos(canvas, e);

    let region = 0;
    if (x < 200) {
        region = 1;
    } else if (x < 400) {
        region = 2;
    } else {
        region = 3;
    }

    if (select === 0) {
        // Check if the selected peg has any disks
        if (pegs[region - 1].length > 0) {
            select = region;
            msg = "";
            draw(c);
        }
    } else {
        if (select !== region) {
            const sourcePeg = pegs[select - 1];
            const targetPeg = pegs[region - 1];

            if (targetPeg.length > 0 && sourcePeg[sourcePeg.length - 1] > targetPeg[targetPeg.length - 1]) {
                msg = "Cannot place larger disk on top of smaller disk";
            } else {
                // Move the disk
                /** @type {number} */
                const disk = /** number */ (sourcePeg.pop());
                targetPeg.push(disk);
                msg = "";
            }
        }

        select = 0;
        draw(c);
    }
}

canvas.style.touchAction = "none";
canvas.addEventListener("click", handleClick, false);