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
const svg = new SVG({
    scale: 1,              
    minScale: 0.5,
    mtextInheritFont: false, 
    exFactor: 0.5,         
    fontCache: 'local'             
});

const mathDocument = mathjax.document("", {
  InputJax: tex,
  OutputJax: svg
});


/**
 * Converts svg element to png
 * @async
 * @method
 * @param {DOMElement} svgElement - an SVGElement
 * @returns {Promise<string>} - A promise resolving to the png html string.
 */    
async function svgToPng(svgElement) {
    // Append the SVG element to the body to get its bounding box
    document.body.appendChild(svgElement);
    const bbox = svgElement.getBoundingClientRect();
    const widthPx = bbox.width;  // Get the width in pixels from the bounding box
    const heightPx = bbox.height;  // Get the height in pixels from the bounding box
    document.body.removeChild(svgElement);

    // Serialize the SVG data and create a Blob
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    let pngDataUrl = await new Promise((resolve, reject) => {
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = 2; 
            canvas.width = widthPx * ratio;
            canvas.height = heightPx * ratio;
            const context = canvas.getContext("2d");

            context.scale(ratio, ratio);
            
            var x = canvas.width / 32,
            y = canvas.height / 32;
            
            context.drawImage(img, x, y, img.width, img.height);

            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = () => reject(new Error("Failed to load SVG image"));
    });

    const pngElement = Object.assign(document.createElement("img"), {
        src: pngDataUrl,
        width: widthPx,
        height: heightPx,
    });

    URL.revokeObjectURL(url);
    return pngElement.outerHTML;
}

/**
 * Renders latex string to a img(png) html string
 * @async
 * @method
 * @param {string} latex - raw latex string
 * @returns {Promist<string>} - A promise resolving to the png html string.
 */    
async function renderLatexToPNG(latex) {
    try{
        const node = await mathDocument.convert(latex, { display: true });
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = adaptor.innerHTML(node); 
        const svgElement = tempDiv.firstChild;

        const pngHtml = await svgToPng(svgElement);
        return pngHtml;

    } catch (error) {
        console.error("Mathjax rendering error", error);
    }
}

/**
 * takes in a pngHtml string and returns the corresponding blob
 * @method
 * @param {string} pngHtml - base 64 encoded png in image tag(as a string)
 * @returns {Blob} - Blob from the provided image information 
*/    
function pngHtml2Blob(pngHtml){
    const rex = /<img[^>]+src="([^"]+)"[^>]+width="([^"]+)"[^>]+height="([^"]+)"/g;
    const match = rex.exec(pngHtml);
    if (!match) {
        console.error("No image source found");
        return null;
    }

    const dataUrl = match[1];
    const width = parseInt(match[2], 10);
    const height = parseInt(match[3], 10);
    const base64Data = dataUrl.split(",")[1];

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    let blob = new Blob([uint8Array], { type: "image/png" });
    return {blob, width, height }
}

/**
 * Currently handles way too much logic, but in essence this function
    * is called when the button is pressed and handles the placing and uploading
    * of images.
 * @async
 * @method
 * @param {event type??} event - event when the render latex button is clicked
 */    
async function renderLatexInComposedView(event) {
    let bodyHTML = await event.composeView.getHTMLContent(); 
    const latexRegex = /\$\s*([^$]+?)\s*\$/g;
    const matches = [...bodyHTML.matchAll(latexRegex)];

    if (!matches) {
        return;
    }

    let imageMap = new Map(); 
    
    for (let i = 0; i < matches.length; i++) {
        const [fullMatch, latex] = matches[i];
        const pngHtml = await renderLatexToPNG(latex);
        const blobInfo = pngHtml2Blob(pngHtml);
        const blob = blobInfo.blob;
        const file = new File([blob], `latexImage${i}_delete_me_${latex}.png`, { type: "image/png" });

        if (imageMap.has(fullMatch)) {
            //use the same image for duplicates
            bodyHTML = bodyHTML.replace(fullMatch, imageMap.get(fullMatch).placeholder);
        } else {
            //new equation, new image
            imageMap.set(fullMatch, { 
                placeholder: `<!--latex${i}-->`, 
                file , 
                width: blobInfo.width , 
                height: blobInfo.height
            });
            bodyHTML = bodyHTML.replace(fullMatch, `<!--latex${i}-->`);
        }
    }

    //add placeholders and upload files
    event.composeView.setBodyHTML(bodyHTML);
    const files = Array.from(imageMap.values()).map(item => item.file);
    await event.composeView.attachInlineFiles(files);

    let numberOfInlineFiles = files.length

    // Create a MutationObserver to monitor image uploads
    const observer = new MutationObserver(( mutations, obs) => {
        const targetObj = mutations[0].target; 
        const uploadImgCount = targetObj.querySelectorAll('img[alt*="_delete_me"]').length;

        if (uploadImgCount >= numberOfInlineFiles) {
            obs.disconnect();
            processUploadedImages(targetObj, imageMap);
            addAttributes(targetObj);
        }
    }); 

    const target = event.composeView.getBodyElement();
    const config = {childList: true, subtree: true};
    observer.observe(target, config);
}

