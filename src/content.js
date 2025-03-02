import * as InboxSDK from '@inboxsdk/core';
import katex from "katex";

//functions
function renderLatex(latex) {
    try {
        return katex.renderToString(latex, { throwOnError: false });   
    } catch (error) {
        console.error("KaTeX rendering error", error);
        return latex;
    }
}

function replaceLatexWithRendered(text) {
    const latexRegex = /\$\s*([^$]+?)\s*\$/g;
    if (latexRegex.test(text)) {
        return text.replace(latexRegex, (_, latex) => renderLatex(latex))
    } else {
        return text
    }
}

//Objects
const latexButton = {
    title: "Render TeX",
    iconUrl: "https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365",

    //feels like a crime
    onClick(event) {
        const html = event.composeView.getHTMLContent();
        const renderedText = replaceLatexWithRendered(html);
        event.composeView.setBodyHTML(renderedText);
    }
}

//run
InboxSDK.load(2, "Hello World")
    .then( (sdk) => {
        sdk.Compose.registerComposeViewHandler((composeView) => {
            composeView.addButton(latexButton);
        });
    });
