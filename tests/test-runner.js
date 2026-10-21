import { getElement } from "../common.js";

/**
 * @typedef {Object} TestCase
 * @property {string} name
 * @property {() => void | Promise<void>} fn
 */

/** @type {Map<string, TestCase[]>} */
const groups = new Map();

/**
 * Usually named after its test file.
 * @param {string} name
 */
export function createTestGroup(name) {
    if (groups.has(name)) {
        throw new Error(`test group already exists: ${name}`);
    }

    /** @type {TestCase[]} */
    const tests = [];
    groups.set(name, tests);

    return {
        /**
         * Register a test in this group.
         * @param {string} testName
         * @param {() => void | Promise<void>} fn
         */
        test(testName, fn) {
            tests.push({ name: testName, fn });
        },
    };
}

/**
 * Run all registered tests and render one section per group.
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

    for (const [groupName, tests] of groups) {
        const section = document.createElement("section");
        section.className = "test-group";

        const heading = document.createElement("p");
        heading.textContent = groupName;

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
