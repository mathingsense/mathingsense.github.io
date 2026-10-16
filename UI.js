const style = document.createElement("style");

style.textContent = `
    .ui {
        position: fixed;
        top: 40px;
        right: 10px;
        width: 280px;
        padding: 10px;
        box-sizing: border-box;

        color: #000;
        background: #ffffff55;
        border: 1px solid #000;

        font-size: 14px;
        z-index: 1000;
    }

    .ui * {
        box-sizing: border-box;
    }

    .ui-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .ui-label {
        background: beige;
    }

    .ui-value {
        min-width: 48px;
        text-align: right;
        background: beige;
    }

    .ui input[type="range"] {
        display: block;
        width: 100%;
        margin: 0;
        padding: 0;
        cursor: pointer;
        background: red;
    }

    .ui-button {
        display: block;
        width: 100%;
        margin: 10px 0;

        border: 1px solid #000;
        background: #faf9f6;

        font: inherit;
        text-align: center;

        cursor: pointer;
    }

    .ui-button:hover {
        background: #f0f5fb;
    }

    .ui-button:active {
        background: #e3edf9;
    }

    .ui-button:disabled {
        opacity: 0.9;
        cursor: not-allowed;
    }

    .ui-select-control {
        margin: 0;
    }

    .ui-select {
        display: block;
        width: 100%;
        margin-top: 6px;

        border: 1px solid #000;
        background: #faf9f6;

        font: inherit;
        cursor: pointer;
    }

    .ui-select:hover {
        background: #f0f5fb;
    }
`;

document.head.appendChild(style);

const panel = document.createElement("aside");
panel.className = "ui";

document.body.appendChild(panel);


/**
 * @typedef {Object} SliderOptions
 * @property {string} label
 * @property {number} min
 * @property {number} max
 * @property {number} [step]
 * @property {number} value
 * @property {(v: number) => void} onChange
 */

/**
 * @param {SliderOptions} param
 * @returns {{
 *   input: HTMLInputElement,
 *   value: number
 * }}
 */
export const uiSlider = ({
    label,
    min,
    max,
    step = 0.01,
    value,
    onChange,
}) => {
    const container = document.createElement("div");
    container.className = "ui-control";

    const header = document.createElement("div");
    header.className = "ui-header";

    const name = document.createElement("label");
    name.className = "ui-label";
    name.textContent = label;

    const output = document.createElement("output");
    output.className = "ui-value";

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);

    name.htmlFor = `slider-${uiSlider.nextId++}`;
    input.id = name.htmlFor;

    function update() {
        const v = Number(input.value);
        output.textContent = v.toFixed(3);
        onChange(v);
    }

    input.addEventListener("input", update);

    header.append(name, output);
    container.append(header, input);
    panel.appendChild(container);

    update();

    return {
        input,

        get value() {
            return Number(input.value);
        },

        set value(v) {
            input.value = String(v);
            update();
        },
    };
}

uiSlider.nextId = 0;


/**
 * @typedef {Object} ButtonOptions
 * @property {string} label
 * @property {() => void} onClick
 * @property {boolean} [disabled]
 */

/**
 * @param {ButtonOptions} param
 * @returns {{
 *   element: HTMLButtonElement,
 *   label: string,
 *   disabled: boolean
 * }}
 */
export const uiButton = ({
    label,
    onClick,
    disabled = false,
}) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "ui-button";
    button.textContent = label;
    button.disabled = disabled;

    button.addEventListener("click", onClick);
    panel.appendChild(button);

    return {
        element: button,

        set label(value) {
            button.textContent = value;
        },

        get label() {
            return button.textContent;
        },

        set disabled(value) {
            button.disabled = value;
        },

        get disabled() {
            return button.disabled;
        },
    };
}


/** @typedef {{label: string, value: string}} SelectOption */

/**
 * @typedef {Object} SelectOptions
 * @property {string} label
 * @property {SelectOption[]} options
 * @property {string} value
 * @property {(value: string) => void} onChange
 */

/**
 * @param {SelectOptions} config
 * @returns {{
 *   element: HTMLSelectElement,
 *   value: string
 * }}
 */
export function uiSelect({
    label,
    options,
    value,
    onChange,
}) {
    const container = document.createElement("div");
    container.className = "ui-select-control";

    const name = document.createElement("label");
    name.className = "ui-label";
    name.textContent = label;

    const select = document.createElement("select");
    select.className = "ui-select";

    for (const option of options) {
        const item = document.createElement("option");
        item.textContent = option.label;
        item.value = option.value;
        select.appendChild(item);
    }

    if (!options.some(option => option.value === value)) {
        throw new Error(`invalid initial value for select "${label}"`);
    }

    select.value = value;

    name.htmlFor = `select-${uiSelect.nextId++}`;
    select.id = name.htmlFor;

    select.addEventListener("change", () => {
        onChange(select.value);
    });

    container.append(name, select);
    panel.appendChild(container);

    return {
        element: select,

        get value() {
            return select.value;
        },

        set value(v) {
            if (!options.some(option => option.value === v)) {
                throw new Error(`invalid value for select "${label}"`);
            }

            select.value = v;
        },
    };
}

uiSelect.nextId = 0;


const toggleButton = document.createElement("button");

toggleButton.textContent = "x Hide controls";
toggleButton.style.cssText = `
    position: fixed;
    top: 0px;
    right: 10px;
    z-index: 1001;
    background: #faf9f6;
    color: #000;
    border: 1px solid #000;
    font-size: 14px;
    cursor: pointer;
`;

document.body.appendChild(toggleButton);

export const uiHide = () => {
    panel.hidden = true;
    toggleButton.textContent = "☰ Show controls";
};

const toggle = () => {
    panel.hidden = !panel.hidden;
};

const isVisible = () => {
    return !panel.hidden;
};

toggleButton.addEventListener("click", () => {
    toggle();
    toggleButton.textContent = isVisible()
        ? "x Hide controls"
        : "☰ Show controls";
});

window.addEventListener("keydown", (event) => {
    // Don't intercept shortcuts while typing in an input.
    if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))
    ) {
        return;
    }

    if (event.key.toLowerCase() === "h") {
        toggle();
    }
});