//only called once images are uploaded 
function processUploadedImages(target, imageMap) {
    let updatedBodyHTML = target.getHTML();
        let generatedImgTags = updatedBodyHTML.match(/(<img\b[^>]*\balt=["'])([^"']*)_delete_me([^"']*)(["'][^>]*>)/g);

        if (generatedImgTags) {
            updatedBodyHTML = updatedBodyHTML.replace(/<img\b[^>]*\balt=["'][^"']*_delete_me[^"']*["'][^>]*>\s*<br\s*\/?>/g, '');
        }

        // Replace placeholders with images
        if (generatedImgTags) {
            let i = 0;
            for (const [latexText, data] of imageMap) {
                if (generatedImgTags[i]) {
                    let cleanedImgTag = generatedImgTags[i].replace(/_delete_me/g, '');
                    cleanedImgTag = cleanedImgTag.replace(/(<img\b[^>]*>)/, function(match) {
                        const widthAttr = ` width="${data.width}"`;
                        const heightAttr = ` height="${data.height}"`;

                        // If the image already has width/height, replace those; otherwise, add them
                        if (/width=["'][^"']*["']/.test(match)) {
                            match = match.replace(/width=["'][^"']*["']/, widthAttr);
                        } else {
                            match = match.replace(/<img\b/, `<img${widthAttr}`);
                        }

                        if (/height=["'][^"']*["']/.test(match)) {
                            match = match.replace(/height=["'][^"']*["']/, heightAttr);
                        } else {
                            match = match.replace(/<img\b/, `<img${heightAttr}`);
                        }

                        return match;
                    });

                    updatedBodyHTML = updatedBodyHTML.replaceAll(data.placeholder, cleanedImgTag);
                }
                i++;
            }
            target.innerHTML = updatedBodyHTML;
        }
}

//method to add identifying attributes to generated images
function addAttributes(target){
    const imgTags = target.querySelectorAll('img[alt*="latexImage"]');

    if (imgTags.length > 0){
        for (let i = 0; i < imgTags.length; i++) {
            if (imgTags[i].classList.contains("gmtex-rendered")) {
                continue;
            }
            imgTags[i].classList.add("gmtex-rendered");
            let altName = imgTags[i].getAttribute("alt");

            const match = altName.match(/^latexImage\d+_(.+)\.png$/);
            if (match) {
                const latex = match[1];
                imgTags[i].setAttribute("data-raw-latex", latex);

                const newAltName = altName.replace(`_${latex}`, '');
                imgTags[i].setAttribute("alt", newAltName)
            } else {
                console.error("Latex in Gmail error: Please submit error report at 'https://github.com/alexgarcia941/gmTeX/issues'");
            }
        }
    }
}

function swapImageToTex(event){
    let target = event.target

    //Not a gmtex image
    if (!target.classList.contains("gmtex-rendered"))
        return;
    
    let img = event.target;
    let latexText = img.getAttribute("data-raw-latex");
    let editedLatex = prompt("Edit LaTeX:", latexText);
    if (editedLatex !== null) {
        img.replaceWith('$' + editedLatex + '$');
        const button = document.getElementsByClassName("renderTexButton")[0];
        button.click();
    }
}

//Objects
const latexRenderButton = {
    title: "Render TeX",
    iconUrl: "data:image/png;base64,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", 
    onClick: renderLatexInComposedView,
    iconClass: "renderTexButton",
}

const inboxSdkId= 'sdk_gmtex_bc6d967dcd'

InboxSDK.load(2, inboxSdkId)
    .then( (sdk) => {
        sdk.Compose.registerComposeViewHandler((composeView) => {
            composeView.addButton(latexRenderButton);
            composeView.getBodyElement().addEventListener("pointerdown", swapImageToTex,{ passive: true });
        });
    })
    .catch(console.error);
