import { getElement } from "../common.js";
import { UI } from "../lib/UI.js";

const info = getElement("info", HTMLDivElement);

/**
 * @param {any[]} args
 */
function log(...args) {
    info.textContent = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');;
}

const original = console.log;
console.log = (...args) => {
    original.apply(console, args);
    log(...args);
};


const slider = new UI()
    .title("Slider").top(100).right(10);

slider.slider({
    label: "Slider L 1",
    min: -5,
    max: 5,
    step: 1,
    value: 1,
    onChange(value) {
        log(this.label, value);
    },
});

slider.slider({
    label: "Slider L 2",
    min: 0,
    max: 10,
    step: 0.1,
    value: 2,
    onChange(value) {
        log(this.label, value);
    },
});


const list = new UI().title("List").top(100);

list.list({
    items: [
        {
            label: "Cube",
            options: [
                {
                    label: "Edit",
                    onClick: (item) => console.log("Editing", item.label),
                },
                {
                    label: "Duplicate",
                    onClick: (item) => console.log("Duplicating", item.label),
                },
                {
                    label: "Delete",
                    onClick: (item) => console.log("Deleting", item.label),
                },
            ],
        },
        {
            label: "Light",
            options: [
                {
                    label: "Toggle visibility",
                    onClick: (item) => console.log("Toggling", item.label),
                },
                {
                    label: "Reset",
                    onClick: (item) => console.log("Resetting", item.label),
                },
            ],
        },
        {
            label: "Camera",
            options: [
                {
                    label: "Focus",
                    onClick: (item) => console.log("Focusing", item.label),
                },
            ],
        },
        {
            label: "Ground",
            // No options button for this item.
        },
    ],
});