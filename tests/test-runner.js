import { getElement } from "../common.js";

/**
 * @typedef {Object} TestCase
 * @property {string} name
 * @property {() => void | Promise<void>} fn
 */

/** @type {Map<string, TestCase[]>} */
const files = new Map();

/**
 * @param {string} fileName
 */
export function initTestFile(fileName) {
    if (files.has(fileName)) {
        throw new Error(`test file already exists: ${fileName}`);
    }

    /** @type {TestCase[]} */
    const tests = [];
    files.set(fileName, tests);

    return {
        /**
         * Register a test in this file.
         * @param {string} testName
         * @param {() => void | Promise<void>} fn
         */
        test(testName, fn) {
            tests.push({ name: testName, fn });
        },
    };
}

/**
 * Run all registered tests and render one section per file.
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

    for (const [fileName, tests] of files) {
        const section = document.createElement("section");
        section.className = "test-group";

        const heading = document.createElement("p");

        const link = document.createElement("a");
        link.href = "https://github.com/mathingsense/mathingsense.github.io/blob/main/tests/" + fileName;
        link.textContent = fileName;
        heading.appendChild(link);

        const groupSummary = document.createElement("p");
        groupSummary.textContent = "Running...";

        const list = document.createElement("ul");
        list.className = "test-list";

        section.append(heading, groupSummary, list);
        results.append(section);

        let passed = 0;
        let failed = 0;

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
                    `✗ ${item.name}: ${error instanceof Error ? error.message : String(error)}`;
            }

            totalTests++;
            list.append(row);

            groupSummary.textContent =
                `${passed} passed, ${failed} failed, ${tests.length} total`;
        }
    }

    summary.textContent =
        `Overall: ${totalPassed} passed, ${totalFailed} failed, ` +
        `${totalTests} total`;

    rerun.disabled = false;
}
