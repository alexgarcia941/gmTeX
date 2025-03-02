console.log("Gmail LaTeX Render Extension Loaded");
const config = { 
    subtree: true, 
    childList: true 
}

function renderLatex(latex) {
    return katex.renderToString(latex, { throwOnError: false });    
}

function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const latexRegex = /\$(.*?[^\\])\$|\\\[(.*?)\\\]|\\\((.*?)\\\)/g; 
    const text = node.textContent;

    if (latexRegex.test(text)) {
        const wrapper = document.createElement("span");
        wrapper.innerHTML = text.replace(latexRegex, (_, latex) => renderLatex(latex));
        node.replaceWith(wrapper);
    }
}
function renderMessageBody() {
    const messageBody = document.querySelectorAll("div[aria-label='Message Body'], div[contenteditable='true']");

    for (const editor of messageBody) {
        for (const node of editor.childNodes) {
            processTextNode(node);
        }
    }
}

function callback(mutations) {
    console.log("mutator callback has been fired")
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const toolbars = node.querySelectorAll(".btc");
                
                for (const toolbar of toolbars) {
                    addRenderButton(toolbar);
                }
            }
        }
    }
}

function addRenderButton(toolBar) {
    if (!toolBar || toolBar.querySelector("#render-latex-btn")) return;
    
    if (toolBar.querySelector("#render-latex-btn")) return;

    const button = document.createElement("button");
    button.id = "render-latex-btn";
    button.textContent = "Render Latex";
    button.style.marginLeft = "10px";
    button.style.padding = "5px 10px";
    button.style.border = "1px solid #ccc";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.background = "#f1f3f4";

    button.addEventListener("click", renderMessageBody);
    toolBar.appendChild(button);
}


function addToolbarButton() {
    // Find the toolbar in the compose window
    const toolbar = document.querySelector(".btC .G-atb");

    // Avoid adding duplicate buttons
    if (toolbar && !document.querySelector("#myCustomToolbarButton")) {
        const button = document.createElement("button");
        button.id = "myCustomToolbarButton";
        button.textContent = "My Custom Button";
        button.style.cssText = "margin-left: 8px; padding: 5px 10px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;";
        button.onclick = () => alert("Toolbar Button Clicked!");

        // Append the button to the toolbar
        toolbar.appendChild(button);
    }
}

// Attach event listener to detect when compose window opens
document.addEventListener("click", (event) => {
    // Gmail's "Compose" button selector
    if (event.target.closest(".T-I.T-I-KE.L3")) {
        setTimeout(addToolbarButton, 500); // Delay to allow UI to render
    }
});

//const observer = new MutationObserver(callback)
//observer.observe(document.body,config)

