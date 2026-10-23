const style = document.createElement("style");

style.textContent = `
    .ui {
        position: fixed;
        top: 10px;
        left: 10px;
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

    .ui-header {
        padding: 0px 5px;
        background: wheat;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
    }

    .ui-slider {
        margin: 10px;
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


    .ui-select {
        margin: 10px;
    }

    .ui-select-element {
        display: block;
        width: 100%;
        margin-top: 6px;
        padding: 5px;

        border: 1px solid #000;
        background: #faf9f6;

        font: inherit;
        cursor: pointer;
    }

    .ui-select-element:hover {
        background: #f0f5fb;
    }


    .ui-list {
        margin: 10px;
    }

    .ui-list-item {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #0002;
    }

    .ui-list-label {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .ui-list-menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        padding: 0;
        border: none;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 20px;
        cursor: pointer;
    }

    .ui-list-menu-button:hover {
        background: #0001;
    }

    .ui-list-dropdown {
        position: absolute;
        top: calc(100% - 2px);
        right: 0;
        min-width: 130px;
        background: white;
        border: 1px solid #000;
        box-shadow: 0 3px 8px #0002;
        z-index: 1001;
    }

    .ui-list-dropdown[hidden] {
        display: none;
    }

    .ui-list-option {
        display: block;
        width: 100%;
        padding: 6px;
        border: none;
        background: transparent;
        color: #000;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .ui-list-option:hover {
        background: #eee;
    }
`;

document.head.appendChild(style);

/**
 * @typedef {{
 *     label: string,
 *     min: number,
 *     max: number,
 *     step: number,
 *     value: number,
 *     onChange: (v: number) => void,
 * }} SliderConfig
 */

/** @typedef {{label: string, value: string}} SelectOption */

/**
 * @typedef {{
 *     label: string,
 *     options: SelectOption[],
 *     value: string,
 *     onChange: (v: string) => void,
 * }} SelectConfig
 */

/**
 * @typedef {{
 *     label: string,
 *     onClick?: (item: ListItemConfig) => void,
 *     disabled?: boolean,
 * }} ListOptionConfig
 */

/**
 * @typedef {{
 *     label: string,
 *     options?: ListOptionConfig[],
 * }} ListItemConfig
 */

/**
 * @typedef {{
 *     label?: string,
 *     items: ListItemConfig[],
 * }} ListConfig
 */

export class UI {
    constructor() {
        const panel = document.createElement("details");
        panel.className = "ui";
        panel.open = true;

        const header = document.createElement("summary");
        header.className = "ui-header";
        header.textContent = "Controls";

        const content = document.createElement("div");
        content.className = "ui-content";

        panel.append(header, content);
        document.body.appendChild(panel);

        this.panel = panel;
        this.header = header;
        this.activeContainer = content;

        this.sliderCount = 0;
        this.selectCount = 0;
    }

    /**
     * @param {string} t
     * @returns {UI}
     */
    title(t) {
        this.header.textContent = t;
        return this;
    }

    /**
     * @param {number} y
     * @returns {UI}
     */
    top(y) {
        this.panel.style.bottom = "auto"
        this.panel.style.top = y + "px";
        return this;
    }

    /**
     * @param {number} x
     * @returns {UI}
     */
    left(x) {
        this.panel.style.right = "auto"
        this.panel.style.left = x + "px";
        return this;
    }

    /**
     * @param {number} x
     * @returns {UI}
     */
    right(x) {
        this.panel.style.left = "auto"
        this.panel.style.right = x + "px";
        return this;
    }

    /**
     * @param {SliderConfig} config
     * @returns {{
     *     input: HTMLInputElement,
     *     value: number,
     * }}
     */
    slider(config) {
        const { label, min, max, step, value } = config;

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

        name.htmlFor = `slider-${this.sliderCount++}`;
        input.id = name.htmlFor;

        function update() {
            const v = Number(input.value);
            output.textContent = v.toFixed(3);
            config.onChange(v);
        }

        input.addEventListener("input", update);

        header.append(name, output);
        container.append(header, input);
        this.activeContainer.appendChild(container);

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

    /**
     * @param {SelectConfig} config
     * @returns {{
     *     element: HTMLSelectElement,
     *     value: string,
     * }}
     */
    select(config) {
        const { label, options, value } = config;

        const container = document.createElement("div");
        container.className = "ui-select";

        const name = document.createElement("label");
        name.className = "ui-label";
        name.textContent = label;

        const select = document.createElement("select");
        select.className = "ui-select-element";

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

        name.htmlFor = `select-${this.selectCount++}`;
        select.id = name.htmlFor;

        select.addEventListener("change", () => {
            config.onChange(select.value);
        });

        container.append(name, select);
        this.activeContainer.appendChild(container);

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

    /**
     * @param {ListConfig} config
     * @returns {HTMLElement}
     */
    list(config) {
        const container = document.createElement("div");
        container.className = "ui-list";

        /** @type {(() => void)[]} */
        const menus = [];

        const closeAll = () => {
            for (const close of menus) {
                close();
            }
        };

        for (const item of config.items) {
            const row = document.createElement("div");
            row.className = "ui-list-item";

            const label = document.createElement("span");
            label.className = "ui-list-label";
            label.textContent = item.label;

            row.appendChild(label);

            if (item.options?.length) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "ui-list-menu-button";
                button.textContent = "\u22ee";
                button.title = "Options";

                const menu = document.createElement("div");
                menu.className = "ui-list-dropdown";
                menu.hidden = true;

                const closeMenu = () => {
                    menu.hidden = true;
                };

                button.addEventListener("click", (event) => {
                    event.stopPropagation();

                    const shouldOpen = menu.hidden;
                    closeAll();
                    menu.hidden = !shouldOpen;
                });

                for (const option of item.options) {
                    const optionButton = document.createElement("button");
                    optionButton.type = "button";
                    optionButton.className = "ui-list-option";
                    optionButton.textContent = option.label;
                    optionButton.disabled = Boolean(option.disabled);

                    optionButton.addEventListener("click", (event) => {
                        event.stopPropagation();
                        closeMenu();
                        option.onClick?.(item);
                    });

                    menu.appendChild(optionButton);
                }

                menus.push(closeMenu);
                row.append(button, menu);
            }

            container.appendChild(row);
        }

        /**
         * Close dropdowns when clicking outside this list.
         * @param {MouseEvent} event
         */
        const onDocumentClick = (event) => {
            if (!container.contains(/** @type {Node} */(event.target))) {
                closeAll();
            }
        };

        document.addEventListener("click", onDocumentClick);

        this.activeContainer.appendChild(container);

        return container;
    }
}