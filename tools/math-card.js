import { getElement } from "../common.js";

const source = getElement("source", HTMLTextAreaElement);
const content = getElement("content", HTMLDivElement);
const artboard = getElement("artboard", HTMLDivElement);
const exportBtn = getElement("export", HTMLButtonElement);

const init = `The sum of the first n positive integers is
$$
1+2+\\cdots+n=\\frac{n(n+1)}{2}.
$$

To see why, pair the first and last terms. Each pair adds to $n+1$.

Therefore, the sum is $\\frac{n(n+1)}{2}$.`;

source.value = init;

function render() {
    content.textContent = source.value;
    content.style.whiteSpace = 'pre-wrap';

    renderMathInElement(content, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        strict: 'warn',
        trust: false,
    });
}

exportBtn.addEventListener("click", async () => {
    try {
        const canvas = await html2canvas(artboard, {
            backgroundColor: "white",
            logging: false,
            scale: 1,
            width: artboard.clientWidth,
            height: artboard.clientHeight,
            scrollX: 0,
            scrollY: 0
        });

        const overlay = document.createElement("div");

        overlay.style.cssText = `;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.85);
            padding: 10px;
            overflow: auto;
            `;

        canvas.style.cssText = `;
            width: 100%;
            height: auto;
            background: white;
            `;

        // Buttons container
        const buttons = document.createElement("div");

        // Save Image button
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.style.cursor = "pointer";

        saveButton.addEventListener("click", () => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert("Could not save the image. Please try again.");
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");

                link.href = url;
                link.download = "math-card.jpg";

                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(() => URL.revokeObjectURL(url), 2000);
            }, "image/jpeg", 0.95);
        });

        // Close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.cursor = "pointer";

        closeButton.addEventListener("click", () => overlay.remove());

        buttons.append(saveButton, closeButton);
        overlay.append(canvas, buttons);
        document.body.appendChild(overlay);

    } catch (error) {
        console.error("Canvas rendering failed:", error);
        alert("Could not generate your math card.");
    }
});

source.addEventListener("input", render);

render();