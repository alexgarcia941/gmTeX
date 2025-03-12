import * as InboxSDK from '@inboxsdk/core';
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";


// Initialize MathJax components 
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX();
const svg = new SVG();

const mathDocument = mathjax.document("", {
  InputJax: tex,
  OutputJax: svg,
  svg: {
    scale: 1,              
    minScale: 0.5,
    mtextInheritFont: false, 
    exFactor: 0.5,         
    fontCache: 'local'
}});

//TODO: clean this up, there are too many uneeded mappings from type to type
async function svgToPng(svgElement){
    const exFactor = 5; // Fall back to 0.5 if not defined

    const canvas = document.createElement("canvas");
    // Get the width and height from the SVG attributes (in ex units)
    const widthEx = parseFloat(svgElement.getAttribute('width'));
    const heightEx = parseFloat(svgElement.getAttribute('height'));

    // Convert the width and height from ex to pixels
    const widthPx = widthEx * exFactor;
    const heightPx = heightEx * exFactor;
    canvas.width = widthPx;
    canvas.height = heightPx;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {type: "image/svg+xml"});
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    console.log("this is running")

    let pngDataUrl = await new Promise((resolve, reject) => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));          };

        img.onerror = () => reject(new Error("Failed to load SVG image"));
    });

    const pngElement = Object.assign(document.createElement("img"), {
        src: pngDataUrl,
        width: canvas.width,
        height: canvas.height,
    });

    URL.revokeObjectURL(url);
    console.log("this runs");
    console.log(pngElement.outerHTML);
    return pngElement.outerHTML;

}

async function renderLatexToPNG(latex) {
    try{
        const node = await mathDocument.convert(latex, { display: true });
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = adaptor.innerHTML(node); 
        const svgElement = tempDiv.firstChild;
        console.log(svgElement);

        const pngHtml = await svgToPng(svgElement);
        return pngHtml;

    } catch (error) {
        console.error("Mathjax rendering error", error);
    }
}

function pngHtml2Blob(pngHtml){
    const rex = /<img[^>]+src="([^"]+)"/g;
    const match = rex.exec(pngHtml);
    if (!match) {
        console.error("No image source found");
        return null;
    }

    const dataUrl = match[1];
    const base64Data = dataUrl.split(",")[1]

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: "image/png" });
}

async function renderLatexInComposedView(event) {
    let bodyHTML = await event.composeView.getHTMLContent(); 

    const latexRegex = /\$\s*([^$]+?)\s*\$/g;
    const matches = [...bodyHTML.matchAll(latexRegex)];

    let imageMap = new Map(); 
    
    for (let i = 0; i < matches.length; i++) {
        const [fullMatch, latex] = matches[i];
        const pngHtml = await renderLatexToPNG(latex);
        const blob = pngHtml2Blob(pngHtml);
        const file = new File([blob], `latexImage${i}.png`, { type: "image/png" });

        
        imageMap.set(fullMatch, { placeholder: `<!--latex${i}-->`, file });

        bodyHTML = bodyHTML.replace(fullMatch, `<!--latex${i}-->`);
    }

    event.composeView.setBodyHTML(bodyHTML);

    const files = Array.from(imageMap.values()).map(item => item.file);
    await event.composeView.attachInlineFiles(files);

    //TODO: edit this so that its in sync(no timeout)
    setTimeout(async () => {
        let updatedBodyHTML = await event.composeView.getHTMLContent(); // Retrieve updated body content

        let imgTags = updatedBodyHTML.match(/<img[^>]+data-surl="cid:[^"]+"[^>]+>/g);

        if (imgTags) {
            for (const imgTag of imgTags) {
                updatedBodyHTML = updatedBodyHTML.replace(imgTag, ""); // Remove the inline image tags
                updatedBodyHTML = updatedBodyHTML.replace(/(<br\s*\/?>\s*)+/, "");
            }
        }

        if (imgTags) {
            let i = 0;
            for (const [latexText, data] of imageMap) {
                if (imgTags[i]) {
                    updatedBodyHTML = updatedBodyHTML.replace(data.placeholder, imgTags[i]);
                }
                i++;
            }

            event.composeView.setBodyHTML(updatedBodyHTML);
        } else {
            console.log("No inline images found.");
        }
    }, 1500); 
}


//Objects
const latexButton = {
    title: "Render TeX",
    iconUrl: "https://lh5.googleusercontent.com/itq66nh65lfCick8cJ-OPuqZ8OUDTIxjCc25dkc4WUT1JG8XG3z6-eboCu63_uDXSqMnLRdlvQ=s128-h128-e365",
    onClick: renderLatexInComposedView,
}

InboxSDK.load(2, "Button Loaded")
    .then( (sdk) => {
        sdk.Compose.registerComposeViewHandler((composeView) => {
            composeView.addButton(latexButton);
        });
    })
    .catch(console.error);
