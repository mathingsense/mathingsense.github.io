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

/** @param {unknown} error */
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * @param {TestCase} item
 * @returns {Promise<{ name: string, error: string | null }>}
 */
async function runCase({ name, fn }) {
    try {
        await fn();
        return { name, error: null };
    } catch (error) {
        return { name, error: errorMessage(error) };
    }
}

/** @param {{ name: string, error: string | null }} result */
function renderResult({ name, error }) {
    const row = document.createElement("li");
    if (error === null) {
        row.textContent = `✓ ${name}`;
    } else {
        row.className = "fail";
        row.textContent = `✗ ${name}: ${error}`;
    }
    return row;
}

/** @typedef {{ passed: number, failed: number }} Stats */

/** @param {Stats} stats */
function formatStats({ passed, failed }) {
    return `${passed} passed, ${failed} failed, ${passed + failed} total`;
}

/**
 * @param {TestCase[]} tests
 * @param {HTMLElement} parent
 * @param {Stats} stats
 * @param {() => void} onProgress
 */
async function runList(tests, parent, stats, onProgress) {
    const list = document.createElement("ul");
    list.className = "test-list";
    parent.append(list);

    for (const item of tests) {
        const result = await runCase(item);
        if (result.error === null) stats.passed++;
        else stats.failed++;

        list.append(renderResult(result));
        onProgress();
    }
}

const GITHUB_TESTS_URL =
    "https://github.com/mathingsense/mathingsense.github.io/blob/main/tests/";


/**
 * @param {string} fileName
 * @returns {{section: HTMLElement, summary: HTMLParagraphElement}}
 */
function renderFileHeader(fileName) {
    const section = document.createElement("section");
    section.className = "test-group";

    const title = document.createElement("p");
    title.className = "test-group-title";

    const link = document.createElement("a");
    link.href = GITHUB_TESTS_URL + fileName;
    link.textContent = fileName;
    title.appendChild(link);

    const summary = document.createElement("p");
    summary.textContent = "Running...";

    section.append(title, summary);
    return { section, summary };
}

/**
 * @param {string} fileName
 * @param {TestFile} file
 * @param {HTMLElement} results
 * @returns {Promise<Stats>}
 */
async function runFile(fileName, file, results) {
    const stats = { passed: 0, failed: 0 };
    const { section, summary } = renderFileHeader(fileName);
    results.append(section);

    const onProgress = () => {
        summary.textContent = formatStats(stats);
    };

    await runList(file.tests, section, stats, onProgress);

    for (const { name, tests } of file.sections) {
        const el = document.createElement("section");
        el.className = "test-section";

        const head = document.createElement("p");
        head.textContent = name;
        el.append(head);
        section.append(el);

        await runList(tests, el, stats, onProgress);
    }

    return stats;
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

    /** @type {Stats} */
    const total = { passed: 0, failed: 0 };

    try {
        for (const [fileName, file] of files) {
            const stats = await runFile(fileName, file, results);
            total.passed += stats.passed;
            total.failed += stats.failed;
        }
        summary.textContent = `Overall: ${formatStats(total)}`;
    } finally {
        rerun.disabled = false;
    }
}