import { getElement } from "../common.js";

/** @typedef {() => void | Promise<void>} Callback */

/**
 * @typedef {{
 *     name: string,
 *     fn: Callback,
 * }} TestCase
 */

/**
 * @typedef {{
 *     name: string,
 *     tests: TestCase[],
 * }} TestSection
 */

/**
 * @typedef {{
 *     tests: TestCase[],
 *     sections: TestSection[],
 * }} TestFile
 */

/** @type {Map<string, TestFile>} */
const files = new Map();

/** @type {TestFile | null} */
let currentFile = null;

/** @type {TestSection | null} */
let currentSection = null;

/**
 * Register a test in the current file or section.
 * @param {string} name
 * @param {Callback} fn
 */
export function test(name, fn) {
    if (!currentFile) {
        throw new Error("test() must be called after initTestFile()");
    }

    const tests = currentSection
        ? currentSection.tests
        : currentFile.tests;

    tests.push({ name, fn });
}

/**
 * Register a section and its tests in current file.
 * @param {string} name
 * @param {Callback} callback
 */
export function section(name, callback) {
    if (!currentFile) {
        throw new Error("section() must be called after initTestFile()");
    }

    const section = {
        name: name,
        tests: [],
    };

    currentFile.sections.push(section);
    currentSection = section;

    callback();
    currentSection = null;
}

/**
 * @param {string} name
 */
export function initTestFile(name) {
    if (files.has(name)) {
        throw new Error(`file already exists: ${name}`);
    }

    /** @type {TestFile} */
    const file = {
        tests: [],
        sections: [],
    };

    currentFile = file;
    files.set(name, file);
}

/**
 * Run all registered tests and sections per file.
 * Display the link to each test file on Github.
 */
export async function runTests() {
    const results = getElement("results", HTMLDivElement);
    const summary = getElement("summary", HTMLParagraphElement);
    const rerun = getElement("rerun", HTMLButtonElement);

    results.replaceChildren();
    summary.textContent = "Running tests...";
    rerun.disabled = true;

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    for (const [fileName, file] of files) {
        const fileSection = document.createElement("section");
        fileSection.className = "test-group";

        const heading = document.createElement("p");
        heading.className = "test-group-title";

        const link = document.createElement("a");
        link.href = "https://github.com/mathingsense/mathingsense.github.io/blob/main/tests/" + fileName;
        link.textContent = fileName;
        heading.appendChild(link);

        const fileSummary = document.createElement("p");
        fileSummary.textContent = "Running...";

        fileSection.append(heading, fileSummary);
        results.append(fileSection);

        let passed = 0;
        let failed = 0;
        let count = 0;

        /**
         * @param {TestCase[]} tests
         * @param {HTMLElement} parent
         */
        async function runList(tests, parent) {
            const list = document.createElement("ul");
            list.className = "test-list";
            parent.append(list);

            for (const item of tests) {
                const row = document.createElement("li");

                try {
                    await item.fn();
                    passed++;
                    totalPassed++;
                    row.textContent = `✓ ${item.name}`;
                } catch (error) {
                    failed++;
                    totalFailed++;
                    row.className = "fail";
                    row.textContent =
                        `✗ ${item.name}: ${error instanceof Error
                            ? error.message
                            : String(error)
                        }`;
                }

                count++;
                totalTests++;
                list.append(row);

                fileSummary.textContent =
                    `${passed} passed, ${failed} failed, ${count} total`;
            }
        }

        // Tests registered directly on the group.
        await runList(file.tests, fileSection);

        // Tests registered inside named sections.
        for (const { name, tests } of file.sections) {
            const el = document.createElement("section");
            el.className = "test-section";

            const head = document.createElement("p");
            head.textContent = name;

            el.append(head);
            fileSection.append(el);

            await runList(tests, el);
        }
    }

    summary.textContent =
        `Overall: ${totalPassed} passed, ${totalFailed} failed, ` +
        `${totalTests} total`;

    rerun.disabled = false;
}
