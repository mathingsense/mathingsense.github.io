const style = document.createElement("style");

style.textContent = `
    .ui {
        position: fixed;
        top: 0;
        right: 10px;
        width: 280px;
        padding: 0px;
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

    .ui-panel-header {
        padding: 0px 5px;
        background: wheat;
        font-weight: 600;
        cursor: pointer;
    }

    .ui-content {
        padding-top: 10px;
    }

    .ui-section {
        margin: 8px 0;
        overflow: hidden;
    }

    .ui-section-title {
        padding: 0px 5px;
        background: antiquewhite;
        font-weight: 600;
        cursor: pointer;
    }

    .ui-section-body {
        padding: 10px 0;
    }

    .ui-section-body > :last-child {
        margin-bottom: 0;
    }


    .ui-slider {
        margin: 0 10px 10px 10px;
    }

    .ui-slider-header {
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
        width: 260px;
        margin: 10px;

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
        margin: 10px;
    }

    .ui-select {
        display: block;
        width: 100%;
        margin-top: 6px;
        padding: 5px;

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

const panel = document.createElement("details");
panel.className = "ui";
panel.open = true;

const panelHeader = document.createElement("summary");
panelHeader.className = "ui-panel-header";

const panelTitle = document.createElement("span");
panelTitle.className = "ui-title";
panelTitle.textContent = "Controls";

const panelContent = document.createElement("div");
panelContent.className = "ui-content";

panelHeader.appendChild(panelTitle);
panel.append(panelHeader, panelContent);
document.body.appendChild(panel);

// Default destination for newly created controls.
let activeContainer = panelContent;


/**
 * Create a collapsible section and build its controls.
 * @param {string} label
 * @param {() => void} build
 * @param {boolean} [open]
 * @returns {HTMLDetailsElement}
 */
export const uiSection = (label, build, open = true) => {
    const section = document.createElement("details");
    section.className = "ui-section";
    section.open = open;

    const summary = document.createElement("summary");
    summary.className = "ui-section-title";
    summary.textContent = label;

    const body = document.createElement("div");
    body.className = "ui-section-body";

    section.append(summary, body);
    activeContainer.appendChild(section);

    // Temporarily route new controls into this section.
    const previousContainer = activeContainer;
    activeContainer = body;

    try {
        build();
    } finally {
        activeContainer = previousContainer;
    }

    return section;
}


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
    container.className = "ui-slider";

    const header = document.createElement("div");
    header.className = "ui-slider-header";

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
    activeContainer.appendChild(container);

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
    activeContainer.appendChild(button);

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
    activeContainer.appendChild(container);

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

export const uiHide = () => {
    panel.open = false;
};

const toggle = () => {
    panel.open = !panel.open;
};

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

const initControl = () => {
    const vv = window.visualViewport;
    if (vv === null) return;

    // This is to make the control panel fixed to viewport when zooming-in in mobile.
    const update = () => {
        panel.style.left = vv.offsetLeft + vv.width - panel.offsetWidth - 10 + "px";
        panel.style.top = vv.offsetTop + "px";
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
};

initControl();